// ─────────────────────────────────────────────────────────────────────────────
// SOUNDS — the app's feedback, played as short generated tones.
//
// Six moments worth hearing, as a few sine notes each. The audio graph, the
// volume, the "Sound effects" preference and every guard live in one place —
// src/lib/audioEngine.js — together with the launch sequence, which has its own
// file (src/lib/splashSounds.js).
//
// These cues are feedback, so they only ever follow something the person did:
// never on load, scroll or hover.
// ─────────────────────────────────────────────────────────────────────────────

import { playRecipe } from "@/lib/audioEngine";
export { getSoundPreference, setSoundPreference } from "@/lib/audioEngine";

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

function play(name) {
  const recipe = RECIPES[name];
  if (recipe) playRecipe(recipe);
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