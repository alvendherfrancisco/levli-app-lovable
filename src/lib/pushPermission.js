// Phase 4A — push permission round-trip (push-permission-bridge.md).
// iOS owns the truth and reports it via window.setPushPermissionStatus; the web
// only listens, keeps it in memory, and asks through a visible opt-in.
import { sendIOSEvent } from "@/lib/iosBridge";
import { openAppSettings } from "@/lib/iosSystem";

const normalize = (s) => (s === "granted" ? "authorized" : s || "unknown");
export const isPushOn = (s) => ["authorized", "provisional", "ephemeral"].includes(s);

let state = { status: "unknown", source: "unknown", at: 0 };
export const getPushPermission = () => state;

if (typeof window !== "undefined" && !window.__pushPermissionInstalled) {
  window.__pushPermissionInstalled = true;
  window.setPushPermissionStatus = (payload = {}) => {
    const p = typeof payload === "string" ? JSON.parse(payload) : payload;
    state = { status: normalize(p.status), source: p.source || "unknown", at: Date.now() };
    console.log("[push] permission", state);
    window.dispatchEvent(new CustomEvent("pushPermissionUpdated", { detail: state }));
  };
  // apns-registration.md — success-only signal once Vapor stored the token.
  window.setRemotePushDeviceRegistered = (payload = {}) => {
    const p = typeof payload === "string" ? JSON.parse(payload) : payload;
    window.__remotePushRegistered = !!p.registered;
    console.log("[push] remote device registered", window.__remotePushRegistered);
    window.dispatchEvent(new CustomEvent("remotePushDeviceRegistered", { detail: { registered: window.__remotePushRegistered } }));
  };
}

// Pull for screens that mount after the launch broadcasts (§B).
export const requestPushStatus = () => sendIOSEvent("wanillajs.event.push.requestStatus", {});

// Ask for the OS prompt, or — once denied — send the person to Settings.app.
// openAppSettings is marked "not wired" in the guide's registry; it is emitted
// as push-permission-bridge.md §3 specifies.
export const turnOnPush = () => {
  if (state.status === "denied") openAppSettings("push_denied_recovery");
  else sendIOSEvent("wanillajs.event.push.requestPermission", {});
};

// Re-ask policy (§4.3): this is about our own banner, never the OS truth.
const KEY = "pushOptIn.v1";
const COOLDOWN_MS = 48 * 60 * 60 * 1000;
const MAX_DISMISSALS = 2;
const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
const write = (v) => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* private mode */ } };

export const optInPolicy = {
  canShowBanner() {
    const v = read();
    return (v.dismissals || 0) < MAX_DISMISSALS && Date.now() - (v.lastShownAt || 0) > COOLDOWN_MS;
  },
  dismissBanner() {
    const v = read();
    write({ ...v, dismissals: (v.dismissals || 0) + 1, lastShownAt: Date.now() });
  },
  canShowDeniedTip: () => !read().deniedTipShown,
  markDeniedTipShown: () => write({ ...read(), deniedTipShown: true }),
};