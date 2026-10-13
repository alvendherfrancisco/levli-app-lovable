import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authStore } from "@/lib/authStore";
import { sendIOSEvent } from "@/lib/iosBridge";

// Paths reachable without a session; anything else waits for one.
const PUBLIC_IOS_PATHS = [
  "/login", "/register", "/forgot-password", "/reset-password", "/onboarding",
  "/privacy", "/terms", "/medical-disclaimer", "/about-sources",
];
const LOGOUT_GUARD_MS = 3000;

const isPublic = (path) => PUBLIC_IOS_PATHS.some((p) => path === p || path.startsWith(`${p}?`) || path.startsWith(`${p}/`));
const loggingOut = () => Date.now() - Number(sessionStorage.getItem("logoutRequestedAt") || 0) < LOGOUT_GUARD_MS;

// iOS → web SPA navigation (guide §3.5) with Phase 3 session gating: a
// protected path that lands without a session is parked in __pendingIOSPath,
// the wrapper is asked for a session, and the path drains on auth:changed.
export default function IOSNavigationBridge() {
  const navigate = useNavigate();

  useEffect(() => {
    const go = (path) => {
      if (typeof path !== "string" || !path.startsWith("/")) return;
      if (isPublic(path) || authStore.get().user) {
        window.__pendingIOSPath = null;
        navigate(path);
        return;
      }
      window.__pendingIOSPath = path;
      // Still starting up: wait for auth:changed rather than asking for a session.
      if (!authStore.get().ready || loggingOut()) return;
      sendIOSEvent("wanillajs.event.auth.sessionRequested", { reason: "protected_path_deep_link", path, at: Date.now() });
    };

    const drain = () => {
      const p = window.__pendingIOSPath;
      if (!p) return;
      if (isPublic(p) || authStore.get().user) go(p);
    };

    const previous = window.navigateFromIOS;
    window.navigateFromIOS = go;

    const onNavigate = (e) => go(e.detail?.path ?? window.__pendingIOSPath);
    window.addEventListener("ios:navigate", onNavigate);
    const unsubscribe = authStore.subscribe(drain);

    if (window.__pendingIOSPath) go(window.__pendingIOSPath);

    return () => {
      window.removeEventListener("ios:navigate", onNavigate);
      unsubscribe();
      window.navigateFromIOS = previous || ((p) => { window.__pendingIOSPath = p; });
    };
  }, [navigate]);

  return null;
}