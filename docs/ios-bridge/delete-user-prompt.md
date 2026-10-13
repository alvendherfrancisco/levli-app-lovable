# Reusable Prompt: iOS Wrapper + Base44 Account Deletion Flow

Paste this entire prompt into a new chat. It assumes the project already has the iOS web bridge foundation (`sendIOSEvent`, `setBase44Session`, `forceLogoutFromIOS`, wrapper detection). If those are missing, implement Phase 1 and Phase 2 of `docs/ios-bridge/implementation-order.md` first.

## Goal

Implement a secure, irreversible account-deletion flow that:
1. Starts from the iOS wrapper's native confirmation.
2. Calls your Vapor backend, which (a) calls a Base44 backend function to delete the user's app data and (b) deprovisions the app user through the Base44 Apps API.
3. Returns the web app to `/auth` with no cached session, so a relaunch never shows the deleted user's screen.

## iOS wrapper → Web contract

The iOS wrapper must expose a `deleteUserButtonTapped(userID:)` Swift function that:

1. Shows a native confirmation alert.
2. On confirm, calls Vapor's delete endpoint.
3. Evaluates JavaScript in this exact order:
   ```swift
   webView.evaluateJavaScript("window.showLoadingOverlay()")
   // ... Vapor performs the server-side deletion ...
   webView.evaluateJavaScript("window.hideLoadingOverlay()")
   webView.evaluateJavaScript("window.showLoginScreen()")
   appleCredentialStore.clear()   // so re-sign-in prompts the Apple sheet again
   ```

The web app must install a global `window.showLoginScreen` handler in `src/utils/iosNotifications.ts`:

```ts
export const showLoginScreen = () => {
  forceLogoutFromIOS('accountDeleted');
};
```

`forceLogoutFromIOS('accountDeleted')` must be unconditional and synchronous for local teardown:

- Skip the 2-minute native-sign-in suppression guard when `reason === 'accountDeleted'`.
- Set `sessionStorage.logoutRequestedAt = Date.now()` (3 s guard to drop a racing `setBase44Session` re-injection).
- Remove `iosAuthSessionEstablishedAt`, `appleSignInRequestedAt`, and `googleSignInRequestedAt` from `sessionStorage`.
- Capture the current user id from the `authStore` before scrubbing.
- Clear the `authStore` and remove every Base44 token key from `localStorage` synchronously (the SDK's own key plus anything your bridge wrote).
- Emit `wanillajs.event.auth.userDidSignOut({ userId, reason: 'accountDeleted' })`.
- Fire `base44.auth.logout()` as fire-and-forget (do NOT await; it may navigate — call `location.replace('/auth')` yourself first if it does not).
- Immediately call `window.location.replace('/auth')`.

## Server side — two calls from Vapor

### 1. Base44 backend function: `delete-user-data`

`base44/functions/delete-user-data/entry.ts`, reachable at
`https://{{BASE44_APP_DOMAIN}}/functions/delete-user-data`. Called server-to-server by Vapor, never from the browser.

- **Method:** `POST`
- **Headers:** `Content-Type: application/json`, `x-api-key: <APPLE_WEBHOOK_API_KEY>` (the same key Vapor uses for `update-subscription` and `referral-credit`; do **not** introduce a separate deletion key)
- **Body:** `{ "user_id": "<Base44 User.id>" }`

Behavior:

1. `secrets.get("APPLE_WEBHOOK_API_KEY")` constant-time compare → 401 if missing/invalid. (External HTTP calls carry no user context; do **not** call `base44.auth.me()` here.)
2. Validate `user_id` is a non-empty string → 400 otherwise.
3. `const admin = createClientFromRequest(req).asServiceRole;`
4. `admin.entities.User.get(user_id)` → 404 if not found (Vapor treats 404 as success after logging).
5. Delete every record in **your project's entities** that references this user, in dependency order (children before parents). Use `filter` + `delete` per record, or `deleteMany` where available. Replace the example with your schema:
   ```ts
   const byUser = async (name: string, field = "user_id") => {
     const rows = await admin.entities[name].filter({ [field]: user_id });
     await Promise.all(rows.map((r: any) => admin.entities[name].delete(r.id)));
     return rows.length;
   };
   // Generic order — children first:
   await byUser("ChallengeRound", "player_id");
   await byUser("Challenge", "challenger_id"); await byUser("Challenge", "challenged_id");
   await byUser("Membership");
   await byUser("Board", "owner_id");
   await byUser("UserStats");
   await byUser("UserSubscription");
   await byUser("ReferralReward", "referrer_id");
   await byUser("PushOutbox", "recipient_user_id");
   ```
   Collect per-entity failures into `warnings` instead of aborting.
6. Clear profile fields on the `User` record (`username`, `username_lc`, balances) so a re-provisioned email starts clean.
7. Return 200: `{ "success": true, "message": "User data deleted", "warnings": [] }` — 500 only if the user lookup or a required deletion threw.

### 2. Base44 Apps API: deprovision the app user

After (1) returns 2xx, Vapor calls, with its **workspace API key**:

```
DELETE-style deprovision: see "Deprovision an app user" in the Apps API
(https://app.base44.com/api/apps/{{BASE44_APP_ID}}/… — beta; confirm the exact path in your workspace)
Header: api_key: <BASE44_WORKSPACE_API_KEY>
Body:   { "email": "<the user's Base44 email>" }
```

This removes the person's access *and* their app user record. If deprovisioning fails, Vapor retries with backoff and alerts — the data is already gone, so the account must not be left half-deleted.

Vapor then deletes its own `users` row (apple_user_id / google_user_id binding) and all APNs device rows for that user.

### Security rules

- Do NOT expose `delete-user-data` to the browser or anonymous clients — the `x-api-key` check is the only auth; there is no `verify_jwt` toggle on Base44, so the check is mandatory.
- Do NOT let the web app delete its own data via open RLS `delete` rules.
- Store `APPLE_WEBHOOK_API_KEY` as a Base44 secret, never in source code; store `BASE44_WORKSPACE_API_KEY` only on Vapor.

## Verification checklist

- [ ] Tapping delete in iOS shows native confirmation.
- [ ] Confirming calls Vapor, which calls `delete-user-data` with `x-api-key` and then deprovisions the user.
- [ ] All user records in app entities are removed; profile fields on `User` are cleared.
- [ ] The person no longer appears in the app's users list in the Base44 dashboard.
- [ ] `window.showLoginScreen()` lands on `/auth`, not the previous authenticated screen.
- [ ] After closing and reopening the app, the user sees `/auth` (no cached session, Apple sheet shown again).
- [ ] Calling `setBase44Session` within 3 s of logout is dropped by the `logoutRequestedAt` guard.
