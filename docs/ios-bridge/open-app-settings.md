# `wanillajs.event.system.openAppSettings`

> **STATUS — NOT WIRED IN THE CURRENT iOS WRAPPER. DO NOT EMIT.**
> The Swift `AppEvent` switch has no `system.*` case, so any emission is
> silently dropped by WKWebView. This doc is retained as the reference
> spec for when the handler is added back — the web-side call sites below
> already exist and will start working the moment iOS ships the handler.

Part of the push permission contract — see
`docs/ios-bridge/push-permission-bridge.md` §3 (recovery from `denied`).

One-way event the web app sends to the iOS wrapper to deep-link the user into
the system Settings app at this app's pane. Used to recover from a `denied`
push-notification permission (since `UNUserNotificationCenter.requestAuthorization`
is a no-op once the user has said no — only Settings.app can re-enable it).

## Envelope

```json
{
  "type": "wanillajs.event.system.openAppSettings",
  "payload": {
    "reason": "push_denied_recovery" | "push_settings_row" | "other"
  }
}
```

## iOS handler

```swift
if let url = URL(string: UIApplication.openSettingsURLString) {
    UIApplication.shared.open(url, options: [:], completionHandler: nil)
}
```

No response back to the web is required. The web app will pick up the new
permission state on the next foreground via the existing
`window.setPushPermissionStatus({ source: "foreground" })` call.

## Call sites in the web app

- `Settings.tsx` → Notifications row → "Open Settings" button when status is `denied`
- `PushDeniedHomeTip.tsx` → one-time soft tip on the home screen when status is `denied`

Both go through `openAppSettings(reason)` in `src/utils/pushPermission.ts`.

## Graceful degradation

If an older wrapper build doesn't yet handle this event, the button taps become
no-ops — nothing crashes, but the user can't recover from `denied` until they
update the app or manually navigate to Settings → Notifications → the app.
