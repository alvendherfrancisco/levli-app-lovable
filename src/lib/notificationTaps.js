// notification-tap-handling.md §4 — analytics for taps. Navigation itself goes
// through window.navigateFromIOS (IOSNavigationBridge, with the
// __pendingIOSPath fallback for cold starts).
import { base44 } from "@/api/base44Client";

if (typeof window !== "undefined" && !window.__notificationTapListener) {
  window.__notificationTapListener = true;
  window.addEventListener("wanillajs.event.notificationTapped", (e) => {
    const d = e.detail || {};
    base44.analytics.track({
      eventName: "notification_tapped",
      properties: { trigger_id: d.trigger_id ?? null, category: d.category ?? null, deep_link: d.deep_link ?? null, cold_start: !!d.cold_start },
    });
  });
}