# Onboarding state bridge (web ⇄ iOS wrapper) — OPTIONAL MODULE

> **Include if** the app has a first-run onboarding flow that must be shown
> once per *device* (before sign-in). **Skip if** onboarding is account-level
> or there is no onboarding at all.

The wrapper owns the durable "has this device completed onboarding?" boolean
in `UserDefaults`. It is the **single source of truth**.

Authority contract:

- The web app never sets the flag itself. Finishing onboarding only *reports*
  completion to the wrapper (`wanillajs.event.onboarding.completed`).
- On every launch the wrapper pushes the boolean into the webview with
  `window.setOnboardingCompleted(true|false)`.
- Until that call arrives, the web app renders a splash and makes no decision.
  `true` -> sign-in screen, `false` -> onboarding flow.
- Outside the wrapper (plain browser / `?preview=1`) there is no native
  authority, so the onboarding flow shows immediately.

**Scope:** the flag is *device-level* and answers only the signed-out,
first-screen question. It never overrides account state — see
"Signed-in accounts with no onboarding data" below.

## 0. Signed-in accounts with no onboarding data

An account can be signed in and still have no app profile / progress row — e.g. a brand-new sign-up on a device that has onboarded
before. In that case the account wins over the device flag:

- The web app shows the onboarding flow again instead of the sign-in screen,
  even when the wrapper reported `onboardingCompleted = true`.
- It waits (splash) until both the session and the cloud progress lookup have
  resolved, so no screen flashes and no redirect loop can form
  (`/home` -> `/` -> `/auth` -> `/home`).
- The **"Already have an account? Sign in"** button is hidden — the user is
  already signed in.
- On finishing this re-run, the web app does **not** send
  `wanillajs.event.onboarding.completed`. The wrapper's stored flag is already
  `true` and this pass is account recovery, not first-run onboarding. The app
  routes straight to `/home`.

Wrapper implications: no extra handling is required. Just keep setting the
flag to `false` on sign-out and account deletion (see section 3) so a genuine
new device/user still gets the first-run path.

## 1. Web → iOS: onboarding completed

Event type (added to `src/lib/wrapperRegistry.ts`):

```
wanillajs.event.onboarding.completed
```

Payload:

```json
{ "at": 1756377600000 }   // plus any app-specific fields, e.g. a chosen display name
```

Sent from the final onboarding step via
`notifyOnboardingCompleted()` in `src/utils/iosOnboardingBridge.ts`, before the
app routes to `/auth` or `/home`.

Swift side:

```swift
case "wanillajs.event.onboarding.completed":
    UserDefaults.standard.set(true, forKey: "onboardingCompleted")
```

## 2. iOS → Web: onboarding flag at launch

After the wrapper receives `wanillajs.event.appStarted`, it must push the
stored boolean into the webview:

```swift
case "wanillajs.event.appStarted":
    let done = UserDefaults.standard.bool(forKey: "onboardingCompleted")
    webView.evaluateJavaScript("window.setOnboardingCompleted(\(done))", completionHandler: nil)
```

`window.setOnboardingCompleted(_:)` is installed at startup by
`initializeOnboardingBridge()` (called from `src/main.tsx`). It accepts
`true/false` (also `"true"`, `1`) and returns a JSON ack string:

```json
{ "accepted": true, "onboardingCompleted": true }
```

## 2b. Swift reference implementation

```swift
import WebKit

extension WebViewController {

    /// Pushes the persisted onboarding flag into the webview.
    /// Call right after receiving `wanillajs.event.appStarted`.
    func sendOnboardingCompleted(_ completed: Bool? = nil) {
        let done = completed ?? UserDefaults.standard.bool(forKey: "onboardingCompleted")
        // No existence check: the web installs the function at module load,
        // before it ever emits `appStarted`, so it is always present here.
        let js = "window.setOnboardingCompleted(\(done));"

        DispatchQueue.main.async { [weak webView] in
            webView?.evaluateJavaScript(js) { result, error in
                if let error = error {
                    print("[bridge] setOnboardingCompleted failed:", error.localizedDescription)
                } else {
                    // result is the JSON ack, e.g. {"accepted":true,"onboardingCompleted":true}
                    print("[bridge] setOnboardingCompleted ack:", result ?? "nil")
                }
            }
        }
    }
}
```

Message-handler wiring:

```swift
switch type {
case "wanillajs.event.appStarted":
    sendOnboardingCompleted()

case "wanillajs.event.onboarding.completed":
    UserDefaults.standard.set(true, forKey: "onboardingCompleted")

case "wanillajs.event.auth.userDidSignOut":
    // Also do this after an account deletion, so the next user on this
    // device sees onboarding again instead of a profile-less stage.
    UserDefaults.standard.set(false, forKey: "onboardingCompleted")

default:
    break
}
```

Push the flag from the `appStarted` case rather than from `viewDidLoad` /
`didFinish navigation:` — the web app sends `appStarted` only after React has
mounted and installed the global, so that is the first moment the call is
guaranteed to land.



### Web-side effect

- The flag is cached in `sessionStorage` under `iosOnboardingCompleted`
  (`"1"` / `"0"`), so a mid-session reload does not lose it.
- `src/pages/Welcome.tsx` subscribes via `useIOSOnboardingCompleted()`. When
  the flag is `true` and there is no local profile yet, it redirects straight
  to `/auth` instead of showing the landing screen.
- `null` means "the wrapper hasn't told us" (plain browser, or the event has
  not arrived yet) — the web app then falls back to its own local state.

## 3. Reset on logout / account deletion

`forceLogoutFromIOS()` calls `clearIOSOnboardingFlag()`, so the cached value is
dropped and the next launch relies on whatever the wrapper reports. The wrapper
should also set its `UserDefaults` flag to `false` when an account is deleted,
otherwise a brand-new user on the same device skips onboarding and lands on a
profile-less stage.

## Notes

- Idempotent: sending the completion event more than once is harmless.
- The flag is device-level, not account-level. Cloud progress / profile data remains the source of truth for a signed-in user; this
  flag only chooses the *first screen* shown at launch.
