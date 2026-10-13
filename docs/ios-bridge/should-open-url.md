# shouldOpenURL — open an external link in Safari

Web → iOS. Sent when the user taps a link that must leave the webview
(legal pages, marketing site, external help articles).

WKWebView silently drops `target="_blank"` navigations unless the host app
implements `webView(_:createWebViewWith:)`. Instead of relying on that, the web
app explicitly asks iOS to open the URL.

## Event

| Field | Value |
| --- | --- |
| Channel | `window.webkit.messageHandlers.wanillajs` (aliases: `gameEvents`, `dataEvents`) |
| Type | `wanillajs.event.navigation.shouldOpenURL` |
| Direction | Web → iOS (outbound only) |

### Envelope

```json
{
  "type": "wanillajs.event.navigation.shouldOpenURL",
  "payload": {
    "url": "https://{{MARKETING_DOMAIN}}/terms",
    "context": "signin.terms"
  }
}
```

- `url` (string, required) — absolute `https://` URL.
- `context` (string, optional) — where the tap came from, for analytics.
  Current values: `signin.terms`, `signin.privacy`, `profile.terms`, `profile.privacy`.

## Legal disclaimer requirement

Every surface that creates or holds an account MUST show a short legal line whose
Terms / Privacy links go through `openExternalURL`:

| Surface | Component | Copy |
| --- | --- | --- |
| Sign-in modal + onboarding sign-in step | `src/components/auth/SignInButtons.tsx` | "By continuing you agree to our Terms and Conditions and Privacy Policy." |
| Profile → Account section (signed in) | `src/pages/Profile.tsx` | "By having an account you have agreed to our Terms and Conditions and Privacy Policy." |

Rules:
- Links: `https://{{MARKETING_DOMAIN}}/terms` and `https://{{MARKETING_DOMAIN}}/privacy`.
- Render as real `<a href>` with `target="_blank"` + `rel="noopener noreferrer"`, but
  `preventDefault()` on click and call `openExternalURL(url, context)` so the wrapper opens Safari.
- Styling: `text-[11px] text-muted-foreground`, links `text-primary underline underline-offset-2`.
  No hardcoded colours.
- Any new account-creation or account-management surface added later must include this line.


## Web side

`src/lib/iosBridge.ts` exposes:

```ts
openExternalURL(url: string, context?: string): boolean
```

- In the wrapper: emits `wanillajs.event.navigation.shouldOpenURL`, returns `true`.
- In a plain browser: `window.open(url, "_blank", "noopener,noreferrer")`, returns `false`.

Trigger points today: the Terms and Conditions / Privacy Policy links under the
Apple + Google buttons in `src/components/auth/SignInButtons.tsx` (rendered in
the onboarding sign-in step and the sign-in prompt modal). Anchors keep a real
`href` for accessibility and call `preventDefault()` before delegating.

## iOS handler

```swift
case "wanillajs.event.navigation.shouldOpenURL":
    guard
        let urlString = payload["url"] as? String,
        let url = URL(string: urlString),
        url.scheme == "https"          // reject non-https / custom schemes
    else { return }
    UIApplication.shared.open(url, options: [:], completionHandler: nil)
```

Notes:
- Validate the scheme is `https` before opening — never pass an unvalidated
  string to `UIApplication.shared.open`.
- Optionally restrict the host to `{{MARKETING_DOMAIN}}` and its subdomains.
- `{{MARKETING_DOMAIN}}` is the app's public marketing / legal site (not the Lovable preview URL).
- `SFSafariViewController` is an acceptable alternative if the app prefers to
  keep the user in-app; Apple review accepts either for legal links.
