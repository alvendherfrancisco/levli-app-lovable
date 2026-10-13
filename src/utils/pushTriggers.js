// Phase 4B — local notification registry (local-push-scheduling-prompt.md).
// Every schedule/cancel goes through here: ids, categories, copy and deep links
// live in this one file. Ids map 1:1 to iOS UNNotificationRequest identifiers —
// never rename one; mint a new id instead.
import { sendIOSEvent } from "@/lib/iosBridge";

export const PUSH_TRIGGER_IDS = ["shot.due"];
export const PUSH_CATEGORIES = ["retention", "social", "monetisation"];

// payload: { id, category, title, body, fireAt (unix s) | delaySeconds, deepLink?, replaces? }
export function schedulePush({ fireAt, delaySeconds, replaces = true, ...rest }) {
  const timing = fireAt != null ? { fireAt: Math.floor(fireAt) } : { delaySeconds: Math.floor(delaySeconds) };
  sendIOSEvent("wanillajs.event.push.schedule", {
    ...rest,
    ...timing,
    replaces,
    trigger_id: rest.id, // mirrored for tap analytics (notification-tap-handling.md §1)
  });
}

export const cancelPush = (id) => sendIOSEvent("wanillajs.event.push.cancel", { id });

// The shot-day reminder: one pending request, re-armed to the next due dose.
// Copy carries no medication name or dose — it shows on the lock screen.
export function schedShotDue(date) {
  schedulePush({
    id: "shot.due",
    category: "retention",
    title: "Shot day",
    body: "Your scheduled shot is due. Tap to log it in Levli.",
    fireAt: date.getTime() / 1000,
    deepLink: "/shots",
  });
}
export const cancelShotDue = () => cancelPush("shot.due");