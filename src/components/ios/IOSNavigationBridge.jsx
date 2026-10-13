import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

// iOS → web SPA navigation (guide §3.5): window.navigateFromIOS(path), the
// `ios:navigate` event, and the __pendingIOSPath drain on mount. Session-gated
// navigation is added in Phase 3.
export default function IOSNavigationBridge() {
  const navigate = useNavigate();

  useEffect(() => {
    const go = (path) => {
      if (typeof path === "string" && path.startsWith("/")) navigate(path);
    };

    const previous = window.navigateFromIOS;
    window.navigateFromIOS = (path) => {
      window.__pendingIOSPath = null;
      go(path);
    };

    const onNavigate = (e) => {
      const path = e.detail?.path ?? window.__pendingIOSPath;
      window.__pendingIOSPath = null;
      go(path);
    };
    window.addEventListener("ios:navigate", onNavigate);

    if (window.__pendingIOSPath) {
      const p = window.__pendingIOSPath;
      window.__pendingIOSPath = null;
      go(p);
    }

    return () => {
      window.removeEventListener("ios:navigate", onNavigate);
      // Back to the queueing shim, so a call between mounts is not lost.
      window.navigateFromIOS = previous || ((p) => { window.__pendingIOSPath = p; });
    };
  }, [navigate]);

  return null;
}