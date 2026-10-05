// ─────────────────────────────────────────────────────────────────────────────
// HAPTICS — a very small wrapper around the Vibration API.
//
// One call = a preference check, a support check and one debounced vibration.
// A device or browser with no navigator.vibrate (iOS Safari) simply feels
// nothing and nothing breaks. Haptics never run on page load or on scroll:
// they only fire from a deliberate tap or from an action the user started.
// ─────────────────────────────────────────────────────────────────────────────

/** Set by the "Haptic feedback" toggle in Settings. */
const STORAGE_KEY = "levli_haptics_enabled";

/** Two vibrations closer together than this are treated as one. */
const DEBOUNCE_MS = 50;

/** The four moments worth feeling, in milliseconds (gap, duration, gap…). */
const PATTERNS = {
  light: 10,              // a tap or a selection
  medium: 20,             // a toggle, opening or closing a sheet
  success: [15, 40, 15],  // something saved
  warning: [30, 50, 30],  // a validation error, a cancel or a delete
};

let lastFiredAt = 0;

/** The user's own choice — on unless they turned it off in Settings. */
export function getHapticsPreference() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === null ? true : stored === "1";
  } catch {
    return true;
  }
}

export function setHapticsPreference(enabled) {
  try { localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0"); } catch { /* storage unavailable */ }
}

/** The device's reduce-motion setting turns haptics off by itself. */
function prefersReducedMotion() {
  try { return !!window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches; } catch { return false; }
}

/**
 * Fires one pattern. Safe to call from anywhere: it does nothing when haptics
 * are switched off, when the device asks for reduced motion, when the browser
 * has no Vibration API, or when another pattern just fired.
 */
export function haptic(pattern = "light") {
  if (!getHapticsPreference() || prefersReducedMotion()) return;
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  const now = Date.now();
  if (now - lastFiredAt < DEBOUNCE_MS) return;
  lastFiredAt = now;
  try { navigator.vibrate(PATTERNS[pattern] ?? PATTERNS.light); } catch { /* ignore */ }
}

export default haptic;