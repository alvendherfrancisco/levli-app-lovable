# iOS → Web: foreground event (Base44)

## What

When the iOS app comes back to the foreground, dispatch a `ios:foregrounded`
DOM event in the webview. This lets the web app immediately verify its Base44
session is still valid and refetch user-scoped data.

## Why

iOS pauses WKWebView JS timers when the app is backgrounded. Any in-memory
assumption the web made about its session ("I called `auth.me()` an hour ago
and it worked") can be stale on resume: the Base44 access token may have
expired, or the wrapper may have been relaunched. Without a wake-up signal,
pages that read RLS-gated entities silently render empty (a denied read on
Base44 returns an empty list, not an error — see the entity security docs).

The web side already listens to `document.visibilitychange` and
`window.pageshow`, which usually fire — but WKWebView behavior is
inconsistent. This event guarantees a recovery within one frame.

## How

Add this in your AppDelegate / SceneDelegate alongside the existing
`UIApplication.willEnterForegroundNotification` handler:

```swift
NotificationCenter.default.addObserver(
  forName: UIApplication.willEnterForegroundNotification,
  object: nil,
  queue: .main
) { [weak webView] _ in
  webView?.evaluateJavaScript(
    "window.dispatchEvent(new Event('ios:foregrounded'))",
    completionHandler: nil
  )
}
```

## Web-side effect

`src/utils/appLifecycle.ts` listens for `ios:foregrounded` (plus
`document.visibilitychange` and `window.pageshow` as belt-and-suspenders).
On any of these it:

1. Runs `refreshIfStale()`: if the last successful `base44.auth.me()` probe is
   older than **5 min** (`STALE_THRESHOLD_S = 5 * 60`), calls `base44.auth.me()`
   again (single-flight, 10 s dedupe).
2. On success, updates the `authStore` and bumps the module-level
   `authEpoch` counter (`reason: "refreshIfStale"`).
3. On `401` / `null`, clears the `authStore`, bumps the epoch
   (`reason: "session_lost"`) and emits
   `wanillajs.event.auth.sessionRequested` with
   `{ reason: "foreground_session_lost", path: location.pathname, at }` so
   the wrapper can mint a fresh token via Vapor and call
   `window.setBase44Session` once (`session-injection-contract.md` Rule 1).
   It does **not** redirect to `/auth` on its own — the wrapper decides.

RLS-gated pages subscribe via `useAuthReady()` / `useAuthEpoch()` and add
the epoch to their fetch deps, so they auto-refetch the instant the session
is confirmed:

```ts
const { authEpoch } = useAuthReady();
useEffect(() => { fetchData(); }, [authEpoch /*, other deps */]);
```

Wire this into every page that reads user-scoped entities (Settings, profile,
any ranking / social screen, etc.).

Required log lines (the verification checklist greps for them):
`[appLifecycle] foreground <trigger>`, `[appLifecycle] background visibilitychange`,
`[appLifecycle] authEpoch bump { epoch, reason }`.

## Notes

- **Independent of push permission.** This does not replace any of the
  `setPushPermissionStatus` calls — it's a separate, narrowly-scoped wake-up
  ping with no payload.
- **Idempotent.** Dispatching it multiple times in a row is harmless; the
  web side dedupes the underlying probe.
- **Optional but recommended.** If you don't wire it up, `visibilitychange`
  + `pageshow` cover the common case. Wiring this up makes recovery
  instant and reliable across iOS versions.
- **Never re-inject on foreground.** The wrapper dispatches the event and
  waits; it only mints a new token if the web asks via `sessionRequested`.

## See also

- `docs/ios-bridge/push-permission-bridge.md` — the canonical push permission
  contract. The mandatory `foreground` status broadcast described there is how
  the web learns about permission changes made in Settings.app.
