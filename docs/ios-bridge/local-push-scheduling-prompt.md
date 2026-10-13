# Reusable prompt: Wire up local notification scheduling (Web → iOS UNUserNotificationCenter)

Use this prompt in any Lovable project that needs **time-based, on-device** notifications scheduled by the web app and delivered by the iOS wrapper without any server round-trip. This is the counterpart to the remote push pipeline (`docs/ios-bridge/remote-push-pipeline-prompt.md`) — that one covers cross-user, fire-now pushes via Vapor/APNs; this one covers "remind me in 24h", "streak at risk in 20h", etc.

---

## Task: Audit and (if missing) implement the local notification scheduling bridge

The web app owns behavioural state (when a daily limit is hit, when a streak is about to expire, when a series is half-finished). The iOS wrapper owns the `UNUserNotificationCenter` scheduler. We hand notifications to iOS through two events on the standard bridge channel and let native register them as `UNNotificationRequest`s. When the user taps one, iOS converts the `deepLink` into the existing `ios:navigate` event.

```
Web behaviour ─► pushTriggers helper ─► sendIOSEvent("wanillajs.event.push.schedule", …)
                                              │
                                        wanillajs handler (WKScriptMessageHandler)
                                              │
                                UNUserNotificationCenter.add(UNNotificationRequest)
                                              │
                                        (tap) UNNotificationResponse
                                              │
                                    webView.navigateFromIOS(path: deepLink)  +  notifyNotificationTapped(…)
                                              │
                                    ios:navigate custom event ─► React Router
```

## Canonical sources — read first, do not re-derive

1. `docs/ios-web-bridge-guide.md`
   - **§4** — `sendIOSEvent` transport, `wanillajs` handler, legacy `gameEvents` alias.
   - **§4.0 / §4.1** — event registry and catalogue (must contain `wanillajs.event.push.schedule` / `.cancel`).
2. `docs/ios-bridge/notification-tap-handling.md` — how a tap on a scheduled notification becomes an `ios:navigate` inside React Router (needed to make `deepLink` do anything).
3. `docs/ios-bridge/implementation-order.md` — Phase 4 lists this bridge alongside the remote push pipeline.

If any of these are missing, stop and ask for them before writing code. Do **not** confuse this with the remote push pipeline — the two use different transports, live in different files, and must not be merged.

---

## Step 1 — Audit checklist

Go through every item. **If present and matches, skip. If missing or drifted, implement in Step 2.** Do not "improve" the envelope shape, id strings, or category values — they form a contract with the iOS wrapper and any drift makes the notification silently drop.

### Transport prerequisites

- [ ] `sendIOSEvent(type, payload)` exists (see Phase 1 of `implementation-order.md`) and posts to `window.webkit.messageHandlers.wanillajs` with the legacy `gameEvents` fallback. Local push rides this exact channel — no new handler.
- [ ] `IOSNavigationBridge` is mounted and listens for `ios:navigate` events. Without it, `deepLink` taps land nowhere.
- [ ] `window.navigateFromIOS(path)` is exposed at module scope so the wrapper can deliver taps, and a `window.addEventListener('wanillajs.event.notificationTapped', …)` analytics listener exists (see `notification-tap-handling.md` §3–§4).

### Trigger registry (`src/utils/pushTriggers.ts`)

- [ ] File exists at `src/utils/pushTriggers.ts`. Every schedule/cancel call in the codebase goes through it — **never** call `sendIOSEvent("wanillajs.event.push.schedule", …)` directly from a page. The registry is the single source of truth for ids, categories, delays, copy, and deep links.
- [ ] Exports a `PushTriggerId` string-literal union. Ids are dotted, lower-case, and stable — they map 1:1 to `UNNotificationRequest` identifiers on iOS, so renaming one silently orphans any previously scheduled notification.
- [ ] Exports a `PushCategory` union of exactly `"retention" | "social" | "monetisation"`. iOS uses this to bucket notifications for Focus/Do-Not-Disturb; do not invent new categories without updating the wrapper.
- [ ] Exports `schedulePush(payload: SchedulePushPayload)` and `cancelPush(id: PushTriggerId)` — the low-level primitives.
- [ ] Exports one convenience helper per trigger the app actually uses (e.g. `schedDailyGamesReset`, `schedStreakAtRisk`). Pages call the helpers, never `schedulePush` directly, so copy and delays live in one file.

### Envelope contract (must match exactly)

Schedule:
```json
{
  "type": "wanillajs.event.push.schedule",
  "payload": {
    "id": "daily.limit.hints",
    "category": "retention",
    "title": "…",
    "body": "…",
    "fireAt": 1746489600,          // unix seconds, OR
    "delaySeconds": 86400,         //   one of the two, never both
    "deepLink": "/some/path",      // optional; mapped to ios:navigate on tap
    "replaces": true               // default true; false only for stacked reminders
  }
}
```

Cancel: `{ "type": "wanillajs.event.push.cancel", "payload": { "id": "<PushTriggerId>" } }`

- [ ] `replaces` defaults to `true` inside `schedulePush`. iOS should cancel any existing request with the same `id` before scheduling the new one — this is how re-arming triggers like `streak.at.risk` stays idempotent.
- [ ] `deepLink` values are real in-app routes. When tapped, iOS calls `window.navigateFromIOS(deepLink)` and dispatches the `wanillajs.event.notificationTapped` CustomEvent (`{ trigger_id, category, deep_link, cold_start }`); the web app routes it. If the route requires a session, `IOSNavigationBridge` already gates it — do not add ad-hoc auth checks here.
- [ ] `title` and `body` are localized at the call site (via `i18n.t(...)`) if the app supports multiple languages. iOS displays the strings verbatim; it does not re-translate.

### Behavioural wiring

Each trigger must be armed and cancelled at the correct behavioural moment. Do not schedule from generic lifecycle hooks — schedule only from the specific event that makes the trigger true.

Reference wiring (adapt names to the target app; skip triggers that don't apply):

| Trigger id              | Arm when …                                                                 | Cancel when …                          | Delay  |
| ----------------------- | -------------------------------------------------------------------------- | -------------------------------------- | ------ |
| `daily.limit.games`     | Paywall blocks the user for the "daily allowance exhausted" reason         | Not required; next arming replaces it  | 24h    |
| `daily.limit.hints`     | Last daily hint is consumed **and** the bonus/bank balance is zero         | Not required; next arming replaces it  | 24h    |
| `series.in.progress`    | User finishes a non-final word inside a multi-step flow (series/course/…)  | Series is completed                    | 48h    |
| `streak.at.risk`        | A round finishes (win or loss)                                             | Next round starts                      | 20h    |
| `subscription.lapsed`   | `subscriptionStatusChanged` from iOS reports the plan just expired         | Next `active` status message           | 1h     |
| `challenge.received` / `challenge.your.turn` / `leaderboard.overtaken` / `referral.successful` | Reserved — wire only when the matching feature ships | — | — |

- [ ] Every arm site cancels the previous request via `replaces: true` (implicit) or an explicit `cancelPush(id)` — no manual bookkeeping of "did I already schedule this."
- [ ] `streak.at.risk` is cancelled at the **start** of the next round, not at the end of the previous one, otherwise the notification races the user.

### Do-not-do list

- Do **not** create a new `window.*` handler for local push. It rides `sendIOSEvent` on the shared `wanillajs` channel.
- Do **not** send `fireAt` and `delaySeconds` together. Pick one.
- Do **not** call `schedulePush` from `useEffect` cleanup or route-change listeners — schedule from the concrete behaviour, not from render lifecycles.
- Do **not** reuse ids across meanings. If a trigger's purpose changes, mint a new id and cancel the old one during migration; otherwise stale scheduled requests on user devices will fire with the new copy.
- Do **not** put user PII or long payloads in `title` / `body`. iOS caches these on-device and shows them on the lock screen.

---

## Step 2 — Implement only what the audit found missing

For every gap, mirror the source-project artifact verbatim:

- **`src/utils/pushTriggers.ts`:** copy from the reference project. Keep the exact `PushTriggerId` union and `PushCategory` union; add or remove ids only as needed for the target app's features. Adjust helper delays / copy / deep links to match the target app's routes.
- **Call-site wiring:** add `sched*` / `cancelPush(...)` calls at the behavioural moments listed above. Import from `@/utils/pushTriggers`, never from `@/utils/iosNotifications`.
- **Localization:** if the target app uses `react-i18next`, wrap the strings in `t(...)` at the call site (not inside `pushTriggers.ts`, because helpers may be called from non-React code).

Do not invent new categories, new envelope keys, or new transports.

---

## Step 3 — Verification checklist

Run each check in the iOS wrapper (not the browser — the browser has no APNs / UNUserNotificationCenter). Paste the results in your final message.

1. **Diag stream.** Watch the wrapper's `wanillajs.event.*Diag` (or console) stream while triggering each arm site. Confirm exactly one `wanillajs.event.push.schedule` fires per trigger, with the correct `id`, `category`, and either `fireAt` or `delaySeconds`.
2. **Replacement.** Trigger `streak.at.risk` twice in a row without cancelling. Confirm iOS reports **one** pending request with that id (not two), proving `replaces: true` is honoured.
3. **Cancellation.** Arm `streak.at.risk`, then start a new round. Confirm a `wanillajs.event.push.cancel` fires with `{ id: "streak.at.risk" }` and iOS reports zero pending requests with that id.
4. **Tap → navigate.** Fast-forward the device clock (or use a short `delaySeconds` for the test) so a notification fires. Tap it. Confirm the app opens on the `deepLink` route, not the last visited route or the home screen. If the app is cold-launched, confirm the pending tap is drained on `wanillajs.event.appStarted` (see `notification-tap-handling.md`).
5. **No direct sends.** `grep -rn 'wanillajs.event.push' src/` should return matches **only** inside `src/utils/pushTriggers.ts`. Any hit elsewhere is a bug — that page is bypassing the registry.
6. **No mixed transports.** `grep -rn 'sendIOSEvent.*push' src/` should return matches **only** inside `src/utils/pushTriggers.ts`. Local push must not be dispatched from ad-hoc call sites.
7. **Category correctness.** Every schedule call uses one of `retention | social | monetisation`. `grep -rn 'category:' src/utils/pushTriggers.ts` should list only these values.
8. **Permission dependency.** Confirm the app has already asked for push permission (Phase 4 of `implementation-order.md`) before relying on scheduled notifications for a critical retention loop. Scheduling succeeds silently even when permission is denied — the user simply never sees anything.

---

## Cross-references

- `docs/ios-web-bridge-guide.md` §4 (transport), §4.0 / §4.1 (event registry and catalogue).
- `docs/ios-bridge/notification-tap-handling.md` (tap → `ios:navigate`).
- `docs/ios-bridge/remote-push-pipeline-prompt.md` (the server-driven counterpart — do not merge with this).
- `docs/ios-bridge/implementation-order.md` (Phase 4 — Push stack).
