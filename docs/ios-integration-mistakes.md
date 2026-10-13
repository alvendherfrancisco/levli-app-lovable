# iOS Integration — Mistakes Log (merged)

> **Base44 readers:** every entry below was logged against a Supabase
> backend. The web ↔ iOS lessons apply unchanged. For the backend ones,
> translate with `docs/ios-bridge/base44-backend-mapping.md`: edge function →
> backend function, `verify_jwt = false` → "no user context on HTTP calls, do
> your own key check", RLS policies → entity `rls` block, `pg_cron` →
> scheduled automation / Workflow, `auth.users` trigger → `ensure-profile`
> function, `setSupabaseSession` → `setBase44Session`, unique constraints →
> filter → write → re-read loops.

Running list of mistakes the AI made while implementing the Wanilla iOS
wrapper integration across three source projects. Kept so future prompts and
the source docs (`docs/ios-web-bridge-guide.md`, `docs/ios-bridge/*`,
`docs/wanilla-integration.md`) can be tightened. **Append new entries at the
end**, dated and specific.

Format per entry:
- **What happened** — the concrete mistake.
- **Why it was wrong** — what the spec / docs actually said.
- **Prompt fix** / **Rule** — how to phrase future instructions so it doesn't recur.

> **How this merged log is organised.** Entries **1–30** come from the first
> two projects (shared lineage, deduplicated). Entries **31–55** come from the
> third project, which hit the same contract from a fresh codebase; several
> are second sightings of earlier lessons (e.g. 45 ↔ 16, 46 ↔ 19, 55 ↔ 21) —
> that repetition is the point: these are the rules an agent reliably gets
> wrong without an explicit instruction.
>
> **Editorial reconciliations made during the merge** (the docs now say one
> thing; the log preserves the history):
> - **Foreground stale threshold is `STALE_THRESHOLD_S = 5 * 60`** (5 min).
>   Entry 10 enforced 60 s from an older draft of `foreground-event.md`;
>   entry 36 set it to 5 min to match the verification checklist. The docs
>   now say 5 min everywhere; treat entry 10's value as superseded. (The
>   separate `already_authenticated` guard in `setSupabaseSession` — "> 60 s
>   of session left" — is unrelated and stays at 60 s.)
> - **`delete-user` is authenticated with `APPLE_WEBHOOK_API_KEY`** — the one
>   Vapor → Supabase key (guide §8.4 / §8.6). Entry 54's dedicated
>   `DELETE_USER_API_KEY` is superseded; do not add a second key.
> - Section references were normalised to the guide's current numbering
>   (`§8.x` for backend contracts; older entries said `§9.x`).
> - Project-specific names (domains, product ids) were replaced with
>   `{{PLACEHOLDERS}}`.

---

## 1. Invented a combined `auth.signInRequested` event

- **What happened**: In Phase 3, `iosBridge.ts` and `SignInButtons.tsx` emitted
  a single `wanillajs.event.auth.signInRequested` event with a `provider`
  field for both Apple and Google.
- **Why it was wrong**: The native side defines two distinct events:
  `wanillajs.event.auth.appleSignInRequested` and
  `wanillajs.event.auth.googleSignInRequested` (see the Swift
  `appleAuthButtonTapped` / `googleAuthButtonTapped` cases, and now
  `docs/ios-web-bridge-guide.md` §8.2.2). The combined event name appears
  nowhere in the docs — it was invented by the AI.
- **Prompt fix**: When adding any new outbound event, require the AI to quote
  the exact event name from the guide before writing code. If it can't be
  quoted, it must ask, not invent.

---

## 2. Built Phase 3 auth without the token-exchange webhooks

- **What happened**: Phase 3 shipped `SignInButtons`, `useAuth`, and a
  `delete-account` edge function, but did NOT implement
  `apple-auth-webhook` or `google-auth-webhook`. The web assumed iOS would
  call `window.setSupabaseSession` "somehow", with no server endpoint to
  produce those tokens.
- **Why it was wrong**: `docs/ios-web-bridge-guide.md` §8.2.1 / §8.2.2 (plus
  `docs/ios-bridge/session-injection-contract.md` and
  `docs/ios-bridge/referral-credit-vapor-spec.md`) make it explicit: Vapor
  POSTs `{ apple_user_id | google_user_id, email, full_name }` with header
  `x-api-key: <*_WEBHOOK_API_KEY>` to Supabase edge functions that return
  `{ success, user: { id, email, created_at }, auth: { access_token,
  refresh_token, expires_in, token_type }, is_new_user }`. Without these
  endpoints the whole native-owns-auth model is a dangling reference.
- **Prompt fix**: Before shipping any auth-related phase, the AI must
  enumerate every endpoint referenced by the guide and confirm each one
  exists in `supabase/functions/`. Missing endpoints block the phase.

---

## 3. Claimed the .md files "aren't in the docs" without asking

- **What happened**: When the user pointed to
  `docs/ios-web-bridge-guide.md` §8.2.1 / §8.2.2,
  `docs/ios-bridge/session-injection-contract.md`, and
  `docs/ios-bridge/referral-credit-vapor-spec.md`, the AI had never read
  them — because they were never copied into the repo. The AI proceeded
  through Phase 3 anyway.
- **Why it was wrong**: The user uploaded these files earlier in the
  conversation; the AI should have (a) persisted them into `docs/` at
  upload time, and (b) at the start of every phase, listed the .md files
  it was working from and asked the user to confirm the set was complete
  before writing code.
- **Prompt fix**: When the user uploads instruction docs, always copy them
  into `docs/` in the same turn. At the start of every phase, print the
  list of doc files being used and pause for confirmation if any expected
  file is missing.

---

## 4. Falsely claimed Lovable Cloud couldn't schedule `send-push` via cron

- **What happened**: At the end of Phase 4C the AI wrote: "Cron intentionally
  not scheduled — Lovable Cloud can't easily hand the service-role key to
  `pg_net`, and the fire-and-forget from `enqueue-push` covers delivery;
  retries wait for the next enqueue." This framed a solvable design choice
  as a platform limitation and quietly left `push_outbox` retries without a
  reliable drainer.
- **Why it was wrong**: The Lovable knowledge base documents the
  `pg_cron` + `pg_net` scheduling pattern as a first-class workflow (see
  `<schedule-jobs-supabase-edge-functions>` guidance). The only real
  obstacle was self-inflicted: `send-push` gated on
  `Authorization: Bearer <SERVICE_ROLE_KEY>`, which `pg_net` can't populate
  from Postgres env. That's a one-line auth-check change, not a platform gap.
- **Prompt fix**: When the AI decides *not* to do something the plan calls
  for, it must state (a) the concrete blocker, (b) whether that blocker is
  in the platform, the app, or its own prior code, and (c) the smallest fix.
  "Can't easily" is a red flag — replace with a specific reason or don't skip
  the step.

---

## 5. Proposed a new `CRON_SECRET` when the anon key already sufficed

- **What happened**: After being called out on skipping cron, the AI's first
  plan added a new `CRON_SECRET` env var and a bespoke `X-Cron-Secret`
  header check in `send-push`. The user asked "why do you need `CRON_SECRET`
  when `VAPOR_PUSH_API_KEY` exists?" — which surfaced that the AI hadn't
  considered the standard Supabase pattern of authenticating pg_cron → edge
  function with the anon key in an `apikey` header, embedded in the
  `cron.job` row.
- **Why it was wrong**: New secrets are a cost — one more thing to rotate,
  document, and reason about. The anon key is already in every client
  bundle; embedding it in `cron.job` (readable only by superuser /
  service_role) is not a security downgrade. The `pg_cron` example in the
  Lovable knowledge base uses exactly this pattern.
- **Prompt fix**: Before proposing a new secret, enumerate the existing
  secrets and platform-provided values that could serve the same purpose,
  and justify why each is insufficient. Default to "reuse" over "add".

---

## 6. Two-sided authentication confusion (Vapor key vs. cron auth)

- **What happened**: The AI initially conflated `VAPOR_PUSH_API_KEY` (which
  authenticates `send-push` → Vapor, outbound) with the auth needed for
  pg_cron → `send-push` (inbound). The user had to explicitly draw the
  distinction.
- **Why it was wrong**: A three-hop pipeline (`pg_cron → send-push → Vapor`)
  has two independent trust boundaries. Reusing one hop's credential for
  the other either over-shares a secret or under-secures a hop.
- **Prompt fix**: For any multi-hop server-to-server flow, the AI must draw
  the arrow diagram first and label each arrow with its own auth mechanism
  before writing code or planning secrets.

---

## 7. Phase 4 shipped as a single monolithic turn without checkpoints

- **What happened**: When the user said "Proceed with the rest of the
  steps," the AI implemented Phase 4B (local notif triggers) *and* Phase 4C
  (DB migration, `enqueue-push`, `send-push`, remote push bridge) in one
  pass — including a DB migration and two new edge functions — before
  pausing for review. The cron omission (mistake #4) was buried inside
  that same turn and easy to miss.
- **Why it was wrong**: Phase 4B and 4C have different risk profiles
  (client-only vs. DB schema + new server surface + external HTTP). They
  deserved separate review gates, especially since Phase 4C added an
  authorisation matrix (`may_caller_push_to_recipient`) that warranted its
  own sanity check.
- **Prompt fix**: Any phase that introduces (a) a new DB table, (b) a new
  edge function callable from the client, or (c) an outbound HTTP
  integration to a third-party service should be its own turn with its own
  verification step, regardless of how the user phrased the go-ahead.

---

## 8. Wrote "Phase 3 complete" while `apple-auth-webhook` / `google-auth-webhook` were still missing

- **What happened**: (See mistake #2 for the root cause.) The
  Phase 3 completion message listed `SignInButtons`, `useAuth`, and
  `delete-account` as evidence of done-ness. The webhook endpoints — the
  actual bridge between Vapor and Supabase auth — were never mentioned as
  outstanding.
- **Why it was wrong**: A phase isn't "complete" when only the pieces the
  AI happened to remember are shipped. Completion is measured against the
  guide's endpoint/event checklist, not the AI's working memory.
- **Prompt fix**: At the end of every phase, before saying "done", the AI
  must re-read the guide's section for that phase and produce a checklist
  of every named endpoint, event, and DB object. Anything not shipped goes
  into a "still owed" list in the same message.


---

## 9. Phase-order mismatch in `setSupabaseSession` account-switch diag stream

- **What happened**: `src/lib/iosIdentity.ts` emitted
  `preflight_signout_done` **before** `storage_scrubbed` during an account
  switch, whereas `session-injection-contract.md` specifies the order
  `account_switch_detected → storage_scrubbed → preflight_signout_done →
  calling_setSession`. The wrapper keys its telemetry off these phase
  names, so a swapped order is silently miscategorised.
- **Why it was wrong**: When the contract lists a sequence of diag phases,
  that sequence is the API — not just a description. The AI treated the
  order as narrative rather than normative and re-ordered the calls for
  what looked like more logical "sign out first, then scrub" flow.
- **Prompt fix**: Any documented phase / event ordering is normative. When
  auditing, diff the actual `emit()` order against the doc's arrow chain
  literally, not semantically.

---

## 10. Foreground refresh threshold widened from 60 s to 5 min

- **What happened**: `appLifecycle.ts` used `STALE_THRESHOLD_S = 5 * 60`,
  but `foreground-event.md` step 2 explicitly says "Force-refreshes the
  session if its `expires_at` is within 60 s." The wider window means
  extra refreshes on every foreground and inflates PostgREST/RPC traffic
  after resume.
- **Why it was wrong**: A numeric threshold in the contract is a hard
  value, not a hint. The AI mentally rounded "within 60 s" into "a few
  minutes to be safe" — the opposite of what the contract asked for.
- **Prompt fix**: Copy numeric thresholds verbatim from the contract into
  the code (ideally as a comment next to the constant referencing the
  doc line). During audit, grep the code for the constant and diff it
  against the doc's stated value.

---

## 11. `wanillajs.event.notificationTapped` mis-typed as an outbound event

- **What happened**: `src/lib/iosBridge.ts` listed
  `"wanillajs.event.notificationTapped"` inside `IOSEventType` (the union
  of web→iOS outbound events). Per
  `notification-tap-handling.md` §3, that event is **inbound** — iOS
  dispatches it as a `CustomEvent` on `window` for analytics, and the web
  is expected to add a `window.addEventListener` for it, not post it.
- **Why it was wrong**: The AI conflated "the web knows about this event
  name" with "the web sends this event", and put every `wanillajs.event.*`
  name into the outbound union without checking direction per the sub-doc.
- **Prompt fix**: For every `wanillajs.event.*` name added to code,
  explicitly classify direction (`outbound: web → iOS via
  messageHandlers` vs. `inbound: iOS → web via dispatched CustomEvent`)
  by grepping the sub-doc for the event name and reading which side
  produces it. Outbound = `IOSEventType`; inbound = `window.addEventListener`.

---

## 12. Built auth/account features without a `profiles` table

- **What happened**: Phase 3 (Sign-in, `useAuth`, `delete-account` edge
  function) and Phase 4 (push opt-in persistence) shipped assuming a
  `public.profiles` row per user existed — but no migration had ever
  created that table. `useProfile`, the delete flow, the leaderboard
  `user_id` joins, and the `handle_new_user` trigger were all referenced
  in code/docs without a schema behind them. The gap was only surfaced
  when the user explicitly asked for "Phase 2 — schema" much later, at
  which point we had to retrofit:
  - `CREATE TABLE public.profiles` with `id`, `username`, `avatar_emoji`,
    timestamps, plus `GRANT` block and RLS policies.
  - `username NOT NULL UNIQUE` with a backfill for pre-existing
    `auth.users` rows that had no profile.
  - `handle_new_user()` + `on_auth_user_created` trigger to auto-insert
    a profile row with a unique random username on signup.
  - `update_updated_at_column` trigger on `profiles`.
  - Added `user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE`
    to every game/progress table that had been created earlier without it
    (leaderboard rows, passport stamps, referral rewards, `push_outbox`),
    so `delete-account` actually cascades.
  - `src/hooks/useProfile.ts` re-wired to gate on `useAuthEpoch` because
    the initial version assumed the row already existed and errored on
    first sign-in.
- **Why it was wrong**: `docs/ios-bridge/implementation-order.md` lists
  the profile/user schema as **Phase 2** — the foundation every later
  phase depends on. Skipping it and starting at Phase 3 meant every
  subsequent phase was quietly built on a missing table; the code
  compiled and the UI rendered, but any real signup would have hit
  PostgREST 404s and the delete flow would have orphaned rows across
  half a dozen tables.
- **Prompt fix**: `implementation-order.md` is the source of truth for
  sequencing. Before starting any phase, the AI must (a) read the order
  doc, (b) confirm every earlier phase's DB objects actually exist via a
  `supabase--read_query` against `information_schema`, and (c) refuse to
  proceed if a prerequisite phase is missing — even if the user's
  message names a later phase. "The user asked for Phase N" is not
  permission to skip Phases 1..N-1.

---

## 13. Added `user_id` FKs to game tables without `ON DELETE CASCADE`

- **What happened**: When the profile schema was finally added, the
  first migration attached `user_id uuid REFERENCES auth.users(id)` to
  the existing game tables **without** `ON DELETE CASCADE`. The
  `delete-account` edge function would then fail at runtime because
  `auth.users` deletion is blocked by dependent rows.
- **Why it was wrong**: `backend-user-schema.md` and the delete-account
  contract both specify that account deletion must fully remove the
  user's data. That's only true if every FK to `auth.users(id)` is
  `ON DELETE CASCADE` (or the edge function deletes children first,
  which the contract doesn't ask for).
- **Prompt fix**: Any new FK to `auth.users(id)` defaults to
  `ON DELETE CASCADE` unless the contract explicitly says otherwise.
  When retrofitting FKs onto existing tables, generate the
  `ALTER TABLE ... DROP CONSTRAINT ... ADD CONSTRAINT ... ON DELETE
  CASCADE` pair in the same migration.

---

## 14. `handle_new_user` trigger initially generated non-unique usernames

- **What happened**: The first version of `handle_new_user()` set
  `username := 'user_' || substr(new.id::text, 1, 8)`. Under the new
  `username UNIQUE` constraint this can collide on any UUID prefix
  clash and, more importantly, gave zero collision handling for the
  backfill of pre-existing users. The trigger had to be rewritten with
  a loop that retries `gen_random_uuid()`-derived usernames until
  `INSERT` succeeds.
- **Why it was wrong**: Adding a `UNIQUE` constraint and a generator
  that can produce duplicates in the same migration is a self-inflicted
  race. The AI added the constraint for correctness and the naive
  generator for convenience without reconciling them.
- **Prompt fix**: When a column gets a `UNIQUE` constraint, every code
  path that writes it (trigger, edge function, client) must be audited
  for collision handling in the same migration. Default pattern: loop
  with a fresh random suffix until insert succeeds, capped at N attempts.

---

## 15. `useProfile` errored on first sign-in (row-not-yet-created race)

- **What happened**: `src/hooks/useProfile.ts` initially did a plain
  `.single()` fetch keyed on `auth.uid()` as soon as a session
  appeared. On brand-new signups the `handle_new_user` trigger and the
  client-side profile fetch race; `.single()` throws `PGRST116` when
  the row isn't there yet, surfacing a red error toast on the very
  first successful sign-in.
- **Why it was wrong**: `useAuthEpoch` exists precisely to gate data
  fetches behind "session is settled AND server-side onboarding
  triggers have had a tick to run." The first draft ignored it.
- **Prompt fix**: Any hook that reads a row keyed on `auth.uid()` from
  a table populated by an `auth.users` trigger must (a) depend on
  `useAuthEpoch`, and (b) use `.maybeSingle()` with a short retry, not
  `.single()`. Treat "row exists" as eventually-consistent on first
  sign-in.

---

## 16. `window.joinLeaderboardById` installed only while `/join-leaderboard/:code` was mounted

- **What happened**: The Phase 5 leaderboard-join bridge installed
  `window.joinLeaderboardById` inside a `useEffect` in
  `src/pages/JoinLeaderboard.tsx` and restored the previous value on
  unmount. Since that page is only mounted when the user is already on
  the join route, iOS calling the global from a notification tap while
  the webview was showing Play / Explore / Progress / Profile hit
  `undefined` and silently no-opped.
- **Why it was wrong**: `docs/ios-web-bridge-guide.md` §3.6 and
  `iosShareLinkBridge.ts`'s own comment are explicit: any `window.*`
  entry point iOS may invoke MUST exist at all times, or WKWebView
  either throws or silently drops the call. Scoping the install to a
  page defeats the purpose of the global.
- **Fix applied**: Moved the installer into a new module-level
  side-effect file `src/lib/iosJoinLeaderboardBridge.ts`, imported once
  from `src/main.tsx` alongside the other bridges. The handler uses
  `history.pushState` + `popstate` so it works regardless of which
  route is currently mounted. `JoinLeaderboard.tsx` no longer touches
  the global.
- **Prompt fix**: Every `window.*` bridge added for iOS goes in
  `src/lib/ios*Bridge.ts` as a module-level side effect, imported from
  `src/main.tsx`. Never install an iOS-facing global inside a component
  `useEffect` — that couples wrapper availability to the current route.


## 17. Missing `showLoadingOverlay` / `hideLoadingOverlay` handlers

**Symptom**: WKWebView logged `TypeError: window.showLoadingOverlay is not a
function` (and the matching `hideLoadingOverlay` error) on every auth,
delete-account, and subscription round-trip. The wrapper's "Webview Comms"
layer calls these to gate the UI while native work is in flight.

**Cause**: Only outbound `wanillajs.event.*` events were implemented. The
inbound counterparts that iOS *calls on the web* were never installed.

**Fix**: Added `src/lib/iosLoadingOverlayBridge.ts` — a module-level
side-effect installer, ref-counted, idempotent, with a 20s safety timeout.
Imported from `src/main.tsx` alongside the other bridge modules so the
handlers exist before React mounts and before the first native message.

**Prompt fix**: Enumerate *both* directions of every bridge contract before
closing a phase. For each outbound `sendIOSEvent` name, ask whether the
wrapper responds by calling something on `window` — if yes, that handler
must also be installed at module scope. Missing inbound handlers are silent
in a plain browser and only surface in the wrapper logs.

---

## 18. App rendered in any browser (no wrapper-only gate)

**What happened**: Until now the SPA rendered fully in any browser tab —
`src/App.tsx` had no check for the WKWebView bridge. Anyone with the
Lovable preview URL (or the published `{{PUBLISHED_WEB_URL}}`) could
land straight on onboarding, hit auth flows, and interact with edge
functions that were designed to be called only from within the wrapper.

**Why it was wrong**: `docs/ios-web-bridge-guide.md` §2 and §2.1 are
explicit that the web app is a WKWebView payload, not a public site.
Detection (`window.webkit.messageHandlers.wanillajs`, legacy
`gameEvents` fallback) plus a wrapper-only access gate is part of the
core contract, not a nice-to-have. Skipping it (a) broke the product
positioning — the marketing site is `{{MARKETING_DOMAIN}}`, not the app
itself — and (b) exposed iOS-only surfaces (native paywall triggers,
Apple/Google sign-in prompts that need the native handler) to
environments where they can only fail.

**Fix applied**:
- Added `src/hooks/use-ios-wrapper.tsx` returning `boolean | null`
  (pending / in-wrapper / browser) with `?preview=1` bypass persisted
  in `localStorage.previewBypass`.
- Wrapped `App.tsx` in a `WrapperGate` that `window.location.replace()`s
  to `https://{{MARKETING_DOMAIN}}` when detection resolves to false.
- Exempted `/dev/test-push` from the gate for Lovable-preview push
  testing (renders `src/pages/DevTestPush.tsx` in a minimal router).

**Prompt fix**: Any project that ships as a WKWebView payload must gate
`App` on wrapper detection **from the first commit**, not retrofit it
after phases 1–5 are done. Treat §2/§2.1 as a Phase-0 requirement.

## 19. Subscription bridge landed as a stub instead of the full DB-reconciled contract

**Problem**: On the first pass of Phase 5, `src/lib/subscriptionStatusBridge.ts`
was shipped as a hint-only listener with a `TODO` for the `user_subscriptions`
table and no `update-subscription` edge function. The prompt spec
(`docs/ios-bridge/subscription-bridge-prompt.md`) requires:

1. Same-origin postMessage guard **plus** a mandatory DB re-read on every hint.
2. A `subscriptionUpdated` CustomEvent as the authoritative signal for the UI.
3. A `public.user_subscriptions` table (unix-epoch `expiration_date`, unique
   `user_id`, RLS read-own-row, no client writes).
4. A `POST /functions/v1/update-subscription` edge function with `x-api-key`
   header check, zod validation, and `verify_jwt = false` in `config.toml`.

Only (1) was in place — components were flipping `SET_AD_FREE` off of a raw
postMessage, which is forgeable.

**Fix applied**:
- Migration created `public.user_subscriptions` with the exact shape from guide
  §8.3.1 (unix-seconds `purchase_date` / `expiration_date`, `user_id` unique,
  cascade on `auth.users`, RLS: authenticated read-own-row, no insert/update
  policies — service_role only via edge function).
- New `supabase/functions/update-subscription/index.ts`: constant-time
  `x-api-key` check against `APPLE_WEBHOOK_API_KEY`, zod body validation,
  `getUserById` existence check, upsert on `user_id`.
- `supabase/config.toml` now declares `[functions.update-subscription]` with
  `verify_jwt = false` (server-to-server call from Vapor, not a user JWT).
- `subscriptionStatusBridge.ts` rewritten: origin guard → hint CustomEvent for
  fast UX → mandatory `reconcileFromDatabase()` → authoritative
  `subscriptionUpdated` CustomEvent. Also reconciles on `SIGNED_IN` /
  `TOKEN_REFRESHED` so a cold-start after a device swap picks up entitlement.
- `PaywallSheet.tsx` now listens for both `subscription-status-hint` (fast) and
  `subscriptionUpdated` (authoritative).
- Renamed `docs/ios-bridge/paywall-events.md` → `ios-paywall-events.md` to
  match the canonical filename referenced by the prompt.

**Prompt fix**: When a phase references a table + edge function + bridge
listener as a single contract, do not ship the listener without the table and
function in the same turn. A hint-only listener that flips paid features off a
forgeable postMessage is a security regression, not a partial implementation.

---

## 20. Subscription entitlement listener scoped to PaywallSheet, so gated UI stayed visible for subscribers

**What went wrong**: The `subscription-status-hint` / `subscriptionUpdated`
listeners that flip `SET_AD_FREE` lived inside `PaywallSheet.tsx`. That
component is only mounted on the Play screen (and only really "active" when
the sheet is open), so when iOS posted
`{ type: "subscriptionStatusChanged", status: { isSubscribed: true, ... } }`
on cold start — before the user ever opened the paywall — the event fired
into the void. Result: an actively-subscribed user still saw the
"3 of 3 free flags left today · Subscribe for unlimited play" pill and the
"Unlock" button on the Play home, because `state.adFree` was never flipped.

**Fix applied**:
- Moved the entitlement listener into `GameProvider` (`src/contexts/GameContext.tsx`)
  so it is installed for the entire app lifetime, independent of which route
  is mounted.
- On mount, also rehydrates from the UX-only `localStorage.isSubscribed`
  mirror written by `subscriptionStatusBridge.ts`, so a cold start after a
  known-subscribed session doesn't flash the paywall UI before the DB
  reconcile completes.
- `PaywallSheet.tsx` keeps its own listeners for the auto-dismiss UX, but is
  no longer the source of truth for global entitlement state.

**Prompt fix**: Global entitlement state (subscription active, feature flags,
auth-derived gates) must be wired at the provider/root level, never inside a
leaf component that may not be mounted when the event arrives. Any listener
that mutates cross-screen state belongs in a context/provider or a
module-level bridge installed from `main.tsx`.

---

## 21. DB reconcile overwrote the iOS hint with `isActive:false` when the row/session wasn't ready yet

**What went wrong**: iOS posted
`{ type:"subscriptionStatusChanged", status:{ isSubscribed:true, expirationDate:"..." } }`
and the bridge correctly fired a `subscription-status-hint` (`active`) that
flipped `state.adFree = true`. But immediately after, `reconcileFromDatabase()`
ran and:

1. Either found no signed-in user (anonymous device) → silently returned, OR
2. Signed-in user but Vapor had not yet written the `user_subscriptions` row →
   `maybeSingle()` returned `data = null`, so `expiration` was `null` and
   `isActive` computed as `false`.

In case (2) the bridge then dispatched
`subscriptionUpdated{ isActive:false }`, which the GameProvider listener
faithfully applied → `SET_AD_FREE(false)` → the "3 of 3 free flags · Unlock"
banner reappeared even though iOS had just said the user was subscribed.
The bridge also never persisted the hint to `localStorage.isSubscribed`, so
a reload would lose the signal entirely.

**Fix applied** (`src/lib/subscriptionStatusBridge.ts` + `GameContext.tsx`):
- Cache the last hint on `window.__lastSubscriptionHint` and write
  `localStorage.isSubscribed` + `subscriptionExpiration` from the raw
  postMessage immediately (before any DB round-trip).
- `reconcileFromDatabase()` now returns early with no event dispatch when
  there is no signed-in user, so an anonymous subscribed session keeps its
  hint-based `adFree = true`.
- When the user is signed in but the row is missing (`data === null`),
  fall back to the cached hint's `isActive` instead of forcing `false`. The
  row will arrive shortly and a subsequent reconcile (auth change / next
  postMessage) will confirm it.
- `GameProvider` also rehydrates from `window.__lastSubscriptionHint` on
  mount, not just from the localStorage mirror, so a hint posted before the
  provider's `useEffect` attached is still picked up.

**Prompt fix**: An "authoritative" reconcile must never publish a *negative*
entitlement result unless it actually observed a signed-in user AND queried
the row. `no session` and `row not yet written` are "unknown", not "expired"
— treating them as expired silently downgrades a paying user's UX and, worse,
overrides a fresher signal from the native layer.


---

## 22. Push pipeline audit — `push_outbox` was reachable by signed-in users

**File**: `public.push_outbox` (migration).

Original schema shipped with RLS enabled **plus** two policies that let any
authenticated user insert and read their own outbox rows:

```sql
CREATE POLICY "senders insert own outbox" ON public.push_outbox
  FOR INSERT TO authenticated WITH CHECK (enqueued_by = auth.uid());
CREATE POLICY "senders view own outbox" ON public.push_outbox
  FOR SELECT TO authenticated USING (enqueued_by = auth.uid());
```

The `docs/ios-web-bridge-guide.md` §8.5 contract is explicit: `push_outbox`
is service-role only. All writes go through the `enqueue-push` edge function
(which uses the service-role client after validating the authorisation
matrix); all drains go through `send-push`. Client-writable rows bypass
`may_caller_push_to_recipient` and the server-only trigger allow-list,
letting a signed-in user enqueue arbitrary pushes to themselves — or,
worse, spoof `enqueued_by` behaviour downstream.

Related drift on the same table:
- No `GRANT ALL ON public.push_outbox TO service_role;` — the table
  survived only because the service role bypasses grants via superuser
  descent, but the contract requires the grant to be explicit.
- `status` check constraint listed only `pending|sent|dead`. The contract
  enum is `pending|sent|failed|dead`. A future writer using `'failed'`
  would trip a check-constraint violation.

**Fix applied**: dropped both policies, revoked all privileges from
`anon`/`authenticated`, added `GRANT ALL ... TO service_role`, extended the
status check to include `'failed'`. Table now truly service-role only.

**Prompt fix**: for outbox / queue tables that are contractually
"service-role only", the migration must (1) enable RLS with **zero**
policies, (2) `REVOKE ALL FROM anon, authenticated`, (3) `GRANT ALL TO
service_role` — in that order. Do not ship the table with "sender can see
their own" convenience policies "just for debugging".


## 23. `send-push` accepted anon-apikey callers

**File**: `supabase/functions/send-push/index.ts`.

Original auth block accepted either
`Authorization: Bearer <SERVICE_ROLE_KEY>` **or** `apikey: <ANON_KEY>`, on
the (incorrect) theory that pg_cron would drive the drainer with the anon
key. The guide §8.5.3 is explicit: `send-push` is service-role only. Anyone
can obtain the anon key (it's in `.env` and every published web build), so
this path let an unauthenticated caller drive the drainer — trivially
DoS'ing Vapor by re-invoking claim + POST loops, and observing timing
signals from the outbox.

Additionally, rows were processed **sequentially** inside a `for` loop,
which for a batch of 25 with 1s Vapor latency wastes ~24s per drain and
lets pg_cron's next invocation collide with the previous one.

**Fix applied**:
- Removed the anon-apikey path. `send-push` now requires
  `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>`; anything else → 401.
- Scheduled pg_cron with a `net.http_post` that reads
  `SUPABASE_SERVICE_ROLE_KEY` from `vault.decrypted_secrets` and passes it
  as the `Authorization` header (not `apikey`).
- Replaced the sequential loop with `Promise.allSettled(rows.map(...))` so
  a batch of 25 completes in ~max(latencies) instead of ~sum(latencies).

**Prompt fix**: for edge functions gated by "service-role only" in the
contract, the audit must include a curl test with a fake bearer AND a curl
test with the raw anon key — both must return 401. Cron scheduling must
fetch the service-role key from the vault at call time; never hard-code
"cron will use apikey" as a shortcut.


## 24. `enqueue-push` payload was under-validated

**File**: `supabase/functions/enqueue-push/index.ts`.

Zod schema declared `payload: z.record(z.string(), z.string()).optional()`
with no bounds on key count or value length. The Vapor / APNs contract
caps payloads (APNs alert body ≤ 4KB total; Vapor rejects >20 keys or any
value >500 chars). Under-validating here let a malformed request through
Supabase and dead-lettered on Vapor's side — turning a caller bug into a
`push_outbox` retry storm that eventually marked the row `dead` at
attempt 5, with the real cause 4 hops away in Vapor's logs.

**Fix applied**: `payload` is now
`z.record(z.string().min(1).max(64), z.string().max(500))
  .refine(v => Object.keys(v).length <= 20)`.
The 400 fires at the edge with a Zod error the caller can read, instead of
silently dead-lettering later.

**Prompt fix**: validate at the boundary that owns the contract with the
next hop. Vapor's payload limits belong in the Supabase Zod schema, not
just as a Vapor-side rejection — otherwise every violation becomes a
dead-letter with no actionable client feedback.


## 25. Missing `verify_jwt = false` blocks for push functions in `config.toml`

**File**: `supabase/config.toml`.

`enqueue-push` validates the caller JWT in code via
`supabase.auth.getClaims(token)`; `send-push` validates the service-role
bearer in code. Both functions therefore need `verify_jwt = false` in
`config.toml` so Supabase's edge platform doesn't reject the request
before our in-code auth runs. The blocks were missing, meaning the
functions relied on the platform's default JWT check — which, once the
signing-keys migration lands, will reject service-role bearers on
`send-push` outright.

**Fix applied**: added

```toml
[functions.enqueue-push]
verify_jwt = false

[functions.send-push]
verify_jwt = false
```

**Prompt fix**: every edge function that does its own auth in code MUST
have a matching `verify_jwt = false` block in `config.toml`. Cross-check
by grepping the function for `getClaims(` or `Bearer ${serviceKey}` — if
either is present and the config block isn't, the function is a ticking
bomb for the next signing-keys rotation.


## 26. `send-push` drainer had no cron schedule

**File**: pg_cron / `net.http_post`.

Fire-and-forget invokes from `enqueue-push` cover happy-path drains, but
the retry ladder (60s → 5m → 30m → 2h → 12h) only advances when
`send-push` is re-invoked. Without a periodic driver, a row that failed
its first delivery would sit in `push_outbox` forever with
`next_attempt_at` in the past. The initial rollout shipped the function
but no cron job — every deferred row silently stalled.

**Fix applied**: enabled `pg_cron` + `pg_net`, scheduled
`drain-push-outbox` at `* * * * *` calling `send-push` with the
service-role key from `vault.decrypted_secrets`.

**Prompt fix**: a retry ladder is inert without a periodic driver. The
Phase 4 checklist must treat "cron scheduled" as a first-class item, not a
side-note. Verify with `SELECT jobname, schedule FROM cron.job;` — if the
row is missing, the pipeline is broken even when the code looks correct.


## 27. Local push registry lived at `src/lib/`, not `src/utils/`

**File**: `src/lib/pushTriggers.ts`.

Prompt (and reference project) specify `src/utils/pushTriggers.ts`. This
project put it under `src/lib/` to match the surrounding bridge modules
(`iosBridge.ts`, `pushPermission.ts`, `subscriptionStatusBridge.ts`). The
contract that actually matters — envelope shape, id/category unions,
single-source-of-truth invariant — is intact, but any future prompt that
grep-checks `src/utils/pushTriggers.ts` will report a false negative.

**Fix applied**: none (kept `src/lib/` for consistency with the rest of
the bridge). Documenting the deviation here so the next audit doesn't
mis-flag it.

**Prompt fix**: audit prompts should locate the registry by content
(`export type PushCategory`, `sendIOSEvent("wanillajs.event.push.schedule"`)
rather than by path. Path conventions vary per project; the contract
doesn't.


## 28. Local push reconciliation is state-diff based, not per-behaviour

**File**: `src/hooks/usePushTriggerSync.ts`.

The prompt's do-not-do list warns against scheduling from render
lifecycles: "schedule from the concrete behaviour, not from render
lifecycles." This project instead runs `rescheduleAll(ctx)` from a single
`useEffect` whose deps are the domain-state signals (`streak`,
`lastPlayDate`, `attemptsToday`, `adFree`) plus the iOS foreground event.

Rationale for keeping it: every trigger uses `replaces: true`, so
`rescheduleAll` is idempotent — it can't produce duplicate
`UNNotificationRequest`s. The alternative (sprinkling `schedStreakAtRisk()`
into `GameContext.tsx` reducer branches, `PlayLimitGate` handlers, etc.)
scatters push logic across gameplay code, and any missed call-site
silently drops a notification. State-diff reconciliation trades a slight
over-scheduling cost for a much smaller "one place to reason about"
surface.

**Fix applied**: none. Documenting the deviation.

**Prompt fix**: the do-not-do rule should say "do not schedule from
**route-change** or generic mount effects" — not "do not schedule from
useEffect". A single idempotent reconciler whose deps are behavioural
state (not lifecycle) is the safer pattern for apps whose triggers all
share `replaces: true`. Only per-behaviour sends make sense when triggers
are stackable (`replaces: false`).

---

---

## 29. Listen-only push status with no fallback ("Checking…" forever)

**Symptom.** The Profile → Notifications row sat permanently on "Checking…".

**Cause.** Two compounding issues:
1. The web side was purely passive — it only listened for
   `window.setPushPermissionStatus`. iOS was not broadcasting the status at
   launch/foreground (or the payload was rejected as malformed), so the
   status stayed `unknown`.
2. There was no way to *ask*, and no timeout, so `unknown` was an absorbing
   state and the UI had no terminal copy for it.

**Fix.**
- Added outbound `wanillajs.event.push.requestStatus`; `usePushPermission()`
  fires it once on mount so late-mounting screens can pull the status.
- Added a 2s `resolved` timeout; unresolved `unknown` is now treated as
  `notDetermined` (shows "Not set up yet." plus a "Turn on" button). Late
  replies still update the UI.
- Rejected payloads now log with `console.error` including the valid values,
  so a malformed wrapper payload is obvious in the console.

**Prompt lesson.** Any "iOS is the source of truth, web just listens" bridge
needs three things spelled out, not two: the broadcast, a pull/request event
for consumers that mount late, and a terminal fallback state with a user
action. Never let an `unknown` status be an absorbing state in UI copy.

---

## 30. Status vocabulary drift between wrapper spec and web validator

**What happened.** The web validator accepted only `authorized` (the
`UNAuthorizationStatus` spelling), while the wrapper replication prompt
documents the granted case as `granted`. A spec-conformant wrapper build
would have had every status payload rejected with `console.error`, leaving
the Notifications row and all push nudges permanently in the `unknown`
state — a silent, console-only failure.

**Fix.** `normalize()` in `src/lib/pushPermission.ts` now maps `granted` to
the canonical `authorized` before validation; both spellings are accepted on
the wire, one value is used downstream.

**Prompt lesson.** When a bridge has an enum on both sides, the two
vocabularies must be pinned in one document, with aliases stated explicitly.
A strict allow-list validator plus an undocumented synonym equals a bridge
that fails closed and silently. Where the native platform enum and the spec
disagree, normalize at the boundary rather than spreading both spellings
through the UI.

---

## 31. `logoutRequestedAt` was written but never enforced

- **What happened**: `forceLogoutFromIOS` set
  `sessionStorage.logoutRequestedAt = Date.now()`, but
  `setSupabaseSession` never read it. A wrapper re-injection arriving
  right after logout would restore the session the user just dropped.
- **Why it was wrong**: `docs/ios-web-bridge-guide.md` §5.3 makes the 3 s
  guard normative: "Any `setSupabaseSession` call within 3s of that
  timestamp must be dropped."
- **Prompt fix**: For every guard the docs name, require the AI to show
  both the *write* site and the *read* site. A guard with no reader is a
  missing feature, not a shipped one.

---

## 32. Missed the `remember` flag and deep-link memory in `IOSNavigationBridge`

- **What happened**: Phase 1 shipped `navigateToPath(path)` without the
  `remember = true` parameter or `rememberIOSDeepLinkPath(path)`, and the
  `ios:navigate` listener ignored `detail.remember`.
- **Why it was wrong**: §3.5 of the guide shows both, and §7's file map
  lists `iosDeepLink.ts` (`rememberIOSDeepLinkPath` /
  `consumeIOSDeepLinkPath`) as an owned artifact.
- **Prompt fix**: Diff each phase's implementation line-by-line against
  the code block in the guide, including default parameter values.

---

## 33. `appStarted` guarded only by `sessionStorage`

- **What happened**: `useAppStartedOnce` checked
  `sessionStorage.appStartedSent` alone. Two mounts in the same tick (React
  StrictMode, or a remount before storage settles) could double-fire.
- **Why it was wrong**: §5.7 requires "module-level `appStartedDispatched`
  **+** `sessionStorage.appStartedSent`" — both, not either.
- **Prompt fix**: Treat "A + B" in the docs as a conjunction and implement
  both halves.

---

## 34. `public.profiles` shipped without `username`

- **What happened**: `profiles` was created with `id/display_name/email/
  auth_method` only, and `handle_new_user` never generated a username.
- **Why it was wrong**: `docs/ios-bridge/backend-user-schema.md` §2 makes
  `username TEXT NOT NULL UNIQUE` part of the minimum viable schema and §3.2
  specifies the adjective+noun+number generator inside the trigger. The doc
  warns explicitly that "any page that reads `profiles.username` will fail".
- **Prompt fix**: Before writing web code for a phase, run the phase's
  prerequisite schema doc column-by-column against the live database.

---

## 35. Doc conflict: Phase 2 mandates events the §4.0 registry marks "do not emit"

- **What happened**: `implementation-order.md` Phase 2 requires
  `wanillajs.event.auth.logoutRequested` and
  `wanillajs.event.system.openAppSettings`, while
  `docs/ios-web-bridge-guide.md` §4.0 and
  `docs/ios-bridge/open-app-settings.md` both mark them (plus
  `auth.userDidSignOut`, `auth.sessionRequested`, `auth.setSessionDiag`) as
  **not wired in the current wrapper — do not emit**.
- **Resolution taken**: emitted them as specced by the phase, with a comment
  citing the "not wired" status. WKWebView drops unknown types silently, so
  they are inert until Swift adds the cases. Flagged rather than silently
  reconciled.
- **Prompt fix**: When two docs disagree, say so in the phase report and name
  the Swift switch as tie-breaker — do not pick one doc quietly.

## 36. Phase 3 lifecycle shipped as `ios:foregrounded`-only

- **What happened**: `src/utils/appLifecycle.ts` listened solely for the
  `ios:foregrounded` custom event. `document.visibilitychange`,
  `window.pageshow`/`pagehide` and `stopAutoRefresh()` were missing, the stale
  threshold was 60 s instead of 5 min, there were no
  `[appLifecycle] foreground …` / `authEpoch bump { epoch, reason }` logs, and
  no `onAuthStateChange` bump for `TOKEN_REFRESHED`.
- **Impact**: On WKWebView builds where the wrapper never dispatches
  `ios:foregrounded`, sessions stayed stale after resume and RLS-gated pages
  rendered empty. The verification checklist (A1–A5) was unrunnable.
- **Fix (this phase)**: Rewrote `appLifecycle.ts` with all four triggers,
  `STALE_THRESHOLD_S = 5 * 60`, exported `refreshIfStale`/`bumpAuthEpoch`, the
  documented log lines, and an auth-state-change epoch bump.

## 37. `useAuthReady` never existed

- **What happened**: `foreground-event.md` and `phase-3-verification.md` both
  reference `src/hooks/useAuthReady.ts`; only `useAuthEpoch.ts` was present.
- **Fix**: Added `useAuthReady()` returning `{ ready, session, user, authEpoch }`.

## 38. Doc references `src/hooks/useLeaderboard.ts`, which does not exist

- **What happened**: Phase 3's file list names `useLeaderboard.ts` as a place to
  thread `authEpoch`. There is no such hook in this codebase and no
  `leaderboard-api` fetch call.
- **Resolution**: Only `usePlayLimit.ts` was wired to the epoch. Verification
  step A5's leaderboard half is not applicable until a leaderboard fetch hook
  exists; the `play-usage` half is testable.

## 39. Session-gated navigation missed the logout guard and the session drain

- **What happened**: `IOSNavigationBridge` emitted `sessionRequested` with
  `reason: 'iosNavigation'` (spec: `protected_path_deep_link`, plus `at`), had
  no `wasLogoutRecentlyRequested()` suppression (B4), and had no
  `onAuthStateChange` subscription to drain `__pendingIOSPath` once a session
  landed (B3) — the deferred deep link only drained on mount.
- **Fix**: Renamed the prefix list to `PUBLIC_IOS_PATH_PREFIXES` with an
  `isPublicPath` helper, exported `wasLogoutRecentlyRequested` from
  `iosNotifications.ts`, corrected the event payload, and added the
  auth-state drain.

## 40. Phase 4 started with only the §3.8/§3.9 listeners in place

- **What happened**: `pushPermission.ts` recorded status and registration but
  nothing emitted `wanillajs.event.push.requestPermission`, there was no
  `pushTriggers.ts`, no `pushOptIn.v1` state, and no UI surface — so the
  permission prompt could never be triggered from the web.
- **Fix (this phase)**: Added `requestPushPermission(reason)`,
  `src/utils/pushOptIn.ts` (7-day cooldown, 3-dismissal stop),
  `src/utils/pushTriggers.ts` (registry + schedule/cancel envelope),
  `usePushPermission()`, and `PushOptInBanner` / `PushNudgeInline` /
  `PushDeniedHomeTip` + a Settings "Reminders" row.

## 41. `notificationTapped` analytics had no web listener

- **What happened**: `notification-tap-handling.md` §3 has iOS dispatch
  `wanillajs.event.notificationTapped` as a DOM CustomEvent, but nothing on the
  web listened, so every tap was invisible in analytics.
- **Fix**: `src/utils/notificationTap.ts`, installed from `main.tsx`, tracks
  `notification_tapped` with dual-key (`trigger_id`/`triggerId`) tolerance.
  Navigation stays exclusively on `navigateFromIOS` — no second nav path.

## 42. Remote-push backend cannot be completed web-side alone

- **What happened**: Phase 4 lists `push_outbox` + `enqueue-push` / `send-push`
  **and** the Vapor `/v1/users/apns/add` endpoint. Vapor is an external server
  outside this repo, and no APNs `.p8` credentials exist in Lovable Cloud.
- **Resolution**: Shipped the `push_outbox` table (service-role writes only,
  one pending row per target per trigger), `enqueue-push`, and `send-push`.
  `send-push` forwards to an APNs relay via the optional `PUSH_RELAY_URL` /
  `PUSH_RELAY_TOKEN` secrets and **no-ops** (`reason: relay_not_configured`)
  until they are set, instead of failing. APNs token registration itself
  remains native + Vapor work.

## 43. `window.setPushPermissionStatus` fires before React mounts

- **What happened**: iOS injects the cold-launch status (`source: "appStart"`)
  as soon as the webview loads, often before any component subscribes to
  `pushPermissionUpdated`.
- **Handling**: `usePushPermission()` seeds from `getPushPermissionStatus()` /
  `getPushDeviceRegistered()` on first render rather than waiting for an event,
  so an early injection is never missed.

## 44. Loading-overlay globals were React-state-bound

- **What happened**: `window.showLoadingOverlay` / `hideLoadingOverlay` lived in
  `src/components/GlobalLoadingOverlay.tsx` and forwarded to a `useState`
  setter captured on mount. Before React mounted (and after an error boundary
  unmounted the tree) they were no-ops, and they were neither ref-counted nor
  timeout-protected — a missed native `hide` stranded the UI forever.
- **Fix**: Replaced with `src/lib/iosLoadingOverlayBridge.ts` — a module-level
  side-effect installer using a plain DOM node (`z-index 2147483000`),
  ref-counted with a 20 s safety auto-hide, imported from `main.tsx`.
  `GlobalLoadingOverlay.tsx` deleted.

## 45. `window.joinLeaderboardById` did not exist

- **What happened**: `/join/:code` handled web link taps, but there was no
  global for iOS to call after a Tapp deferred deep link or notification tap.
- **Fix**: `src/lib/iosJoinLeaderboardBridge.ts`, imported from `main.tsx` per
  mistake #16 — module scope, never a page `useEffect`. It validates the code,
  calls `rememberIOSDeepLinkPath` so the Phase 3 session gate can drain it, and
  navigates via `pushState` + `popstate` from any mounted route. Added the
  `/join-leaderboard/:code` alias route.

## 46. Paywall only emitted analytics, never the StoreKit trigger

- **What happened**: `PaywallSheet` sent `wanillajs.event.paywall.*` only.
  Per `ios-paywall-events.md` §2 those are observability-only — the sheet is
  presented off the legacy no-`type` message `{ notificationName:
  "paywall.subscriptions.show" }`, which was missing. Tapping Subscribe in the
  wrapper did nothing.
- **Fix**: Added `sendIOSNotification()` to `iosNotifications.ts` and fired the
  documented order: StoreKit trigger → `subscribeButtonTapped` →
  `subscribeClicked`.

## 47. Legal links pointed at non-existent in-app routes

- **What happened**: Settings and the sign-in screen linked to `/privacy` and
  `/terms`, which are not routes in this SPA — both landed on NotFound, and in
  WKWebView `target="_blank"` is dropped entirely.
- **Fix**: `src/lib/iosBridge.ts` exposes `openExternalURL(url, context)`
  emitting `wanillajs.event.navigation.shouldOpenURL` (https-only guard,
  `window.open` fallback in a browser). Sign-in now carries the required legal
  disclaimer line with real `<a href>` + `preventDefault()`.
  **Outstanding**: `SITE_URL` currently points at the published Lovable domain;
  swap it for the real marketing domain once it exists.

## 48. Referral credit had no server side at all

- **What happened**: `referral-credit-vapor-spec.md` documents an endpoint
  Vapor already expects; nothing existed, so every referral attribution would
  have 404'd.
- **Fix**: Migration added `public.referral_rewards`
  (`UNIQUE(referrer_id, referred_user_id)`, self-referral CHECK, read-own-rows
  RLS, no client writes) plus `profiles.bonus_hints` and the
  `credit_referral()` SECURITY DEFINER RPC (service_role only — the first pass
  left PUBLIC EXECUTE in place, which the linter caught; `REVOKE ... FROM
  PUBLIC` is required, revoking from `anon, authenticated` alone is not enough).
  `supabase/functions/referral-credit` does constant-time `x-api-key`
  validation against `APPLE_WEBHOOK_API_KEY`, zod-validates the body, returns
  the documented status codes, and enqueues the `referral.successful` push
  without ever rolling back the credit on push failure.

## 49. Auth webhooks were never implemented (Vapor got a 404, not a payload)

- **What happened**: Vapor POSTs to `/functions/v1/apple-auth-webhook` (and
  `google-auth-webhook`) after verifying the native identity token, and decodes
  the reply into `SupabaseAuthResponse`. Neither edge function existed in this
  project, so Vapor never received a decodable body — which surfaces on the iOS
  side as "wrong response format" rather than as a missing endpoint.
- **The Swift contract is stricter than the JSON docs suggest**:
  ```swift
  struct SupabaseAuthResponse { let success: Bool?; let user: User; let auth: Auth }
  // Auth: access_token, refresh_token   (both non-optional String)
  // User: id, email                     (both non-optional String)
  ```
  `success` is the only optional field. Anything that emits `email: null`,
  nests tokens differently (`session.access_token`), or returns a bare
  `{ access_token, refresh_token }` at the top level fails decoding silently.
- **Fix**: `supabase/functions/_shared/authWebhook.ts` implements both webhooks
  from one factory and always returns:
  `{ success, user: { id, email, created_at }, auth: { access_token,
  refresh_token, expires_in, token_type }, is_new_user }`.
  `user.email` falls back to the request email so it can never be null.
- **Non-obvious pieces carried over from the guide**:
  - `listUsers()` must be paginated (`perPage: 1000`, up to 50 pages) — the
    default page size of 50 silently misses existing users and creates dupes.
  - There is no admin API to mint a JWT: `generateLink({ type: 'magiclink' })`
    → take `hashed_token` (or the link's `token` param) → `verifyOtp()`.
  - Match on `user_metadata.apple_user_id` / `google_user_id` first, email
    second (relay emails rotate), and backfill the provider id when missing.
  - `createUser` races with a concurrent call: on `email_exists` / HTTP 422,
    re-scan and treat it as a sign-in instead of returning 500.
- **Per-provider keys**: the first pass fell back to `APPLE_WEBHOOK_API_KEY`
  when `GOOGLE_WEBHOOK_API_KEY` was unset — a silent cross-provider trust hole.
  Removed: each webhook now reads only its own env var and 401s if it is
  missing. `GOOGLE_WEBHOOK_API_KEY` is stored as a secret and must match the
  value configured in Vapor.

## 50. The sign-in screen didn't dismiss after `setSupabaseSession`

- **What happened**: after the native flow succeeded and the wrapper called
  `window.setSupabaseSession(accessToken, refreshToken)`, the bridge reported
  `restored` but `/auth` stayed on screen. `src/pages/Auth.tsx` read the session
  exactly once, in a mount-time `getSession()` — a session that arrives *later*
  produced no re-render and no navigation.
- **Second half of the bug**: `runSetSession` only navigated when
  `window.__pendingIOSPath` was set (deep-link case). In the normal sign-in flow
  that value is null, so nothing moved the webview off `/auth`.
- **Fix**:
  - `/auth` now subscribes to `supabase.auth.onAuthStateChange` and leaves as
    soon as a session with a user appears — covering native injection and web
    OAuth alike. The one-shot `getSession()` stays as the initial guard, and a
    `left` latch stops a double navigation when both fire.
  - `runSetSession` falls back to dispatching `ios:navigate → /home` when there
    is no pending path and the app is sitting on `/auth`.
- **Also added**: `/auth` opened from Settings receives router state
  `{ fromSettings: true }` and renders a close (X) button that returns to
  `/settings`. When `/auth` is the app's own gate there is no marker and no
  close button, so a required sign-in can't be skipped.
- **Rule**: never gate wrapper-driven UI on a one-shot session read. Anything
  the native side can change asynchronously must be observed with
  `onAuthStateChange`, not polled at mount.

## 51. Same-user session injection skipped every UI update

- **What happened**: `runSetSession` returned immediately when the incoming
  token belonged to the already-persisted user. That path emitted
  `already_authenticated`, but did not navigate away from `/auth` and did not
  notify Settings. Because no new `setSession()` call occurred, there was also
  no guaranteed auth-state event; the sign-in screen and Settings could both
  continue showing signed-out UI after a relaunch.
- **Fix**: every successful native handoff, including the same-user fast path,
  now dispatches a token-free `ios:session-restored` event and runs the same
  pending-path/auth-screen navigation. Settings responds by revalidating with
  `getUser()`, while `/auth` dismisses immediately. The bridge now also checks
  and throws a returned `setSession` error instead of reporting `restored`.
- **Rule**: optimization exits in authentication bridges must preserve all
  observable completion side effects; deduplicating the network write must not
  deduplicate navigation or UI synchronization.

## 52. Async auth callback deadlocked native `setSession`

- **What happened**: the module-level `onAuthStateChange` callback in
  `Auth.tsx` was `async` and awaited the `claim_player` RPC. The auth client
  invokes subscribers while it still holds the operation that emitted the
  event, so making another awaited client call inside the callback can block
  `setSession()` itself. The bridge then never reached its `restored` event or
  redirect, leaving the successful sign-in screen visible.
- **Fix**: the auth callback now returns synchronously and defers the player
  claim and sign-in notification to a zero-delay task. This lets `setSession()`
  complete first, after which the existing restored signal and navigation run.
- **Rule**: `onAuthStateChange` subscribers must never await auth, RPC, or
  database work inline; capture the event data and defer follow-up work.

## 53. Logout tap did nothing on the web side

- **What happened**: `handleLogout` in `SettingsPage.tsx` emitted
  `auth.logoutRequested` and then delegated to `forceLogoutFromIOS`. That helper
  starts with a guard that aborts when an Apple/Google sign-in was requested in
  the last 2 minutes — a protection against *spurious native force-logouts right
  after a sign-in handoff*. Applied to a real logout tap it silently returned:
  the wrapper cleared its keychain, but the web app kept its Supabase session,
  never signed out and never showed `/auth`.
- **Fix**: `forceLogoutFromIOS(reason, userInitiated)` now skips the
  recent-sign-in guard when the user tapped Log out, clears the
  `appleSignInRequestedAt` / `googleSignInRequestedAt` markers, signs out with
  `scope: 'local'`, removes any leftover `sb-*` localStorage keys and does a
  `location.replace('/auth')`.
- **Rule**: anti-race guards must distinguish machine-triggered from
  user-triggered calls. A guard that can swallow an explicit user action is a
  bug, not a safety net.

## 54. Account deletion had no server-to-server endpoint and an async teardown

- **What happened**: deletion relied on `delete-account`, a JWT-authenticated
  function callable from the browser. The Vapor backend has no user JWT, so it
  could not call it. `window.showLoginScreen()` also routed through
  `forceLogoutFromIOS` with the 2-minute sign-in suppression guard still armed
  and awaited `supabase.auth.signOut()` before redirecting — a deleted user
  could linger in local storage if the network call hung.
- **Fix**: added `supabase/functions/delete-user` (`verify_jwt = false`,
  guarded by `x-api-key: DELETE_USER_API_KEY`, service-role client, UUID
  validation, `getUserById` existence check, FK-safe table cleanup, then
  `auth.admin.deleteUser`). `forceLogoutFromIOS` now treats
  `reason === 'accountDeleted'` as unconditional, captures the user id before
  scrubbing, clears `iosAuthSessionEstablishedAt` plus every `sb-*`/`auth-token`
  key synchronously, fires `signOut()` without awaiting and immediately calls
  `location.replace('/auth')`.
- **Rule**: destructive native-driven flows need a secret-authenticated
  server-to-server endpoint and a synchronous local teardown — never gate them
  behind guards or awaited network calls.

## 55. `subscriptionStatusChanged` payload was ignored, so the paywall came back

- **What happened**: the wrapper posts
  `{"type":"subscriptionStatusChanged","status":{"isSubscribed":true,"expirationDate":"2026-09-15T17:52:05Z"}}`
  via `window.postMessage`. `initializeSubscriptionBridge` matched on `type`
  only and then re-read `user_subscriptions`. No `update-subscription` endpoint
  existed, so the row was absent, the bridge emitted `expired`, `isPremium`
  stayed `false` and the next game showed the paywall again. A JSON *string*
  payload would also have been dropped, since only object payloads were read.
- **Fix**: `src/utils/subscriptionBridge.ts` now parses string payloads,
  applies `status.isSubscribed` + `expirationDate` immediately (`applyNativeStatus`,
  accepting ISO strings and Unix seconds/milliseconds), records
  `nativeActiveUntil` and only then reconciles with the database. Reconciliation
  can upgrade to `active` but never downgrades while the native entitlement is
  still unexpired. Added `supabase/functions/update-subscription`
  (`verify_jwt = false`, `x-api-key: APPLE_WEBHOOK_API_KEY`, service-role
  upsert on `user_id`) so Vapor can persist the state for later launches.
- **Rule**: a native status message is the fast path and the database is the
  durable truth. Read the payload, grant immediately, reconcile after — and
  never let an empty database row revoke an entitlement the wrapper just
  confirmed.

---

<!-- Add new entries below as they come up. Keep them dated and specific. -->
