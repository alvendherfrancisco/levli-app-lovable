// Pharmacokinetic helpers — a single-compartment, first-order elimination model
// driven by the doses actually logged.
//
// What the model does:
//   · each logged dose contributes  dose × 0.5^(days since / half-life)
//   · the amounts are summed (superposition)
//   · absorption is treated as instantaneous, and one fixed volume of
//     distribution is assumed, so the summed amount is proportional to the
//     concentration the label's half-life describes
//   · only doses inside the last five half-lives are used — anything older
//     contributes less than 3% and would only add noise
//
// Everything here is modelled relative exposure, never a measured blood level.
// The calculation version is exported so a displayed figure can be traced.

export const PK_CALCULATION_VERSION = "pk-v2";

/** Doses older than this many half-lives are outside the model window. */
export const MODEL_WINDOW_HALF_LIVES = 5;

/** Relative amount remaining from one dose: A(t) = D × 0.5^(t / t½). */
export function remainingAtDays(dose, halfLifeDays, daysSinceDose) {
  if (!dose || daysSinceDose < 0 || !halfLifeDays || halfLifeDays <= 0) return 0;
  return dose * Math.pow(0.5, daysSinceDose / halfLifeDays);
}

/** The model window in days for a half-life. */
export function windowDays(halfLifeDays) {
  if (!halfLifeDays || halfLifeDays <= 0) return 0;
  return halfLifeDays * MODEL_WINDOW_HALF_LIVES;
}

/** Doses that still contribute at `atDate`, i.e. inside the model window. */
export function recentDoses(doses = [], halfLifeDays, atDate = new Date()) {
  const limit = windowDays(halfLifeDays);
  if (!limit) return [];
  return doses.filter((d) => {
    const days = (atDate - d.date) / 86400000;
    return days >= 0 && days <= limit;
  });
}

/** Summed relative amount at `atDate` (relative exposure). */
export function superposition(doses, halfLifeDays, atDate) {
  if (!halfLifeDays || halfLifeDays <= 0) return 0;
  let total = 0;
  for (const d of doses) {
    const daysSince = (atDate - d.date) / 86400000;
    if (daysSince >= 0) total += remainingAtDays(d.dose, halfLifeDays, daysSince);
  }
  return total;
}

/**
 * The amount immediately after a dose once dosing has gone on forever at a
 * fixed interval: D / (1 − 0.5^(τ / t½)). This is the 100% reference the
 * current figure is compared against — it is derived from the dose and interval
 * actually being taken, never a fixed number.
 */
export function steadyStateAmount(dose, halfLifeDays, intervalDays) {
  if (!dose || dose <= 0) return null;
  if (!halfLifeDays || halfLifeDays <= 0) return null;
  if (!intervalDays || intervalDays <= 0) return null;
  return dose / (1 - Math.pow(0.5, intervalDays / halfLifeDays));
}

/**
 * The exposure picture for one medication, built from the doses logged.
 *
 * @param {Array<{date: Date, dose: number}>} doses — every logged dose
 * @returns {{
 *   hasRecentDose: boolean, amount: number, steadyStatePercent: number,
 *   dosesInWindow: number, lastDoseDaysAgo: number|null,
 *   referenceDose: number|null, steadyStateAmount: number|null,
 *   referenceDay: Date|null
 * }}
 */
export function exposureSummary({ doses = [], halfLifeDays, intervalDays, atDate = new Date() }) {
  const empty = {
    hasRecentDose: false, amount: 0, steadyStatePercent: 0, dosesInWindow: 0,
    lastDoseDaysAgo: null, referenceDose: null, steadyStateAmount: null, referenceDay: null,
  };
  if (!halfLifeDays || halfLifeDays <= 0) return empty;

  const inWindow = recentDoses(doses, halfLifeDays, atDate);
  if (!inWindow.length) return empty;

  const amount = superposition(inWindow, halfLifeDays, atDate);
  const latest = inWindow.reduce((a, b) => (b.date > a.date ? b : a));
  const reference = steadyStateAmount(latest.dose, halfLifeDays, intervalDays);
  // The reference is the current dose at the label interval, so this falls as
  // doses are missed and rises as a dose is stepped up.
  const percent = reference
    ? Math.max(0, Math.min(100, Math.round((amount / reference) * 100)))
    : 0;

  return {
    hasRecentDose: true,
    amount,
    steadyStatePercent: percent,
    dosesInWindow: inWindow.length,
    lastDoseDaysAgo: Math.max(0, Math.floor((atDate - latest.date) / 86400000)),
    referenceDose: latest.dose,
    steadyStateAmount: reference,
    referenceDay: latest.date,
  };
}