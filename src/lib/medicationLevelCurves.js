// ─────────────────────────────────────────────────────────────────────────────
// The level curves, baked into the app.
//
// Taken once from "Daily_Bloodlevels.xlsx" — its "Single dose" sheet — and never
// read at run time. Each figure is one day after a dose, as a share of that
// dose's own peak:
//
//   day 0   the day the dose is taken — the sheet carries 0 there
//   day 1…  % of the peak of a single dose
//
// Two curves: tirzepatide (Mounjaro® / Zepbound®) and semaglutide (Wegovy® /
// Ozempic®). Both tables run to day 49; past that a dose's share is a rounding
// error, so it counts as nothing.
//
// Checked against the same file's "Weekly dosing" sheet, which adds a dose every
// seven days: this table, added up per dose on that schedule, reproduces its
// figure day for day (tirzepatide day 8: 0.9637 + 0.4324 = 1.3961; semaglutide
// day 9: 0.9803 + 0.5868 = 1.5671).
// ─────────────────────────────────────────────────────────────────────────────

/** The last day the tables carry. Beyond it a dose contributes nothing. */
export const CURVE_LAST_DAY = 49;

// prettier-ignore
const TIRZEPATIDE_VALUES = [
  0, 0.9637, 0.9694, 0.8615, 0.7524, 0.6553, 0.5705, 0.4967, 0.4324, 0.3764,
  0.3277, 0.2853, 0.2483, 0.2162, 0.1882, 0.1638, 0.1426, 0.1242, 0.1081, 0.0941,
  0.0819, 0.0713, 0.0621, 0.0540, 0.0471, 0.0410, 0.0357, 0.0310, 0.0270, 0.0235,
  0.0205, 0.0178, 0.0155, 0.0135, 0.0118, 0.0102, 0.0089, 0.0078, 0.0068, 0.0059,
  0.0051, 0.0045, 0.0039, 0.0034, 0.0029, 0.0026, 0.0022, 0.0019, 0.0017, 0.0015,
];

// prettier-ignore
const SEMAGLUTIDE_VALUES = [
  0, 0.7697, 0.9803, 0.9920, 0.9368, 0.8626, 0.7865, 0.7142, 0.6476, 0.5868,
  0.5316, 0.4815, 0.4361, 0.3950, 0.3578, 0.3240, 0.2935, 0.2658, 0.2408, 0.2181,
  0.1975, 0.1789, 0.1620, 0.1467, 0.1329, 0.1204, 0.1090, 0.0988, 0.0894, 0.0810,
  0.0734, 0.0665, 0.0602, 0.0545, 0.0494, 0.0447, 0.0405, 0.0367, 0.0332, 0.0301,
  0.0273, 0.0247, 0.0224, 0.0203, 0.0183, 0.0166, 0.0150, 0.0136, 0.0123, 0.0112,
];

// The lines said under the graph, in the sheet's own words — "may" and "can",
// never "will" — for the days both curves share. The sheet's own appetite note
// marks days 6 and 7 of a weekly cycle as the point where appetite can come back
// a little, and its washout notes carry the rest.
const SHARED_NOTES = [
  { from: 0, to: 0, text: "Absorption starts today. There is no single moment of peak." },
  { from: 3, to: 3, text: "The level is in its peak window. Satiety effects may emerge; GI symptoms are possible." },
  { from: 4, to: 5, text: "The level is coming down, though effects can persist as it falls." },
  { from: 6, to: 7, text: "A small increase in appetite can occur around day 6 to 7." },
  { from: 8, to: 21, text: "The level keeps falling without another dose. How long the effects last can vary." },
  { from: 22, to: null, text: "Only a low level remains and it is still coming down. A low level does not always mean the effect has gone." },
];

export const MEDICATION_CURVES = {
  tirzepatide: {
    id: "tirzepatide",
    label: "Tirzepatide",
    // The day the table peaks on, which is what the phase is read from.
    peakDay: 2,
    values: TIRZEPATIDE_VALUES,
    notes: [
      { from: 1, to: 2, text: "Hunger and food noise may be reduced." },
    ],
  },
  semaglutide: {
    id: "semaglutide",
    label: "Semaglutide",
    peakDay: 3,
    values: SEMAGLUTIDE_VALUES,
    notes: [
      { from: 1, to: 1, text: "Hunger and food noise may be reduced a little." },
      { from: 2, to: 2, text: "The greatest reduction in hunger and food noise may occur around now." },
    ],
  },
};

/** One dose's share of its own peak, `daysSince` days after it was taken. */
export function curveValue(curve, daysSince) {
  if (!curve || !Number.isFinite(daysSince)) return 0;
  const day = Math.floor(daysSince);
  if (day < 0 || day > CURVE_LAST_DAY) return 0;
  return curve.values[day] || 0;
}

/** The line said under the graph for the day in hand, in the sheet's wording. */
export function levelNote(curve, daysSince) {
  if (!curve) return "";
  const day = Math.max(0, Math.floor(daysSince || 0));
  const all = [...curve.notes, ...SHARED_NOTES];
  const match = all.find((n) => day >= n.from && (n.to == null || day <= n.to));
  return (match || SHARED_NOTES[SHARED_NOTES.length - 1]).text;
}