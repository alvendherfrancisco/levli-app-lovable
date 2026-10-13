# Native Bridge: AdMob Interstitials + Non-consumable IAP — OPTIONAL MODULE

> **Include if** the app is ad-supported and/or sells a one-off "remove ads"
> purchase. **Skip if** the app monetises only through auto-renewing
> subscriptions (that path is `ios-paywall-events.md` +
> `subscription-bridge-prompt.md`) or is free.

`{{APP_NAME}}` web → WKWebView (Wanilla shell) bridge for AdMob interstitials
and StoreKit in-app purchases. These use **dedicated message handlers**
(`ads`, `iap`) with a request/response pattern, unlike the fire-and-forget
`wanillajs.event.*` envelope. The wrapper must register both handlers on
`WKUserContentController` or the messages are silently dropped.

## Outgoing messages (JS → native)

Posted via `window.webkit.messageHandlers[handler].postMessage(payload)`.
Every request carries a client-generated `requestId`; native echoes it back so
the web can match the response to the pending promise.

### Handler: `ads`

```json
{ "action": "showAd", "requestId": "<string>" }
```

Native shows a non-skippable AdMob interstitial. When the user has finished
(or skipped per AdMob rules), native MUST call `window.onAdClosed(requestId)`.

### Handler: `iap`

```json
{ "action": "purchase", "productId": "{{ADFREE_PRODUCT_ID}}", "requestId": "<string>" }
```

Native runs the StoreKit purchase flow, then calls:

```js
window.onPurchaseResult(requestId, { success: true,  receipt: "<base64>" })
window.onPurchaseResult(requestId, { success: false, error: "user_cancelled" })
```

```json
{ "action": "restore", "requestId": "<string>" }
```

Native runs the restore flow, then calls:

```js
window.onRestoreResult(requestId, { success: true })
window.onRestoreResult(requestId, { success: false, error: "nothing_to_restore" })
```

### Handler: `wanillajs` — external links

External links (terms, privacy, help) do **not** use this module — they go
through `wanillajs.event.navigation.shouldOpenURL` on the standard channel.
Full spec: `docs/ios-bridge/should-open-url.md`.

## Inbound globals (native → JS)

Install all three at module scope from `src/main.tsx` (same rule as every
other iOS-invoked global — never inside a component `useEffect`):

```ts
window.onAdClosed(requestId: string): void
window.onPurchaseResult(requestId: string, result: { success: boolean; receipt?: string; error?: string }): void
window.onRestoreResult(requestId: string, result: { success: boolean; error?: string }): void
```

Each resolves the pending promise for `requestId` and is a no-op for unknown
ids. Add a safety timeout (e.g. 90 s for purchases, 60 s for ads) so a missed
native callback cannot strand the UI.

## Product IDs

| Purpose    | App Store Product ID    | Type           |
| ---------- | ----------------------- | -------------- |
| Remove ads | `{{ADFREE_PRODUCT_ID}}` | Non-consumable |

## Rules

- **Entitlement is local-first, server-optional.** The web stores
  `adFree: true` in `localStorage` once it receives a `success` callback. If
  the app also has a server-side entitlement table, reconcile against it the
  same way the subscription bridge does (hint first, DB confirms; never let an
  empty row revoke a native-confirmed purchase — see
  `ios-integration-mistakes.md` #21 / #55).
- **Browser preview fallback.** If `window.webkit.messageHandlers` is absent
  (browser / `?preview=1`), the web layer uses a mock timed ad modal and a mock
  purchase sheet — no native bridge calls are made and nothing throws.
- **Ad frequency is a web-side decision** (one source project showed an
  interstitial every 3rd completed unit of content; subscribers / ad-free
  purchasers skip the counter entirely). iOS only shows what it is asked to.
- **Restore is mandatory** for non-consumables (App Store guideline 3.1.1) —
  surface a "Restore purchases" row in Settings that posts `{ action: "restore" }`.

## Push notifications

The canonical contract for notification permission (request, status
broadcasts, denied recovery) lives in
`docs/ios-bridge/push-permission-bridge.md`.
