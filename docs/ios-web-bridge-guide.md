# iOS Wrapper ↔ Web App Communication Guide

A complete, drop-in specification for building a React/Vite web app that runs
inside a native iOS WKWebView wrapper and communicates with it bidirectionally.

This document is **self-contained**: copy it into a new Base44 project (or
hand it to a fresh Base44 agent) and you can recreate the entire bridge
exactly as it works in production today.

> **Placeholders.** Every upper-case `{{PLACEHOLDER}}` in this doc set (e.g.
> `{{APP_NAME}}`, `{{BUNDLE_ID}}`, `{{APP_STORE_ID}}`, `{{MARKETING_DOMAIN}}`,
> `{{VAPOR_BASE_URL}}`, `{{BASE44_APP_ID}}`, `{{BASE44_APP_DOMAIN}}`) is a value the project owner
> supplies. The values live in `docs/ios-bridge/project-facts.md`, collected at
> kickoff (`docs/wanilla-integration.md` → "Placeholders — ask me, never
> guess"). If a token is not in that file, **ask before writing code** — never
> infer it, and never let a literal `{{…}}` reach source or config. Domain
> examples such as `game.*` / `leaderboard.*` are **illustrative** — rename or
> delete per app. Base44's own `{{user.*}}` RLS templates are not
> placeholders.

---

## Table of contents

1. [Architecture overview](#1-architecture-overview)
2. [Wrapper detection](#2-wrapper-detection)
3. [iOS → Web channel (`window.*` globals)](#3-ios--web-channel)
4. [Web → iOS channel (`webkit.messageHandlers.wanillajs`)](#4-web--ios-channel)
5. [Critical contracts & gotchas](#5-critical-contracts--gotchas)
6. [iOS-side reference (Swift)](#6-ios-side-reference-swift)
7. [Bootstrap checklist for a new project](#7-bootstrap-checklist)
8. [Backend collaboration (Vapor + Base44)](#8-backend-collaboration-vapor--base44)
9. [Glossary of `wanillajs.event.*` namespaces](#9-glossary)

---

## 1. Architecture overview

```text
┌────────────────────────────┐                       ┌────────────────────────────┐
│      iOS Wrapper           │                       │     React Web App          │
│      (Swift + WKWebView)   │                       │     (Vite + React Router)  │
│                            │                       │                            │
│   evaluateJavaScript ───── │ ───── window.* ─────► │   global handler           │
│   ◄───── postMessage ───── │ ◄── webkit handler ── │   sendIOSEvent("…")        │
│                            │                       │                            │
│   • Apple / Google Sign In │                       │   • UI / game logic        │
│   • Local push scheduling  │                       │   • Base44 auth + entities │
│   • APNs registration      │                       │   • Push trigger registry  │
│   • Tapp link minting      │                       │   • Subscription paywall   │
│   • UIActivityViewCtrl     │                       │   • Share UI fallback      │
│   • Native confirm dialogs │                       │                            │
└────────────────────────────┘                       └────────────────────────────┘
```

**Two channels, opposite directions:**

| Direction | Mechanism | Examples |
|---|---|---|
| iOS → Web | `webView.evaluateJavaScript("window.fn(...)")` calling globals the web installs at boot | `setBase44Session`, `navigateFromIOS`, `handleShareLinkFromIOS`, `setPushPermissionStatus`, `showLoadingOverlay`, `showLoginScreen`, `ios:foregrounded` event |
| Web → iOS | `window.webkit.messageHandlers.wanillajs.postMessage({type, payload})` | All `wanillajs.event.*` events: `appStarted`, `auth.*`, `game.*`, `share.requestLink`, `push.schedule`, etc. |

**Three-layer model on the web side:**

1. **Bridge primitives** (`src/utils/iosNotifications.ts`) — `sendIOSEvent`,
   `setBase44Session`, `forceLogoutFromIOS`, etc. Pure functions, no UI.
2. **Singletons / global installers** (`src/utils/iosShareLinkBridge.ts`,
   `src/utils/pushPermission.ts`, `src/components/GlobalLoadingOverlay.tsx`)
   — install `window.*` handlers at module load and survive component
   unmounts.
3. **React glue** (`IOSNavigationBridge.tsx`, `useIsIOSWrapper`,
   `useAuthEpoch`) — components/hooks that subscribe to bridge events.

---

## 2. Wrapper detection

The wrapper is detected by the presence of a `webkit.messageHandlers` entry
that iOS installs at WKWebView creation time. The canonical handler name
is **`wanillajs`** — this is the `WKScriptMessageHandler` name the Swift
wrapper registers, and it is what `AppEvent.appEvent(eventName:params:)`
dispatches from.

> **Canonical handler name: `wanillajs`.** Use this for every new project.
> Some older wrapper builds register the handler as `gameEvents`; treat that
> as a legacy alias. If your wrapper exposes both, prefer `wanillajs`.
> **If you `postMessage` to a handler the Swift side did not register,
> WKWebView silently drops the message — no error, no log.** This is the
> #1 cause of "events not firing in iOS".

### `src/hooks/use-ios-wrapper.tsx`

```tsx
import { useState, useEffect } from "react";

export const useIsIOSWrapper = () => {
  const [isIOSWrapper, setIsIOSWrapper] = useState<boolean | null>(null);

  useEffect(() => {
    const hasIOSBridge = !!(
      window.webkit?.messageHandlers?.wanillajs ||
      window.webkit?.messageHandlers?.gameEvents // legacy alias
    );

    // Browser preview bypass: ?preview=1 sticks in localStorage
    const params = new URLSearchParams(window.location.search);
    if (params.get("preview") === "1") {
      try { localStorage.setItem("previewBypass", "1"); } catch {}
    }
    const previewBypass = (() => {
      try { return localStorage.getItem("previewBypass") === "1"; }
      catch { return false; }
    })();

    setIsIOSWrapper(hasIOSBridge || previewBypass);
  }, []);

  return isIOSWrapper;
};

export const isRunningInIOSWrapper = (): boolean =>
  !!(window.webkit?.messageHandlers?.wanillajs ||
     window.webkit?.messageHandlers?.gameEvents);
```

**Browser visitors** (no wrapper) must be sent to an App Store landing
page. The web build assumes native sign-in (Apple / Google via the
wrapper) and has no usable functionality outside the wrapper — never let
a browser visitor reach an authenticated route.

---

## 2.1 Enforcing wrapper-only access

Detection (§2) only *tells* you whether the wrapper is present. You also
need to **gate the app** so browser traffic lands on a generic install
page instead of broken auth screens. Three pieces — copy them verbatim
into the new project.

### 2.1.1 Route guard: `<WrapperOnly>`

Wrap the router with a guard that renders the landing page for browser
visitors and the real app for wrapper / preview-bypass visitors:

```tsx
// src/components/WrapperOnly.tsx
import { useLocation } from "react-router-dom";
import { useIsIOSWrapper } from "@/hooks/use-ios-wrapper";
import { BrowserLandingPage } from "@/components/BrowserLandingPage";

// Paths that must stay reachable from a regular browser (legal pages,
// invite links the wrapper installs from, the auth screen iOS shows in
// its own webview, etc.). Keep this in sync with the PUBLIC_IOS_PATHS
// list used by IOSNavigationBridge (§3.5).
const PUBLIC_BROWSER_PATHS = ["/privacy", "/terms", "/join/", "/join-leaderboard/"];

export const WrapperOnly = ({ children }: { children: React.ReactNode }) => {
  const isWrapper = useIsIOSWrapper();          // null | true | false
  const { pathname } = useLocation();

  if (isWrapper === null) return null;          // detection pending
  if (isWrapper) return <>{children}</>;        // wrapper or ?preview=1 bypass

  const isPublic = PUBLIC_BROWSER_PATHS.some(p => pathname === p || pathname.startsWith(p));
  return isPublic ? <>{children}</> : <BrowserLandingPage />;
};
```

### 2.1.2 Generic browser landing page

A single hero screen — **no app UI, no auth UI, no domain content**:

```tsx
// src/components/BrowserLandingPage.tsx
const APP_STORE_URL = "https://apps.apple.com/app/id{{APP_STORE_ID}}";

export const BrowserLandingPage = () => (
  <main className="min-h-dvh grid place-items-center p-8 text-center">
    <div className="max-w-md space-y-6">
      <h1 className="text-3xl font-semibold">{{APP_NAME}}</h1>
      <p className="text-muted-foreground">
        {/* One-line value prop. Keep it generic — this is the only thing
            search engines and accidentally-shared links will surface. */}
      </p>
      <a
        href={APP_STORE_URL}
        className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-primary-foreground font-medium"
      >
        Open in the App Store
      </a>
      <p className="text-xs text-muted-foreground">
        <a href="?preview=1" className="underline">Continue to web preview</a>
        {" "}(developers & QA only)
      </p>
    </div>
  </main>
);
```

Rules:

- Do **not** render auth, account, paid, or domain UI here.
- The `?preview=1` link sets `localStorage.previewBypass = "1"` via
  `useIsIOSWrapper` (§2) so the team can still QA the web build.
- Apple's App Review uses the binary, not this URL — this page exists
  for organic browser traffic and social unfurls, not for review.

### 2.1.3 Router wiring

Mount `<WrapperOnly>` once, around `<Routes>`:

```tsx
// src/App.tsx
<BrowserRouter>
  <WrapperOnly>
    <Routes>
      {/* all app routes */}
    </Routes>
  </WrapperOnly>
</BrowserRouter>
```

### 2.1.4 SEO / sharing metadata

Set `<title>`, `meta[name=description]`, and OG / Twitter tags in
`index.html` to describe the **App Store listing**, not the in-app
experience. Anyone who lands on the bare web URL (search, paste in
chat, etc.) should be funnelled to install — not confused by gameplay
screenshots they can't reach.

---

## 3. iOS → Web channel

iOS invokes JavaScript globals via `evaluateJavaScript`. **Every global
must be installed at app boot** so it exists when iOS calls it — otherwise
WKWebView throws and the message is lost.

### 3.1 `window.setBase44Session(ott, expectedEmail?)`

Hands a Base44 **single-use embed sign-in token** to the web after a native
sign-in completes. Full contract: `docs/ios-bridge/session-injection-contract.md`.

**Contract — CRITICAL:**

- Call **exactly once** per fresh native sign-in, immediately after Vapor
  returns `{ auth: { ott }, user: { email } }` (§8.2.2). Tokens expire in
  60 s and are single-use — mint last, inject immediately.
- **DO NOT** call on foreground, notification tap, deep-link arrival, or
  "just in case the webview reloaded". Session liveness on resume is
  handled web-side via `ios:foregrounded` (§3.10); the web asks for a new
  token via `wanillajs.event.auth.sessionRequested` only when its probe fails.
- `ott` MUST be a non-empty, 3-segment token string; `expectedEmail` SHOULD
  be passed so the web can short-circuit `already_authenticated` without
  spending the token.

**Web-side defensive idempotency** (all phases emitted via
`wanillajs.event.auth.setSessionDiag`):

| Phase | Trigger |
|---|---|
| `rejected_invalid_token` | Token shape check fails — no storage mutation, token not spent |
| `already_authenticated` | `base44.auth.me()` already resolves to `expectedEmail` — no-op, return success, still emits `ios:session-restored` |
| `duplicate_in_flight` | Another handoff started in the last 10s — return that promise |
| `account_switch_detected` → `storage_scrubbed` → `preflight_signout_done` → `calling_setSession` | Genuine account switch (live email ≠ `expectedEmail`) |
| `setSession_timeout` | Redeem/exchange hung > 5s |
| `restored` → `redirecting` | Success |

A WKWebView-safe wrapper returns a synchronous JSON string (`{accepted, attemptId, tokenShape}`) because `evaluateJavaScript` cannot serialize a Promise. The real outcome is delivered via the `setSessionDiag` event stream.

Redeem mechanism (reload with `?ott=` vs in-page token exchange) is chosen per `session-injection-contract.md` §4. After success the bridge calls `base44.auth.me()`, fills the web-side `authStore`, emits `auth:changed` + `ios:session-restored`, and calls `ensure-profile` if the user has no `username` yet.

### 3.2 `window.showLoginScreen()`

Called by iOS after a native confirmation flow (e.g. account deletion).

**Critical:** must clear the `authStore` and the SDK's stored token first —
otherwise the cached session in localStorage causes `/auth` to auto-redirect
back to `/` for the now-deleted user.

```ts
export const showLoginScreen = () => {
  forceLogoutFromIOS('accountDeleted');
};
```

### 3.3 `window.forceLogoutFromIOS(reason?)`

Fire-and-forget force logout (e.g. no tokens in keychain, revoked credential).

```ts
export const forceLogoutFromIOS = (reason?: string): void => {
  // Suppress during user-initiated native sign-in (2-min window)
  const appleRequestedAt = parseInt(sessionStorage.getItem('appleSignInRequestedAt') ?? '', 10);
  const googleRequestedAt = parseInt(sessionStorage.getItem('googleSignInRequestedAt') ?? '', 10);
  const lastRequestedAt = Math.max(
    Number.isFinite(appleRequestedAt) ? appleRequestedAt : 0,
    Number.isFinite(googleRequestedAt) ? googleRequestedAt : 0
  );
  if (lastRequestedAt > 0 && Date.now() - lastRequestedAt < 2 * 60 * 1000) return;

  sessionStorage.setItem('logoutRequestedAt', String(Date.now())); // 3s race guard
  sessionStorage.setItem('appStartedSent', '1');                   // prevent duplicate appStarted

  const userId = authStore.getUser()?.id;            // capture before scrubbing
  authStore.clear();                                  // synchronous local teardown
  scrubBase44TokenKeys();                             // SDK token key(s) in localStorage
  sendIOSEvent('wanillajs.event.auth.userDidSignOut', { userId, reason: reason ?? null });
  void import('@/api/base44Client').then(({ base44 }) => { try { base44.auth.logout(); } catch {} });
  window.location.replace('/auth');                   // hard reload wipes in-memory state
};
```

**The 3s guard** (`logoutRequestedAt`) lets a racing `setBase44Session`
re-injection from the wrapper be dropped, without blocking a fresh
interactive sign-in. Use a *timestamp*, not a binary flag — a binary flag
silently kills the next legitimate native sign-in.

### 3.4 `window.showLoadingOverlay()` / `window.hideLoadingOverlay()`

Global blocking overlay iOS can summon during long native operations (native
sign-in, IAP purchase, account deletion, etc.).

> **Canonical contract: `docs/ios-bridge/loading-overlay.md`.** The globals
> must be a **module-level DOM-node installer** (ref-counted, 20 s safety
> auto-hide, `z-index 2147483000`, imported from `src/main.tsx`) — *not* the
> React-state forwarding sketch below. The React version is a no-op before
> React mounts and after an error boundary unmounts the tree, and strands the
> UI if native misses a `hide` (see `ios-integration-mistakes.md` #17 / #44).
> The sketch is kept only to show the call shape.

```tsx
let setGlobalLoading: ((loading: boolean) => void) | null = null;

export const showLoadingOverlay = () => setGlobalLoading?.(true);
export const hideLoadingOverlay = () => setGlobalLoading?.(false);

if (typeof window !== "undefined") {
  (window as any).showLoadingOverlay = showLoadingOverlay;
  (window as any).hideLoadingOverlay = hideLoadingOverlay;
}

export const GlobalLoadingOverlay = () => {
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    setGlobalLoading = setIsLoading;
    return () => { setGlobalLoading = null; };
  }, []);
  if (!isLoading) return null;
  return <div className="fixed inset-0 z-[9999] …">…</div>;
};
```

Mount `<GlobalLoadingOverlay />` once at the App root.

### 3.5 `window.navigateFromIOS(path)`

SPA navigation initiated by iOS (notification tap, Tapp deferred deep link,
etc.). Uses React Router's `useNavigate` under the hood — does NOT trigger
a full document reload.

```tsx
// src/components/IOSNavigationBridge.tsx
const PUBLIC_IOS_PATHS = ["/auth", "/privacy", "/terms", "/join/", "/join-leaderboard/"];

const needsSessionBeforeNavigation = (path: string) =>
  path.startsWith("/") &&
  !PUBLIC_IOS_PATHS.some(p => path === p || path.startsWith(p));

export const IOSNavigationBridge = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const navigateToPath = async (path?: string | null, remember = true) => {
      if (!path) return;
      if (remember) rememberIOSDeepLinkPath(path);

      // For protected paths, ensure session exists or ask iOS to inject one
      if (needsSessionBeforeNavigation(path)) {
        if (!authStore.getUser()) {
          window.__pendingIOSPath = path;
          sendIOSEvent("wanillajs.event.auth.sessionRequested",
                       { reason: "iosNavigation", path });
          return;
        }
      }
      navigate(path);
    };

    window.navigateFromIOS = (path: string) => {
      window.__pendingIOSPath = null;
      navigateToPath(path, true);
    };

    window.addEventListener("ios:navigate", (e: any) => {
      const path = e.detail?.path ?? window.__pendingIOSPath;
      window.__pendingIOSPath = null;
      navigateToPath(path, e.detail?.remember !== false);
    });

    // Drain any pending path queued before the bridge mounted
    if (window.__pendingIOSPath) {
      const p = window.__pendingIOSPath;
      window.__pendingIOSPath = null;
      navigateToPath(p);
    }

    return () => { delete window.navigateFromIOS; };
  }, [navigate]);

  return null;
};
```

**`__pendingIOSPath` queue**: iOS may call `navigateFromIOS` before the
bridge component has mounted (e.g. cold start with deep link). The Swift
helper falls back to assigning `window.__pendingIOSPath` so the bridge
drains it on mount.

### 3.6 `window.handleShareLinkFromIOS(payload)` / `handleShareLinkErrorFromIOS(msg)`

iOS responds to a `wanillajs.event.share.requestLink` with a minted Tapp link
(or an error). These globals MUST exist at all times or WKWebView throws.

```ts
// src/utils/iosShareLinkBridge.ts — install once at module load
export type ShareLinkPayload = {
  shareLink: string;
  userID?: string;     // canonical (capital D); also accepts userId for legacy
  username?: string;
  source?: string;
};

let currentSubscriber: { onLink?; onError? } | null = null;

export const subscribeShareLink = (sub) => {
  currentSubscriber = sub;
  return () => { if (currentSubscriber === sub) currentSubscriber = null; };
};

if (typeof window !== 'undefined') {
  window.handleShareLinkFromIOS = (input) => {
    const payload = typeof input === 'string'
      ? { shareLink: input }
      : { shareLink: input.shareLink,
          userID: input.userID ?? input.userId,
          username: input.username,
          source: input.source };
    currentSubscriber?.onLink?.(payload);
  };
  window.handleShareLinkErrorFromIOS = (msg) => {
    currentSubscriber?.onError?.(msg);
  };
}
```

Side-effect import from `src/main.tsx`:

```ts
import "./utils/iosShareLinkBridge";
```

Screens that need the result temporarily register via `subscribeShareLink`
and unsubscribe on unmount. If no subscriber is active, the callback is a
no-op (still a valid function — no exception thrown).

### 3.7 `window.updateShareLink(link)` *(optional/legacy)*

Push-style update of a previously displayed share link. Install if you have
a screen that displays a long-lived share URL iOS may want to refresh.

### 3.8 `window.setPushPermissionStatus({status, source})`

> Canonical contract: `docs/ios-bridge/push-permission-bridge.md`.
> Note the status alias — the wrapper may send `"granted"`; the web normalizes
> it to `"authorized"` on receipt. Both are valid on the wire.
> For screens that mount after the three broadcasts, the optional pull event
> `wanillajs.event.push.requestStatus` is documented in
> `docs/ios-bridge/apns-registration.md` § "Push status request".

iOS owns the truth (`UNUserNotificationCenter` authorization status). The
web is a passive listener and **never polls**. iOS calls this at three
moments: cold launch (`appStart`), every foreground (`foreground`), and
immediately after the user responds to the OS prompt (`promptResult`).

```ts
type PushPermissionStatus = "granted" | "denied" | "notDetermined"
                          | "provisional" | "ephemeral" | "unknown";
type PushPermissionSource  = "appStart" | "foreground" | "promptResult" | "unknown";

let currentStatus: PushPermissionStatus = "unknown";

export const initializePushPermissionBridge = () => {
  (window as any).setPushPermissionStatus = (payload) => {
    const next = payload?.status ?? "unknown";
    if (next === currentStatus) return;
    currentStatus = next;
    window.dispatchEvent(new CustomEvent("pushPermissionUpdated",
      { detail: { status: next, source: payload?.source ?? "unknown" } }));
  };
};
```

Boot from `src/main.tsx`:

```ts
import { initializePushPermissionBridge } from "./utils/pushPermission";
initializePushPermissionBridge();
```

### 3.9 `window.setRemotePushDeviceRegistered({registered})`

iOS calls this once APNs token registration + your backend's device-token
upsert both succeed. The web uses it to gate "you can receive remote pushes
now" UI hints.

Same install pattern as 3.8.

### 3.10 `ios:foregrounded` DOM event

When iOS comes back to the foreground, the wrapper dispatches:

```swift
webView.evaluateJavaScript("window.dispatchEvent(new Event('ios:foregrounded'))")
```

iOS pauses WKWebView JS timers when backgrounded. On resume the web cannot
assume its Base44 session is still valid (token expiry, wrapper relaunch), and
a denied entity read on Base44 returns an **empty list, not an error** — so
pages silently render empty.

**`src/utils/appLifecycle.ts`** listens and:

1. Probes `base44.auth.me()` if the last successful probe is older than 5 min
   (`STALE_THRESHOLD_S = 5 * 60`)
   (`refreshIfStale`, single-flight).
2. On success, updates the `authStore` and bumps a global `authEpoch` counter
   that page-level fetch effects depend on (via `useAuthEpoch`) to auto-refetch.
3. On `401`, clears the `authStore` and emits
   `wanillajs.event.auth.sessionRequested { reason: "foreground_session_lost", path, at }`
   so the wrapper can re-mint via Vapor (§8.2.3). It never redirects on its own.

```ts
// In every page that reads user-scoped entities:
const { authEpoch } = useAuthReady();
useEffect(() => { fetchData(); }, [authEpoch, /* other deps */]);
```

Full spec: `docs/ios-bridge/foreground-event.md`.

### 3.11 `window.postMessage({type: "subscriptionStatusChanged", status})`

iOS reports IAP/StoreKit status changes via `postMessage`. The web listener
treats this as a *hint only* and **always re-confirms against the database**
because postMessage is forgeable.

```ts
window.addEventListener("message", (event) => {
  if (event.origin && event.origin !== window.location.origin) return;
  if (event.data?.type === "subscriptionStatusChanged") {
    reconcileFromDatabase(); // read UserSubscription (RLS) or invoke get-subscription
  }
});
```

`localStorage.isSubscribed` is a UX-only mirror — **never gate a paid
feature on it alone.** Always re-check the DB.

### 3.12 `window.setAppLaunchCount(count)`

iOS owns the launch counter (persisted in `UserDefaults`) and pushes the
current value to the web on every cold start / resume that constitutes a
"launch" in the wrapper's model. The web is stateless about it — nothing
is persisted across sessions on the web side.

```ts
// src/utils/appReviewLaunchCount.ts
export const APP_REVIEW_LAUNCH_THRESHOLD = 5;

let launchCount = 0;

export const setLaunchCount = (n: number) => {
  if (typeof n !== "number" || !Number.isFinite(n) || n < 0) return;
  launchCount = Math.floor(n);
};

export const shouldShowAppReviewModal = () => launchCount >= APP_REVIEW_LAUNCH_THRESHOLD;

if (typeof window !== "undefined") {
  (window as any).setAppLaunchCount = (n: number) => setLaunchCount(n);
}
```

Swift call site (right after the `appStarted` handshake completes):

```swift
let key = "appLaunchCount"
let next = UserDefaults.standard.integer(forKey: key) + 1
UserDefaults.standard.set(next, forKey: key)
webView.evaluateJavaScript("window.setAppLaunchCount(\(next))")
```

The `5` divisor is a **web-side decision** and can be changed unilaterally
without a wrapper release. iOS should never gate its own behaviour on the
count — it only reports.

---



## 4. Web → iOS channel

All web→iOS messages go through one helper that targets the **`wanillajs`**
message handler (with `gameEvents` as a legacy fallback for older wrappers):

```ts
// src/utils/iosNotifications.ts
export const sendIOSEvent = (type: string, payload?: Record<string, any>) => {
  const handler =
    window.webkit?.messageHandlers?.wanillajs ??
    window.webkit?.messageHandlers?.gameEvents; // legacy

  if (handler) {
    handler.postMessage({ type, payload: payload ?? {} });
  } else {
    // Not in wrapper (browser, SSR, preview). Never throw — just warn + no-op.
    console.warn("[iOS bridge] not in wrapper, skipping", type);
  }
};
```

The Swift side receives `{ type, payload }`, decodes `type` into the
`AppEvent` enum via `AppEvent.appEvent(eventName:params:)`, and dispatches.
**Swift is the single source of truth.** If Swift and this guide disagree,
Swift wins — update this guide in the same PR as the Swift change.

### 4.0 Authoritative event registry

> **Last synced with Swift snapshot: `<sha-pending — bumped 2026-06-08 for googleSignInRequested>`.**
> When you add, rename, or remove a Swift `AppEvent` case, bump this SHA
> and edit the table below in the same PR.

Every `type` string below must appear **verbatim** in both the Swift
`AppEvent.appEvent(eventName:)` switch and any JS `sendIOSEvent(...)` call.
A typo here = silent `DecodableHelper.decode` failure = the event is dropped.

#### Lifecycle

| JS `type`                          | Swift case             | Payload struct |
| ---------------------------------- | ---------------------- | -------------- |
| `wanillajs.haptic`                 | `.haptic(_)`           | `Haptic`       |
| `wanillajs.event.appStarted`       | `.appStarted`          | —              |
| `wanillajs.event.screenView`       | `.screenView(_)`       | `ScreenView`   |

#### Auth

| JS `type`                                  | Swift case                        | Payload struct       |
| ------------------------------------------ | --------------------------------- | -------------------- |
| `wanillajs.event.auth.appleSignInRequested`| `.appleAuthButtonTapped`          | —                    |
| `wanillajs.event.auth.googleSignInRequested`| `.googleAuthButtonTapped`        | `{ mode: "signin" \| "signup" }` |
| `wanillajs.event.auth.userDidSignUp`       | `.authUserDidSignUp(_)`           | `UserDidAuthData`    |
| `wanillajs.event.auth.userDidSignIn`       | `.authUserDidSignIn(_)`           | `UserDidAuthData`    |

#### Example domain registry (illustrative — rename or delete per app)

> The `game.*` and `leaderboard.*` rows below are the source project's
> actual Swift switch cases, kept verbatim so you can see a real, working
> domain mapping. **They are NOT required by the bridge.** Delete or
> rename them for your app's domain — the lifecycle / auth / push /
> share / paywall / settings rows above are the only ones every project
> reuses as-is.

##### Example: game

| JS `type`                                       | Swift case                         | Payload struct                |
| ----------------------------------------------- | ---------------------------------- | ----------------------------- |
| `wanillajs.event.game.useHintButtonTapped`      | `.gameUseHintButtonTapped(_)`      | `GameUseHintButtonTapped`     |
| `wanillajs.event.game.buyHintsButtonTapped`     | `.gameBuyHintsButtonTapped`        | —                             |
| `wanillajs.event.game.userCompletedLevel`       | `.gameUserCompletedLevel(_)`       | `GameUserCompletedLevel`      |
| `wanillajs.event.game.userFailedLevel`          | `.gameUserFailedLevel(_)`          | `GameUserFailedLevel`         |
| `wanillajs.event.game.startLevelButtonTapped`   | `.gameStartLevelButtonTapped(_)`   | `GameStartLevelButtonTapped`  |
| `wanillajs.event.game.easyDifficultyButtonSelected`   | `.gameEasyDifficultyButtonSelected`   | —                       |
| `wanillajs.event.game.mediumDifficultyButtonSelected` | `.gameMediumDifficultyButtonSelected` | —                       |
| `wanillajs.event.game.hardDifficultyButtonSelected`   | `.gameHardDifficultyButtonSelected`   | —                       |
| `wanillajs.event.game.languageChanged`          | `.gameLanguageChanged`             | —                             |

##### Example: leaderboard

| JS `type`                                       | Swift case                              | Payload struct              |
| ----------------------------------------------- | --------------------------------------- | --------------------------- |
| `wanillajs.event.leaderboard.easyDifficultyButtonSelected`   | `.leaderboardEasyDifficultyButtonSelected`   | —                  |
| `wanillajs.event.leaderboard.mediumDifficultyButtonSelected` | `.leaderboardMediumDifficultyButtonSelected` | —                  |
| `wanillajs.event.leaderboard.hardDifficultyButtonSelected`   | `.leaderboardHardDifficultyButtonSelected`   | —                  |
| `wanillajs.event.leaderboard.copyLinkButtonTapped` | `.leaderboardCopyLinkButtonTapped(_)` | `GameLeaderboardShareLink`  |
| `wanillajs.event.leaderboard.languageChanged`   | `.leaderboardLanguageChanged`           | —                           |

#### Settings

| JS `type`                                                | Swift case                                  | Payload struct          |
| -------------------------------------------------------- | ------------------------------------------- | ----------------------- |
| `wanillajs.event.settings.privacyPolicyButtonTapped`     | `.settingsPrivacyPolicyButtonTapped`        | —                       |
| `wanillajs.event.settings.termsAndConditionsButtonTapped`| `.settingsTermsAndConditionsButtonTapped`   | —                       |
| `wanillajs.event.settings.deleteAccountButtonTapped`     | `.deleteUserButtonTapped(_)`                | `DeleteUserEventData`   |
| `wanillajs.event.settings.logoutButtonTapped`            | `.settingsLogoutButtonTapped`               | —                       |

#### Paywall

| JS `type`                                       | Swift case                          | Payload struct                       |
| ----------------------------------------------- | ----------------------------------- | ------------------------------------ |
| `wanillajs.event.paywall.subscribeButtonTapped` | `.paywallSubscribeButtonTapped(_)`  | `PaywalSubscriptionButtonTapped`     |
| `wanillajs.event.paywall.closeButtonTapped`     | `.paywallCloseButtonTapped(_)`      | `PaywalSubscriptionButtonTapped`     |

##### Notification-style `gameEvents` messages (no `type` key)

In addition to the `wanillajs.event.*` envelope above, the paywall Subscribe
button also posts a **legacy notification-style** message on the same
`gameEvents` message handler. These messages have **no `type` field**; iOS
dispatches on `notificationName` instead. This is the primary trigger the
wrapper listens for to present the native StoreKit sheet — the
`wanillajs.event.paywall.subscribeButtonTapped` above is analytics-only.

| JS payload                                                | Emitted from                        | iOS side-effect                              |
| --------------------------------------------------------- | ----------------------------------- | -------------------------------------------- |
| `{ notificationName: "paywall.subscriptions.show" }`      | `src/pages/Game.tsx` `handleSubscribe` | Presents the native StoreKit subscription sheet. |

Sent verbatim as:

```js
window.webkit.messageHandlers.gameEvents.postMessage({
  notificationName: 'paywall.subscriptions.show'
});
```

The `notificationName` namespace is reserved for future paywall/subscription
signals (e.g. `paywall.subscriptions.hide`). Do not overload it for unrelated
events — use the `wanillajs.event.*` envelope for anything new.

#### Push Notifications

| JS `type`                              | Swift case                          | Payload struct                                        |
| -------------------------------------- | ----------------------------------- | ----------------------------------------------------- |
| `wanillajs.event.push.requestPermission` | `.requestNotificationPermission`  | —                                                     |
| `wanillajs.event.push.schedule`        | `.scheduleLocalNotification(_)`     | `WanillaClientScheduleLocalPushNotificationPayload`   |
| `wanillajs.event.push.cancel`          | `.canceLocalNotification(_)`        | `WanillaClientCancelLocalPushNotificationPayload`     |

#### Share

| JS `type`                          | Swift case             | Payload struct      |
| ---------------------------------- | ---------------------- | ------------------- |
| `wanillajs.event.share.requestLink`| `.shareLinkRequest(_)` | `ShareLinkRequest`  |

#### Events defined in sub-docs (confirm against your wrapper's Swift switch)

These are specified in dedicated sub-docs and marked **Active** in §4.1, but
they were added after the Swift snapshot above. Treat them as part of the
registry **only after** you have confirmed the case exists in the wrapper's
`AppEvent` switch; otherwise WKWebView drops them silently.

| JS `type`                                     | Sub-doc                                   | Payload |
| --------------------------------------------- | ----------------------------------------- | ------- |
| `wanillajs.event.navigation.shouldOpenURL`    | `docs/ios-bridge/should-open-url.md`      | `{ url, context? }` |
| `wanillajs.event.review.requestPrompt`        | §4.1 "Review prompt"                      | `{ reason, promptType }` |
| `wanillajs.event.review.modalShown` / `.openAppStore` / `.modalDismissed` | §4.1 "Review prompt" | `{ launchCount, via? }` |
| `wanillajs.event.push.requestStatus` *(optional)* | `docs/ios-bridge/apns-registration.md` | `{}` |
| `wanillajs.event.onboarding.completed` *(optional module)* | `docs/ios-bridge/onboarding-state.md` | `{ at, … }` |

> **Doc-conflict rule.** If a sub-doc or `implementation-order.md` mandates an
> event that this registry marks "Not wired — do not emit" (today:
> `auth.logoutRequested`, `auth.sessionRequested`, `system.openAppSettings`,
> `auth.userDidSignOut`, `auth.setSessionDiag`), emit it as the sub-doc
> specifies, add a code comment citing the "not wired" status, and **say so in
> the phase report**. The Swift switch is the tie-breaker; WKWebView drops
> unknown types silently, so the emission is inert until Swift adds the case.

### 4.0.1 Payload shapes

Mirror each Swift `Decodable` struct here so the agent does not guess keys.
Wrong key / wrong type = `DecodableHelper.decode` returns nil = the case
falls through and **the event is silently dropped**.

```ts
// Haptic
type Haptic = {
  style: "light" | "medium" | "heavy" | "soft" | "rigid"
       | "success" | "warning" | "error";
};

// ScreenView
type ScreenView = { screenName: string };

// ShareLinkRequest — superset; iOS uses what it needs.
type ShareLinkRequest = {
  source: string;                 // analytics origin
  userID: string;                 // auth.uid() (capital D — canonical)
  username: string;
  featureType: "referral_credit" | "leaderboard_invite";
  featureValue: string | number;  // hint amount OR leaderboardId
  deeplink?: string;              // e.g. "/join/<inviteCode>"
  object: string;                 // human-readable label for the Tapp link
  presentNativeShareSheet: boolean;
};

// WanillaClientScheduleLocalPushNotificationPayload
type WanillaClientScheduleLocalPushNotificationPayload = {
  id: string;                     // UNNotificationRequest identifier
  category: "retention" | "social" | "monetisation";
  title: string;
  body: string;
  fireAt?: number;                // unix seconds — use this OR delaySeconds
  delaySeconds?: number;
  deepLink?: string;              // forwarded as ios:navigate on tap
  replaces?: boolean;             // default true
};

// WanillaClientCancelLocalPushNotificationPayload
type WanillaClientCancelLocalPushNotificationPayload = { id: string };

// PaywalSubscriptionButtonTapped (note: spelling matches Swift)
type PaywalSubscriptionButtonTapped = { userId: string };

// --- TODO: confirm these against the Swift Decodable structs ---
// Values below reflect what this codebase currently emits via sendIOSEvent
// and are a starting point only — fix the keys if Swift disagrees.

// UserDidAuthData
type UserDidAuthData = {
  email?: string;
  userId: string;
  authMethod: "apple" | "google" | "email" | string;
  authType?: "signin" | "signup" | "unknown";
};

// DeleteUserEventData
type DeleteUserEventData = { userId: string };

// ─── Example domain payloads (illustrative — rename or delete per app) ───
// Shapes for the example `game.*` / `leaderboard.*` events above. Not
// required by the bridge; included so you can see how a real domain
// maps its Decodable structs to TS.

// GameUseHintButtonTapped
type GameUseHintButtonTapped = {
  hintsRemaining: number;
  level: number;
  difficulty: "easy" | "medium" | "hard";
};

// GameUserCompletedLevel / GameUserFailedLevel
type GameUserCompletedLevel = { level: number; difficulty: "easy" | "medium" | "hard" };
type GameUserFailedLevel    = { level: number; difficulty: "easy" | "medium" | "hard" };

// GameStartLevelButtonTapped
type GameStartLevelButtonTapped = {
  level: number;
  difficulty: "easy" | "medium" | "hard";
  language?: string;
};

// GameLeaderboardShareLink
type GameLeaderboardShareLink = { link: string };
```

When a Swift struct changes, update both the table in §4.0 and the matching
shape above in the same PR.

### 4.0.2 Pre-merge checklist (every bridge change)

- [ ] The JS `type` string is copy-pasted from the Swift case literal — no typos, no renames.
- [ ] Payload keys + types match the Swift `Decodable` struct exactly.
- [ ] `isRunningInIOSWrapper()` checks `window.webkit?.messageHandlers?.wanillajs`.
- [ ] Non-wrapper code paths `console.warn` and no-op instead of throwing.
- [ ] §4.0 table updated in the same PR as the Swift switch.
- [ ] "Last synced" SHA in §4.0 is bumped.

### 4.0.3 Rule for the Lovable agent

Before emitting any `wanillajs.*` message, read this file and confirm the
`type` string appears **verbatim** in the §4.0 registry. If it doesn't,
**stop and ask the user** to either update the Swift switch or pick an
existing event — do not invent a new event name.

Events flagged in §4.1 / §8 as **"Not wired in current wrapper — do not
emit"** are also forbidden; treat them as nonexistent until they appear in
the §4.0 table.

### 4.1 Event catalogue

The catalogue below is the human-readable, project-specific companion to the
authoritative registry in §4.0. Use §4.0 as the contract; use §4.1 to
understand *why* each event exists and how to port it to a new app.

All event names use the namespace `wanillajs.event.<group>.<action>`.

Each event is annotated with:

- **Reuse if:** the generic feature pattern that should trigger this event in a new app.
- **Rename to:** suggested name when the example wording does not fit your domain.
- **Skip if:** app types where the event has no analogue and should be removed.

---

#### Lifecycle

##### `wanillajs.event.appStarted`
- **Payload:** —
- **Trigger:** Once per webview session, after auth hydrated. Guarded by module-level `appStartedDispatched` + `sessionStorage.appStartedSent`.
- **iOS side-effect:** Subscription reconcile, push-permission prompt-on-launch, any first-launch housekeeping.
- **Reuse if:** *Always.* Any iOS-wrapped web app needs a single "the SPA is alive and authenticated" signal so the wrapper can run launch-time work exactly once.
- **Rename to:** keep as-is.
- **Skip if:** never.

##### `wanillajs.event.screenView`
- **Payload:** `{ screenName: string }`
- **Trigger:** Every page mount.
- **iOS side-effect:** Analytics forwarding.
- **Reuse if:** *Always.* Any SPA that wants native-side analytics parity should emit this on every route change.
- **Rename to:** keep as-is.
- **Skip if:** the app has no analytics requirement and no per-screen native behaviour.

##### `wanillajs.haptic`
- **Payload:** `{ type: 'impact' | 'notification' | 'selection', … }`
- **Trigger:** UI feedback moments (button taps, success, error).
- **iOS side-effect:** `UIImpactFeedbackGenerator` / `UINotificationFeedbackGenerator`.
- **Reuse if:** the app has tactile UI moments worth reinforcing (games, fintech confirmations, swipe gestures).
- **Rename to:** keep as-is.
- **Skip if:** the app is purely content/reading with no interactive feedback surfaces.

---

#### Auth

##### `wanillajs.event.auth.appleSignInRequested`
- **Payload:** `{ mode }`
- **Trigger:** User taps the Apple Sign In button.
- **Reuse if:** the app uses Apple Sign In via the iOS wrapper (the bootstrap assumes this).
- **Rename to:** `auth.<provider>SignInRequested` if you support multiple native providers (Google, Sign in with Game Center, etc.).
- **Skip if:** the app handles auth entirely inside the web layer with no native provider.

##### `wanillajs.event.auth.googleSignInRequested`
- **Payload:** `{ mode: "signin" | "signup" }`
- **Trigger:** User taps the Google Sign In button on `/auth`.
- **Wrapper contract:** run native GIDSignIn, obtain a verified Google ID token, then send it to Vapor, which verifies it and runs the Apps API provision + embed-token calls (§8.2). On success call `window.setBase44Session(ott, email)` exactly once (see `docs/ios-bridge/session-injection-contract.md`).
- **Reuse if:** the app uses Google Sign In via the iOS wrapper.
- **Skip if:** Google auth isn't offered.

> **Prerequisite:** the `User` entity must carry the `username` custom fields
> and the `ensure-profile` function must exist before Phase 2 ships. See
> `docs/ios-bridge/backend-user-schema.md`.



##### `wanillajs.event.auth.userDidSignUp` / `userDidSignIn`
- **Payload:** `{ email, userId, authMethod, authType }` — `userId` is the Base44 `User.id`; the wrapper forwards it to Vapor so server-to-server calls can address this user (§8.2.1 note 2).
- **Trigger:** First successful `base44.auth.me()` after a session handoff (`ios:session-restored`). `authType: "signup"` when `ensure-profile` reports `created: true`.
- **Reuse if:** *Always when auth exists.* Native side needs this for analytics, push token registration, and conditional onboarding.
- **Rename to:** keep as-is.
- **Skip if:** no auth at all.

##### `wanillajs.event.auth.userDidSignOut`
- **Status:** **Not wired in current wrapper — do not emit.** Swift `AppEvent.appEvent` has no case for this string; the wrapper drops it silently. Existing in-codebase callers should be cleaned up or the Swift switch extended.
- **Payload (historical):** `{ userId, reason }`
- **Original intent:** Any logout — web-initiated or `forceLogoutFromIOS`. Wrapper would clear cached Apple credential / push token bindings.

##### `wanillajs.event.auth.logoutRequested`
- **Status:** **Not wired in current wrapper — do not emit.**
- **Payload (historical):** `{ userId }`
- **Original intent:** Settings → Logout button; asks the wrapper to drop the Apple credential so it stops re-injecting the session.

##### `wanillajs.event.auth.logoutDiag` / `setSessionDiag`
- **Status:** **Not wired in current wrapper — do not emit.**
- **Payload (historical):** `{ phase, userId, attemptId?, … }`
- **Original intent:** Diagnostic stream during logout and `setBase44Session` retries.

##### `wanillajs.event.auth.sessionRequested`
- **Status:** **Not wired in current wrapper — do not emit.**
- **Payload (historical):** `{ reason, path }`
- **Original intent:** Protected navigation lands without a session → web asks iOS to inject one.

##### `wanillajs.event.auth.error`
- **Status:** **Not wired in current wrapper — do not emit.**
- **Payload (historical):** `{ error, authMethod }`
- **Original intent:** Any auth failure.

##### `wanillajs.event.auth.languageChanged`
- **Status:** **Not wired in current wrapper — do not emit.**
- **Payload (historical):** `{ language }`
- **Original intent:** Language picker on the auth screen; would let the wrapper localise native dialogs.

---

#### Settings

##### `wanillajs.event.settings.logoutButtonTapped`
- **Payload:** —
- **Reuse if:** Settings has a Logout row. Pair with `auth.logoutRequested` (this one is analytics-only; the auth one drives wrapper state).
- **Rename to:** keep as-is.

##### `wanillajs.event.settings.deleteAccountButtonTapped`
- **Payload:** `{ userId }`
- **Trigger:** Triggers iOS native confirmation alert + server-to-server delete.
- **Reuse if:** the app supports account deletion (required by App Store guideline 5.1.1(v)) and you want the confirmation to be a native alert.
- **Rename to:** keep as-is.
- **Skip if:** the app has no accounts (no deletion needed).

##### `wanillajs.event.settings.privacyPolicyButtonTapped` / `termsAndConditionsButtonTapped`
- **Payload:** —
- **Reuse if:** Settings links to legal documents and you want analytics on their open rate. Optional — web can also just render them in a webview.
- **Rename to:** keep as-is.

##### `wanillajs.event.settings.languageChanged`
- **Status:** **Not wired in current wrapper — do not emit.** Use `game.languageChanged` or `leaderboard.languageChanged` for now.
- **Payload (historical):** `{ language }`

##### `wanillajs.event.settings.completeRegistrationTapped`
- **Status:** **Not wired in current wrapper — do not emit.**
- **Payload (historical):** —
- **Original intent:** User taps a "finish setting up your profile" CTA on a multi-step onboarding resume path.

---

#### Example domain actions (illustrative — rename or delete per app)

> The events below are the source project's actual domain events
> (puzzle / quiz games). They are kept verbatim because the underlying *patterns*
> — discrete units of content, pass/fail outcomes, mode toggles,
> consumable IAP — recur in many apps. Rename every `game.*` /
> `leaderboard.*` string to fit your domain language; do not ship the
> literal names below in a new project.

##### `wanillajs.event.game.startLevelButtonTapped`
- **Payload:** `{ level, difficulty }`
- **Reuse if:** the app has level-, lesson-, chapter-, episode-, or workout-based progression where the user explicitly starts a discrete unit of content.
- **Rename to:** `content.startUnitTapped`, `lesson.startTapped`, `workout.startTapped`, etc.
- **Skip if:** the app is a single continuous surface (feed, chat, dashboard) with no discrete units.

##### `wanillajs.event.game.userCompletedLevel` / `userFailedLevel`
- **Payload:** `{ level, difficulty }`
- **Reuse if:** the app has pass/fail or complete/abandon outcomes on those discrete units. Native side uses these to trigger review prompts, streak push notifications, and analytics funnels.
- **Rename to:** `content.unitCompleted` / `content.unitAbandoned`, `lesson.completed` / `lesson.failed`, etc.
- **Skip if:** there is no notion of completing or failing a unit.

##### `wanillajs.event.game.easyDifficultyButtonSelected` / `mediumDifficultyButtonSelected` / `hardDifficultyButtonSelected`
- **Payload:** —
- **Reuse if:** the app has a fixed small set of mode/difficulty/tier toggles you want tracked as discrete events. Cleaner alternative: a single `<group>.modeSelected` event with `{ mode }` payload.
- **Rename to:** `<group>.modeSelected` with `{ mode: string }` payload — the per-variant events bloat the enum on the Swift side.
- **Skip if:** the app has no mode/difficulty concept.

##### `wanillajs.event.game.probeButtonTapped` / `filterButtonTapped`
- **Status:** **Not wired in current wrapper — do not emit.** Swift has no case for either string. Use `game.useHintButtonTapped` if you only need a hint-consumption signal.
- **Payload (historical):** `{ hintsRemaining, level, difficulty }`
- **Original intent:** Track consumable in-app *tools* (hints, boosts, lookups) for analytics or paywall triggers.

##### `wanillajs.event.game.buyHintsButtonTapped`
- **Payload:** —
- **Reuse if:** the app sells consumable in-app items (hints, credits, tokens, energy, coins, AI tokens) via StoreKit and needs iOS to present the purchase sheet.
- **Rename to:** `store.buyConsumableTapped` with `{ sku }` payload.
- **Skip if:** the app uses only subscriptions (covered by `paywall.*`) or has no IAP at all.

##### `wanillajs.event.game.languageChanged`
- **Payload:** `{ language }`
- **Reuse if:** the in-game/in-content surface has its own language picker independent of Settings. Usually redundant — most apps only need `settings.languageChanged`.
- **Rename to:** drop and consolidate on `settings.languageChanged`.
- **Skip if:** language is set in one place only.

---

#### Leaderboard / social

##### `wanillajs.event.leaderboard.languageChanged`
- **Payload:** —
- **Reuse if:** the new app has an analogous social/ranking screen with a language picker.
- **Rename to:** keep as-is.

##### `wanillajs.event.leaderboard.easyDifficultyButtonSelected` / `mediumDifficultyButtonSelected` / `hardDifficultyButtonSelected`
- **Payload:** —
- **Reuse if:** the leaderboard / ranking screen has fixed mode/difficulty filters you want tracked as discrete events. Same caveat as the `game.*DifficultyButtonSelected` trio — a single `<screen>.filterChanged` with `{ filterType, value }` is cleaner.

##### `wanillajs.event.leaderboard.seriesTabSelected`
- **Status:** **Not wired in current wrapper — do not emit.**
- **Payload (historical):** `{ seriesId }`
- **Original intent:** Tab selection on the leaderboard series exhibition view.

##### `wanillajs.event.leaderboard.copyLinkButtonTapped`
- **Payload:** `{ link }`
- **Trigger:** iOS presents `UIActivityViewController` with the supplied URL.
- **Reuse if:** the app has any "copy/share this URL" affordance where you want the iOS share sheet instead of the web `navigator.share` fallback.
- **Rename to:** `share.presentSheet` with `{ link, title? }`.
- **Skip if:** the app never shares URLs, or you exclusively use `share.requestLink` (which mints links natively).

---

#### Paywall / subscriptions

##### `wanillajs.event.paywall.subscribeButtonTapped`
- **Payload:** `{ userId }`
- **Trigger:** iOS launches StoreKit purchase flow.
- **Reuse if:** the app monetises via auto-renewing subscriptions purchased through StoreKit.
- **Rename to:** keep as-is.
- **Skip if:** the app is free, ad-supported only, or uses web-side billing (Stripe/Paddle) exclusively.

##### `wanillajs.event.paywall.closeButtonTapped`
- **Payload:** `{ userId }`
- **Reuse if:** the app has a dismissible paywall and you want native-side analytics on dismissals (essential for paywall A/B tests).
- **Rename to:** keep as-is.
- **Skip if:** no paywall, or paywall is fully web-rendered without iOS instrumentation.

##### Notification trigger: `{ notificationName: "paywall.subscriptions.show" }`
- **Handler:** `window.webkit.messageHandlers.gameEvents` (same handler as `wanillajs.event.*`, but **no `type` key** — dispatched on `notificationName`).
- **Emitted from:** `handleSubscribe` in `src/pages/Game.tsx`, when the user taps Subscribe on the daily-limit paywall.
- **iOS side-effect:** Presents the native StoreKit subscription sheet. This is the actual "show the paywall" trigger; the `wanillajs.event.paywall.subscribeButtonTapped` posted alongside it is analytics-only.
- **Reuse if:** the wrapper owns the StoreKit UI and the web only signals intent.
- **Rename to:** keep as-is (contract with the live wrapper).
- **Skip if:** paywall is fully web-rendered (Stripe/Paddle) with no native sheet.

---

#### Push

##### `wanillajs.event.push.requestPermission`
- **Payload:** `{ reason }`
- **iOS side-effect:** Calls `UNUserNotificationCenter.requestAuthorization`.
- **Reuse if:** the app uses push notifications and prompts contextually (recommended over prompting on launch).
- **Rename to:** keep as-is.
- **Skip if:** no push.

##### `wanillajs.event.push.schedule` / `push.cancel`
- **Payload:** schedule envelope (see below) / `{ id }`
- **iOS side-effect:** Creates or removes a `UNNotificationRequest`.
- **Reuse if:** the app sends *local* (client-scheduled) notifications — daily reminders, streak nudges, limit-reset alerts. Remote APNs push is a separate flow.
- **Rename to:** keep as-is.
- **Skip if:** the app only uses remote push driven server-side.

##### `wanillajs.event.system.openAppSettings`
- **Status:** **Not wired in current wrapper — do not emit.** Swift has no `system.*` cases.
- **Payload (historical):** `{ reason }`
- **Original intent:** Opens iOS Settings → app pane when permissions were denied.

##### `wanillajs.event.navigation.shouldOpenURL`
- **Payload:** `{ url: string, context?: string }`
- **iOS side-effect:** Validates the URL is `https` and calls `UIApplication.shared.open(url)` (Safari).
- **Emitted by:** Terms / Privacy links under the sign-in buttons; any future external link.
- **Full spec:** `docs/ios-bridge/should-open-url.md`


**Schedule envelope:**

```ts
{
  id: "daily.limit.hints",         // 1:1 with UNNotificationRequest identifier
  category: "retention" | "social" | "monetisation",
  title: string,
  body: string,
  fireAt?: number,                  // unix seconds; OR
  delaySeconds?: number,
  deepLink?: string,                // mapped to ios:navigate on tap
  replaces?: boolean,               // default true
}
```

The web owns behavioural state; iOS owns scheduling. All schedule/cancel
calls should go through `src/utils/pushTriggers.ts` so the trigger
registry stays the single source of truth.

---

#### Share

##### `wanillajs.event.share.requestLink`
- **Payload:** see below.
- **iOS side-effect:** Mints a Tapp (or branch.io / similar) link, optionally presents `UIActivityViewController`, always returns via `handleShareLinkFromIOS`.
- **Reuse if:** the app has any referral, invite, or deep-shareable surface (invite-a-friend, share-a-leaderboard, share-a-document) AND uses a native deep-link SDK on iOS.
- **Rename to:** keep as-is — `featureType` already discriminates the use case.
- **Skip if:** the app uses purely web-side share URLs with no native deep-link SDK; use `leaderboard.copyLinkButtonTapped` style instead.

**`share.requestLink` payload:**

```ts
{
  source: string;          // analytics origin, e.g. "settings", "hints_empty_state"
  userID: string;          // auth.uid() of requester (canonical, capital D)
  username: string;        // requester display name (fallback "friend")
  featureType: "referral_credit" | "leaderboard_invite";
  featureValue: string | number;
                           // referral_credit  → hint reward amount (e.g. 50)
                           // leaderboard_invite → leaderboard id
  deeplink?: string;       // web path the link resolves to, e.g. "/join/<code>"
  object: string;          // human-readable label baked into the Tapp link
  presentNativeShareSheet: boolean;
                           // true  → iOS mints AND presents share sheet
                           // false → iOS only returns link; web owns UI
}
```

Adapt `featureType` to the new app's share surfaces (e.g. `document_share`, `playlist_invite`).

---

#### Review prompt

##### `wanillajs.event.review.requestPrompt`
- **Status:** Active.
- **Payload:** `{ reason: string; promptType: string }` — both fields are mandatory.
  - `reason`: free-form tag the native side can log for analytics (e.g. `"firstMajorActionOfSession"`).
  - `promptType`: typed discriminator so the wrapper can route to the correct native prompt UI. For App Store reviews this must be `"appReview"`.
- **Native handler:** call `SKStoreReviewController.requestReview(in: scene)` on the active `UIWindowScene`. Apple silently rate-limits to **3 prompts / 365 days per user** and may decide not to surface the modal at all; the web side must not try to compensate or retry.
- **When to emit:** exactly once per webview session, after the user completes their **first major interaction** — a meaningful, successful action defined per app (e.g. finishing a primary task, completing an onboarding flow, saving their first document). Guard with `sessionStorage` so a cold start re-arms the trigger.
- **When NOT to emit:** on app launch, on passive views (splash / list scrolls), on failed or aborted actions, or repeatedly within a single session.

**Web-side recipe (domain-agnostic):**

```ts
import { requestAppStoreReview } from "@/utils/iosNotifications";

// Call this from the success handler of the first major user action.
const SESSION_FLAG = "reviewPromptFiredThisSession";
try {
  if (!sessionStorage.getItem(SESSION_FLAG)) {
    sessionStorage.setItem(SESSION_FLAG, "1");
    // Small delay so any success animation/toast lands before the modal.
    window.setTimeout(
      () => requestAppStoreReview({ reason: "firstMajorActionOfSession", promptType: "appReview" }),
      1500,
    );
  }
} catch {}
```

**Swift handler stub:**

```swift
import StoreKit

case .reviewRequestPrompt:
    // payload.promptType == "appReview" → App Store review
    // payload.reason is optional — log it if useful, otherwise ignore.
    if let scene = UIApplication.shared.connectedScenes
        .first(where: { $0.activationState == .foregroundActive }) as? UIWindowScene {
        SKStoreReviewController.requestReview(in: scene)
    }
```

The `requestPrompt` event is a **best-effort ask**: Apple's OS-level rate
limit (3 prompts / 365 days) means the native modal may never actually
surface. For a second, web-owned review channel that always shows and can
send the user directly to the App Store review page, use the events below.

##### `wanillajs.event.review.modalShown`
- **Status:** Active.
- **Payload:** `{ launchCount: number }`
- **Emitted when:** the in-app "rate on the App Store" modal mounts on the
  web side (i.e. `launchCount >= threshold` and the first major action of
  the session has just completed — see §3.12).
- **Native handler:** reset the `UserDefaults` launch counter to `0` so the
  next cycle starts fresh. Log `launchCount` for analytics.

##### `wanillajs.event.review.openAppStore`
- **Status:** Active.
- **Payload:** `{ launchCount: number }`
- **Emitted when:** the user taps the modal's primary "Add a review" button.
- **Native handler:** open the App Store review page for this app in Safari
  via `UIApplication.shared.open`:
  ```swift
  case .reviewOpenAppStore:
      let appID = "{{APP_STORE_ID}}" // this app's App Store numeric ID
      if let url = URL(string: "https://apps.apple.com/app/id\(appID)?action=write-review") {
          UIApplication.shared.open(url)
      }
  ```

##### `wanillajs.event.review.modalDismissed`
- **Status:** Active.
- **Payload:** `{ launchCount: number, via: "closeButton" | "backdrop" }`
- **Emitted when:** the user closes the modal without going to the App Store.
- **Native handler:** analytics only.

**Channel selection (mutually exclusive per session):** the web picks
exactly one of the two review channels off the same "first major user
action" moment, based on the iOS-reported launch count:

- `launchCount >= 5` → emit **only** `review.modalShown` (in-app modal).
  `review.requestPrompt` is **not** emitted this session.
- `launchCount < 5` (or unknown) → emit **only** `review.requestPrompt`
  (native SKStoreReview). The in-app modal does not open.

**Web-side flow (domain-agnostic):**

```text
[iOS cold start]        UserDefaults.launchCount += 1
      │
      ▼
[iOS: window.setAppLaunchCount(n)]                              (see §3.12)
      │
      ▼
[first major user action of the session completes]
      │
      ├──► if n >= 5 and !sessionFlag:
      │        open in-app <AppReviewModal />
      │        ├─ onMount ──► review.modalShown  ──► iOS resets counter to 0
      │        ├─ "Add a review" ──► review.openAppStore ──► iOS opens App Store
      │        └─ "Not now" / backdrop ──► review.modalDismissed
      │
      └──► else:
               requestAppStoreReview(...)         (native SKStore prompt)
```

The two channels are **never both** fired in the same session — the
launch-count threshold decides which one runs.


---



#### Account

##### `wanillajs.event.account.deleted`
- **Status:** **Not wired in current wrapper — do not emit.** Swift has no `account.*` case.
- **Payload (historical):** `{ userId, success: true }`
- **Original intent:** Web confirms backend deletion succeeded; iOS then performs full sign-out + state reset.

##### `wanillajs.event.account.deleteError`
- **Status:** **Not wired in current wrapper — do not emit.**
- **Payload (historical):** `{ userId, error }`


---

## 5. Critical contracts & gotchas

### 5.1 Session injection is one-shot

`setBase44Session` is destructive if called naively (it spends a single-use
token, can wipe a working session and — in the reload mechanism — forces a
full page load). The defensive idempotency in §3.1 is what
keeps things safe — but the wrapper still **must not** call it on
foreground, deep link, or notification tap. Foreground refresh is the web's
job (§3.10).

### 5.2 Token shape validation

Before touching storage or spending the token, validate:

- `ott.split('.').length === 3` (current embed tokens are JWT-shaped)
- `ott.length > 0` and `typeof ott === 'string'`
- if `expectedEmail` is given, it looks like an email

Reject with phase `rejected_invalid_token`. This is the real defense against
accidentally injecting an Apple `authorizationCode` or identity token, or the
whole `embed_url`, in place of the one-time token.

### 5.3 Logout 3-second guard

`sessionStorage.logoutRequestedAt = Date.now()` set during logout. Any
`setBase44Session` call within 3s of that timestamp must be dropped to
swallow the wrapper's automatic post-relaunch re-injection. **Use a
timestamp, not a binary flag** — binary flags silently kill the next
legitimate sign-in.

### 5.4 Bridge readiness retry pattern

iOS may try to call a `window.*` global before the web has installed it
(cold start race). The Swift side wraps non-critical calls in a retry:

```swift
let script = """
(function() {
    if (typeof window.setPushPermissionStatus === 'function') {
        window.setPushPermissionStatus(\(json));
    } else {
        setTimeout(function() {
            if (typeof window.setPushPermissionStatus === 'function') {
                window.setPushPermissionStatus(\(json));
            }
        }, 500);
    }
})();
"""
```

For critical calls (`setBase44Session`), use an `iosReady` handshake:

```ts
// On the web, after all globals are installed:
(window as any).iosReady = true;
((window as any).iosReadyCallbacks ?? []).forEach(cb => cb());
(window as any).iosReadyCallbacks = [];
```

```swift
// On iOS, before calling a critical global:
evaluateJavaScript("""
(function() {
    if (window.iosReady) { /* call directly */ }
    else { (window.iosReadyCallbacks ??= []).push(function() { /* call now */ }); }
})();
""")
```

### 5.5 Deep-link path queue

`window.__pendingIOSPath` is the rendezvous slot for paths queued before
`IOSNavigationBridge` mounts. iOS Swift helper falls back to it; the bridge
drains it on mount. Always set it back to `null` after consuming.

### 5.6 Browser-preview bypass

`?preview=1` flips `localStorage.previewBypass` so the web acts as if it's
inside the wrapper (useful for the Base44 preview, Playwright tests). Without
this, browser visitors see the App Store landing page.

### 5.7 `appStarted` dispatched exactly once

Module-level `appStartedDispatched` + `sessionStorage.appStartedSent`
together. The two guards exist because logged-out cold start mounts
`AppContent` twice (initial mount, then redirect-to-`/auth` remount) and
naive single-flag would fire twice.

### 5.8 WKWebView cannot serialize Promises

`evaluateJavaScript` returns `nil` for async functions. If iOS needs an
immediate ack, wrap the async function and return a synchronous JSON string
synchronously, then deliver the real result via an event:

```ts
const setBase44SessionBridge = (ott, expectedEmail?): string => {
  const attemptId = createSetSessionAttemptId();
  void setBase44Session(ott, expectedEmail, { attemptId });
  return JSON.stringify({ accepted: true, attemptId });
};
(window as any).setBase44Session = setBase44SessionBridge;
(window as any).setSupabaseSession = setBase44SessionBridge;  // alias for wrapper builds that still call the old name
```

iOS reads `accepted: true` immediately; subscribes to
`wanillajs.event.auth.setSessionDiag` for the real outcome.

### 5.9 `postMessage` is forgeable

The `subscriptionStatusChanged` listener treats iOS's message as a *hint*
only and re-confirms against the database. Never grant entitlement based
on a `postMessage` alone.

### 5.10 SPA navigation, not full reload

`navigateFromIOS` MUST use React Router (`navigate(path)`) — full document
reloads remount the tree, re-emit `appStarted`, refetch every page,
and create visible flicker.

---

## 6. iOS-side reference (Swift)

### 6.1 Outbound: iOS → Web

```swift
func updateShareLink(shareLink: String) {
    evaluateJavaScript("window.updateShareLink('\(shareLink)')")
}

func setWebAppSession(ott: String, email: String) {
    let script = "window.setBase44Session('\(ott)', '\(email)');"
    evaluateJavaScript(script, completionHandler: nil)
}

func showLoadingOverlay()  { evaluateJavaScript("window.showLoadingOverlay()") }
func hideLoadingOverlay()  { evaluateJavaScript("window.hideLoadingOverlay()") }
func showJSLoginScreen()   { evaluateJavaScript("window.showLoginScreen()") }

func injectDeviceRegistered(_ registered: Bool) {
    let payload: [String: Any] = ["registered": registered]
    let json = jsonString(payload)
    let script = """
    (function() {
        if (typeof window.setRemotePushDeviceRegistered === 'function') {
            window.setRemotePushDeviceRegistered(\(json));
        } else {
            setTimeout(function() {
                if (typeof window.setRemotePushDeviceRegistered === 'function') {
                    window.setRemotePushDeviceRegistered(\(json));
                }
            }, 500);
        }
    })();
    """
    evaluateJavaScript(script)
}

func sendPushNotificationPermission(result: WanillaUNNotificationPermissionRequestResult) {
    let payload: [String: Any] = [
        "status": result.status.rawValue,
        "source": result.origin.rawValue,
    ]
    let json = jsonString(payload)
    let script = """
    (function() {
        if (typeof window.setPushPermissionStatus === 'function') {
            window.setPushPermissionStatus(\(json));
        } else {
            setTimeout(function() {
                if (typeof window.setPushPermissionStatus === 'function') {
                    window.setPushPermissionStatus(\(json));
                }
            }, 500);
        }
    })();
    """
    evaluateJavaScript(script)
}

func sendShareLinkToWebView(url: URL, userID: String, username: String?, source: String) {
    let payload: [String: Any] = [
        "shareLink": url.absoluteString,
        "userID": userID,
        "username": username as Any,
        "source": source,
    ]
    let json = jsonString(payload)
    evaluateJavaScript("window.handleShareLinkFromIOS(\(json));")
}

func handleTappGenerateURLError() {
    evaluateJavaScript("window.handleShareLinkErrorFromIOS('Failed to generate link');")
}

func notifySubscriptionStatusChanged(isSubscribed: Bool,
                                     productId: String? = nil,
                                     expirationDate: String? = nil) {
    var status: [String: Any] = ["isSubscribed": isSubscribed]
    if let productId = productId { status["productId"] = productId }
    if let expirationDate = expirationDate { status["expirationDate"] = expirationDate }
    let message: [String: Any] = ["type": "subscriptionStatusChanged", "status": status]
    let script = "window.postMessage(\(jsonString(message)), '*');"
    evaluateJavaScript(script)
}

func navigateFromIOS(path: String?) {
    guard let path, !path.isEmpty else { return }
    let escaped = path.replacingOccurrences(of: "'", with: "\\'")
    let script = """
    (function() {
        if (typeof window.navigateFromIOS === 'function') {
            window.navigateFromIOS('\(escaped)');
        } else {
            window.__pendingIOSPath = '\(escaped)';
        }
    })();
    """
    evaluateJavaScript(script)
}

func iOSForegrounded() {
    evaluateJavaScript("window.dispatchEvent(new Event('ios:foregrounded'))")
}
```

### 6.2 Inbound: Web → iOS

The web posts `{type, payload}` to `webkit.messageHandlers.wanillajs` (legacy alias: `gameEvents`).
iOS decodes `type` into a `JavascriptAppEvent` enum case and dispatches:

```swift
// Each `case` is annotated with the same Reuse / Rename / Skip guidance as
// the web event catalogue in §4.1 — use it to decide which cases to keep,
// rename, or drop when porting this enum to a new app.

func handle(gameEvent: JavascriptAppEvent?,
            controller: WKUserContentController,
            hapticManager: HapticManagerProtocol) {
    // Namespace the enum per project, e.g. `JavascriptAppEvents.{{APP_NAME}}.AppEvent`.
    guard let appEvent = gameEvent as? JavascriptAppEvents.{{APP_NAME}}.AppEvent else { return }

    switch appEvent {

    // ─── Lifecycle ──────────────────────────────────────────────────────
    // Reuse: always. Every iOS-wrapped SPA needs these.
    case .appStarted:
        guard didLaunch() else { return }
        notifySubscriptionUpdate(webview: webView)
        requestNotificationPermission(origin: .appStart, webView: webView)
    case .haptic(let h):  hapticManager.fire(haptic: h)   // Skip if no tactile UI surfaces
    case .screenView:     break                            // Skip if no native analytics

    // ─── App Store review prompt ────────────────────────────────────────
    // Reuse: always. Web fires once per session after the first major
    // successful user action; Apple rate-limits to 3 prompts / 365 days.
    case .reviewRequestPrompt:
        if let scene = UIApplication.shared.connectedScenes
            .first(where: { $0.activationState == .foregroundActive }) as? UIWindowScene {
            SKStoreReviewController.requestReview(in: scene)
        }

    // ─── Auth ───────────────────────────────────────────────────────────
    // Reuse: whenever the app has authentication via the wrapper.
    // Skip entirely if auth is web-only with no native provider.
    case .authUserDidSignUp(let d):   handleAuthUserDidSignUp(userDidAuthData: d)
    case .authUserDidSignIn(let d):   handleAuthUserDidSignIn(userDidAuthData: d)
    case .appleAuthButtonTapped:      performAppleAuthentication()
                                      // Rename to .googleAuthButtonTapped etc. for other providers
    case .authError:                  break

    // ─── Example domain actions (rename or delete per app) ─────────────
    // These are no-op pass-throughs to analytics. Rename the enum cases to
    // match the new app's domain language:
    //
    //   .gameStartLevelButtonTapped        → .contentStartUnitTapped
    //                                        Reuse if the app has discrete
    //                                        levels/lessons/chapters/workouts.
    //                                        Skip for single-surface apps.
    //
    //   .gameUserCompletedLevel /          → .contentUnitCompleted /
    //   .gameUserFailedLevel                 .contentUnitAbandoned
    //                                        Reuse when units have pass/fail
    //                                        outcomes; native uses these for
    //                                        review prompts + streak push.
    //
    //   .gameUseHintButtonTapped           → .toolsConsumableUsed
    //                                        Reuse if app has consumable tools
    //                                        (hints, boosts, AI lookups).
    //
    //   .gameBuyHintsButtonTapped          → .storeBuyConsumableTapped
    //                                        Reuse if app sells consumable IAP
    //                                        via StoreKit. Skip if subs-only.
    //
    //   .game*DifficultyButtonSelected     → collapse into .modeSelected(mode)
    //                                        Reuse if app has mode/tier toggles.
    //                                        Skip if no mode concept.
    //
    //   .gameLanguageChanged               → drop; consolidate on
    //                                        .settingsLanguageChanged.
    //
    //   .leaderboard*                      → Reuse only if the app has an
    //                                        analogous social/ranking screen.
    case .gameUseHintButtonTapped(_),
         .gameStartLevelButtonTapped(_),
         .gameUserCompletedLevel(_),
         .gameUserFailedLevel(_),
         .gameBuyHintsButtonTapped,
         .gameLanguageChanged,
         .gameEasyDifficultyButtonSelected,
         .gameMediumDifficultyButtonSelected,
         .gameHardDifficultyButtonSelected,
         .leaderboardLanguageChanged,
         .leaderboardEasyDifficultyButtonSelected,
         .leaderboardMediumDifficultyButtonSelected,
         .leaderboardHardDifficultyButtonSelected,
         .settingsPrivacyPolicyButtonTapped,   // Optional; analytics-only
         .settingsTermsAndConditionsButtonTapped,
         .paywallSubscribeButtonTapped,        // Reuse if StoreKit subs; skip if Stripe/Paddle or free
         .paywallCloseButtonTapped:            // Reuse if any dismissible paywall
        break

    // ─── Share sheet for a pre-minted URL ───────────────────────────────
    // Rename to .sharePresentSheet(link:title:) for clarity.
    // Reuse if the app ever shares URLs and prefers the native share sheet
    // over navigator.share. Skip if you only use .shareLinkRequest below.
    case .leaderboardCopyLinkButtonTapped(let s):
        presentLinkActionSheet(link: s.link)

    // ─── Account deletion ───────────────────────────────────────────────
    // Reuse if the app supports account deletion (required for App Store
    // 5.1.1(v) when accounts exist). Skip only for account-less apps.
    case .deleteUserButtonTapped(let d):
        deleteUserButtonTapped(userID: d.userID)

    // Reuse whenever the wrapper holds native auth state (Apple keychain,
    // Google token) that must be invalidated on user-initiated logout.
    case .settingsLogoutButtonTapped:
        handleLogout()

    // ─── Push ───────────────────────────────────────────────────────────
    // Reuse if the app uses push at all. The schedule/cancel pair is for
    // *local* notifications (streak nudges, daily reminders). Skip if the
    // app uses only server-driven remote APNs push.
    case .requestNotificationPermission:
        requestNotificationPermission(origin: .promptResult, webView: webView)
    case .scheduleLocalNotification(let p):
        let payload = WanillaClientScheduleLocalPushNotificationPayload(
            id: p.id, category: p.category, title: p.title, body: p.body,
            fireAt: p.fireAt, delaySeconds: p.delaySeconds,
            deepLink: p.deepLink, replaces: p.replaces)
        wanillaMediaDependencies.unNotificationsHandler.scheduleLocalNotification(payload)
    case .canceLocalNotification(let p):
        wanillaMediaDependencies.unNotificationsHandler.cancelLocalNotification(id: p.id)

    // ─── Native deep-link mint + share ──────────────────────────────────
    // Reuse if the app has invite/referral/shareable surfaces AND uses a
    // native deep-link SDK (Tapp, branch.io, AppsFlyer). Skip if links are
    // generated purely on the web side — use .leaderboardCopyLinkButtonTapped
    // pattern instead.
    case .shareLinkRequest(let p):
        handleShareLinkRequest(p, userContentController: controller, webView: webView)
    }
}
```


---

## 7. Bootstrap checklist

Create these files in a new Base44 project, in this order:

```text
src/
├── main.tsx                              # side-effect imports + bridge init
├── App.tsx                               # mount GlobalLoadingOverlay + IOSNavigationBridge
├── hooks/
│   ├── use-ios-wrapper.tsx               # §2
│   ├── use-auth-ready.ts                 # exposes { user, isReady, authEpoch } from authStore
│   └── use-auth-epoch.ts                 # subscribes to appLifecycle authEpoch
├── components/
│   ├── IOSNavigationBridge.tsx           # §3.5
│   └── GlobalLoadingOverlay.tsx          # §3.4
└── utils/
    ├── iosNotifications.ts               # sendIOSEvent, setBase44Session,
    │                                     # forceLogoutFromIOS, showLoginScreen,
    │                                     # requestShareLink, navigateFromIOS helper,
    │                                     # deleteUserAccount, handleAppleIdentityToken
    │                                     # (Google uses wanillajs.event.auth.googleSignInRequested)
    ├── authStore.ts                      # { user, ready }, auth:changed events, scrubBase44TokenKeys
    ├── iosShareLinkBridge.ts             # §3.6 — installs handleShareLinkFromIOS globals
    ├── iosDeepLink.ts                    # rememberIOSDeepLinkPath / consumeIOSDeepLinkPath
    ├── pushPermission.ts                 # §3.8/3.9 + opt-in policy state
    ├── pushTriggers.ts                   # §4 push.schedule/cancel helpers
    ├── remotePush.ts                     # enqueue cross-device APNs via enqueue-push function
    ├── subscriptionHandler.ts            # §3.11
    └── appLifecycle.ts                   # §3.10
```

### `src/main.tsx`

```ts
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// CRITICAL: side-effect imports that install window.* globals
import "./utils/iosNotifications";       // setBase44Session, showLoginScreen, forceLogoutFromIOS
import "./utils/iosShareLinkBridge";     // handleShareLinkFromIOS, handleShareLinkErrorFromIOS

import { initializePushPermissionBridge } from "./utils/pushPermission";
initializePushPermissionBridge();        // setPushPermissionStatus, setRemotePushDeviceRegistered

createRoot(document.getElementById("root")!).render(<App />);
```

### `src/App.tsx`

```tsx
const AppContent = () => {
  const isIOSWrapper = useIsIOSWrapper();
  const { isReady } = useAuthReady();

  useEffect(() => {
    initializeSubscriptionListener();    // postMessage + entity reconcile
    initAppLifecycle();                  // ios:foregrounded + visibilitychange
  }, []);

  // Fire appStarted exactly once, after auth hydrated
  useEffect(() => {
    if (!isReady || appStartedDispatched) return;
    const sent = sessionStorage.getItem('appStartedSent') === '1';
    appStartedDispatched = true;
    sessionStorage.setItem('appStartedSent', '1');
    if (!sent) sendIOSEvent('wanillajs.event.appStarted');
  }, [isReady]);

  if (isIOSWrapper === null) return <LoadingSpinner />;
  if (!isIOSWrapper) return <AppStoreLanding />;

  return (
    <BrowserRouter>
      <IOSNavigationBridge />
      <Routes>…</Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <GlobalLoadingOverlay />
      <AppContent />
    </TooltipProvider>
  </QueryClientProvider>
);
```

### iOS wrapper checklist

- [ ] Register the `wanillajs` message handler (and optionally `dataEvents`,
      plus the legacy `gameEvents` alias if older web builds need it) on
      `WKUserContentController` at WKWebView creation. The handler name
      must match exactly what `sendIOSEvent` posts to, or messages are
      silently dropped.
- [ ] Wire `UIApplication.willEnterForegroundNotification` to dispatch
      `ios:foregrounded` (§3.10).
- [ ] Implement the 13 outbound functions in §6.1.
- [ ] Implement the inbound switch in §6.2.
- [ ] On notification tap, call `navigateFromIOS(path:)` only — never
      include auth tokens in a notification payload.
- [ ] Call `setBase44Session` **exactly once** per fresh native sign-in (Apple or Google), and otherwise only in response to `auth.sessionRequested`.

---

## 8. Backend collaboration (Vapor + Base44)

> The iOS wrapper does **not** talk to Base44 directly. All trust-sensitive
> operations (turn a native identity token into a Base44 session, record a
> StoreKit purchase, fan out remote push, delete a user) flow through a
> **Vapor backend** that holds the shared secrets. The web app and Base44
> backend functions sit on either side of that backend. This section documents
> every contract between the three parties. The Supabase → Base44 translation
> table lives in `docs/ios-bridge/base44-backend-mapping.md`; read it first.

### 8.0 Source-of-truth split (read this first)

The two backends are **not interchangeable** and **must not duplicate state**.
Confusing them produces silent identity drift (two users for the same human),
auth bypasses, and impossible-to-reconcile subscription records.

| Concern | Source of truth | Lives in | Why |
|---|---|---|---|
| **User identity** (who this human is) | **Vapor** | Vapor's `users` table, keyed by `apple_user_id` or `google_user_id`, storing the Base44 **email** and `base44_user_id` | Vapor is the only party that sees the raw Apple / Google identity token and can verify it against the provider's JWKS. It owns the binding between the provider's stable `sub` and the Base44 account (which is keyed by email). |
| **APNs device tokens** | **Vapor** | Vapor's `devices` table | The APNs `.p8` auth key lives on Vapor. Device tokens must never leak to the web or to Base44. |
| **StoreKit receipts / entitlement validity** | **Vapor** | Vapor's subscription verifier | App Store Server Notifications V2 are signed JWS; only Vapor verifies them. Base44 stores the *projection*. |
| **App-user access + session minting** | **Base44** (Apps API) | app users, embed sign-in tokens | Only the Base44 platform can mint a token that `base44.auth` accepts. Vapor asks for one with its workspace API key. |
| **Profile, gameplay, social, referrals, push outbox** | **Base44** | entities (`User` custom fields, `UserStats`, `Board`, `PushOutbox`, …) | "App data" — read/written by the SPA under entity RLS, and by backend functions with the service role. Vapor never touches entities. |
| **Subscription entitlement projection** | **Base44** (`UserSubscription`) | written by Vapor via `update-subscription` | Web reads this for paywall gating. Vapor is the *writer*; Base44 is the *reader of record* for app code. |
| **`isSubscribed` flag in `localStorage`** | **Neither — a UX cache** | Browser `localStorage` | Populated by the `postMessage` fast-path. Never trust it server-side. |

#### Direction of writes (one-way arrows, never the other way)

```text
Apple / Google id token ──► Vapor ────► Base44 Apps API (provision + embed token) ──► web redeems
StoreKit receipt        ──► Vapor ────► UserSubscription        (update-subscription function)
Delete confirmation     ──► Vapor ────► delete-user-data fn + Apps API deprovision
PushOutbox record       ──► send-push ────► Vapor APNs relay   (scheduled automation)
```

- **The SPA never writes profile / entitlement / reward fields** — backend functions do, with the service role.
- **Vapor never reads entities.** It holds `BASE44_WORKSPACE_API_KEY` (Apps API) and `APPLE_WEBHOOK_API_KEY` (to call the three server-to-server functions), nothing else.
- **The web never calls Vapor directly.** All web → Vapor communication is brokered through the iOS wrapper or through a backend function (`send-push`). `VAPOR_PUSH_API_KEY` never enters the browser bundle.

### 8.1 Topology at a glance

```text
┌──────────────────┐   Apple / Google identity token / receipt / push request
│  iOS wrapper     │ ─────────────────────────────────────────────────────┐
│  (Swift, APNs    │                                                      │
│   device)        │ ◄───── ott + email / subscription / silent           │
└────────┬─────────┘                                                      │
          │ webkit.messageHandlers                                         │
          │ setBase44Session / postMessage                                 ▼
          ▼                                                   ┌────────────────────────┐
┌──────────────────┐                                          │  Vapor backend         │
│  Web app (SPA)   │ ── enqueue-push (functions.invoke) ──┐    │  • verifies Apple /    │
│  inside WKWebView│                                      │    │    Google JWT          │
└──────────────────┘                                      │    │  • Apps API: provision │
                                                          ▼    │    + embed-token       │
                            ┌────────────────────────────────┐ │  • validates StoreKit  │
                            │  Base44 backend functions      │ │  • holds APNs auth key │
                            │  • ensure-profile (user)       │ │  • registers APNs      │
                            │  • update-subscription  ◄──────┼─┤    tokens              │
                            │  • delete-user-data     ◄──────┼─┤                        │
                            │  • referral-credit      ◄──────┼─┘                        │
                            │  • enqueue-push (user)         │   ▲                      │
                            │  • send-push (scheduled) ──────┼───┘ X-WLAPNS             │
                            └────────────────────────────────┘                          │
                                      Base44 Apps API ◄── api_key (workspace) ──────────┘
```

Shared secrets — **never reuse one for the other**:

| Secret | Held by | Direction | Purpose |
|---|---|---|---|
| `BASE44_WORKSPACE_API_KEY` | Vapor | Vapor → Base44 Apps API, header `api_key` | Provision app users, mint embed sign-in tokens, deprovision users. Needs the *Provision app users* + *Mint embed sign-in tokens* permissions. |
| `APPLE_WEBHOOK_API_KEY` | Vapor + Base44 secrets | Vapor → backend functions, header `x-api-key` | Authenticates Vapor when calling `update-subscription`, `delete-user-data`, `referral-credit` |
| `VAPOR_PUSH_API_KEY` | Base44 secrets + Vapor | `send-push` → Vapor, header `X-WLAPNS` | Authenticates the drainer when posting to Vapor's APNs relay |
| `VAPOR_BASE_URL` | Base44 secrets | `send-push` → Vapor | Base URL of the Vapor service (no trailing slash assumed) |
| `INTERNAL_FUNCTION_KEY` | Base44 secrets | function → function, header `x-internal-key` | `enqueue-push` → `send-push` fire-and-forget |

### 8.2 Authentication flow (native sign-in via Vapor + Apps API)

Apple Sign In does **not** use Base44's built-in Apple OAuth provider (that is a
web-redirect flow). Instead the iOS wrapper performs Apple Sign In natively,
hands the identity token to Vapor, Vapor verifies it against Apple's JWKS,
provisions the user on Base44 and mints a single-use embed sign-in token. The
web app receives that token via `window.setBase44Session(ott, email)`.

```text
┌─────────┐                ┌───────┐                  ┌────────────────────┐                ┌──────────┐
│  User   │ tap "Sign In"  │  iOS  │ Apple identity   │  Vapor             │ api_key +      │ Base44   │
│         │ ─────────────► │       │   token          │  • verifies JWT    │ { email, role }│ Apps API │
│         │                │       │ ───────────────► │    with Apple JWKS │ ─────────────► │ provision│
│         │                │       │                  │  • users[sub]⇐email│ { email,       │ + embed- │
│         │                │       │                  │                    │   surface }    │ token    │
│         │                │       │                  │                    │ ◄───────────── │          │
│         │                │       │ { ott, email }   │                    │ {token,expires}│          │
│         │                │       │ ◄─────────────── │                    │                │          │
│         │                │       │ evaluateJavaScript("window.setBase44Session(ott, email)")        │
│         │                │       │ ─────────────────────────────────────────────┐                   │
│         │                │       │                                              ▼                   │
│         │                │       │                                   ┌──────────────────┐           │
│         │                │       │                                   │ Web redeems ott  │           │
│         │                │       │                                   │ → base44.auth.me │           │
└─────────┘                └───────┘                                   └──────────────────┘           │
```

#### 8.2.1 Vapor → Base44 Apps API (per sign-in)

**Step 1 — provision (idempotent).** `POST https://app.base44.com/api/apps/{{BASE44_APP_ID}}/users/provisions`
Header `api_key: <BASE44_WORKSPACE_API_KEY>`. Body:

```json
{ "email": "user@privaterelay.appleid.com", "role": "user", "full_name": "Jane Doe" }
```

Response `200 { "status": "created" | "exists", "email": "...", "role": "user" }`.
`full_name` is only available on the very first Apple sign-in — send it when
you have it, omit otherwise. `role` must be one of the app's roles (400
`invalid_role` otherwise).

**Step 2 — mint the sign-in token.** `POST https://app.base44.com/api/apps/{{BASE44_APP_ID}}/embed-tokens`
(renamed to `/embed-url` in a change dated 2026-10-06; request and response are
unchanged — pin whichever path returns 200 in your workspace). Same header. Body:

```json
{ "email": "user@privaterelay.appleid.com", "surface": "live_site" }
```

Response `200 { "token": "<ott>", "expires_in": 60, "embed_url": "https://{{BASE44_APP_DOMAIN}}/?ott=<ott>" }`.

The token is **single-use** and expires in **60 s**. Mint it as the last step
before replying to iOS; never store or log it.

**Critical implementation notes (carry these forward verbatim):**

1. **Key Vapor's users by the provider `sub`** (`apple_user_id` /
   `google_user_id`), not by email. Apple private-relay emails are stable per
   Apple ID + app, but the provider id is the identity. Store the Base44 email
   next to it; if a returning user's email ever differs, keep using the stored
   one for the Apps API call (that is their Base44 identity).
2. **Learn the Base44 `User.id` from the web.** The Apps API answers with the
   email only. The web emits `wanillajs.event.auth.userDidSignIn { userId,
   email, authMethod }` after its first successful `auth.me()`; the wrapper
   forwards `userId` to Vapor (`/v1/users/link`), which stores it as
   `base44_user_id`. Every later Vapor → function call (`update-subscription`,
   `referral-credit`, `delete-user-data`) uses that id.
3. **Rate limits.** Provision/deprovision share 120 req/min per app; embed
   tokens 300 req/min. Fine for sign-ins; do not mint on every foreground.
4. **Both endpoints are beta.** Vapor wraps them behind one internal
   `mintSession(providerSub)` function so a path or field change is a
   one-file fix.

#### 8.2.2 Vapor → iOS response (the Swift contract)

```json
{
  "success": true,
  "user":    { "email": "user@privaterelay.appleid.com", "base44_user_id": "…or null on first sign-in…" },
  "auth":    { "ott": "eyJ…", "embed_url": "https://{{BASE44_APP_DOMAIN}}/?ott=eyJ…", "expires_in": 60 },
  "is_new_user": false
}
```

`user.email`, `auth.ott` and `auth.embed_url` are non-optional strings; the
Swift decoder treats anything else as "wrong response format".

**iOS-side handoff after success:**

```swift
let response = try await vapor.appleAuthExchange(identityToken: token)   // or googleAuthExchange
let js = "window.setBase44Session('\(response.auth.ott)', '\(response.user.email)')"
webView.evaluateJavaScript(js)   // exactly once — see docs/ios-bridge/session-injection-contract.md
```

Google Sign In follows the same architecture: the web emits
`wanillajs.event.auth.googleSignInRequested { mode }`, iOS runs `GIDSignIn`,
forwards the Google identity token to Vapor, Vapor verifies it against
Google's public keys and runs the same two Apps API calls.

#### 8.2.3 Silent re-mint on cold start (only if needed)

If verification (`base44-backend-mapping.md` §3) shows the redeemed session does
not persist across WKWebView cold starts, the web will emit
`wanillajs.event.auth.sessionRequested { reason: "foreground_session_lost" |
"protected_path_deep_link", path }`. The wrapper then calls Vapor
`POST /v1/session/refresh` (authenticated with the device's stored Vapor
session, **no Apple sheet**), gets a fresh `{ ott, email }`, and calls
`setBase44Session` once. If the wrapper has no stored Vapor session, it runs
the full native sign-in instead.

### 8.3 Subscription updates (StoreKit → Vapor → Base44)

StoreKit purchase and renewal events fire on iOS. Vapor receives App Store
server notifications (or iOS reports the local transaction), validates the
receipt, then upserts the canonical `UserSubscription` record through a backend
function.

There are **two independent paths** for telling the web that a user is subscribed:

1. **Authoritative (server):** Vapor → `update-subscription` → `UserSubscription`. Survives reinstall, multi-device, refunds.
2. **Fast (client):** iOS → `window.postMessage({ type: 'subscriptionStatusChanged', status })` → web `localStorage.isSubscribed`. Instantaneous, no round-trip.

#### 8.3.1 Function: `POST https://{{BASE44_APP_DOMAIN}}/functions/update-subscription`

**Caller:** Vapor backend (every renewal, cancellation, refund, grace period change).
**Auth:** `x-api-key: <APPLE_WEBHOOK_API_KEY>` (constant-time compare against `secrets.get(...)`). No user context — use `asServiceRole`.

**Request body:**

```json
{
  "user_id": "<Base44 User.id>",
  "product_id": "{{SUBSCRIPTION_PRODUCT_ID}}",
  "purchase_date": 1716998400,
  "expiration_date": 1719676800,
  "original_transaction_id": "100000123456789",
  "consumed_product_discount_id": null
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `user_id` | string | yes | Base44 `User.id` (learned via `userDidSignIn`, §8.2.1 note 2) |
| `expiration_date` | integer (unix seconds) | **yes** | The gating field; everything else is metadata |
| `product_id` | string \| null | no | StoreKit product identifier |
| `purchase_date` | integer (unix seconds) \| null | no | Original purchase moment |
| `original_transaction_id` | string \| null | no | StoreKit `originalTransactionId` — needed for refund correlation |
| `consumed_product_discount_id` | string \| null | no | Promo/offer correlation |

**Response 200:** `{ "success": true, "subscription": { /* the upserted record */ } }`
**Errors:** 401 (bad key), 400 (invalid body), 404 (user not found), 500 (write failure).

**Upsert key:** `user_id` — `filter({ user_id })`, then `update` the existing record or `create`; if the re-filter finds two, delete the newer one (no unique index on Base44). One record per user; renewals overwrite.

**Entity:** see `docs/ios-bridge/subscription-bridge-prompt.md` (`UserSubscription`, read-own-record RLS, no client writes).

#### 8.3.2 The `postMessage` fast-path contract

Unchanged from the Supabase set — iOS dispatches on the SPA's `window`:

```ts
window.postMessage({
  type: 'subscriptionStatusChanged',
  status: { isSubscribed: true, productId: '{{SUBSCRIPTION_PRODUCT_ID}}', expirationDate: '2026-07-29T12:00:00.000Z' }
}, '*');
```

The web applies the hint immediately, then reconciles against `UserSubscription`
(read directly under RLS, or via a `get-subscription` function). Reconcile may
upgrade; it downgrades only when it observed a signed-in user **and** an expired
record — "no session" / "no record yet" are *unknown*.

> **Security note:** `postMessage` is forgeable from any web context. The
> fast-path is a UX optimisation, never an authorisation source.

#### 8.3.3 Ad-watched signal (legacy, optional)

`window.postMessage({ type: 'adWatchCompleted' }, '*');` — remove if the new app is subscription-only.

### 8.4 Account deletion (web → iOS → Vapor → Base44)

App Store guideline 5.1.1(v) requires in-app account deletion. Flow:

```text
Web ── settings.deleteAccountButtonTapped ──► iOS native alert ──► Vapor
   Vapor ──► POST /functions/delete-user-data  { user_id }      (x-api-key)   → deletes entity records
   Vapor ──► Apps API deprovision { email }                     (api_key)     → removes the app user
   Vapor ──► deletes its own users + devices rows
iOS ──► window.hideLoadingOverlay(); window.showLoginScreen(); appleCredentialStore.clear()
Web ──► forceLogoutFromIOS('accountDeleted') → scrub storage → /auth
```

Full contract, deletion order template and checklist: `docs/ios-bridge/delete-user-prompt.md`.
404 from `delete-user-data` means "already gone" — Vapor treats it as success after logging.
See §5.3 for the 3-second logout guard the web uses to ignore stale session injections during this window.

### 8.5 Remote push notifications (web → Base44 → Vapor → APNs)

Local notifications are scheduled directly on iOS (§4.1 `push.schedule`).
**Remote** pushes — social events one user triggers for another — flow through
Base44 so the web never holds the APNs key and Vapor never reads entities:

```text
Web ─► functions.invoke("enqueue-push") ─► PushOutbox (pending)
                                            │  scheduled automation (1 min) + fire-and-forget
                                         send-push ─► POST {VAPOR_BASE_URL}/api/v1/users/apns/external  (X-WLAPNS)
                                                                  │
                                                              APNs ─► device
```

The complete contract — entity schema, zod bounds, authorisation matrix
(social triggers via a "may caller push recipient?" predicate; `subscription.lapsed`
and `referral.successful` are server-only), claim-without-locks protocol, the
Vapor endpoint shape, and the retry ladder **60s → 5m → 30m → 2h → 12h**
(`MAX_ATTEMPTS = 5`, `BATCH_SIZE = 25`, "User not found" retried once at +60s) —
is in `docs/ios-bridge/remote-push-pipeline-prompt.md`. The Vapor-facing
contract is byte-for-byte the same as in the Supabase set.

#### 8.5.1 Vapor responsibilities (device registration side)

1. Expose `POST /v1/users/apns/add` that the iOS wrapper calls during launch with the APNs device token bound to the Vapor user (and, once known, the Base44 `User.id`). This is what makes "User not found" temporary.
2. Maintain the device → user mapping, drop stale tokens on APNs 410.
3. Hold the APNs `.p8` auth key + key id + team id. None of this ever touches Base44 or the web.
4. Implement `POST /api/v1/users/apns/external` accepting `recipient_user_id` = Base44 `User.id`, returning `200 { success:true, devices_notified:<n> }` or `404 { reason: "User not found …" }`.

### 8.6 Required secrets (recap)

| Secret | Where | Used by |
|---|---|---|
| `BASE44_WORKSPACE_API_KEY`, `BASE44_APP_ID` | Vapor | Apps API: provision, embed-token, deprovision |
| `APPLE_WEBHOOK_API_KEY` | Vapor **and** Base44 secrets | `update-subscription`, `delete-user-data`, `referral-credit` |
| `VAPOR_BASE_URL`, `VAPOR_PUSH_API_KEY` | Base44 secrets, Vapor | `send-push` → Vapor (`X-WLAPNS`) |
| `INTERNAL_FUNCTION_KEY` | Base44 secrets | `enqueue-push` → `send-push` |

> Rotate `APPLE_WEBHOOK_API_KEY`, `VAPOR_PUSH_API_KEY` and `BASE44_WORKSPACE_API_KEY` independently. Set Base44 secrets with `base44 secrets set NAME=value` (or the dashboard); read them with `secrets.get()` inside handlers only.

### 8.7 Bootstrap checklist for the next project

1. Create a workspace API key with *Provision app users* + *Mint embed sign-in tokens*; verify both Apps API calls from Vapor against a scratch app (and which embed-token path is live).
2. Add `username` / `username_lc` custom fields to `User`; ship `ensure-profile` (`backend-user-schema.md`).
3. Provision the Base44 secrets in §8.6.
4. Recreate the backend functions: `ensure-profile`, `update-subscription`, `delete-user-data`, `referral-credit`, `enqueue-push`, `send-push` (with its scheduled automation or Workflow).
5. Recreate the entities: `UserSubscription`, `PushOutbox`, `ReferralReward`, plus your domain entities — all with explicit `rls` blocks.
6. Implement the Vapor side: Apple / Google JWT verification, Apps API client, `/v1/users/link`, `/v1/session/refresh`, StoreKit validation, APNs registration endpoint, and the `/api/v1/users/apns/external` relay.
7. Wire the iOS wrapper handlers from §6 — they call Vapor, never Base44.
8. Smoke-test the full chain end-to-end (sign in → `auth.me()` → `ensure-profile` → push → subscription → delete) before publishing.

---

## 9. Glossary

| Namespace | Meaning |
|---|---|
| `auth.*` | Sign in/up/out, session injection diag, logout diag, language |
| `account.*` | Account deletion lifecycle |
| `settings.*` | Logout, delete, privacy, terms, language |
| `paywall.*` | Subscribe / close button taps |
| `push.*` | requestPermission, schedule, cancel |
| `share.*` | requestLink (referral or invite) |
| `<domain>.*` | App-specific events — name the namespace after your domain (e.g. `lesson.*`, `workout.*`, `feed.*`). See §4.1 "Example domain actions" for the source project's `game.*` / `leaderboard.*` events as a reference pattern. |

---

**End of guide.** Drop this file into the next project's `docs/`
directory and reference it when wiring up the iOS bridge **and** the
Vapor + Base44 backend. Every `window.*` global, every
`wanillajs.event.*` name, every Swift signature, every backend endpoint
contract, every shared secret, and every gotcha that caused production
pain in the source project is captured here.

