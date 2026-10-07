// ─────────────────────────────────────────────────────────────────────────────
// AUDIO ENGINE — the Web Audio plumbing every sound in the app plays through.
//
// The sound designs sit beside this file: src/lib/sounds.js holds the short
// feedback cues, src/lib/splashSounds.js the launch sequence. Both share this
// one AudioContext, this one preference, and these guards.
//
// Every sound is generated with the Web Audio API, so no audio files ship with
// the app. They are quiet (peak 0.15), brief, and always fade out rather than
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
export const VOLUME = 0.15;

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
export function audioContext() {
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

/**
 * The shared context, but only once the browser has actually started it — which
 * happens on the first gesture of the page.
 *
 * A sound nobody asked for with a gesture (the launch sequence) uses this rather
 * than the call above: notes scheduled on a context that is still blocked would
 * all fire late, in a heap, the moment the person first tapped something else.
 * Skipping them is the right silence.
 */
export function liveContext() {
  return audio && audio.state === "running" ? audio : null;
}

// The first tap of the session unlocks audio for the rest of it, so a sound
// played later (after a save finishes, say) is not blocked.
if (typeof window !== "undefined") {
  const unlock = () => { audioContext(); };
  window.addEventListener("pointerdown", unlock, { once: true });
  window.addEventListener("touchstart", unlock, { once: true });
}

/**
 * One tone: a quick attack and a gentle exponential fade-out, optionally gliding
 * from `freq` to `to` over its length. `at` is an offset in seconds from now, so
 * a whole sequence can be scheduled at once and still land on its own beats.
 */
export function note(ctx, { freq, to, at, dur, peak = VOLUME }) {
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

/** Schedules a whole set of notes on a context, tolerating a dead audio graph. */
export function playNotes(ctx, notes) {
  try { notes.forEach((n) => note(ctx, n)); } catch { /* audio unavailable */ }
}

/**
 * Plays one recipe. Safe to call from anywhere: it does nothing when sounds are
 * switched off, when the browser has no Web Audio, or when another sound just
 * played.
 */
export function playRecipe(recipe) {
  if (!enabled || !recipe) return;
  const now = Date.now();
  if (now - lastPlayedAt < DEBOUNCE_MS) return;
  const ctx = audioContext();
  if (!ctx) return;
  lastPlayedAt = now;
  playNotes(ctx, recipe);
}