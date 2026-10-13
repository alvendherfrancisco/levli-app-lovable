# Notification-Tap Handling — iOS Wrapper Implementation

> **Contract:** notification taps from iOS use `window.navigateFromIOS(path)` **only**. There is no separate notification-open bridge. `window.handleNotificationOpenFromIOS` has been removed.

All deep-link sources (push tap, Universal Link, Tapp callback) funnel through the same web-side function: `window.navigateFromIOS(path)`. Notification taps add an independent analytics call (`wanillajs.event.notificationTapped`). Auth tokens must **never** travel through a notification payload — see [`session-injection-contract.md`](./session-injection-contract.md).

---

## Overview

```text
Source: push tap | Universal Link | Tapp callback
        ↓
Build a path string per source
  • push tap → userInfo["deepLink"] / ["deep_link"]   (already a path)
  • UL       → url.path (+ url.query)                 (verbatim)
  • Tapp     → "/join-leaderboard/\(id)"   (constructed from the attributed id — app-specific)
        ↓
Web app ready? ── no ──┐
        │              │
        │              ├─ Push tap: hold in single-slot pendingTap, drain on appStarted
        │              └─ UL / Tapp: rely on window.__pendingIOSPath fallback
        ↓
webView.navigateFromIOS(path:)            ← all sources
webView.notifyNotificationTapped(...)     ← notification taps only (analytics)
        ↓
IOSNavigationBridge → React Router navigate(path)
```

> **iOS is a dumb URL forwarder.** It doesn't parse path semantics. For push and Universal Links it passes the existing path verbatim; only Tapp requires constructing a path (the source projects used `"/join-leaderboard/\(id)"`) because Tapp's attribution returns an ID rather than a URL. The web owns all routing logic. If you want to remove even that one constructed path from Swift, adopt the optional `deep-link-payload-contract.md`.

---

## Removed: `sendNotificationOpen` / `handleNotificationOpenFromIOS`

A previous version of this bridge bundled "inject a Supabase session" and "navigate" into a single `window.handleNotificationOpenFromIOS(payload)` call. That path is **gone**. Reasons:

1. Apple Sign In already injects the session via `window.setBase44Session` exactly once after the credential is returned. The session is then live for the lifetime of the webview — re-injecting on every notification tap was both unnecessary and destructive (it raced with the strict-validation guards in `setBase44Session` and silently no-op'd the deep-link navigation when any token-shaped field was present in the payload).
2. There is nothing the notification-open path did for navigation that `navigateFromIOS` doesn't already do better, with no auth coupling.

The wrapper must:

- **Delete** any `sendNotificationOpen(_:)` / `WanillaClientPushNotificationOpenPayload` Swift code.
- On notification tap, call `webView.navigateFromIOS(path: payload.deepLink)` (see section 3 below).
- Never include `accessToken` / `refreshToken` in any notification payload.

---

## 1. Payload contract — dual-key support

iOS reads the deep link from `userInfo` with this priority:

1. `userInfo["deepLink"]` (camelCase)
2. `userInfo["deep_link"]` (snake_case)

**Why both?**
- Local notifications scheduled via `pushTriggers.ts` use **camelCase** (`deepLink`) — see `local-push-scheduling-prompt.md`.
- Remote APNs payloads from Vapor / the `push_outbox` table use **snake_case** (`deep_link`) — see `remote-push-pipeline-prompt.md`.

Also extract these for analytics (snake_case from Vapor; mirror the same keys when scheduling local notifications):
- `userInfo["trigger_id"]` — e.g. `"daily.limit.hints"`, `"streak.at.risk"`
- `userInfo["category"]` — `"retention" | "social" | "monetisation"`

```swift
struct NotificationTapPayload {
    let deepLink: String?
    let triggerId: String?
    let category: String?

    init(userInfo: [AnyHashable: Any]) {
        self.deepLink = (userInfo["deepLink"] as? String)
            ?? (userInfo["deep_link"] as? String)
        self.triggerId = userInfo["trigger_id"] as? String
        self.category = userInfo["category"] as? String
    }
}
```

---

## 2. Cold start vs warm tap

### Warm tap — app already running
The webview is mounted, `IOSNavigationBridge` is listening. Inject immediately.

### Cold start tap — app was killed
- iOS launches the app via `application(_:didFinishLaunchingWithOptions:)` with `launchOptions[UIApplication.LaunchOptionsKey.remoteNotification]` populated, OR
- The notification center delegate fires before the webview has finished bootstrapping React Router.

In either case, injecting JS too early will fail silently. Queue the tap and drain it once `wanillajs.event.appStarted` arrives (one-shot, see guide §5.7).

```swift
class AppDelegate: UIResponder, UIApplicationDelegate, UNUserNotificationCenterDelegate, WKScriptMessageHandler {

    private var pendingTap: NotificationTapPayload?
    private var webAppReady = false

    func handleAppStarted() {
        webAppReady = true
        if let pending = pendingTap {
            pendingTap = nil
            dispatchTap(pending, coldStart: true)
        }
    }

    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        let payload = NotificationTapPayload(userInfo: response.notification.request.content.userInfo)
        if webAppReady {
            dispatchTap(payload, coldStart: false)
        } else {
            pendingTap = payload  // single-slot queue: latest tap wins
        }
        completionHandler()
    }
}
```

> **Foreground tap:** always navigate. A tap is explicit user intent.

---

## 3. The injection (Swift)

```swift
extension WKWebView {
    /// Navigate the web app to a path. Uses window.navigateFromIOS when the
    /// bridge is mounted; otherwise seeds window.__pendingIOSPath so the
    /// bridge picks it up on mount (cold-start belt-and-suspenders).
    func navigateFromIOS(path: String) {
        let escaped = path.replacingOccurrences(of: "'", with: "\\'")
        let script = """
        (function() {
            if (typeof window.navigateFromIOS === 'function') {
                window.navigateFromIOS('\(escaped)');
            } else {
                window.__pendingIOSPath = '\(escaped)';
            }
        })();
        """
        evaluateJavaScript(script) { _, error in
            if let error = error {
                print("[iOS] navigateFromIOS error: \(error.localizedDescription)")
            }
        }
    }

    /// Fire-and-forget analytics ping for a notification tap.
    func notifyNotificationTapped(triggerId: String?,
                                  category: String?,
                                  deepLink: String?,
                                  coldStart: Bool) {
        let payload: [String: Any] = [
            "trigger_id": triggerId ?? NSNull(),
            "category": category ?? NSNull(),
            "deep_link": deepLink ?? NSNull(),
            "cold_start": coldStart
        ]
        guard let data = try? JSONSerialization.data(withJSONObject: payload),
              let json = String(data: data, encoding: .utf8) else { return }

        let script = """
        window.dispatchEvent(new CustomEvent('wanillajs.event.notificationTapped', { detail: \(json) }));
        """
        evaluateJavaScript(script, completionHandler: nil)
    }
}
```

### Two independent concerns

`deepLink` → navigation. `triggerId` / `category` → analytics. Two separate `evaluateJavaScript` calls. Universal Link / Tapp arrivals only call `navigateFromIOS`.

```swift
// Notification tap → both calls
private func dispatchTap(_ payload: NotificationTapPayload, coldStart: Bool) {
    if let path = payload.deepLink, !path.isEmpty {
        webView.navigateFromIOS(path: path)
    }
    webView.notifyNotificationTapped(
        triggerId: payload.triggerId,
        category: payload.category,
        deepLink: payload.deepLink,
        coldStart: coldStart
    )
}

// Universal Link / Tapp → navigation only
private func handleDeepLinkPath(_ path: String) {
    webView.navigateFromIOS(path: path)
}
```

---

## 4. Web-side wiring

`IOSNavigationBridge` exposes `window.navigateFromIOS(path)` and drains `window.__pendingIOSPath` on mount, calling React Router's `navigate(path)`. No other JS-side bridge is involved.

**Session gate for protected paths.** For any path outside `PUBLIC_IOS_PATHS` (`/auth`, `/privacy`, `/terms`, `/join/`, `/join-leaderboard/`), the bridge first checks the web-side `authStore`. If no user is present, it stashes the path in `window.__pendingIOSPath` and emits `wanillajs.event.auth.sessionRequested` — iOS is expected to re-mint a session via Vapor, or complete a fresh Apple/Google Sign In (either triggers `window.setBase44Session`). Once the session lands, the pending path is drained and the navigation completes. Public paths bypass this gate entirely.

---

## 5. Path construction by source

| Source | What iOS has | Path forwarded |
|---|---|---|
| Push notification (local or APNs) | `userInfo["deepLink"]` / `["deep_link"]` | Pass verbatim, e.g. `/join/abc123` |
| Web share / Universal Link | `URL.path` (+ `url.query`) | Pass verbatim |
| Tapp deferred deep link | Resolved feature id (e.g. a board / invite id) | Construct the app's join path, e.g. `"/join-leaderboard/\(id)"` (or pass the dictionary — see `deep-link-payload-contract.md`) |

---

## 6. Edge cases

| Case | Behavior |
|------|----------|
| `deepLink` missing | Skip navigation; still fire `notificationTapped` analytics |
| Unknown route | React Router falls through to `NotFound` |
| Unauthenticated user | `/join/:code` stashes path in `sessionStorage.postAuthRedirect` and bounces to `/auth` |
| Multiple rapid taps before `appStarted` | Single-slot queue: latest wins |

---

## 7. Project config checklist

1. `UNUserNotificationCenter.current().delegate = self` in `didFinishLaunchingWithOptions` **before** the webview loads.
2. Peek at `launchOptions?[.remoteNotification]` and seed `pendingTap`.
3. Wire `wanillajs.event.appStarted` through your `WKScriptMessageHandler` to call `handleAppStarted()`.
4. Implement `userNotificationCenter(_:willPresent:withCompletionHandler:)` returning `[.banner, .sound]` for foreground display.
