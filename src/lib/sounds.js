// ─────────────────────────────────────────────────────────────────────────────
// SOUNDS — the app's feedback, played as short generated tones.
//
// Every sound is made with the Web Audio API, so no audio files ship with the
// app. They are quiet (peak 0.15), brief, and always fade out rather than
// stopping dead, which is what keeps them from clicking.
//
// iOS Safari will not start audio before a user gesture, so the AudioContext is
// created on the first tap of the session (never on load) and resumed whenever
// it is found suspended. With no Web Audio available every call is a no-op.
//
// The phone's silent switch is respected by doing nothing at all: Web Audio on
// iOS already follows the ringer switch, and nothing here tries to override it.
// ─────────────────────────────────────────────────────────────────────────────

/** Set by the "Sound effects" toggle in Settings. */
const STORAGE_KEY = "levli_sound_enabled";

/** Two sounds closer together than this are treated as one. */
const DEBOUNCE_MS = 60;

/** Quiet enough to be pleasant next to a phone held to the ear. */
const VOLUME = 0.15;

let enabled = readPreference();
let audio = null;
let lastPlayedAt = 0;

/** The user's own choice — on unless they turned it off in Settings. */
function readPreference() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === null ? true : stored === "1";
  } catch {
    return true;
  }
}

export function getSoundPreference() {
  return enabled;
}

export function setSoundPreference(value) {
  enabled = !!value;
  try { localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0"); } catch { /* storage unavailable */ }
}

// The haptics preference from before this feature is no longer used.
try { localStorage.removeItem("levli_haptics_enabled"); } catch { /* storage unavailable */ }

/** The shared AudioContext, created on the first user gesture. */
function context() {
  if (typeof window === "undefined") return null;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  if (!audio) {
    try { audio = new AudioCtx(); } catch { return null; }
  }
  if (audio.state === "suspended") {
    try { audio.resume(); } catch { /* ignore */ }
  }
  return audio;
}

// The first tap of the session unlocks audio for the rest of it, so a sound
// played later (after a save finishes, say) is not blocked.
if (typeof window !== "undefined") {
  const unlock = () => { context(); };
  window.addEventListener("pointerdown", unlock, { once: true });
  window.addEventListener("touchstart", unlock, { once: true });
}

/**
 * One tone: a quick attack and a gentle exponential fade-out, optionally
 * gliding from `freq` to `to` over its length.
 */
function note(ctx, { freq, to, at, dur, peak = VOLUME }) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const start = ctx.currentTime + at;

  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, start);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, start + dur);

  // Exponential ramps cannot reach zero, so the ends sit just above it.
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + dur + 0.03);
}

/** The six moments worth hearing, as a few sine notes each. */
const RECIPES = {
  // A tap or a selection — chips, days, dropdown choices, tabs. ~40ms
  tap: [{ freq: 600, at: 0, dur: 0.04 }],
  // Opening a sheet, expanding a section — a soft rise. ~90ms
  open: [{ freq: 520, at: 0, dur: 0.05 }, { freq: 700, at: 0.045, dur: 0.045 }],
  // Closing a sheet, collapsing a section — a soft fall. ~90ms
  close: [{ freq: 700, at: 0, dur: 0.05 }, { freq: 500, at: 0.045, dur: 0.045 }],
  // Something saved — a gentle three-note chime. ~250ms
  success: [
    { freq: 523, at: 0, dur: 0.1 },
    { freq: 659, at: 0.07, dur: 0.1 },
    { freq: 784, at: 0.14, dur: 0.11 },
  ],
  // A duplicate warning or a validation error — low, high, low. ~200ms
  warning: [
    { freq: 420, at: 0, dur: 0.08 },
    { freq: 560, at: 0.07, dur: 0.08 },
    { freq: 420, at: 0.14, dur: 0.06 },
  ],
  // Something removed — one soft descending tone. ~150ms
  delete: [{ freq: 420, to: 230, at: 0, dur: 0.15 }],
};

/**
 * Plays one sound. Safe to call from anywhere: it does nothing when sounds are
 * switched off, when the browser has no Web Audio, or when another sound just
 * played. Never fires on load, scroll or hover — only from a user action.
 */
function play(name) {
  if (!enabled) return;
  const recipe = RECIPES[name];
  if (!recipe) return;
  const now = Date.now();
  if (now - lastPlayedAt < DEBOUNCE_MS) return;
  const ctx = context();
  if (!ctx) return;
  lastPlayedAt = now;
  try { recipe.forEach((n) => note(ctx, n)); } catch { /* audio unavailable */ }
}

export const sound = {
  tap: () => play("tap"),
  open: () => play("open"),
  close: () => play("close"),
  success: () => play("success"),
  warning: () => play("warning"),
  delete: () => play("delete"),
};

export default sound;