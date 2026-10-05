// ─────────────────────────────────────────────────────────────────────────────
// Dose colours — ONE central config.
//
// A neutral sequential palette: light indigo at the lowest dose through to a
// burnt orange at the highest. No red is used for a dose, because red reads as
// "error" rather than "lower number". Colour is never the only signal — every
// place a dose colour is shown also shows the dose as text (chips, badges,
// chart legends), and getDoseLabel() supplies that text.
//
// The dose step comes from the central medications config, so the colour ladder
// always matches the label's strength list.
// ─────────────────────────────────────────────────────────────────────────────

import { getAllowedDoses } from "@/lib/medicationConfig";

// Low → high ladder, step 1 first. Neutral and warm, never red.
export const DOSE_LADDER = [
  "#818CF8", // step 1 — light indigo
  "#6366F1", // step 2 — indigo
  "#4338CA", // step 3 — deep indigo
  "#0E7490", // step 4 — cyan
  "#0D9488", // step 5 — teal
  "#C2410C", // step 6 — burnt orange
];

// Doses that are not a standard step (typed doses, compounded strengths).
export const CUSTOM_DOSE_COLOR = "#64748B";

const DARK_TEXT = "#1F2937";
const LIGHT_TEXT = "#FFFFFF";

/** The dose's step (1 = lowest listed strength), or null when it isn't listed. */
export function getDoseStep(medication, dose) {
  const value = Number(dose);
  if (!value) return null;
  const index = getAllowedDoses(medication).findIndex((d) => Number(d.value) === value);
  return index === -1 ? null : index + 1;
}

/** The colour that represents this dose. */
export function getDoseColor(medication, dose) {
  const step = getDoseStep(medication, dose);
  return (step && DOSE_LADDER[step - 1]) || CUSTOM_DOSE_COLOR;
}

/**
 * The dose as text — always shown next to the colour so the colour is never the
 * only signal.
 */
export function getDoseLabel(medication, dose, unit) {
  const value = Number(dose);
  if (!Number.isFinite(value) || value <= 0) return "";
  const resolvedUnit = unit || getAllowedDoses(medication)[0]?.unit || "mg";
  return `${value} ${resolvedUnit}`;
}

/** How the label describes this strength (initiation / titration only / standard). */
export function getDoseRole(medication, dose) {
  const value = Number(dose);
  const match = getAllowedDoses(medication).find((d) => Number(d.value) === value);
  return match?.role || null;
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
      unit: s.dose_unit || "mg",
      label: getDoseLabel(s.medication, s.dose, s.dose_unit),
      color: getDoseColor(s.medication, s.dose),
    });
  });
  return [...seen.values()].sort((a, b) => a.dose - b.dose);
}