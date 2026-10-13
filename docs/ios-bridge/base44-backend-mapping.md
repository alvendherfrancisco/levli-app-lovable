# Base44 Backend Mapping — read this before any backend phase

This doc set was first written for Lovable Cloud (Supabase). This Base44
variant keeps the **web ↔ iOS bridge byte-for-byte identical** (the Swift
wrapper does not care which backend the web app uses) and swaps the backend
layer. This file is the translation table; every backend sub-doc in this set
follows it.

## 1. Concept mapping

| Supabase concept (Lovable set) | Base44 equivalent (this set) | Notes |
|---|---|---|
| `auth.users` row + Supabase JWT session | Base44 app user (identity = **email**) + Base44 access token | `base44.auth.me()` returns `{ id, email, role, full_name, data.* }` |
| `window.setSupabaseSession(access, refresh)` | `window.setBase44Session(ott)` | Single-use **embed sign-in token** minted by Vapor via the Apps API; see `session-injection-contract.md` |
| `apple-auth-webhook` / `google-auth-webhook` edge functions (mint session) | **Vapor calls the Base44 Apps API directly**: `POST /api/apps/{app_id}/users/provisions` then `POST /api/apps/{app_id}/embed-tokens` | No Base44 backend function is needed to mint a session. Vapor holds a **workspace API key** with the *Provision app users* + *Mint embed sign-in tokens* permissions |
| `public.profiles` table + `on_auth_user_created` trigger | Custom fields on the built-in **`User` entity** (`username`, …) + an `ensure-profile` backend function | Base44 has no DB triggers on users; the web calls `ensure-profile` once after the first `auth.me()` |
| `public.<table>` with RLS policies | **Entity** (JSON schema) with `rls` block | `{"created_by": "{{user.email}}"}` ≈ `auth.uid() = user_id`; use `user_email` / `user_id` fields on records you create server-side |
| Service-role-only table (RLS + zero policies) | Entity with `rls: { create:false, read:false, update:false, delete:false }` | `base44.asServiceRole.entities.X` bypasses RLS from backend functions only |
| Supabase Edge Function (`supabase/functions/<name>/index.ts`) | **Backend function** `base44/functions/<name>/entry.ts` (Deno, `export default async function (req)`) | HTTP endpoint: `https://{{BASE44_APP_DOMAIN}}/functions/<name>` |
| `verify_jwt = false` in `config.toml` | *(nothing)* — direct HTTP calls arrive with **no user context**; do your own `x-api-key` check and use `asServiceRole` | Calls via `base44.functions.invoke()` from the web carry the user; `base44.auth.me()` returns `null` for external callers |
| `Deno.env.get('SECRET')` | `secrets.get('SECRET')` from `base44:runtime` (inside the handler, never at module top level) | Set with `base44 secrets set NAME=value` or the dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` bearer for `send-push` | Not needed: the cron **automation** invokes the function in-platform; external callers are rejected by an `x-api-key` check | See `remote-push-pipeline-prompt.md` |
| `pg_cron` + `pg_net` 1-minute schedule | **Scheduled automation** in `function.jsonc` (`schedule_type: "simple", repeat_unit: "minutes", repeat_interval: 1`) | If the app has **Workflows** enabled, `function.jsonc` automations are refused (HTTP 409) — recreate the schedule as a Workflow instead |
| `claim_push_outbox_batch()` with `FOR UPDATE SKIP LOCKED` | Optimistic claim: `filter({status:'pending', next_attempt_at ≤ now})` → `update(id, {status:'claimed', claim_token})` → re-read and keep only rows whose `claim_token` matches | No row locks in Base44's NoSQL store; the claim token is the dedupe |
| `auth.admin.deleteUser(id)` | `POST /api/apps/{app_id}/users/{user_id}/deprovision` (or *Remove app user*) from **Vapor** via the Apps API, after the backend function has deleted the user's entity records | See `delete-user-prompt.md` |
| `supabase.auth.startAutoRefresh()` / `refreshSession()` on foreground | `base44.auth.me()` liveness probe; on 401 → emit `wanillajs.event.auth.sessionRequested` so iOS re-mints silently | See `foreground-event.md` |
| `supabase.auth.onAuthStateChange` | A small web-side `authStore` that emits `auth:changed` when `setBase44Session` succeeds / logout runs | The SDK has no auth-state event; the bridge owns it |

## 2. Identity flow at a glance

```text
User taps "Sign in with Apple"
  │
iOS: native ASAuthorization → identity token
  │
Vapor: verify token (Apple JWKS) → users table keyed by apple_user_id, store email
  │
Vapor → Base44 Apps API (workspace API key):
   POST /api/apps/{{BASE44_APP_ID}}/users/provisions   { email, role: "user", full_name }   (idempotent)
   POST /api/apps/{{BASE44_APP_ID}}/embed-tokens        { email, surface: "live_site" }
        → { token, expires_in: 60, embed_url }
  │
Vapor → iOS: { success, user: { email }, auth: { ott, embed_url, expires_in } }
  │
iOS: window.setBase44Session('<ott>')   ← exactly once per fresh sign-in / cold start
  │
Web: redeem the one-time token → Base44 access token → base44.auth.setToken(...) → auth:changed
```

The embed token is **single-use and expires in 60 s**. Mint it as the last
step before injecting; never cache or log it.

## 3. What is verified vs. what you must confirm (beta surface)

Everything in §1 marked plainly is documented on docs.base44.com as of
October 2026. The following are **beta or inferred** — confirm them in a
scratch app before building Phase 2 on them:

| Item | Status | How to verify |
|---|---|---|
| Apps API endpoints `POST /api/apps/{app_id}/users/provisions` and `POST /api/apps/{app_id}/embed-tokens` | Documented, **beta** ("endpoints, fields and behaviour may change"). The embed-token path was renamed to `/embed-url` in a change dated 2026-10-06; request/response unchanged. | `curl` both with your workspace API key; use whichever path returns 200 and pin it in Vapor |
| Loading `embed_url` (`…/?ott=<token>`) in the WKWebView signs the app in | Documented for iframe embedding; SDK redeems `?ott=` at client creation | Load `embed_url` in a WKWebView; `base44.auth.me()` must return the user |
| Exchanging the OTT **without a reload** (`POST /api/apps/{appId}/auth/embed/token`, `grant_type=urn:ietf:params:oauth:grant-type:token-exchange`, `subject_token_type=urn:base44:params:oauth:token-type:embed-ott`) then `base44.auth.setToken(access_token, true)` | Seen in the SDK source, **not in public docs** | Try it from a backend function first; if it fails, use the reload path (`session-injection-contract.md` §4) |
| Whether the redeemed session **persists** across WKWebView cold starts (localStorage) | Unknown — the SDK refuses token storage while it considers itself embedded | Cold-start the wrapper after a sign-in; if `auth.me()` is 401, the wrapper must re-mint on every cold start (the contract already allows this) |
| Base44 `User.id` vs email as the stable key for Vapor | Email is the Apps API identity; Apple private-relay emails are stable per Apple ID + app | Key Vapor's `users` by `apple_user_id` / `google_user_id`; store the Base44 email alongside |
| Entity automations firing on the built-in `User` entity | Not documented | Don't rely on it — use the `ensure-profile` function instead |

## 4. Secrets (names)

| Where | Secret | Purpose |
|---|---|---|
| Vapor | `BASE44_WORKSPACE_API_KEY` | Apps API: provision users, mint embed tokens, deprovision users |
| Vapor | `BASE44_APP_ID` (= `{{BASE44_APP_ID}}`) | Path parameter for the Apps API |
| Base44 app | `APPLE_WEBHOOK_API_KEY` | Authenticates Vapor → backend functions (`update-subscription`, `delete-user`, `referral-credit`) via `x-api-key` |
| Base44 app | `VAPOR_BASE_URL`, `VAPOR_PUSH_API_KEY` | `send-push` → Vapor APNs relay (`X-WLAPNS`) |
| Base44 app | `INTERNAL_FUNCTION_KEY` | Backend-function-to-backend-function calls that must not be reachable from the web (e.g. `enqueue-push` → `send-push` fire-and-forget) |

`GOOGLE_WEBHOOK_API_KEY` from the Lovable set is **not needed**: Google and
Apple both terminate at Vapor, and Vapor talks to Base44 with one workspace key.

## 5. Things that do not change

- Every `window.*` global and `wanillajs.event.*` name (the Swift wrapper is
  shared across backends). The only rename is `setSupabaseSession` →
  `setBase44Session`, because the argument is different (one OTT instead of
  two Supabase tokens). If your wrapper build only knows
  `setSupabaseSession`, alias it: `window.setSupabaseSession = (a) =>
  window.setBase44Session(a)`.
- The Vapor-facing contracts (`/v1/users/apns/add`,
  `/api/v1/users/apns/external`, `X-WLAPNS`, retry ladder, payload shapes).
- All numeric guards (5 min staleness, 10 s single-flight, 3 s logout guard,
  5 s session timeout, 20 s overlay auto-hide, 2 s push-status fallback).
