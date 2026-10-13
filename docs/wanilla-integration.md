# iOS ↔ Web Bridge — Project Kickoff ({{APP_NAME}})

You are implementing the Wanilla iOS-wrapper bridge for this web app. This is a
native iOS WKWebView wrapper around a React/Vite web app that communicates
bidirectionally with Swift. I have uploaded a set of `.md` specification files
with this message. They are the single source of truth for this work.

Read this entire prompt before writing any code. Do not start coding until you
have completed Steps 1–3 below and shown me their output.

## Placeholders — ask me, never guess

The docs are generic. Wherever a project-specific value is needed they contain
an upper-case token in double curly braces, e.g. `{{APP_NAME}}`,
`{{BUNDLE_ID}}`, `{{VAPOR_BASE_URL}}`. These are **not** real values. The rule:

1. **Collect them up front, once.** As part of Step 1 below, print the table
   underneath as a numbered list and ask me to fill it in. Wait for my reply.
   Any value I leave blank, ask again only when a phase actually needs it.
2. **Record them.** Save my answers to `docs/ios-bridge/project-facts.md`
   (key → value). From then on, whenever a doc shows `{{SOME_KEY}}`, use the
   value from that file.
3. **If you meet a token that is not in the file, stop and ask** before
   writing a single line that depends on it. Do not infer it from the repo
   name, a URL you saw, or a similar project.
4. **Never write a literal `{{…}}` token** into source, config, a secret
   name, a URL, or a commit. If one would end up in code, you skipped step 3.
5. Secret **names** (`APPLE_WEBHOOK_API_KEY`, `VAPOR_PUSH_API_KEY`, …) are
   not placeholders — use them exactly as written. And secret **values** are
   never typed into this chat (see "Secrets" below).

All keys (9–10 are specific to this backend):

| # | Key | What it is | Example |
|---|---|---|---|
| 1 | `{{APP_NAME}}` | Display name; also the Swift enum namespace `JavascriptAppEvents.<APP_NAME>` | `MathStar` |
| 2 | `{{BUNDLE_ID}}` | iOS bundle identifier | `com.example.mathstar` |
| 3 | `{{APP_STORE_ID}}` | Numeric App Store id (review deep link, landing page) | `1234567890` |
| 4 | `{{MARKETING_DOMAIN}}` | Public marketing / legal site serving `/terms` and `/privacy` | `www.example.com` |
| 5 | `{{PUBLISHED_WEB_URL}}` | The published web build the WKWebView loads | `myapp.base44.app` |
| 6 | `{{VAPOR_BASE_URL}}` | Vapor backend base URL, no trailing slash | `https://api.example.com` |
| 7 | `{{SUBSCRIPTION_PRODUCT_ID}}` | StoreKit auto-renewing product id | `com.example.mathstar.monthly` |
| 8 | `{{ADFREE_PRODUCT_ID}}` | StoreKit non-consumable id — only if the ads/IAP module is in use | `com.example.mathstar.adfree` |
| 9 | `{{BASE44_APP_ID}}` | App id used in Apps API paths (`/api/apps/<id>/…`) | `6820f3a4e7b91d003c45a1f2` |
| 10 | `{{BASE44_APP_DOMAIN}}` | Domain that serves `/functions/<name>` | `myapp.base44.app` |

> Base44's own permission syntax also uses double braces (`{{user.email}}`,
> `{{user.id}}`, `{{user.data.*}}`) inside entity `rls` blocks. Those are
> real Base44 templates, not placeholders — copy them verbatim. Mine are
> UPPER_CASE; Base44's are `user.*`.

---

## Step 1 — Persist the docs into the repo (do this first, this turn)

I have uploaded several `.md` files with this message. Before anything else:

0. Print the placeholder table from the section above as a numbered list and
   ask me for the values. Do not continue to item 1 until I have replied;
   then write `docs/ios-bridge/project-facts.md`.
1. Copy every uploaded file into `docs/ios-bridge/` in the repo, except
   `ios-web-bridge-guide.md`, which goes at `docs/ios-web-bridge-guide.md`
   (it is the canonical index that the others reference), and
   `ios-integration-mistakes.md`, which goes at
   `docs/ios-integration-mistakes.md` (you will append to it).
2. Print the full list of files you saved and their paths.
3. Confirm in writing: "All bridge docs and project facts are now in the repo. I will treat
   `docs/ios-web-bridge-guide.md` as canonical and the sub-docs as the
   per-phase contracts."

If any file fails to save, stop and tell me — do not proceed from memory.

## Step 2 — Read and internalize the operating rules

These rules come from a log of real mistakes made on previous builds
(`docs/ios-integration-mistakes.md`, written against a Supabase backend — read
`docs/ios-bridge/base44-backend-mapping.md` for the translation). Each one prevents a specific, expensive
failure. Follow them for the entire project.

**Sequencing.**

- `docs/ios-bridge/implementation-order.md` defines the phase order and is the
  authority on sequencing. Implement phases top-down. Never combine phases in
  one turn. Never skip a phase, even if I name a later one — "the user asked
  for Phase N" is not permission to skip Phases 1..N-1.
- Run the **Phase 0 — Preconditions gate** (defined in
  `implementation-order.md`) at the START of every phase, including this one.
  It is mandatory and not skippable.

**Fidelity to the docs.**

- Every `window.*` global, `wanillajs.event.*` name, endpoint path, DB object
  name, and numeric threshold must be quoted verbatim from a doc. If you cannot
  quote it from a doc, do not invent it — ask me.
- Documented sequences (e.g. diag-phase orderings) and numeric values (5 min
  staleness, 10 s single-flight, 3 s logout guard, 5 s `setSession` timeout,
  retry ladders) are **normative, not hints**. Copy them exactly, with a
  comment citing the doc.
- If the Swift side and a doc disagree, Swift wins — flag it, don't silently
  reconcile. If two docs disagree, say so in the phase report and name the
  Swift switch as tie-breaker.
- Classify every `wanillajs.event.*` name by direction before adding it to
  code: outbound (web → iOS via `messageHandlers`) goes in the event type
  union; inbound (iOS → web via dispatched `CustomEvent`) gets a
  `window.addEventListener`. Never both.

**Bridge completeness.**

- Every bridge contract has two directions. For each outbound `sendIOSEvent`,
  check whether iOS calls something back on `window`; if so, that inbound
  handler ships in the same phase.
- Every iOS-invoked `window.*` global installs at **module scope** (a
  `src/lib/ios*Bridge.ts` or `src/utils/…` file imported once from
  `src/main.tsx`), never inside a component `useEffect`. A global installed in
  a component vanishes when its route unmounts and the native call is silently
  dropped.
- Global entitlement / auth-derived state (subscription active, feature
  gates) is wired at provider/root level, never inside a leaf component.

**Auth & session (highest-risk area).**

- Do not touch the session-injection guards
  (`docs/ios-bridge/session-injection-contract.md`) outside the identity phase.
  Regressions here are silent and show up only as "user stuck on /auth".
- `window.setBase44Session` is called exactly once per fresh native sign-in
  (and, only if the web asks via `auth.sessionRequested`, once per cold
  start). Never on foreground, notification tap, or deep-link arrival.
- Anything the native side can change asynchronously is observed via the
  web-side `authStore` events (`auth:changed`, `ios:session-restored`), never
  polled once at mount. Listeners never `await` backend work inline.

**Security & state.**

- Never gate a paid feature on a `postMessage` or `localStorage` alone — always
  reconcile against the database. When reconciling, treat "no session" or "row
  not yet written" as **unknown**, never as a negative result.
- Service-role-only entities (e.g. `PushOutbox`, `ReferralReward`) ship with
  `rls: { create:false, read:false, update:false, delete:false }` (or
  read-own-record at most); only backend functions touch them via
  `asServiceRole`. Backend functions reached over plain HTTP have **no user
  context** — they must do their own `x-api-key` / `x-internal-key` check
  before using the service role, and must never call `auth.me()` expecting a
  user.
- Every entity that references a user carries `user_id` (= `User.id`); the
  `delete-user-data` function deletes those records explicitly — there is no
  cascade.
- Base44 has no unique indexes or row locks: every "exactly once" guarantee
  (usernames, dedupe keys, referral pairs, outbox claims) is a
  filter → write → re-read loop, as specified in the sub-docs. Do not drop
  the re-read.

**Secrets.** Never ask me to paste a secret value into the chat. When you need
one, state the exact secret name you will reference in code (e.g.
`APPLE_WEBHOOK_API_KEY`), wait for me to confirm the name matches what Vapor
uses, then use the platform's secret-request popup so the value goes straight
to the secrets store. Reference secrets only via `secrets.get('NAME')` from
`base44:runtime`, **inside the handler** (a read at module top level returns
`undefined`). Never echo a secret value into a file, log line, error message,
`function.jsonc`, or curl example — use a placeholder like `<API_KEY>`. Before proposing a
*new* secret, enumerate the existing ones and justify why each is
insufficient — default to reuse.

**Backend layout.** Functions live at `base44/functions/<name>/entry.ts`
(`export default async function (req: Request)`), shared code in
`base44/shared/`, entities in `base44/entities/<Name>.jsonc`, schedules in the
function's `function.jsonc` (or a Workflow if the app has Workflows enabled).
Each function's HTTP endpoint is `https://{{BASE44_APP_DOMAIN}}/functions/<name>`.
Use `base44.functions.invoke()` from the web, never raw `fetch` to that URL.

**Reporting.** When you decide *not* to do something the plan calls for,
state (a) the concrete blocker, (b) whether it lives in the platform, the app,
or your own prior code, and (c) the smallest fix. "Can't easily" is not a
reason.

## Step 3 — Confirm scope and completeness before coding

Print, for my confirmation:

- The list of docs you saved (from Step 1) and the contents of
  `docs/ios-bridge/project-facts.md` (values, not secrets).
- The phase you are about to start (Phase 1 — Foundation) and the exact
  artifacts it owns, quoted from `implementation-order.md` and the referenced
  section of the guide.
- Any doc the phase references that you did NOT receive — if the set looks
  incomplete, pause and ask me rather than proceeding.

---

## Then: begin Phase 1 — Foundation

Once Steps 1–3 are shown, proceed to implement **Phase 1 only** in this same
turn, following its entry in `implementation-order.md` and the transport
section of `docs/ios-web-bridge-guide.md`. Phase 1 covers the transport layer:
the `sendIOSEvent` + `window.*` handler pattern, `ios:navigate` dispatch +
`IOSNavigationBridge` mount, the one-shot `appStarted` and `screenView`
lifecycle events, wrapper detection + the `<WrapperOnly>` gate, and the
loading-overlay globals.

Name every file you create or edit before editing it. Do not touch identity,
push, subscription, or backend surfaces in this phase.

## When Phase 1 is done

- Produce a "shipped vs still owed" checklist measured against Phase 1's
  artifact list — not against what you remember building.
- Tell me exactly how to verify it in the wrapper (which
  `wanillajs.event.*Diag` streams or console lines to watch), then STOP and
  wait for my go-ahead before starting Phase 2.
