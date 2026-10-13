# Push Permission Bridge — Contract + Replication Prompt

Self-contained prompt for any Lovable project reusing the same iOS wrapper
(WKWebView). Business-logic agnostic: it specifies the permission round-trip
contract only — the app's UI and re-ask policy are yours to design.

Use this to **audit** an existing port or to **implement from scratch**.

---

## The contract in one paragraph

The web app asks iOS to show the OS permission prompt by sending
`wanillajs.event.push.requestPermission`. iOS owns the truth
(`UNUserNotificationCenter` authorization status) and reports it back by
calling the JS global `window.setPushPermissionStatus({ status, source })`
at three moments: cold launch, foreground/resume, and immediately after the
prompt resolves. The web app is a **passive listener** — it never polls.
To recover from `denied` (where re-prompting is a no-op), the web app sends
`wanillajs.event.system.openAppSettings` and iOS opens Settings.app.

---

## 1. Web → iOS: request the OS prompt

Send via the `wanillajs` message handler (`gameEvents` is the legacy
fallback). No payload.

```ts
window.webkit?.messageHandlers?.wanillajs?.postMessage({
  type: "wanillajs.event.push.requestPermission",
  payload: {},
});
```

iOS handler: `UNUserNotificationCenter.current().requestAuthorization(options:)`,
then report the result with `setPushPermissionStatus` using source
`"promptResult"`.

**Policy rules (web side):**

- Never send at app start unprompted — only from a user-visible opt-in
  (banner, inline nudge, settings row).
- If the last known status is `denied`, do NOT send this event; send
  `wanillajs.event.system.openAppSettings` instead.
- Rate-limit re-asks (see §4).

## 2. iOS → Web: report authorization status

The web app installs this global at boot (before any iOS call can arrive):

```ts
type PushPermissionStatus =
  | "granted" | "denied" | "notDetermined"
  | "provisional" | "ephemeral" | "unknown";

type PushPermissionSource =
  | "appStart" | "foreground" | "promptResult" | "unknown";

window.setPushPermissionStatus = (payload: {
  status: PushPermissionStatus;
  source?: PushPermissionSource;
}) => { /* store + notify listeners */ };
```

### The three mandatory call moments

1. **App start / cold launch** — right after `wanillajs.event.appStarted`.
   Source: `"appStart"`.
2. **Foreground / resume** — on `UIApplication.willEnterForegroundNotification`.
   Source: `"foreground"`. Critical: users toggle the OS setting outside the
   app, and this is how the web learns a Settings.app recovery worked.
3. **Prompt result** — immediately after `requestAuthorization` resolves
   following `wanillajs.event.push.requestPermission`. Source: `"promptResult"`.

### Canonical Swift injection

JSON-serialize the payload, guard for bridge readiness, retry once after
500 ms:

```swift
func sendPushNotificationPermission(result: PermissionRequestResult) {
    let payload: [String: Any] = [
        "status": result.status.rawValue,   // "granted" | "denied" | "notDetermined" | ...
        "source": result.origin.rawValue,   // "appStart" | "foreground" | "promptResult"
    ]

    guard let jsonData = try? JSONSerialization.data(withJSONObject: payload),
          let jsonString = String(data: jsonData, encoding: .utf8) else { return }

    let script = """
    (function() {
        if (typeof window.setPushPermissionStatus === 'function') {
            window.setPushPermissionStatus(\(jsonString));
        } else {
            setTimeout(function() {
                if (typeof window.setPushPermissionStatus === 'function') {
                    window.setPushPermissionStatus(\(jsonString));
                }
            }, 500);
        }
    })();
    """

    webView.evaluateJavaScript(script) { _, error in
        if let error = error { print("Push permission injection failed: \(error)") }
    }
}
```

### Companion: device registration (optional)

Once APNs token registration AND your backend's token-store endpoint succeed:

```js
window.setRemotePushDeviceRegistered({ registered: true });
```

## 3. Recovery from `denied`

`requestAuthorization` is a no-op in `denied` state. The only recovery is
deep-linking to Settings.app:

```ts
window.webkit?.messageHandlers?.wanillajs?.postMessage({
  type: "wanillajs.event.system.openAppSettings",
  payload: { reason: "push_denied_recovery" },
});
```

iOS opens `UIApplication.openSettingsURLString`. When the user returns, the
mandatory **foreground** status push (§2) delivers the new status — the web
never needs to check.

## 4. Web-side pieces to implement

1. **Boot wiring:** call `initializePushPermissionBridge()` once in your app
   entry point (`main.tsx`), which installs `window.setPushPermissionStatus`
   and `window.setRemotePushDeviceRegistered`. Must be idempotent.
2. **In-memory status store** with a `pushPermissionUpdated` window
   CustomEvent so any UI component can subscribe. The iOS status is the only
   source of truth; never cache it in localStorage.
3. **Re-ask policy state** (localStorage is fine — this is about *your* UI
   behaviour, not the OS truth): track whether the banner was shown,
   dismissal count, and last-shown timestamps. Suggested: 48 h cooldown,
   max 2 contextual dismissals.
4. **Tiered UI by status:**
   - `granted` / `provisional` / `ephemeral` → silent ("On" in settings).
   - `notDetermined` / `unknown` → opt-in banner / contextual nudges.
   - `denied` → hide ask UI forever; show a one-shot tip + settings row that
     deep-link via `openAppSettings`.

## 5. Verification checklist

- [ ] Cold launch: web receives `{ status, source: "appStart" }` without
      polling (check via `console.log` in the setter or a debug page).
- [ ] Opt-in banner tap → iOS prompt appears → web receives
      `source: "promptResult"` with the user's choice.
- [ ] Toggle notifications off in Settings.app → background → foreground the
      app → web receives `source: "foreground"` with `denied`.
- [ ] In `denied` state, the app sends `openAppSettings` instead of
      `requestPermission`.
- [ ] Bridge-not-ready case: iOS injection before web boot is recovered by
      the 500 ms retry (test by injecting immediately at `loadHTML` time).
- [ ] `initializePushPermissionBridge()` is called exactly once and is
      idempotent under HMR / double-mount.

## References

- `docs/ios-web-bridge-guide.md` §3.8 (web-side reference implementation).
- `docs/ios-bridge/apns-registration.md` (token registration + Vapor relay).
- `docs/ios-bridge/open-app-settings.md` (settings deep-link details).
- `docs/ios-bridge/foreground-event.md` (why the foreground push matters).

---

---

# Additions learned in production (portable — adopt all three)

Everything above is the minimal round-trip. The three additions below came out
of real failures on previous builds (see `ios-integration-mistakes.md` #29 and
#30) and should be treated as part of the contract for new projects.

## A. Status vocabulary: `granted` == `authorized`

`UNAuthorizationStatus` calls the granted case `authorized`; the wrapper
replication prompt (and some wrapper builds) send `granted`. **Both spellings
are accepted on the wire.** The web normalizes `"granted"` → `"authorized"` in
one place (`canonicalStatus()` / `normalize()` in the push-permission module)
before storing, and every downstream comparison (settings row, opt-in banner,
inline nudge, local-reminder scheduling) uses `authorized` only. Any other
value is rejected with a `console.error` that lists the valid values, so a
malformed wrapper payload is obvious in the console instead of silently
leaving the UI on `unknown`.

## B. Pull event for late-mounting screens: `wanillajs.event.push.requestStatus`

The pure-listener model leaves screens that mount *after* the
`appStart` / `foreground` broadcasts (e.g. a Settings → Notifications row)
with no status at all. Add a pull:

- Web sends `{ type: "wanillajs.event.push.requestStatus", payload: {} }`
  (`requestPushStatus()` in the push-permission module).
- iOS replies on the main thread with
  `window.setPushPermissionStatus({ status, source: "appStart" })` after
  reading `UNUserNotificationCenter.current().getNotificationSettings`.
- `usePushPermission()` sends this once on mount and marks itself `resolved`
  after a **2 s timeout**. Unresolved `unknown` is then treated as
  `notDetermined` so the UI shows a "Turn on" action instead of "Checking…"
  forever. A late reply still updates the UI.

Full wire contract: `docs/ios-bridge/apns-registration.md` § "Push status
request". If the wrapper build does not implement the reply, the 2 s fallback
keeps the UI usable — but register the Swift case; it is a one-liner.

**Rule:** any "iOS is the source of truth, web just listens" bridge needs three
things, not two: the broadcast, a pull/request event for consumers that mount
late, and a terminal fallback state with a user action. Never let `unknown` be
an absorbing state in UI copy.

## C. Boot wiring that survives HMR / double-mount

`src/main.tsx`, before React mounts:

```ts
initializePushPermissionBridge();  // installs window.setPushPermissionStatus
initializeRemotePushBridge();      // installs window.setRemotePushDeviceRegistered
```

Both are idempotent (module-level `installed` flag). `usePushPermission()`
seeds from the in-memory store on first render rather than waiting for an
event, so a cold-launch injection that arrives before React mounts is never
missed (`ios-integration-mistakes.md` #43).

## Example re-ask policy (one source project — tune per app)

`pushOptIn.v1` in `localStorage`:

| Rule | Value |
|------|-------|
| Banner re-show after a dismiss | 7 days |
| Denied-tip re-show | 30 days |
| After a granted prompt | never shown again |

This is UI policy, not OS truth — keep it out of the status store.

## Relevant files (reference layout)

```
src/lib/pushPermission.ts        # status store, validator (+ granted→authorized), requestPushStatus
src/lib/remotePush.ts            # setRemotePushDeviceRegistered
src/lib/pushOptInState.ts        # re-ask cooldowns
src/hooks/usePushPermission.ts   # resolved / checking / undetermined flags, 2 s fallback
src/utils/pushTriggers.ts        # local reminder IDs + categories (see local-push-scheduling-prompt.md)
src/components/push/*            # banner, inline nudge, denied tip
```

(`src/lib/` vs `src/utils/` is a per-project convention — locate modules by
content, not path. See `ios-integration-mistakes.md` #27.)
