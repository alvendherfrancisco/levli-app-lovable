import { haptic } from "@/lib/haptics";

/**
 * The app's toast store. It holds at most ONE toast, so a new one replaces
 * whatever is showing instead of stacking, and the timings live here so every
 * caller gets the same behaviour:
 *   - 4 seconds on screen
 *   - 6 seconds when there is something to tap (Undo / Retry)
 *   - an error stays until the user dismisses it
 */
const AUTO_DISMISS_MS = 4000;
const ACTION_DISMISS_MS = 6000;

let current = null;
let nextId = 1;
const listeners = new Set();

function publish(next) {
  current = next;
  listeners.forEach((listener) => listener(current));
}

export function subscribeToast(listener) {
  listeners.add(listener);
  listener(current);
  return () => listeners.delete(listener);
}

export function dismissToast(id) {
  if (!current) return;
  if (id != null && current.id !== id) return;
  publish(null);
}

function show(type, message, options = {}) {
  // The vibration matches what the card says: a save lands, a delete or a
  // failure warns.
  if (type === "success") haptic("success");
  if (type === "error" || type === "deleted") haptic("warning");
  const hasAction = typeof options.onAction === "function";
  publish({
    id: nextId++,
    type,
    message,
    actionLabel: hasAction ? options.actionLabel || null : null,
    onAction: hasAction ? options.onAction : null,
    // An Undo is only meaningful for a short window, so it can expire before
    // the toast itself goes away.
    actionTtlMs: hasAction ? options.actionTtlMs ?? null : null,
    duration: type === "error" ? null : hasAction ? ACTION_DISMISS_MS : AUTO_DISMISS_MS,
  });
}

const toast = (message, options) => show("success", message, options);
toast.success = (message, options) => show("success", message, options);
toast.warning = (message, options) => show("warning", message, options);
toast.error = (message, options) => show("error", message, options);
toast.deleted = (message, options) => show("deleted", message, options);
toast.dismiss = (id) => dismissToast(id);

export { toast };