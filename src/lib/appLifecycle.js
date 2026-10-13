// Phase 3 — Lifecycle (foreground-event.md). On ios:foregrounded,
// visibilitychange and pageshow, re-probes the session when the last probe is
// older than 5 min, then bumps authEpoch so user-scoped data refetches. A lost
// session asks the wrapper for a new one; it never redirects on its own.
import { base44 } from "@/api/base44Client";
import { authStore } from "@/lib/authStore";
import { sendIOSEvent } from "@/lib/iosBridge";

export const STALE_THRESHOLD_S = 5 * 60;
const DEDUPE_MS = 10000;

let lastProbeAt = Date.now();
let inFlight = null;
let authEpoch = 0;

export const getAuthEpoch = () => authEpoch;

const bump = (reason) => {
  authEpoch += 1;
  console.log("[appLifecycle] authEpoch bump", { epoch: authEpoch, reason });
  window.dispatchEvent(new CustomEvent("auth:epoch", { detail: { epoch: authEpoch, reason } }));
};

const probe = () => {
  if (inFlight && Date.now() - inFlight.at < DEDUPE_MS) return inFlight.promise;
  const promise = (async () => {
    let user = null;
    try { user = await base44.auth.me(); } catch { user = null; }
    lastProbeAt = Date.now();
    if (user) {
      authStore.set(user);
      bump("refreshIfStale");
    } else {
      authStore.set(null);
      bump("session_lost");
      sendIOSEvent("wanillajs.event.auth.sessionRequested", {
        reason: "foreground_session_lost", path: window.location.pathname, at: Date.now(),
      });
    }
    return user;
  })();
  inFlight = { at: Date.now(), promise };
  return promise;
};

export const refreshIfStale = () => {
  if (!authStore.get().user) return null; // nothing to refresh while signed out
  if ((Date.now() - lastProbeAt) / 1000 < STALE_THRESHOLD_S) return null;
  return probe();
};

if (typeof window !== "undefined" && !window.__appLifecycleInstalled) {
  window.__appLifecycleInstalled = true;
  const onForeground = (trigger) => {
    console.log("[appLifecycle] foreground", trigger);
    refreshIfStale();
  };
  window.addEventListener("ios:foregrounded", () => onForeground("ios:foregrounded"));
  window.addEventListener("pageshow", () => onForeground("pageshow"));
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") onForeground("visibilitychange");
    else console.log("[appLifecycle] background visibilitychange");
  });
  // A fresh session from the wrapper counts as a successful probe.
  window.addEventListener("ios:session-restored", () => { lastProbeAt = Date.now(); bump("session_restored"); });
}