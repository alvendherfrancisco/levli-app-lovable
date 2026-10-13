import { useEffect, useState } from "react";
import { getPushPermission, requestPushStatus } from "@/lib/pushPermission";
import { isRunningInIOSWrapper } from "@/lib/iosBridge";

// The current push permission. Pulls once on mount; after 2 s with no answer,
// an unknown status reads as notDetermined so the UI offers "Turn on".
export default function usePushPermission() {
  const [perm, setPerm] = useState(getPushPermission);
  const [resolved, setResolved] = useState(() => getPushPermission().status !== "unknown");

  useEffect(() => {
    const h = (e) => { setPerm(e.detail); setResolved(true); };
    window.addEventListener("pushPermissionUpdated", h);
    if (isRunningInIOSWrapper()) requestPushStatus();
    const t = setTimeout(() => setResolved(true), 2000);
    return () => { window.removeEventListener("pushPermissionUpdated", h); clearTimeout(t); };
  }, []);

  const status = resolved && perm.status === "unknown" ? "notDetermined" : perm.status;
  return { status, resolved };
}