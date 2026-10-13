# Referral Credit — Vapor Integration Spec (Base44)

> Closes the deferred-deep-link loop: when a new user installs the app via a Tapp referral link, Vapor calls a Base44 backend function server-to-server to credit the original sharer.

The web app is **not** involved in this flow. The referrer's app may not even be open at the time. For the push-delivery pipeline this feeds into (`PushOutbox` → `send-push` → Vapor APNs relay), see `remote-push-pipeline-prompt.md`.

---

## When Vapor invokes this

**Trigger:** Tapp attribution resolves on a fresh install and returns a payload tagged `featureType: "referral_credit"`. The payload includes the referrer's `userID` (baked in by the web app when the share link was minted via `wanillajs.event.share.requestLink` — see guide §4.1).

**Pre-condition (important):** Vapor MUST wait until the **referred** user has completed native sign-in and has been provisioned on Base44 **and** has redeemed their first session (so a `User` record exists — `base44-backend-mapping.md` §2). The endpoint requires `referredUserId` to be a real Base44 `User.id`. Vapor learns that id from the web → iOS `wanillajs.event.auth.userDidSignIn { userId }` event, which fires after the first successful `auth.me()`.

**Self-referral short-circuit:** If `referrerUserId === referredUserId`, skip the call — the server will reject it with 400.

---

## Endpoint

```
POST https://{{BASE44_APP_DOMAIN}}/functions/referral-credit
Content-Type: application/json
x-api-key: <APPLE_WEBHOOK_API_KEY>
```

> Same shared API key Vapor uses for `update-subscription` and `delete-user-data`. External HTTP calls carry no user context; the function must use `asServiceRole` and do its own key check.

### Body

```json
{
  "referrerUserId": "base44-user-id-of-the-sharer",
  "referredUserId": "base44-user-id-of-the-new-install",
  "creditsAwarded": 50
}
```

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `referrerUserId` | string (User.id) | yes | — | From Tapp attribution `userID` |
| `referredUserId` | string (User.id) | yes | — | The newly-signed-in user |
| `creditsAwarded` | int 1–500 | no | `50` | Almost always omit. Rename to your reward unit (hints, tokens, premium days…) |

---

## Response handling

### `200 { "status": "credited", "awarded": N, "reward_id": "<ReferralReward.id>" }`
Success. Vapor does **nothing further** — the function itself enqueues a `referral.successful` push to the referrer (writes a `PushOutbox` record with the service role and invokes `send-push`).

### `200 { "status": "already_credited", "reward_id": "..." }`
This `(referrer, referred)` pair was already credited. Swallow silently. This is the expected outcome on every retry.

### `400 { "error": "self_referral_not_allowed" }`
Log and drop. Do **not** retry.

### `400 { "error": "invalid_body" | "invalid_json", ... }`
Indicates a client bug in Vapor. Log loudly and drop.

### `401 { "error": "unauthorized" }`
API key drift between Vapor env and the `APPLE_WEBHOOK_API_KEY` Base44 secret. Page the on-call.

### `404 { "error": "user_not_found", "which": "referrer" | "referred" }`
The referred user has not redeemed a session yet (see pre-condition) — retry on the same schedule as 5xx. A missing *referrer* is permanent (account deleted): drop.

### `5xx`
Retry with exponential backoff. Suggested schedule: **3 attempts at 5s, 30s, 5min**. The function is idempotent — retries resolve to `already_credited` if a prior attempt actually succeeded.

---

## Guarantees the server provides

- **Idempotent forever.** The `ReferralReward` entity is checked for an existing `(referrer_id, referred_user_id)` pair before writing, and re-read after writing; if two concurrent calls both created a record, the loser deletes its own and returns `already_credited`. (Base44 has no unique index — this check-write-reread loop is the substitute; keep it.)
- **Self-referral rejected** server-side.
- **Credit written with the service role** to `User.data.bonus_credits` (or your reward field) on the referrer — never from the client.
- **Push on first success.** Push failures do not roll back the credit.

### Entity

```jsonc
{
  "name": "ReferralReward",
  "type": "object",
  "properties": {
    "referrer_id":      { "type": "string" },
    "referred_user_id": { "type": "string" },
    "awarded":          { "type": "integer" }
  },
  "required": ["referrer_id", "referred_user_id", "awarded"],
  "rls": { "read": { "data.referrer_id": "{{user.id}}" }, "create": false, "update": false, "delete": false }
}
```

---

## Security

- Treat `APPLE_WEBHOOK_API_KEY` like a production credential. Store in Vapor's secret manager. **Never log it** or echo it in error messages.
- The endpoint is open to the internet — the API key is the only auth. Rotate via `base44 secrets set` if exposure is suspected; coordinate with the iOS team (also affects `update-subscription` and `delete-user-data`).

---

## Test recipe

Replace `{{BASE44_APP_DOMAIN}}`, `<API_KEY>`, and the ids.

### Happy path — credited
```bash
curl -i -X POST "https://{{BASE44_APP_DOMAIN}}/functions/referral-credit" \
  -H "Content-Type: application/json" -H "x-api-key: <API_KEY>" \
  -d '{ "referrerUserId": "<id-a>", "referredUserId": "<id-b>" }'
# 200 {"status":"credited","awarded":50,"reward_id":"..."}
```

### Idempotency — re-run the same call
```bash
# 200 {"status":"already_credited","reward_id":"..."}
```

### Self-referral
```bash
# body with the same id twice → 400 {"error":"self_referral_not_allowed"}
```

### Bad auth
```bash
# -H "x-api-key: wrong" → 401 {"error":"unauthorized"}
```

---

## Related

- `docs/ios-web-bridge-guide.md` §4.1 `share.requestLink` — how the share link is minted
- `docs/ios-bridge/remote-push-pipeline-prompt.md` — how the resulting push is delivered
- `docs/ios-bridge/deep-link-payload-contract.md` — optional data-driven deep-link payloads (`featureType: "referral_credit"`)
- `docs/ios-bridge/base44-backend-mapping.md` — why there is no unique constraint and how the function compensates
