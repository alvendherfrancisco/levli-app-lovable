# Phase 3 — Lifecycle Verification Checklist

Manual test plan for the Phase 3 iOS bridge work. Walk through each step in
order. Every step has:

- **Do** — the concrete action (URL, DevTools snippet, or wrapper interaction).
- **Expect** — the observable signal (console line, `window.__*` value,
  network request, or `wanillajs.event.*Diag` entry the wrapper receives).
- **If it fails** — most likely culprit and file to inspect.

Files under test:
- `src/lib/appLifecycle.ts`
- `src/hooks/useAuthEpoch.ts`, `src/hooks/useAuthReady.ts`
- `src/components/IOSNavigationBridge.tsx`
- Wiring in `src/main.tsx` and every data hook that threads `authEpoch` into its fetch deps (the source projects used e.g. `useLeaderboard.ts`, `usePlayLimit.ts` — substitute your own)

Prep: open DevTools → Console + Network. In the wrapper, open the
`wanillajs.event.*Diag` stream. Sign in with Apple/Google at least once so a
real Base44 session exists (`base44.auth.me()` resolves).

---

## A. Foreground / background refresh (`appLifecycle.ts`)

### A1. Startup auto-refresh armed
- **Do:** Hard-reload the preview.
- **Expect:** Console shows `[appLifecycle] foreground pageshow`. No
  `refreshSession failed` warning. the first `base44.auth.me()` probe succeeded (`[appLifecycle] authEpoch bump { reason: "probe" }`).
- **If it fails:** `installAppLifecycle()` isn't running — check
  `src/main.tsx` imports and call order.

### A2. Backgrounding stops the refresher
- **Do:** Switch to another browser tab (or lock the device in the wrapper).
- **Expect:** Console shows `[appLifecycle] background visibilitychange`.
- **If it fails:** `document.addEventListener("visibilitychange", …)` in
  `appLifecycle.ts` isn't wired, or the tab is still considered visible.

### A3. Foreground refreshes a near-expired session
- **Do:** Sign in. Wait > 5 min (the contract value from
  `foreground-event.md`, `STALE_THRESHOLD_S = 5 * 60`), background the tab, then
  foreground it.
- **Expect:**
  - Console: `[appLifecycle] foreground …` followed by
    `[appLifecycle] authEpoch bump { epoch: N, reason: "refreshIfStale" }`.
  - Network: one request from `base44.auth.me()` (no duplicate within 10 s).
- **If it fails:** `refreshIfStale` returned early — inspect the
  last-probe timestamp / `STALE_THRESHOLD_S` math, or the probe errored
  (check the warning line it prints).

### A4. iOS wrapper foreground event
- **Do:** In the wrapper, background the app then foreground it. The wrapper
  is expected to `window.dispatchEvent(new CustomEvent("ios:foregrounded"))`.
- **Expect:** Console: `[appLifecycle] foreground ios:foregrounded` and an
  `authEpoch bump` if the session was stale.
- **If it fails:** The native side isn't dispatching `ios:foregrounded` —
  wrapper bug, not web. Confirm by manually firing
  `window.dispatchEvent(new Event("ios:foregrounded"))` from DevTools; if
  that works, it's a wrapper omission.

### A5. Fetches re-run on epoch bump
- **Do:** Open any screen that reads RLS-gated data. Trigger A3 or A4 to
  force a bump.
- **Expect:** Network shows a second request for that screen's data right
  after the epoch bump.
- **If it fails:** `authEpoch` isn't threaded into the effect deps — check
  the `useEffect` in the screen's data hook.

---

## B. Session-gated navigation (`IOSNavigationBridge.tsx`)

Reset between steps: `window.__pendingIOSPath = undefined`.

### B1. Public path bypasses gate (signed out)
- **Do:** Sign out. In console: `window.navigateFromIOS('/auth')`.
- **Expect:** URL changes to `/auth` immediately. No `sessionRequested`
  event in the wrapper diag stream.
- **If it fails:** `PUBLIC_IOS_PATH_PREFIXES` in `IOSNavigationBridge.tsx`
  is missing `/auth` or the prefix match is wrong.

### B2. Protected path stashes + requests session (signed out)
- **Do:** Signed out. In console: `window.navigateFromIOS('/profile')`.
- **Expect:**
  - URL does NOT change.
  - `window.__pendingIOSPath === '/profile'`.
  - Wrapper receives `wanillajs.event.auth.sessionRequested` with
    `{ reason: "protected_path_deep_link", path: "/profile", at: … }`.
- **If it fails:** `isPublicPath('/profile')` is returning true (bad
  prefix), or the `authStore` still holds a user (check it was cleared on
  sign-out).

### B3. Session lands → deferred path drains
- **Do:** With B2's `__pendingIOSPath` still set, have the wrapper (or a
  dev endpoint on Vapor) mint a fresh embed token and call
  `window.setBase44Session(<ott>, <email>)`.
- **Expect:**
  - `wanillajs.event.auth.setSessionDiag` phases progress through
    `calling_setSession` → `restored` → `redirecting`.
  - `auth:changed` fires → drainer runs → route changes to `/profile`
    (after the reload, if mechanism A is in use).
  - `window.__pendingIOSPath` / its `sessionStorage` mirror is now cleared.
- **If it fails:** the `auth:changed` subscription in
  `IOSNavigationBridge.tsx` isn't installed, or the token was rejected
  (`rejected_invalid_token` diag) or expired (mint a fresh one — 60 s).

### B4. Logout guard suppresses `sessionRequested`
- **Do:** `window.forceLogoutFromIOS('test')`, then within 3 s
  `window.navigateFromIOS('/profile')`.
- **Expect:** `__pendingIOSPath === '/profile'` but NO
  `wanillajs.event.auth.sessionRequested` in the diag stream. Only the
  earlier `wanillajs.event.auth.logoutRequested` is present.
- **If it fails:** `wasLogoutRecentlyRequested()` isn't being called or the
  3 s window elapsed — retest faster.

### B5. Protected path with existing session
- **Do:** Signed in. `window.navigateFromIOS('/profile')`.
- **Expect:** Immediate navigation to `/profile`. `__pendingIOSPath`
  untouched. No `sessionRequested` event.
- **If it fails:** the `authStore` is empty even though signed in —
  storage was scrubbed or the probe failed mid-test.

### B6. Cold-start `__pendingIOSPath` drains on mount
- **Do:** In console (before reload): `window.__pendingIOSPath = '/auth'`.
  Then hard-reload.
- **Expect:** After mount, URL is `/auth`. `__pendingIOSPath` is cleared.
- **If it fails:** The `drainPending()` block in `IOSNavigationBridge`'s
  mount effect isn't running — check the early shim in `index.html` isn't
  overwriting `navigateFromIOS` after mount.

---

## C. Diag / regressions

### C1. No `duplicate_in_flight` storm
- **Do:** In console, fire `window.setBase44Session(ott, email)` 5× in a
  tight loop with the same token and email.
- **Expect:** Wrapper diag shows exactly one `calling_setSession` +
  `restored`. The other four are `already_authenticated` (email already
  live) or `duplicate_in_flight` (within 10 s window). The single-use token
  is spent at most once.
- **If it fails:** Single-flight or already-authenticated guards in
  `iosIdentity.ts` regressed — Phase 2 issue, not Phase 3.

### C2. `useAuthReady` gates cold-start UI
- **Do:** Sign in, then hard-reload `/profile`.
- **Expect:** The "Signed in as …" block renders once, without briefly
  flashing the `SignInButtons` fallback first.
- **If it fails:** `useAuthReady`'s `ready` flag isn't gating the branch, or
  the first `me()` probe is taking longer than the first paint — acceptable
  degradation, not a bug, unless the flicker is user-visible.

### C3. No regressions in Phase 1 events
- **Do:** Reload; navigate through 3–4 of the app's main screens.
- **Expect:**
  - Exactly one `wanillajs.event.appStarted` per session load.
  - One `wanillajs.event.screenView` per route change (including the
    initial route).
- **If it fails:** `useIOSLifecycle` in `IOSNavigationBridge` regressed.

---

## Wrapper-only checks (skip in browser preview)

These require a real device build:

- **D1.** Cold-start deep link via APNs tap to `/profile` while signed
  out → path is queued in the wrapper's `pendingTap`, drained on
  `appStarted`, then Phase 3's session gate stashes it and emits
  `sessionRequested`. After a fresh Apple Sign In, `/profile` opens.
- **D2.** Universal Link to a public invite path (e.g. `/join/<code>`) while
  signed out → bypasses the gate (public prefix), lands on the join screen,
  which runs its own auth flow.
- **D3.** Foregrounding after >30 min → `refreshIfStale` probes; if the
  session is gone, `sessionRequested` fires and the wrapper re-mints
  silently; no visible re-render / white flash, no dropped user-scoped data.

---

## Sign-off

All A/B/C checks pass in the browser preview, and D1–D3 pass in the wrapper
build. File any deviations as new entries in
`docs/ios-integration-mistakes.md` before starting Phase 4.
