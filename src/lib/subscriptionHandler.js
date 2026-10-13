// iOS subscription sync (guide §3.11 / §8.3.2). Installed at module scope.
// The wrapper's postMessage is a fast hint only; the database is the record.
import { base44 } from "@/api/base44Client";
import { authStore } from "@/lib/authStore";

const nowSec = () => Math.floor(Date.now() / 1000);
const toSec = (iso) => { const t = Date.parse(iso); return Number.isFinite(t) ? Math.floor(t / 1000) : null; };

// { active: true|false|null (unknown), expiresAt: unix seconds|null, source }
let state = { active: null, expiresAt: null, source: "none" };
export const getSubscriptionState = () => state;

const set = (next, eventName) => {
  state = next;
  window.dispatchEvent(new CustomEvent(eventName, { detail: state }));
};

const hintStillValid = () => {
  const h = window.__lastSubscriptionHint;
  return !!(h?.isSubscribed && (h.expiresAt == null || h.expiresAt > nowSec()));
};

export const reconcileSubscription = async () => {
  if (!authStore.get().user) return state; // no session: unknown, change nothing
  let data;
  try { data = (await base44.functions.invoke("get-subscription", {})).data; } catch { return state; }
  const exp = data?.subscription?.expiration_date ?? null;
  if (exp && exp > nowSec()) {
    set({ active: true, expiresAt: exp, source: "db" }, "subscriptionUpdated");
  } else if (exp && !hintStillValid()) {
    // Downgrade only on an observed expired record, never over a live native hint.
    try { localStorage.setItem("isSubscribed", "false"); } catch { /* ignore */ }
    set({ active: false, expiresAt: exp, source: "db" }, "subscriptionUpdated");
  }
  return state;
};

const applyHint = (status) => {
  const expiresAt = status.expirationDate ? toSec(status.expirationDate) : null;
  const isSubscribed = !!status.isSubscribed && (expiresAt == null || expiresAt > nowSec());
  window.__lastSubscriptionHint = { isSubscribed, expiresAt, productId: status.productId ?? null, at: Date.now() };
  try { localStorage.setItem("isSubscribed", String(isSubscribed)); } catch { /* ignore */ }
  set({ active: isSubscribed, expiresAt, source: "hint" }, "subscription-status-hint");
  reconcileSubscription();
};

if (typeof window !== "undefined" && !window.__subscriptionHandlerInstalled) {
  window.__subscriptionHandlerInstalled = true;
  window.addEventListener("message", (e) => {
    // Same-origin guard: the wrapper posts on the page's own window.
    if (e.source !== window || (e.origin && e.origin !== window.location.origin)) return;
    let msg = e.data;
    if (typeof msg === "string") { try { msg = JSON.parse(msg); } catch { return; } }
    if (msg?.type !== "subscriptionStatusChanged" || !msg.status) return;
    let status = msg.status;
    if (typeof status === "string") { try { status = JSON.parse(status); } catch { return; } }
    applyHint(status);
  });
  authStore.subscribe(() => reconcileSubscription());
}