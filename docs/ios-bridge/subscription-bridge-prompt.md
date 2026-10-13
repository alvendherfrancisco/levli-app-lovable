# Reusable prompt: Wire up the paywall / subscription bridge (Web ↔ iOS ↔ Vapor ↔ Base44)

Use this prompt in any Base44 project where you need the same subscription communication contract.

---

## Task: Wire up the paywall / subscription bridge (Web ↔ iOS ↔ Vapor ↔ Base44)

Our iOS wrapper isn't reliably driving the StoreKit sheet or reflecting subscription state back into the web app. Implement the full contract described in our existing docs and verify each surface before reporting done.

## Canonical sources — read first, do not re-derive

1. `docs/ios-bridge/ios-paywall-events.md` — the dedicated paywall sub-doc.
2. `docs/ios-web-bridge-guide.md` — the main canonical guide:
   - **§4.1 (Paywall / subscriptions)** for the web → iOS paywall events and the legacy `notificationName` trigger; **§3.11** for the iOS → web `subscriptionStatusChanged` fast-path.
   - **§8.3** for the Vapor → Base44 `update-subscription` backend function and the `UserSubscription` entity.
3. `docs/ios-bridge/base44-backend-mapping.md` — Supabase → Base44 translation.

If any of these docs are missing, stop and ask me to provide them before writing code.

## Scope — implement all four surfaces

1. **Web → iOS: StoreKit trigger**
   - When the user taps the subscribe button on the paywall, post a message directly to `window.webkit.messageHandlers.gameEvents` (not through a generic `sendIOSEvent` helper) with the literal payload:
     ```js
     { notificationName: "paywall.subscriptions.show" }
     ```
   - This is the authoritative signal that tells the iOS wrapper to present the native StoreKit subscription sheet.

2. **Web → iOS: analytics events**
   - From the same paywall component, also emit:
     - `wanillajs.event.paywall.subscribeButtonTapped` with `{ userId }` on subscribe tap.
     - `wanillajs.event.paywall.closeButtonTapped` with `{ userId }` on close tap.
   - These are analytics-only; they must not be used as the StoreKit trigger.

3. **iOS → Web: subscription state sync**
   - Listen for `window.postMessage({ type: "subscriptionStatusChanged", status })` from the WKWebView (object **or** JSON-string payload).
   - Apply `status.isSubscribed` + `expirationDate` immediately as a hint (cache on `window.__lastSubscriptionHint` and in `localStorage.isSubscribed`), then reconcile against the database via the `get-subscription` function. Reconciliation may upgrade to active, and may downgrade only when it actually observed a signed-in user **and** an expired row — "no session" / "no row yet" are *unknown*, never negative.

4. **Vapor → Base44: server-to-server update**
   - Implement or confirm the `update-subscription` backend function at `https://{{BASE44_APP_DOMAIN}}/functions/update-subscription`.
   - It must:
     - Require `x-api-key: <APPLE_WEBHOOK_API_KEY>` (constant-time compare against `secrets.get("APPLE_WEBHOOK_API_KEY")`). Return 401 otherwise.
     - Validate the body with zod (or equivalent): `user_id` (Base44 user id, string), `expiration_date` (int, unix seconds, required), `product_id`, `purchase_date`, `original_transaction_id`, `consumed_product_discount_id` (all optional).
     - Confirm the user exists: `asServiceRole.entities.User.get(user_id)` → 404 if not.
     - Upsert the `UserSubscription` record keyed by `user_id` (filter → update or create). One record per user; renewals overwrite.
     - Use Unix-epoch seconds for `purchase_date` and `expiration_date`.

## Required files / artifacts

- `src/components/Paywall.tsx` (or whatever your paywall component is called) that fires **both** the direct `gameEvents` notification and the `wanillajs` analytics events.
- `src/utils/subscriptionHandler.ts` (or equivalent) that:
  - Has a same-origin postMessage guard.
  - Applies the native hint first, then reconciles against the DB on init, on `auth:changed`, and on every hint.
  - Dispatches `subscription-status-hint` (fast) and `subscriptionUpdated` (authoritative) CustomEvents.
  - Is consumed at the **provider/root** level, not inside the paywall sheet.
- `base44/entities/UserSubscription.jsonc`:
  ```jsonc
  {
    "name": "UserSubscription",
    "type": "object",
    "properties": {
      "user_id":                      { "type": "string" },
      "product_id":                   { "type": "string" },
      "purchase_date":                { "type": "integer", "description": "unix seconds" },
      "expiration_date":              { "type": "integer", "description": "unix seconds — the gating field" },
      "original_transaction_id":      { "type": "string" },
      "consumed_product_discount_id": { "type": "string" }
    },
    "required": ["user_id", "expiration_date"],
    "rls": {
      "read":   { "data.user_id": "{{user.id}}" },
      "create": false, "update": false, "delete": false
    }
  }
  ```
  Read-own-record only; no client writes (service role from `update-subscription` only).
- `base44/functions/update-subscription/entry.ts` with zod validation and the `x-api-key` check.
- `base44/functions/get-subscription/entry.ts` (user-invoked via `base44.functions.invoke`) returning `{ expiration_date, product_id } | null` for `auth.me()` — or read the entity directly from the client; both are RLS-safe.
- `APPLE_WEBHOOK_API_KEY` secret set in the project (`base44 secrets set`).

## Trust rules

- `localStorage.isSubscribed` is **UX-only**. Every paid gate must re-check the database via the subscription handler.
- A forged cross-origin `postMessage` must be ignored by the origin guard.
- Subscription state must never be granted by client-side code alone.
- A DB reconcile must never revoke an entitlement the wrapper confirmed moments ago while the native `expirationDate` is still in the future.

## Anti-patterns — reject these

- Sending the StoreKit trigger via the `wanillajs.event.*` envelope.
- Granting subscription solely from a `postMessage` without DB reconciliation.
- Client-side writes to `UserSubscription` (any open `create`/`update` RLS).
- Using ISO strings instead of Unix-epoch seconds for `purchase_date` / `expiration_date` in the entity (the postMessage fast-path uses ISO — that's intentional, different consumer).
- Listeners for entitlement scoped to the paywall sheet component.

## Verification checklist — run before reporting done

- [ ] Tap Subscribe in the web app inside the wrapper: console/network shows exactly one `paywall.subscriptions.show` `gameEvents` message and one `subscribeButtonTapped` analytics event.
- [ ] Tap Close in the web app inside the wrapper: one `closeButtonTapped` event is emitted.
- [ ] Simulate `window.postMessage({ type: "subscriptionStatusChanged", status: { isSubscribed: true, expirationDate: "<future ISO>" } }, "*")` from devtools: the hint flips gated UI immediately, then a DB re-read runs; with no row the UI stays active (unknown ≠ expired).
- [ ] `curl` against `https://{{BASE44_APP_DOMAIN}}/functions/update-subscription`:
  - With valid `x-api-key` and valid body → 200.
  - Without `x-api-key` → 401.
  - With invalid body → 400.
  - Verify the `UserSubscription` record is upserted by `user_id` (exactly one record).
- [ ] Forged `postMessage` from a cross-origin iframe is ignored (origin guard test).
- [ ] A paid feature gate still blocks when `localStorage.isSubscribed=true` but the DB record says expired **and** the cached native hint is also expired.

Report: file diffs, function URL, and screenshots or log excerpts from the checks above.

## Reuse guidance

If the target app is not a game, rename the `wanillajs.event.paywall.*` analytics event names to fit your domain — but **do not rename** the `notificationName` string `"paywall.subscriptions.show"`. iOS matches on that exact literal to present StoreKit.
