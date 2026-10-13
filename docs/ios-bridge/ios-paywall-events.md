# iOS Paywall Events

Two independent messaging channels fire when the user interacts with the
paywall (the source projects used `GamePaywall.tsx` / `src/pages/Game.tsx`; substitute your paywall component and the screen that hosts it). Both post
to `window.webkit.messageHandlers.gameEvents`, but they use different
envelopes and iOS dispatches them separately.

## 1. `wanillajs.event.*` envelope (analytics)

Sent via the shared `sendIOSEvent` helper. Every message has a `type`
field that Swift decodes into a typed case.

| JS `type`                                       | Payload      | Emitted from                     |
| ----------------------------------------------- | ------------ | -------------------------------- |
| `wanillajs.event.paywall.subscribeButtonTapped` | `{ userId }` | your paywall component |
| `wanillajs.event.paywall.closeButtonTapped`     | `{ userId }` | your paywall component |

These are **analytics / observability only**. Do not rely on them to
present the StoreKit sheet — that's the job of the notification-style
message below.

## 2. Notification-style `gameEvents` messages

A **separate**, legacy-style message posted directly (no `sendIOSEvent`
wrapper) whose payload has **no `type` field**. iOS dispatches on
`notificationName`.

| Payload                                                   | Emitted from                            | iOS side-effect                              |
| --------------------------------------------------------- | --------------------------------------- | -------------------------------------------- |
| `{ notificationName: "paywall.subscriptions.show" }`      | the paywall's Subscribe handler | Presents the native StoreKit subscription sheet. |

Sent verbatim:

```js
window.webkit.messageHandlers.gameEvents.postMessage({
  notificationName: 'paywall.subscriptions.show'
});
```

### Namespace

The `paywall.subscriptions.*` namespace is reserved for future
subscription lifecycle signals from web → iOS (e.g. a `hide` counterpart
if the web ever needs to force-dismiss the sheet). Do not overload
`notificationName` with unrelated events — use the `wanillajs.event.*`
envelope for anything new.

## Ordering

When the user taps Subscribe, both channels fire in the same tick:

1. `{ notificationName: "paywall.subscriptions.show" }` → iOS shows StoreKit.
2. `wanillajs.event.paywall.subscribeButtonTapped` → analytics.
3. `sendIOSNotification('subscribeClicked', { source: 'paywall' })` → legacy analytics ping.

iOS must treat (1) as the authoritative trigger; (2) and (3) are for
funnel analysis and can be ignored by the presentation layer.
