import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { sendIOSEvent } from "@/lib/iosBridge";

// Module-level guard + sessionStorage guard (guide §5.7): appStarted fires once.
let appStartedDispatched = false;

const screenNameFor = (pathname) => (pathname === "/" ? "home" : pathname.replace(/^\//, "") || "home");

export default function IOSLifecycleEvents() {
  const { isLoadingAuth } = useAuth();
  const { pathname } = useLocation();

  useEffect(() => {
    if (isLoadingAuth || appStartedDispatched) return;
    let sent = false;
    try { sent = sessionStorage.getItem("appStartedSent") === "1"; } catch { /* ignore */ }
    appStartedDispatched = true;
    if (sent) return;
    try { sessionStorage.setItem("appStartedSent", "1"); } catch { /* ignore */ }
    sendIOSEvent("wanillajs.event.appStarted");
  }, [isLoadingAuth]);

  useEffect(() => {
    sendIOSEvent("wanillajs.event.screenView", { screenName: screenNameFor(pathname) });
  }, [pathname]);

  return null;
}