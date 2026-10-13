# APNs Token Registration — iOS Wrapper Implementation

This document covers the **device token → Vapor → JS** flow inside the iOS wrapper.

## Web-side contract

The web exposes `window.setRemotePushDeviceRegistered({ registered: true })`
(see `docs/ios-web-bridge-guide.md` §3.9; backend mapping in `base44-backend-mapping.md`). iOS calls it **once** — and only
after the Vapor registration call returns 2xx. Never inject
`{ registered: false }`; the web treats this handler as a success-only
signal and Vapor's `send-push` drainer already handles the "device not
registered yet" race with a 60 s retry.

## Handler naming

Outbound web → iOS events flow through the `wanillajs` `WKScriptMessageHandler`
(canonical). Some legacy wrapper builds register the handler under the name
`gameEvents` as an alias — new wrappers should register **`wanillajs`** and
treat `gameEvents` as deprecated. Injecting the `window.*` globals below is
independent of the outbound handler name.

## Overview

After the user grants push permission (`UNUserNotificationCenter.requestAuthorization`), you must call `UIApplication.shared.registerForRemoteNotifications()`. On success, Apple invokes `didRegisterForRemoteNotificationsWithDeviceToken`. You then send that token to your Vapor backend and, on HTTP 200, inform the web app via `window.setRemotePushDeviceRegistered({ registered: true })`.

---

## Step-by-step implementation

### 1. Trigger registration after the user grants permission

Inside your `UNUserNotificationCenter.requestAuthorization` completion handler, on the **main thread**:

```swift
UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { granted, error in
    DispatchQueue.main.async {
        // Always push the permission status to JS first
        self.injectPushPermissionStatus(
            status: granted ? .authorized : .denied,
            source: .promptResult
        )

        // Only proceed to APNs registration if granted
        if granted {
            UIApplication.shared.registerForRemoteNotifications()
        }
    }
}
```

> **Why `DispatchQueue.main.async`?** `registerForRemoteNotifications()` must run on the main thread. The completion handler above may fire on a background queue.

---

### 2. Handle success in `didRegisterForRemoteNotificationsWithDeviceToken`

```swift
func application(
    _ application: UIApplication,
    didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
) {
    // 1. Convert token to lowercase hex
    let tokenHex = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()

    // 2. Persist locally (used for Vapor API calls and re-registration checks)
    UserDefaults.standard.set(tokenHex, forKey: "apns_device_token")

    // 3. Call Vapor to register the token
    Task {
        do {
            try await VaporAPI.registerAPNsToken(tokenHex)
            // 4. Only inject into webview on confirmed success
            self.injectDeviceRegistered()
        } catch {
            print("APNs token registration failed: \(error)")
            // Do NOT inject failure into webview.
            // The web app does not need to know about transient failures.
        }
    }
}
```

**Important:** Do not inject `registered: false` on failure. The web side treats `setRemotePushDeviceRegistered` as a success-only signal. Vapor's `send-push` drainer already handles the race condition where a device isn't registered yet (1 retry after 60s).

---

### 3. Vapor API call (`VaporAPI.registerAPNsToken`)

```swift
import Foundation

enum VaporAPI {
    static func registerAPNsToken(_ tokenHex: String) async throws {
        let baseURL = URL(string: "{{VAPOR_BASE_URL}}")!
        let url = baseURL.appendingPathComponent("/v1/users/apns/add")

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        // Use the Apple identity token from Sign in with Apple
        guard let appleIdentityToken = Keychain.load(.appleIdentityToken) else {
            throw VaporError.missingAuthToken
        }
        request.setValue("Bearer \(appleIdentityToken)", forHTTPHeaderField: "Authorization")

        let body: [String: Any] = [
            "apns_token": tokenHex,
            "environment": isDebugBuild ? "sandbox" : "production",
            "bundle_id": Bundle.main.bundleIdentifier ?? "",
            "locale": Locale.current.identifier
        ]

        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw VaporError.invalidResponse
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            let bodyString = String(data: data, encoding: .utf8) ?? "<empty>"
            throw VaporError.httpError(status: httpResponse.statusCode, body: bodyString)
        }
    }
}

enum VaporError: Error {
    case missingAuthToken
    case invalidResponse
    case httpError(status: Int, body: String)
}
```

**Field reference:**

| Field | Description |
|-------|-------------|
| `apns_token` | Lowercase hex string from `deviceToken.map { String(format: "%02.2hhx", $0) }.joined()` |
| `environment` | `"sandbox"` for Debug builds, `"production"` for TestFlight/App Store |
| `bundle_id` | Your app's bundle identifier |
| `locale` | `Locale.current.identifier`, e.g. `en_US` |

---

### 4. Handle failure in `didFailToRegisterForRemoteNotificationsWithError`

```swift
func application(
    _ application: UIApplication,
    didFailToRegisterForRemoteNotificationsWithError error: Error
) {
    print("Failed to register for remote notifications: \(error.localizedDescription)")
    // Do NOT call injectDeviceRegistered() here.
    // The web app does not need to know about this failure.
}
```

Common causes:
- Running on the iOS Simulator (APNs is not supported; use a real device)
- Missing `aps-environment` entitlement
- No network connectivity
- Apple Push Notification service outage

---

### 5. Re-register on every cold launch

In `application(_:didFinishLaunchingWithOptions:)`, after checking the current authorization status:

```swift
func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
) -> Bool {
    // ... other setup ...

    UNUserNotificationCenter.current().getNotificationSettings { settings in
        DispatchQueue.main.async {
            let status = settings.authorizationStatus

            // Push current status to JS on every cold launch
            self.injectPushPermissionStatus(status: status, source: .appStart)

            // Re-register if already authorized (token may have changed)
            switch status {
            case .authorized, .provisional, .ephemeral:
                UIApplication.shared.registerForRemoteNotifications()
            case .notDetermined, .denied:
                break
            @unknown default:
                break
            }
        }
    }

    return true
}
```

> **Why re-register every launch?** Apple may rotate the device token. Re-registering ensures Vapor always has the current token.

---

### 6. Inject into the webview

Use `JSONSerialization` (not raw string interpolation) to safely construct the JavaScript payload:

```swift
private func injectDeviceRegistered() {
    let payload: [String: Any] = ["registered": true]

    guard let jsonData = try? JSONSerialization.data(withJSONObject: payload),
          let jsonString = String(data: jsonData, encoding: .utf8) else {
        print("Failed to serialize device-registered payload")
        return
    }

    let script = """
    (function() {
        if (typeof window.setRemotePushDeviceRegistered === 'function') {
            window.setRemotePushDeviceRegistered(\(jsonString));
        } else {
            setTimeout(function() {
                if (typeof window.setRemotePushDeviceRegistered === 'function') {
                    window.setRemotePushDeviceRegistered(\(jsonString));
                }
            }, 500);
        }
    })();
    """

    webView.evaluateJavaScript(script) { _, error in
        if let error = error {
            print("Device registration injection failed: \(error)")
        }
    }
}
```

**Why `JSONSerialization`?** It guarantees correct quoting and escaping. With raw string interpolation like `\(result.status.rawValue)`, bare words like `granted` or `true` are injected unquoted into JavaScript, causing `ReferenceError`.

After this injection, the web app will:
1. Set `deviceRegistered = true` in memory
2. Dispatch a `pushDeviceRegisteredUpdated` custom event
3. Any subscribers (e.g. analytics, debug UI) receive the update

---

## End-to-end happy path

```
PushOptInBanner ──→ sendIOSEvent("wanillajs.event.push.requestPermission")
                    ↓
              iOS calls UNUserNotificationCenter.requestAuthorization()
                    ↓
              User taps "Allow"
                    ↓
              iOS injectPushPermissionStatus(status: .authorized, source: .promptResult)
                    ↓
              UIApplication.shared.registerForRemoteNotifications()
                    ↓
         didRegisterForRemoteNotificationsWithDeviceToken(tokenData)
                    ↓
              VaporAPI.registerAPNsToken(tokenHex)
                    ↓
              POST /v1/users/apns/add → HTTP 200
                    ↓
              injectDeviceRegistered()
                    ↓
              window.setRemotePushDeviceRegistered({ registered: true })
```

---

## Project configuration checklist

Before this flow works, verify:

1. **Push Notifications capability** is enabled in Xcode → Signing & Capabilities
2. **Background Modes** → "Remote notifications" is checked
3. **APNs Auth Key** (`.p8`) is uploaded to Apple Developer Portal AND your Vapor server
4. **`aps-environment` entitlement** is present in your provisioning profile
5. **Testing on a real device** — the iOS Simulator cannot receive APNs tokens

---

## Push status request (web → iOS): `wanillajs.event.push.requestStatus`

The web side never polls or inspects notification permission itself — iOS is
the source of truth and broadcasts via `window.setPushPermissionStatus` at
cold launch (`source: "appStart"`), on every foreground (`"foreground"`) and
after the OS prompt (`"promptResult"`).

Problem observed in production (one source project): a screen that mounts *after* those broadcasts
(e.g. the Profile settings row) never receives a status and renders
"Checking…" forever.

### Contract

Outbound (web → iOS):

```json
{ "type": "wanillajs.event.push.requestStatus", "payload": {} }
```

iOS MUST respond by calling, on the main thread:

```js
window.setPushPermissionStatus({ status: "<status>", source: "appStart" })
```

`status` is one of: `authorized` (alias: `granted`), `denied`,
`notDetermined`, `provisional`, `ephemeral`, `unknown`. `granted` is
normalized to `authorized` on receipt. Any other shape is rejected and logged
with `console.error` on the web side.

Full permission contract: `docs/ios-bridge/push-permission-bridge.md`.

Implementation note (Swift): read
`UNUserNotificationCenter.current().getNotificationSettings` and map
`authorizationStatus` to the string above; evaluate the JS on the webview.

### Web-side fallback

`usePushPermission()` sends `push.requestStatus` on mount and marks itself
`resolved` after a 2s timeout. If nothing arrives, the UI stops showing
"Checking…" and falls through to the `notDetermined` copy plus a "Turn on"
button, so the user always has an action. A late reply still updates the UI.
