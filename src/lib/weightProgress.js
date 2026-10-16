import { lossFraction, seriesKeyForMedication } from "@/lib/expectedCurve";
import { fromKg } from "@/lib/measure";

/**
 * The numbers behind Home's Weight Progress card: the recent weights with the
 * typical GLP-1 curve alongside them for the mini trend, how far along the goal
 * the user is, and the card's one line of encouragement.
 *
 * Everything is read from what the Insights page reads — the weight history, the
 * profile and the shots — and in the unit the profile displays, so the card and
 * the page can never disagree.
 */

/** How many recent weigh-ins the card's mini trend is drawn from. */
export const SPARK_POINTS = 12;

const DAY_MS = 86400000;

/** A stored day key ("2026-10-12") as a local date. */
function dayOf(key) {
  const [y, m, d] = String(key || "").split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

/** The goal set on the profile, in kilograms, or null when none is set. */
export function goalKgOf(profile) {
  const kg = parseFloat(profile?.goal_weight_kg);
  return Number.isFinite(kg) ? kg : null;
}

/**
 * The last `limit` logged weights, oldest first, in the display unit, with the
 * typical GLP-1 curve read at each of those same days (see
 * src/lib/expectedCurve.js). The curve starts at the first weight ever logged, so
 * it is measured from there, and it is floored at the goal rather than crossing
 * it — the same rule the Insights chart draws it with.
 *
 * With fewer than two weights there is no trend; `points` comes back short and
 * the card shows its own placeholder instead.
 */
export function trendSeries(weightHistory = [], { unit, profile, shots, limit = SPARK_POINTS } = {}) {
  const recent = weightHistory.slice(-limit);
  const first = weightHistory[0];
  const points = [];
  const expected = [];
  if (!first) return { points, expected };

  const medication = shots?.[0]?.medication || profile?.default_medication || "";
  const key = seriesKeyForMedication(medication, shots?.[0]?.route);
  const goalKg = goalKgOf(profile);
  const floored = goalKg != null && goalKg < first.kg;

  recent.forEach((entry) => {
    points.push(fromKg(entry.kg, unit));
    const weeks = (dayOf(entry.date) - dayOf(first.date)) / (7 * DAY_MS);
    const curveKg = first.kg * (1 - lossFraction(key, weeks));
    expected.push(fromKg(floored ? Math.max(goalKg, curveKg) : curveKg, unit));
  });

  return { points, expected };
}

/**
 * How much of the way from the first logged weight to the goal has been covered,
 * as a whole percentage between 0 and 100. Null when there is nothing to measure:
 * no goal at all, or a goal that is not below the starting weight, where a share
 * of the way there would not mean anything.
 */
export function goalPercent(startKg, currentKg, goalKg) {
  if (startKg == null || currentKg == null || goalKg == null || startKg <= goalKg) return null;
  const pct = ((startKg - currentKg) / (startKg - goalKg)) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

/**
 * The one short line under the card, chosen from what is actually true: the goal
 * reached, a steady month of weigh-ins, the share of the way there, and failing
 * all of those the plain nudge to log the next one. Factual, and never a
 * celebration of a number that has not moved.
 */
export function motivationLine({ reachedGoal, weighInsThisMonth, goalPct }) {
  if (reachedGoal) return "You've reached your goal weight";
  if (weighInsThisMonth >= 4) return `Great consistency, ${weighInsThisMonth} weigh-ins this month`;
  if (goalPct != null && goalPct >= 1) return `You're ${goalPct}% of the way there`;
  return "Log your next weight to see your trend";
}