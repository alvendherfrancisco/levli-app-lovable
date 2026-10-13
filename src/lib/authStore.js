// Web-side auth store (Phase 2). Owns { user, ready } and emits `auth:changed`
// on window whenever it changes. Screens read auth from here, never from a
// cached me() result.
import { base44 } from "@/api/base44Client";

let state = { user: null, ready: false };

const emit = () => window.dispatchEvent(new CustomEvent("auth:changed", { detail: { ...state } }));

export const authStore = {
  get: () => state,
  set(user) {
    state = { user: user ? { id: user.id, email: user.email, role: user.role, data: user.data ?? user } : null, ready: true };
    emit();
  },
  // Server round trip; never trusts a cached object.
  async refresh() {
    let user = null;
    try { user = await base44.auth.me(); } catch { user = null; }
    authStore.set(user);
    return user;
  },
  subscribe(fn) {
    const h = (e) => fn(e.detail);
    window.addEventListener("auth:changed", h);
    return () => window.removeEventListener("auth:changed", h);
  },
};