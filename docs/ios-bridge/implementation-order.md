# iOS Bridge — Recommended Implementation Order

This doc tells a future Base44 AI **how** to roll out the iOS ↔ web bridge in a
new project without blowing up the auth session, deadlocking navigation, or
overwhelming its context window.

> **Golden rule:** do **not** implement all bridges in one prompt. Ship one
> phase at a time, verify it in the wrapper, then move on. Each phase below is
> a separate prompt.

## Why phased?

- **Shared critical files.** `iosNotifications.ts`, `appLifecycle.ts`, and
  `IOSNavigationBridge.tsx` are edited by almost every bridge. Rewriting them
  all at once loses invariants (session guards, single-flight gates,
  `__pendingIOSPath` drain) that took real debugging to establish.
- **Silent auth bugs.** The session-injection contract is the single most
  failure-prone piece — a wrong guard leaves the user stuck on `/auth` with
  no visible error. Must be its own phase with focused verification.
- **Context-window pressure.** The full guide is long. Handing the AI only
  the sub-doc for the current phase keeps edits surgical and prevents
  hallucinated APIs.
- **Independent testability.** Each phase produces something you can verify
  in the wrapper (`wanillajs.event.*Diag` streams, deep-link taps, foreground
  refresh) before piling on more surface area.

## Phase 0 — Preconditions gate (run at the START of every phase)

Mandatory, not skippable, even when the user names a later phase. Print the
results before writing any code.

1. **Docs present.** List every file under `docs/ios-bridge/` plus
   `docs/ios-web-bridge-guide.md`. If a file this phase references is missing,
   stop and ask for it — do not proceed from memory.
2. **Earlier phases actually shipped.** For each earlier phase, check its
   owned artifacts exist: the files (grep for the exported symbol, not just
   the path — path conventions vary), the `window.*` globals installed from
   `src/main.tsx`, and the DB objects (query `information_schema` /
   `pg_policies` for tables, triggers, functions, policies). Missing
   prerequisites block the phase — "the user asked for Phase N" is not
   permission to skip Phases 1..N-1.
3. **Wrapper gate in place.** The app is gated on wrapper detection
   (`<WrapperOnly>` / guide §2.1) and browser visitors land on the install
   page. This is a Phase-0 requirement, not a Phase-5 polish item.
4. **Secrets named, not pasted.** Every secret this phase needs is listed by
   *name* and confirmed to exist in the project's secrets store. Never ask
   the user to paste a value into chat.
5. **Both directions enumerated.** For every outbound `sendIOSEvent` this
   phase adds, name the inbound `window.*` handler iOS calls back (if any)
   and confirm it ships in the same phase at module scope.

## Phase order

Implement top-down. Do not skip phases — later ones assume earlier invariants.

### Phase 1 — Foundation
Establishes the transport before anything rides on it.

- 3-layer `sendIOSEvent` + `window.*` handler pattern
  (`webkit.messageHandlers.wanillajs`, legacy aliases `gameEvents` /
  `dataEvents`).
- `ios:navigate` custom event dispatch + `IOSNavigationBridge` mount with
  `window.navigateFromIOS(path)` and the `__pendingIOSPath` drain.
  *(Optional: the data-driven payload resolver from
  `deep-link-payload-contract.md` — adopt only if the app has several
  shareable feature types.)*
- Lifecycle events: `wanillajs.event.appStarted` (one-shot, both guards),
  `wanillajs.event.screenView`.
- iOS wrapper detection (`isRunningInIOSWrapper`, `useIsIOSWrapper`) and the
  `<WrapperOnly>` gate + browser landing page (guide §2 / §2.1).
- Loading overlay globals `window.showLoadingOverlay` / `hideLoadingOverlay`
  (`loading-overlay.md`) — module-level DOM node, ref-counted, 20 s safety
  timeout. Installed here because iOS calls them during Phase 2 auth
  round-trips.

References: `docs/ios-web-bridge-guide.md` §2, §3.4, §3.5, §4, §5.7;
`loading-overlay.md`.

### Phase 2 — Identity
The most failure-prone phase. Do it alone.

- **Prerequisite schema:** add the `username` / `username_lc` custom fields
  to the `User` entity and ship the `ensure-profile` function before touching
  the web code. Auth will appear to work without it, but any page that reads
  `username` will fail. Reference: `backend-user-schema.md`.
- **Prerequisite verification:** confirm the Apps API provision + embed-token
  flow works from Vapor in a scratch app (`base44-backend-mapping.md` §3) and
  pin which redeem mechanism the web uses (`session-injection-contract.md` §4).
  No Base44 backend function is needed for session minting — Vapor talks to
  the Apps API directly.
- A web-side `authStore` (`src/lib/authStore.ts`) that owns `{ user, ready }`
  and emits `auth:changed`; every screen reads auth from it, never from a
  cached `me()` result.
- `window.setBase44Session(ott, expectedEmail?)` with all four guards:
  invalid-token reject, already-authenticated short-circuit, 10 s
  single-flight, account-switch storage scrub — and the documented diag-phase
  **order**.
- `window.forceLogoutFromIOS(reason?, userInitiated?)` +
  `wanillajs.event.auth.logoutRequested` and the `logoutRequestedAt` 3 s guard
  (timestamp, **never** a binary flag). The guard must have both a write site
  and a read site.
- `/auth` must subscribe to `auth:changed` / `ios:session-restored` (never a
  one-shot `me()` at mount) so it dismisses when the native session lands;
  the listener must not `await` backend work inline.
- `wanillajs.event.system.openAppSettings` + `openAppSettings(reason)` helper
  (needed for the denied-push recovery path in Phase 4, but ship the helper here).
- `window.setPushPermissionStatus` listener stub per
  `push-permission-bridge.md` §2 (no UI yet — just record state, with the
  `granted` → `authorized` normalization).
- Legal links via `openExternalURL` (`should-open-url.md`) on the sign-in
  surface.

References: `session-injection-contract.md`, `open-app-settings.md`,
`backend-user-schema.md`, `base44-backend-mapping.md`, `push-permission-bridge.md`
(status listener contract), `should-open-url.md`, guide §8.2.

### Phase 3 — Lifecycle
Fixes the "webview woke up, session is stale, page is empty" class of bug.

- `appLifecycle.ts`: `visibilitychange` + `pageshow` / `pagehide` +
  `ios:foregrounded` → `refreshIfStale` (`STALE_THRESHOLD_S = 5 * 60` — the contract value;
  probes `base44.auth.me()` single-flight) / `authEpoch` bump, plus
  `sessionRequested` on a lost session.
- `useAuthEpoch` / `useAuthReady` and wire the epoch into fetch-effect deps
  on RLS-gated pages.
- `IOSNavigationBridge` session-gated navigation: `PUBLIC_IOS_PATHS`,
  `__pendingIOSPath` drain on mount **and** on `auth:changed`,
  `wanillajs.event.auth.sessionRequested`
  (`{ reason: "protected_path_deep_link", path, at }`), logout-guard
  suppression.

References: `foreground-event.md`, `phase-3-verification.md` (run it before
advancing).

### Phase 4 — Push
Backend-heavy. Only start once identity + lifecycle are stable. Split into
4A / 4B / 4C — each gets its own turn and verification.

- **4A — Permission round-trip.** `wanillajs.event.push.requestPermission`
  prompt flow, `window.setPushPermissionStatus` UI wiring (`PushOptInBanner`,
  `PushNudgeInline`, `PushDeniedHomeTip`, Settings row, `pushOptIn.v1`
  cooldown state), the `push.requestStatus` pull + 2 s fallback.
  Reference: `push-permission-bridge.md`.
- **4B — Local scheduling.** `wanillajs.event.push.schedule` / `.cancel` via
  the `pushTriggers.ts` registry; `window.navigateFromIOS(path)` for
  notification taps (dual-key payload, cold-start `pendingTap` →
  `appStarted` drain) and the `wanillajs.event.notificationTapped` analytics
  listener. References: `local-push-scheduling-prompt.md`,
  `notification-tap-handling.md`.
- **4C — Remote pipeline.** `window.setRemotePushDeviceRegistered` +
  `PushOutbox` entity (all RLS closed) + `enqueue-push` / `send-push` backend
  functions + **1-minute scheduled automation** (or Workflow) + Vapor
  `/v1/users/apns/add` and `/api/v1/users/apns/external`. References:
  `apns-registration.md`, `remote-push-pipeline-prompt.md`, guide §8.5.
  "Drain scheduled" is a first-class checklist item — confirm it in the
  dashboard's Automations tab.

### Phase 5 — Features (parallelizable)
Each is self-contained and can ship in any order once Phases 1–4 land.

- Share link / share image bridges (`share.requestLink`,
  `handleShareLinkFromIOS`).
- Invite / join deep links (e.g. `window.joinLeaderboardById`,
  `/join-leaderboard/{id}`) — module-scope global, never a page `useEffect`.
  Or add a `featureType` case to `resolveDeepLinkTarget` if you adopted
  `deep-link-payload-contract.md`.
- Paywall / subscription bridge — the full DB-reconciled contract, not a
  hint-only stub (`subscription-bridge-prompt.md`, `ios-paywall-events.md`,
  guide §8.3).
- Account deletion server-to-server endpoint (`delete-user-prompt.md`,
  guide §8.4).
- Referral credit (`referral-credit` backend function + Tapp deferred deep
  link, `referral-credit-vapor-spec.md`).
- App Store review prompt + in-app review modal (guide §3.12, §4.1).

### Optional modules (include only if the app needs them)

| Module | Doc | Include if |
|---|---|---|
| Onboarding state flag | `onboarding-state.md` | the app has a once-per-device onboarding flow shown before sign-in |
| Data-driven deep-link payloads | `deep-link-payload-contract.md` | the app has several shareable feature types and you want to add new ones without a wrapper release |
| AdMob interstitials + non-consumable IAP | `native-bridge-ads-iap.md` | the app is ad-supported and/or sells a one-off "remove ads" purchase |

## Practical tips for the implementing AI

- **One phase per prompt.** Never combine phases. A phase that adds (a) a new
  entity, (b) a new client-callable backend function, or (c) an outbound HTTP
  integration gets its own turn and its own verification step.
- **Paste the phase's sub-doc verbatim** into the prompt. Do not rely on the
  AI to re-derive the contract from `docs/ios-web-bridge-guide.md`.
- **Name exact files to edit.** Prevents accidental rewrites of unrelated
  bridge code.
- **Verify before advancing.** Check the wrapper's `wanillajs.event.*Diag`
  streams (or console logs in preview) and confirm the phase's success
  criteria before starting the next phase. End every phase with a
  "shipped vs still owed" checklist measured against the phase's artifact
  list, not against memory.
- **Treat `docs/ios-web-bridge-guide.md` as the canonical index**; hand the
  AI the specific sub-doc for the phase being built.
- **Never let the AI touch the session-injection guards** outside Phase 2
  — regressions here are silent and user-visible only as "stuck on /auth".
- **Log deviations.** Anything that departs from a doc (path conventions,
  thresholds, a doc conflict) goes into `docs/ios-integration-mistakes.md`
  in the same turn, with the Swift switch named as tie-breaker.
