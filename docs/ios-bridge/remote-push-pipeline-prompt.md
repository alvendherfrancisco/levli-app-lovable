# Reusable prompt: Wire up the remote push pipeline (Base44 → Vapor → APNs)

Use this prompt in any Base44 project that needs cross-user, fire-now push notifications delivered through Vapor's APNs relay. This covers the outbound `enqueue-push` → `PushOutbox` → `send-push` → Vapor path only; local/time-based nudges scheduled by iOS itself are out of scope (`local-push-scheduling-prompt.md`).

---

## Task: Audit and (if missing) implement the Base44 → Vapor remote push pipeline

```
Web app ─► enqueue-push (user context via functions.invoke) ─► PushOutbox (pending)
                                          │
                     send-push (scheduled automation every minute + fire-and-forget)
                                          │
                     POST {VAPOR_BASE_URL}/api/v1/users/apns/external
                     Header: X-WLAPNS: <VAPOR_PUSH_API_KEY>
                                          │
                                        APNs
```

## Canonical sources — read first, do not re-derive

1. `docs/ios-web-bridge-guide.md`
   - **§8.0 / §8.1** — source-of-truth split, topology diagram and secret matrix.
   - **§8.5** — full contract for `enqueue-push`, `PushOutbox`, `send-push`, retry ladder, Vapor endpoint shape.
2. `docs/ios-bridge/apns-registration.md` — device-registration side and the 60s "user not found" retry rationale.
3. `docs/ios-bridge/base44-backend-mapping.md` — Supabase → Base44 translation (claiming without row locks, automations vs cron).
4. `docs/ios-bridge/referral-credit-vapor-spec.md` — an example server-only trigger that uses this pipeline.

If any of these docs are missing, stop and ask for them before writing code.

---

## Step 1 — Audit checklist (do this before writing anything)

Go through every item. **If present and matches, skip it. If missing or drifted, implement it in Step 2.** Do not silently "improve" values — the retry ladder, batch size, header name, endpoint path, and payload shape must match exactly, because they form a contract with Vapor.

### Secrets (`base44 secrets set`)

- [ ] `VAPOR_BASE_URL` is set (no trailing slash assumed by code).
- [ ] `VAPOR_PUSH_API_KEY` is set and is a **distinct** value from `APPLE_WEBHOOK_API_KEY`. Reuse is forbidden — the Apple key authenticates Vapor → Base44; this key authenticates Base44 → Vapor. They must rotate independently.
- [ ] `INTERNAL_FUNCTION_KEY` is set — used only for `enqueue-push` → `send-push` fire-and-forget and for the scheduled drain.
- [ ] None of these appear in any file under `src/**` (grep to confirm). They must never enter the browser bundle. Read them with `secrets.get()` inside the handler, never at module top level.

### Entity

- [ ] `base44/entities/PushOutbox.jsonc` exists:
  ```jsonc
  {
    "name": "PushOutbox",
    "type": "object",
    "properties": {
      "recipient_user_id": { "type": "string" },
      "category":          { "type": "string", "enum": ["social", "monetisation", "retention"] },
      "trigger_id":        { "type": "string", "maxLength": 64 },
      "title":             { "type": "string", "maxLength": 200 },
      "body":              { "type": "string", "maxLength": 500 },
      "deep_link":         { "type": "string", "maxLength": 500 },
      "payload":           { "type": "object", "additionalProperties": { "type": "string", "maxLength": 500 } },
      "dedupe_key":        { "type": "string", "maxLength": 200 },
      "enqueued_by":       { "type": "string" },
      "status":            { "type": "string", "enum": ["pending", "claimed", "sent", "failed", "dead"], "default": "pending" },
      "claim_token":       { "type": "string" },
      "attempts":          { "type": "integer", "default": 0 },
      "last_error":        { "type": "string" },
      "next_attempt_at":   { "type": "integer", "description": "unix seconds" },
      "sent_at":           { "type": "integer", "description": "unix seconds" }
    },
    "required": ["recipient_user_id", "category", "trigger_id", "title", "body", "status", "next_attempt_at"],
    "rls": { "create": false, "read": false, "update": false, "delete": false }
  }
  ```
- [ ] RLS closes **all four** operations. Only `asServiceRole` (backend functions) touches this entity. No "sender can see their own rows" convenience rule.
- [ ] A "may caller push recipient?" predicate exists for social triggers, implemented as a shared helper in `base44/shared/mayPushTo.ts` that checks your app's social link entity with the service role (membership, friendship, team…). Name it after the real relationship — do not copy a leaderboard name.

### Backend functions

- [ ] `base44/functions/enqueue-push/entry.ts` exists and:
  - Gets the caller with `createClientFromRequest(req).auth.me()`; `null` → 401. (It is invoked from the web via `base44.functions.invoke("enqueue-push", body)`, which forwards the user.)
  - Uses zod to validate the body: `recipient_user_id string`, `category enum`, `trigger_id str≤64`, `title str≤200`, `body str≤500`, `deep_link str≤500?`, `payload record<string,string≤500>` with max 20 keys, `dedupe_key str≤200?`, `drain_now bool?`.
  - Enforces per-trigger authorisation: server-only triggers (`subscription.lapsed`, `referral.successful`) are **rejected** (403) for any web caller; self-push is rejected (403); social triggers require `mayPushTo(callerId, recipientId)` to return true.
  - Dedupe: if `dedupe_key` is set, `filter({ dedupe_key })` first; if a record exists return `200 { success: true, deduped: true }`. After creating, re-filter and if more than one record carries the key, delete the newer one(s) and return `deduped: true` (compensates for the missing unique index).
  - Creates the record with `asServiceRole.entities.PushOutbox.create(...)`, `status: "pending"`, `next_attempt_at: now`.
  - When `drain_now !== false`, fire-and-forget `POST https://{{BASE44_APP_DOMAIN}}/functions/send-push` with header `x-internal-key: <INTERNAL_FUNCTION_KEY>` wrapped in `waitUntil()` so high-priority notifications don't wait for the schedule.
- [ ] `base44/functions/send-push/entry.ts` exists and:
  - Accepts only (a) the scheduled automation (request body `args` present, no user) or (b) `x-internal-key` equal to `INTERNAL_FUNCTION_KEY`. Anything else → 401. Never trust `auth.me()` here.
  - Batch size **25**. Claim without row locks: `filter({ status: "pending" })`, keep rows with `next_attempt_at ≤ now`, take 25, for each `update(id, { status: "claimed", claim_token: <uuid>, attempts: +1 })`, then `get(id)` and **skip** any row whose `claim_token` is not the one this invocation wrote (another drainer won).
  - Processes claimed rows in parallel via `Promise.allSettled`.
  - Posts to `POST {VAPOR_BASE_URL}/api/v1/users/apns/external` with header `X-WLAPNS: <VAPOR_PUSH_API_KEY>` and JSON body: `{ recipient_user_id, category, trigger_id, title, body, deep_link, payload, dedupe_key }`.
  - **200 + `{ success: true, devices_notified: N }`** → `status: "sent"`, `sent_at`. `devices_notified: 0` is still success.
  - **404 + `reason` starts with "User not found"** → 1 retry after 60s (`USER_NOT_FOUND_MAX_ATTEMPTS = 2`), then `dead`. Covers the race between sign-in and Vapor `/v1/users/apns/add` device registration.
  - **404 with any other reason** → treat as transient (likely bad `X-WLAPNS` key), log loudly, fall into the backoff ladder.
  - Permanent 4xx (`>=400 && <500`, except 408, 429, and the 404 handled above) → `dead`.
  - Transient (5xx, 408, 429, network) → `status: "pending"`, `next_attempt_at` via ladder **60s, 5m, 30m, 2h, 12h** (`MAX_ATTEMPTS = 5`), then `dead`.
  - Rows left in `claimed` for > 10 min (crashed drainer) are reset to `pending` at the start of each run.
- [ ] `base44/functions/send-push/function.jsonc` schedules the drain:
  ```jsonc
  {
    "name": "send-push",
    "entry": "entry.ts",
    "automations": [{
      "type": "scheduled", "name": "drain_push_outbox", "is_active": true,
      "schedule_mode": "recurring", "schedule_type": "simple",
      "repeat_unit": "minutes", "repeat_interval": 1,
      "function_args": { "trigger": "cron" }
    }]
  }
  ```
  If the app has **Workflows** enabled, deploying this fails with HTTP 409 — recreate the same 1-minute schedule as a Workflow that invokes `send-push`, and keep `function_args` out of the file. Either way, "drain is scheduled" is a first-class checklist item: confirm it in the dashboard's Automations/Workflows tab.

### Client helper

- [ ] `src/utils/remotePush.ts` exposes `sendRemotePush({ recipientUserId, triggerId, category, title, body, deepLink?, payload?, dedupeKey? })` that calls `base44.functions.invoke("enqueue-push", …)`.
- [ ] The `payload` TS type is `Record<string, string>` — nested objects and non-string values are forbidden (Vapor rejects them). This constraint must be enforced both here and in the zod schema on the server.

---

## Step 2 — Implement only what the audit found missing

For every gap, mirror the artifact above verbatim. Do not invent new fields, new statuses, or new retry values. Every deviation from this contract is a bug.

- **Vapor side (out-of-repo, but must be delivered together):** implement `POST /api/v1/users/apns/external` that authenticates on `X-WLAPNS`, looks up the recipient's APNs devices by Base44 `User.id`, sends the alert, and responds:
  - `200 { success: true, devices_notified: <n>, dedupe_key }` on success (including `n=0`).
  - `404 { reason: "User not found ..." }` when the recipient has no registered devices.
  - `400` for malformed body (permanent, will be dead-lettered).

---

## Step 3 — Verification checklist

Run each check and paste the result in your final message. Skipping this section is not acceptable.

1. **Happy path.** `base44.functions.invoke("enqueue-push", {...})` from an authenticated web session. Confirm: record appears with `status='pending'`; within seconds (fire-and-forget drain) `status='sent'`, `sent_at` populated, `last_error` empty; Vapor logs show `devices_notified >= 0`.
2. **Drainer auth.** `curl -X POST https://{{BASE44_APP_DOMAIN}}/functions/send-push` with no header → 401. With `x-internal-key` → 200 and a drain summary.
3. **Registration race.** Enqueue a push to a user with **no** registered APNs device. Confirm the record goes `pending → pending (next_attempt_at ≈ +60s, last_error contains "User not found") → dead` after the second attempt.
4. **Transient failure.** Point `VAPOR_BASE_URL` at a URL that returns 500. Confirm `next_attempt_at` advances through 60s → 5m → 30m → 2h → 12h → `dead` on attempt 6.
5. **Dedupe.** Two `enqueue-push` calls with the same `dedupe_key`: second returns `{ success: true, deduped: true }` and exactly one record exists.
6. **Self-push rejection.** `recipient_user_id = <your own id>` → 403.
7. **Server-only trigger rejection.** `trigger_id: "referral.successful"` from the web → 403.
8. **Payload shape.** `payload: { nested: { a: 1 } }` → 400 with zod details.
9. **Concurrent drain.** Trigger the scheduled run and the fire-and-forget drain within the same second; confirm no row is sent twice (claim tokens).
10. **No secret leakage.** `grep -r "VAPOR_PUSH_API_KEY\|VAPOR_BASE_URL\|INTERNAL_FUNCTION_KEY" src/` returns nothing.

---

## Cross-references

- `docs/ios-web-bridge-guide.md` §8.1 (topology), §8.5 (full contract).
- `docs/ios-bridge/apns-registration.md` (device-registration side).
- `docs/ios-bridge/implementation-order.md` (Phase 4C — Remote pipeline).
- `docs/ios-bridge/referral-credit-vapor-spec.md` (example of a server-only trigger consuming this pipeline).
