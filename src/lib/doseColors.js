// ─────────────────────────────────────────────────────────────────────────────
// Dose colours — ONE central config.
//
// A dose chip, badge, dot or chart marker carries the colour the manufacturer
// itself uses for that strength (see OFFICIAL_DOSE_COLORS below), so what the
// person sees in Levli matches the pen, tablet carton or box in their hand.
//
// Where a manufacturer publishes no per-strength colour — or the dose is not one
// of the product's labelled strengths — the neutral fallback ladder is used.
//
// Colour is never the only signal: every place a dose colour is shown also shows
// the dose as text (chips, badges, chart legends), and getDoseLabel() supplies
// that text. Several official colours are red or magenta by the manufacturer's
// own design (Ozempic 0.5 mg, Rybelsus 7 mg, Wegovy 0.5 mg); those are
// reproduced faithfully rather than reinterpreted as an error state.
// ─────────────────────────────────────────────────────────────────────────────

import { getAllowedDoses, getMedicationConfig } from "@/lib/medicationConfig";

// ── Official manufacturer colours ─────────────────────────────────────────────
// Keyed by the config id (src/lib/medicationConfig.js) and the labelled strength.
// Every set was read from the manufacturer's own material — the pen itself, its
// carton, or Novo Nordisk's own strength chart. A product whose maker publishes
// no per-strength colour is deliberately absent, so it falls to the ladder
// rather than wearing a colour nobody printed.
export const OFFICIAL_DOSE_COLORS = {
  // Novo Nordisk Ozempic — one pen per strength, colour on the pen label.
  ozempic: {
    0.25: "#00857D",
    0.5: "#E11928",
    1: "#009775",
    2: "#E3B03C",
  },
  // Novo Nordisk Wegovy single-dose pen — pen label and carton colour.
  wegovy: {
    0.25: "#46B1A8",
    0.5: "#BC3879",
    1: "#A56831",
    1.7: "#006F95",
    2.4: "#2B383D",
  },
  // Lilly Mounjaro KwikPen — cap and label colour per strength.
  mounjaro: {
    2.5: "#75787B",
    5: "#592C7F",
    7.5: "#00857D",
    10: "#D45780",
    12.5: "#0069A0",
    15: "#F58233",
  },
  // Novo Nordisk Rybelsus — the carton's colour band per strength.
  rybelsus: {
    3: "#009639",
    7: "#E32D1C",
    14: "#0082CA",
  },
  // Novo Nordisk Saxenda — one pen delivers every strength, so its single label
  // and dose-knob accent colour identifies the product, not a strength.
  saxenda: {
    0.6: "#4A37A5",
    1.2: "#4A37A5",
    1.8: "#4A37A5",
    2.4: "#4A37A5",
    3: "#4A37A5",
  },
};

// The fallback for a product with no published per-strength colour (Zepbound,
// Victoza, Trulicity, the compounded products) and for a dose that isn't one of
// a product's labelled strengths. Low → high ladder, step 1 first: light indigo
// through to burnt orange, stepped against the product's own strength list.
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

/** The manufacturer's own colour for this labelled strength, or null. */
export function getOfficialDoseColor(medication, dose) {
  const id = getMedicationConfig(medication)?.id;
  const byDose = id ? OFFICIAL_DOSE_COLORS[id] : null;
  const value = Number(dose);
  if (!byDose || !Number.isFinite(value)) return null;
  const key = Object.keys(byDose).find((k) => Number(k) === value);
  return key ? byDose[key] : null;
}

/** The colour that represents this dose: the label's own colour where the
    manufacturer publishes one, otherwise the fallback ladder. */
export function getDoseColor(medication, dose) {
  const official = getOfficialDoseColor(medication, dose);
  if (official) return official;
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