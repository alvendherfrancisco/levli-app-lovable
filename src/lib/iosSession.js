// Session injection (session-injection-contract.md) and native logout.
// Installed at module scope from main.jsx, before React mounts.
import { base44 } from "@/api/base44Client";
import { appParams } from "@/lib/app-params";
import { sendIOSEvent } from "@/lib/iosBridge";
import { authStore } from "@/lib/authStore";
import { nativeSignInInProgress } from "@/lib/iosNativeSignIn";

const LOGOUT_KEY = "logoutRequestedAt";
const LOGOUT_GUARD_MS = 3000;
const SINGLE_FLIGHT_MS = 10000;
const TIMEOUT_MS = 5000;
const AUTH_PATHS = ["/login", "/register", "/forgot-password", "/reset-password", "/onboarding"];

let inFlight = null; // { at, attemptId, promise }

const diag = (phase, attemptId, extra = {}) =>
  sendIOSEvent("wanillajs.event.auth.setSessionDiag", { phase, attemptId, at: Date.now(), ...extra });

const tokenShape = (t) => (typeof t === "string" && t.split(".").length === 3 ? "jwt" : "invalid");

const currentUser = async () => { try { return await base44.auth.me(); } catch { return null; } };

const withTimeout = (p) =>
  Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), TIMEOUT_MS))]);

// Mechanism B: in-page exchange of the one-time token for an access token.
const redeem = async (ott) => {
  const res = await fetch(`/api/apps/${appParams.appId}/auth/embed/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:token-exchange",
      subject_token: ott,
      subject_token_type: "urn:base44:params:oauth:token-type:embed-ott",
    }),
  });
  if (!res.ok) throw new Error(`exchange_${res.status}`);
  const { access_token } = await res.json();
  if (!access_token) throw new Error("exchange_no_token");
  base44.auth.setToken(access_token, true);
};

const scrubStorage = () => {
  const keep = sessionStorage.getItem(LOGOUT_KEY);
  try { localStorage.removeItem("base44_access_token"); localStorage.removeItem("levli:profile"); } catch { /* ignore */ }
  if (keep) sessionStorage.setItem(LOGOUT_KEY, keep);
};

const finish = async (attemptId, user) => {
  authStore.set(user);
  window.dispatchEvent(new CustomEvent("ios:session-restored"));
  const username = user?.username ?? user?.data?.username;
  if (!username) base44.functions.invoke("ensureProfile", {}).catch(() => {});
};

const run = async (ott, expectedEmail, attemptId) => {
  const live = await currentUser();
  if (live && expectedEmail && live.email?.toLowerCase() === expectedEmail.toLowerCase()) {
    diag("already_authenticated", attemptId);
    await finish(attemptId, live);
    return true;
  }
  if (live) {
    diag("account_switch_detected", attemptId);
    scrubStorage();
    diag("storage_scrubbed", attemptId);
    base44.auth.setToken(null, false);
    diag("preflight_signout_done", attemptId);
  }
  diag("calling_setSession", attemptId);
  try {
    await withTimeout(redeem(ott));
  } catch (e) {
    diag(e.message === "timeout" ? "setSession_timeout" : "setSession_failed", attemptId, { error: e.message });
    return false;
  }
  const user = await currentUser();
  if (!user) { diag("setSession_failed", attemptId, { error: "me_failed" }); return false; }
  diag("restored", attemptId);
  await finish(attemptId, user);
  // Reload into the app so every provider starts from the new session.
  const pending = window.__pendingIOSPath;
  const here = window.location.pathname;
  const target = pending || (AUTH_PATHS.includes(here) ? "/" : here + window.location.search);
  diag("redirecting", attemptId, { path: target });
  window.location.replace(target);
  return true;
};

if (typeof window !== "undefined") {
  window.setBase44Session = (ott, expectedEmail) => {
    const attemptId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    const shape = tokenShape(ott);
    const reply = (accepted) => JSON.stringify({ accepted, attemptId, tokenShape: shape });

    if (shape !== "jwt") { diag("rejected_invalid_token", attemptId); return reply(false); }
    const loggedOutAt = Number(sessionStorage.getItem(LOGOUT_KEY) || 0);
    if (loggedOutAt && Date.now() - loggedOutAt < LOGOUT_GUARD_MS) {
      diag("logout_guard_dropped", attemptId);
      return reply(false);
    }
    if (inFlight && Date.now() - inFlight.at < SINGLE_FLIGHT_MS) {
      diag("duplicate_in_flight", attemptId, { firstAttemptId: inFlight.attemptId });
      return JSON.stringify({ accepted: true, attemptId: inFlight.attemptId, tokenShape: shape });
    }
    inFlight = { at: Date.now(), attemptId, promise: run(ott, expectedEmail, attemptId) };
    return reply(true);
  };

  // Older wrapper builds only know the Supabase name.
  window.setSupabaseSession = (a) => window.setBase44Session(a);

  window.forceLogoutFromIOS = (reason = "native", userInitiated = false) => {
    const deleted = reason === "accountDeleted";
    if (!deleted && nativeSignInInProgress()) return JSON.stringify({ accepted: false, reason: "signInInProgress" });
    sessionStorage.setItem(LOGOUT_KEY, String(Date.now()));
    if (deleted) {
      // Account deletion: tear everything down synchronously, then leave.
      ["iosAuthSessionEstablishedAt", "appleSignInRequestedAt", "googleSignInRequestedAt"].forEach((k) => sessionStorage.removeItem(k));
      const userId = authStore.get?.()?.id ?? null;
      authStore.set(null);
      try {
        Object.keys(localStorage)
          .filter((k) => k.startsWith("base44") || k.startsWith("levli:") || k === "token")
          .forEach((k) => localStorage.removeItem(k));
      } catch { /* ignore */ }
      sendIOSEvent("wanillajs.event.auth.userDidSignOut", { userId, reason });
      window.location.replace("/login");
      try { base44.auth.logout("/login"); } catch { /* fire-and-forget */ }
      return JSON.stringify({ accepted: true, reason, userInitiated });
    }
    authStore.set(null);
    base44.auth.logout("/login");
    return JSON.stringify({ accepted: true, reason, userInitiated });
  };

  // Called by the wrapper after Vapor finishes deleting the account.
  window.showLoginScreen = () => window.forceLogoutFromIOS("accountDeleted");
}

// Web-initiated logout: tell iOS so it clears its native session too, and set
// the guard so the wrapper's re-injection cannot resurrect it.
export const requestIOSLogout = (reason = "user") => {
  sessionStorage.setItem(LOGOUT_KEY, String(Date.now()));
  sendIOSEvent("wanillajs.event.auth.logoutRequested", { reason, at: Date.now() });
};