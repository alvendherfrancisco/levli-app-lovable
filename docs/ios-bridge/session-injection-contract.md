# Session Injection Contract — `window.setBase44Session`

This is the single source of truth for when the iOS wrapper is allowed to
inject a Base44 session into the web app. It is the Base44 counterpart of the
Supabase `setSupabaseSession` contract; the guards, timings and diag phases are
deliberately the same so the wrapper's telemetry does not change.

Background on how the token is minted: `base44-backend-mapping.md` §2.

## Rule 1 — One-shot per fresh native sign-in (and per cold start, if needed)

Call `window.setBase44Session(ott, expectedEmail?)` **exactly once**,
immediately after the native sign-in returns and Vapor has provisioned the
user and minted an embed sign-in token for that identity.

Additionally — **only if** verification showed that the redeemed session does
not survive a WKWebView cold start (`base44-backend-mapping.md` §3) — the
wrapper may call it once more per cold start, **in response to**
`wanillajs.event.auth.sessionRequested` from the web, using a freshly minted
token obtained from Vapor without showing the Apple/Google sheet (Vapor already
holds the provider-id ↔ email binding).

Do **NOT** call it:

- on `applicationWillEnterForeground` / scene activation
- on notification tap / deep-link arrival
- on Tapp deferred deep-link resolution
- as a "session heartbeat" or "just in case the webview reloaded"
- with a token older than ~50 s (they expire at 60 s and are single-use — mint
  as the last step before injecting)

Session liveness on resume is handled by the web via `appLifecycle.ts` +
`useAuthEpoch` — see `foreground-event.md`. The wrapper just dispatches
`ios:foregrounded`; the web probes its own session and asks for a new one via
`sessionRequested` only when the probe fails.

## Rule 2 — Token shape

The first argument is the **single-use embed sign-in token** (`token` from
the Apps API response — the value that appears as `?ott=` in `embed_url`).
Not the `embed_url`, not the Apple identity token, not the Apple
`authorizationCode`, not a Base44 access token the wrapper got from somewhere
else.

| Arg | Shape |
|---|---|
| `ott` | Non-empty string. Current tokens are JWT-shaped (three dot-separated base64url segments); the web checks `split('.').length === 3` and rejects anything else with `rejected_invalid_token`. Do not depend on any claim inside it. |
| `expectedEmail` (optional) | The email Vapor returned for this identity. Lets the web detect `already_authenticated` vs `account_switch_detected` **before** spending the single-use token. Pass it whenever you have it. |

## Return value — synchronous JSON, not a Promise

`window.setBase44Session` returns a **synchronous JSON string** of the form
`{accepted, attemptId, tokenShape}` because `WKWebView.evaluateJavaScript`
cannot serialize a Promise. `accepted: true` only means the shape check passed
and the handoff has started. The **real outcome** is delivered asynchronously
via the `wanillajs.event.auth.setSessionDiag` event stream (phase table below).

## Rule 3 — Notification opens go through `navigateFromIOS` only

There is no notification-open bridge. On notification tap, the wrapper calls
`webView.navigateFromIOS(path: payload.deepLink)`. Auth tokens must never be
included in a notification payload. If the user is signed in, the web already
has the session. If they aren't, the deep link is stashed and the web emits
`sessionRequested`.

## 4. How the web redeems the token (implementation note for the web agent)

Two mechanisms exist; use **A** unless verification (`base44-backend-mapping.md`
§3) shows **B** works in your workspace.

**A — Reload with `?ott=` (documented behaviour).** The Base44 SDK redeems a
one-time token present on the page URL when the client is created. The bridge
stashes `window.__pendingIOSPath` (if any) in `sessionStorage`, then does
`location.replace(location.origin + '/?ott=' + encodeURIComponent(ott))`. On
boot the SDK exchanges the token; the bridge then emits the `restored` →
`redirecting` phases and drains the pending path. This is the one place a
full reload is accepted (it re-emits `appStarted`; the `appStartedSent`
session flag suppresses the duplicate).

**B — In-page exchange (no reload; SDK-internal endpoint).**
`POST https://app.base44.com/api/apps/{{BASE44_APP_ID}}/auth/embed/token`
with `grant_type=urn:ietf:params:oauth:grant-type:token-exchange`,
`subject_token=<ott>`, `subject_token_type=urn:base44:params:oauth:token-type:embed-ott`
→ `{ access_token }` → `base44.auth.setToken(access_token, true)` →
`authStore.emit('auth:changed')`. SPA-only, no reload. Treat as unverified
until it returns 200 in your workspace.

After either path, the bridge must:
1. Call `base44.auth.me()` and store `{ id, email, role, data }` in the
   web-side `authStore` (this replaces `supabase.auth.getSession()` everywhere).
2. Emit a token-free `ios:session-restored` CustomEvent so `/auth` dismisses
   and Settings revalidates (`ios-integration-mistakes.md` #51).
3. Call `ensure-profile` once if `me.data.username` is empty
   (`backend-user-schema.md` §3).

## What the web does if you violate the contract

`setBase44Session` is defensively idempotent — but treat that as a safety
net, not a feature:

| Situation | New `phase` in `wanillajs.event.auth.setSessionDiag` |
|---|---|
| Token empty or not three segments | `rejected_invalid_token` — no storage mutation, token not spent |
| `base44.auth.me()` already resolves to a user **and** `expectedEmail` matches it | `already_authenticated` — no storage mutation, token not spent, returns success, still emits `ios:session-restored` |
| Another handoff started in the last 10 s | `duplicate_in_flight` — returns the first call's promise |
| Live user's email differs from `expectedEmail` (genuine account switch) | `account_switch_detected` → `storage_scrubbed` → `preflight_signout_done` → `calling_setSession` |
| Redeem / exchange did not complete within 5 s | `setSession_timeout` |
| Handoff finished cleanly | `restored` → `redirecting` |

Without `expectedEmail` the web cannot distinguish the first two rows from a
real switch and always takes the full redeem path — correct, but it spends a
token and (in mechanism A) reloads.

The 3-second logout guard (`sessionStorage.logoutRequestedAt`) applies exactly
as in the Supabase contract: any `setBase44Session` call within 3 s of that
timestamp is dropped (`logout_guard_dropped`), so the wrapper's automatic
post-relaunch re-injection cannot resurrect a session the user just ended.
Use a **timestamp, never a binary flag**.
