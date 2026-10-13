# Loading Overlay Bridge (inbound)

The iOS wrapper gates its UI with a full-screen loading overlay while native
work (auth exchange, account deletion, subscription refresh, …) is in
flight. It calls into the web app via two globals:

```ts
window.showLoadingOverlay(): void
window.hideLoadingOverlay(): void
```

Both are installed by `src/lib/iosLoadingOverlayBridge.ts`, imported from
`src/main.tsx` as a module-level side effect so the handlers exist before
React mounts and before the first native message.

## Contract

- **Synchronous**, **idempotent**, **never throw**, return `undefined`.
- **Ref-counted** — overlapping native operations still hide correctly after
  the last matching `hide` call.
- **Safety timeout** — 20 s auto-hide so a missed `hide` from native cannot
  strand the UI.
- **DOM node**, not React state — survives route changes and is available
  before React mounts (same pattern as the `navigateFromIOS` shim in
  `index.html`).
- **Z-index** `2147483000` — above modals, sheets, tab bar, everything.
- **Backdrop** matches the app's palette (one source project used
  `rgba(198,236,249,0.72)` + blur) — pick a colour from your theme tokens.

## Non-goals

The web app does **not** call these functions itself. They exist purely as
the inbound half of the wrapper contract. All web-triggered spinners live
in React components as usual.
