// Small iOS system bridges shipped in Phase 2.
import { sendIOSEvent, isRunningInIOSWrapper } from "@/lib/iosBridge";

// open-app-settings.md — the wrapper does not handle this yet; the helper
// exists so the Phase 4 call sites work the moment iOS ships the handler.
export const openAppSettings = (reason = "other") =>
  sendIOSEvent("wanillajs.event.system.openAppSettings", { reason });

// should-open-url.md — open an external https link in Safari.
export const openExternalURL = (url, context) => {
  if (isRunningInIOSWrapper()) {
    sendIOSEvent("wanillajs.event.navigation.shouldOpenURL", context ? { url, context } : { url });
    return true;
  }
  window.open(url, "_blank", "noopener,noreferrer");
  return false;
};

// push-permission-bridge.md §2 — status listener stub: record state only.
const normalize = (s) => (s === "granted" ? "authorized" : s || "unknown");
if (typeof window !== "undefined") {
  window.__pushPermission = window.__pushPermission || { status: "unknown", source: "unknown", at: 0 };
  window.setPushPermissionStatus = (payload = {}) => {
    window.__pushPermission = { status: normalize(payload.status), source: payload.source || "unknown", at: Date.now() };
    window.dispatchEvent(new CustomEvent("ios:push-permission", { detail: window.__pushPermission }));
  };
}