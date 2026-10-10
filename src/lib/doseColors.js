// ─────────────────────────────────────────────────────────────────────────────
// Dose colours — ONE resolver for the whole app.
//
// A dose chip, badge, dot or chart marker carries the colour the manufacturer
// itself uses for that strength or pen. That colour is stored on the catalogue
// entry it belongs to (src/lib/medicationConfig.js) as a light and a dark token,
// beside the dose, the source it was checked against and the date it was
// checked. No dose colour is hard-coded in the UI.
//
// Products whose maker publishes no colour system — the compounded products, the
// unapproved peptides and the "Others" entry — use one ordered indigo scale,
// stepping from light to dark with the dose's size so a higher dose reads
// stronger. The steps are fixed, so a dose keeps its step when more strengths
// are added above it.
//
// A dose typed through "+ Other" on a product that does have a scheme is drawn
// as a neutral outline rather than a fill, so a typed amount can never look like
// a labelled strength.
//
// Colour is never the only signal: everywhere a dose colour is drawn, the dose is
// written beside it, so the palette is a recognition cue and nothing more.
// ─────────────────────────────────────────────────────────────────────────────

import { getMedicationConfig } from "./medicationConfig.js";
import { ensureContrast, mixWithWhite, readableTextColor } from "./colorMath.js";

/** The neutral used by a typed dose and by a medication with no scheme. */
export const NEUTRAL_DOSE_COLOR = "#64748B";

// A neutral chip is an outline, not a fill: it carries no strength at all.
const NEUTRAL_OUTLINE = {
  light: { color: "#475569", borderColor: "#CBD5E1" },
  dark: { color: "#C7CBD8", borderColor: "rgba(255, 255, 255, 0.3)" },
};

/**
 * The standard scale: one indigo hue, eight steps, lightest first.
 * Only used where no manufacturer colour system exists, so it never borrows a
 * brand's own colour.
 */
export const STANDARD_SCALE = [
  { light: "#E0E3FE", dark: "#C6CCFD" },
  { light: "#C7D2FE", dark: "#B2B8FB" },
  { light: "#A5B4FC", dark: "#9EA3F9" },
  { light: "#8B95F8", dark: "#8E92F7" },
  { light: "#7A80F2", dark: "#7F81F5" },
  { light: "#6A6CE8", dark: "#7272F0" },
  { light: "#5C5BD9", dark: "#6763E8" },
  { light: "#514FCA", dark: "#5D58DE" },
];

/** The scheme recorded for a product, or null (for sign-off and checks). */
export function getDoseScheme(medication) {
  return getMedicationConfig(medication)?.colorScheme || null;
}

/** true when the maker of this product publishes a dose colour system. */
export function hasOfficialScheme(medication) {
  return getDoseScheme(medication)?.status === "confirmed";
}

/**
 * Every labelled strength of a product: the list on the product itself and, for a
 * product sold in more than one form, the list each form carries. Ozempic's
 * tablet strengths live on its tablet form, so they are drawn in the pack colour
 * the oral formulation carries rather than as a typed dose.
 */
function labelledStrengths(entry) {
  return [
    ...entry.allowedDoses,
    ...(entry.forms || []).flatMap((form) => form.doses || []),
  ];
}

/**
 * The dose's step on the standard scale, 1 being the product's lowest dose.
 * A product with no labelled strengths has no scale to step along, so it sits on
 * step 1 rather than implying a strength it does not have.
 */
function standardStep(entry, value) {
  const max = Number(entry?.maxDoseMg);
  if (Number.isFinite(max) && max > 0) {
    // The tiny epsilon keeps a dose that lands exactly on a boundary (7/8 of the
    // maximum, say) on its own step: in floating point the product lands a hair
    // over the whole number, which would push it onto the step above.
    const step = Math.ceil((value / max) * STANDARD_SCALE.length - 1e-9);
    return Math.min(STANDARD_SCALE.length, Math.max(1, step));
  }
  return 1;
}

/**
 * The colour token for a dose: the maker's own where the dose is a labelled
 * strength, the standard scale where the product has no colour system, and null
 * where a dose is typed rather than labelled (or the medication is unknown).
 */
export function getDoseToken(medication, dose) {
  const entry = getMedicationConfig(medication);
  const value = Number(dose);
  if (!entry || !Number.isFinite(value) || value <= 0) return null;
  if (entry.colorScheme?.status === "confirmed") {
    const labelled = labelledStrengths(entry).find((d) => Math.abs(Number(d.value) - value) < 1e-9);
    return labelled?.color || null;
  }
  return STANDARD_SCALE[standardStep(entry, value) - 1];
}

/** true when this dose is not one of the product's own labelled strengths. */
export function isCustomDose(medication, dose) {
  return hasOfficialScheme(medication) && !getDoseToken(medication, dose);
}

/** The neutral outlined chip, in the theme in use. */
export function getNeutralDoseStyle(isDark = false) {
  const token = isDark ? NEUTRAL_OUTLINE.dark : NEUTRAL_OUTLINE.light;
  return { background: "transparent", color: token.color, borderColor: token.borderColor };
}

/** The colour for a dot or chart marker (a neutral slate where none applies). */
export function getDoseColor(medication, dose, isDark = false) {
  const token = getDoseToken(medication, dose);
  if (!token) return NEUTRAL_DOSE_COLOR;
  return isDark ? token.dark : token.light;
}

/**
 * A filled chip for a labelled strength, or the neutral outline for anything
 * else. The returned text colour always meets WCAG AA on the returned
 * background, the hue kept as the maker drew it.
 */
export function getDoseStyle(medication, dose, isDark = false) {
  const token = getDoseToken(medication, dose);
  if (!token) return getNeutralDoseStyle(isDark);
  return ensureContrast(isDark ? token.dark : token.light);
}

/**
 * The print-safe swatch for the written report: the colour as a pale tint with
 * near-black text, so it stays readable in colour, in greyscale and on paper.
 * The dose value is always printed beside it.
 */
export function getPrintDoseStyle(medication, dose) {
  const token = getDoseToken(medication, dose);
  if (!token) return { background: "#FFFFFF", color: "#111827", borderColor: "#94A3B8" };
  return { background: mixWithWhite(token.light, 0.82), color: "#111827", borderColor: token.light };
}

/** White or dark text for a raw colour (chart labels, report tables). */
export function getDoseTextColor(hex) {
  return readableTextColor(hex);
}

/** The dose as text — always shown next to the colour. */
export function getDoseLabel(medication, dose, unit) {
  const value = Number(dose);
  if (!Number.isFinite(value) || value <= 0) return "";
  const resolvedUnit = unit || getMedicationConfig(medication)?.allowedDoses?.[0]?.unit || "mg";
  return `${value} ${resolvedUnit}`;
}

/** The dose colours used by a set of shot-like records, for chart legends. */
export function getDoseLegend(shots = [], isDark = false) {
  const seen = new Map();
  shots.forEach((s) => {
    if (!s || s.dose == null) return;
    const key = `${s.medication || ""}|${Number(s.dose)}`;
    if (seen.has(key)) return;
    const token = getDoseToken(s.medication, s.dose);
    seen.set(key, {
      key,
      medication: s.medication || "",
      dose: Number(s.dose),
      unit: s.dose_unit || "mg",
      label: getDoseLabel(s.medication, s.dose, s.dose_unit),
      color: token ? (isDark ? token.dark : token.light) : NEUTRAL_DOSE_COLOR,
      neutral: !token,
    });
  });
  return [...seen.values()].sort((a, b) => a.dose - b.dose);
}