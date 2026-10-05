// ─────────────────────────────────────────────────────────────────────────────
// Dose colours — ONE central config.
// A dose is recognised by its colour everywhere: the chips in Add Shot, the
// badges on shot / history / repeat cards, the Insights markers and legend,
// and the shot-day notification.
//
//   • Ozempic follows its pen label colours.
//   • Every other medication follows a low-to-high ladder by dose step, where
//     step 1 is the lowest strength in that medication's own list.
//   • A custom dose that is not a standard step uses neutral slate.
// ─────────────────────────────────────────────────────────────────────────────

import { DOSE_UNIT, getDoseList } from "@/lib/doseOptions";

// Ozempic pen label colours.
export const OZEMPIC_DOSE_COLORS = {
  0.25: "#F26A72", // light red
  0.5: "#E11D2A",  // red
  1: "#0E6B73",    // teal
  2: "#D9A826",    // gold
};

// Low → high ladder, step 1 first.
export const DOSE_LADDER = [
  "#38BDF8", // step 1 — sky blue
  "#14B8A6", // step 2 — teal
  "#22C55E", // step 3 — green
  "#EAB308", // step 4 — amber
  "#F97316", // step 5 — orange
  "#DC2626", // step 6 — deep red
];

// Custom doses that match no standard step.
export const CUSTOM_DOSE_COLOR = "#64748B";

const DARK_TEXT = "#1F2937";
const LIGHT_TEXT = "#FFFFFF";

const normaliseMedication = (medication) =>
  String(medication || "").replace(/[®™]/g, "").trim().toLowerCase();

/** The dose's step (1 = lowest strength), or null when it isn't a standard step. */
export function getDoseStep(medication, dose) {
  const value = Number(dose);
  if (!value) return null;
  const index = getDoseList(medication).findIndex((d) => Number(d) === value);
  return index === -1 ? null : index + 1;
}

/** The colour that represents this dose. */
export function getDoseColor(medication, dose) {
  if (normaliseMedication(medication) === "ozempic") {
    return OZEMPIC_DOSE_COLORS[Number(dose)] || CUSTOM_DOSE_COLOR;
  }
  const step = getDoseStep(medication, dose);
  return (step && DOSE_LADDER[step - 1]) || CUSTOM_DOSE_COLOR;
}

/** White or dark text, whichever reads better on that colour. */
export function getDoseTextColor(hex) {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance >= 0.35 ? DARK_TEXT : LIGHT_TEXT;
}

/** Ready-to-spread style for a filled dose element. */
export function getDoseStyle(medication, dose) {
  const background = getDoseColor(medication, dose);
  return { background, color: getDoseTextColor(background) };
}

/** The dose colours used by a set of shot-like records, for chart legends. */
export function getDoseLegend(shots = []) {
  const seen = new Map();
  shots.forEach((s) => {
    if (!s || s.dose == null) return;
    const key = `${s.medication || ""}|${Number(s.dose)}`;
    if (seen.has(key)) return;
    seen.set(key, {
      key,
      medication: s.medication || "",
      dose: Number(s.dose),
      unit: s.dose_unit || DOSE_UNIT,
      color: getDoseColor(s.medication, s.dose),
    });
  });
  return [...seen.values()].sort((a, b) => a.dose - b.dose);
}