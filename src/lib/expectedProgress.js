import { lossFraction, seriesEndWeek, seriesKeyForMedication } from "@/lib/expectedCurve";
import { fromKg } from "@/lib/measure";

/**
 * The data behind the Expected Progress card: the user's own logged weights and
 * the expected GLP-1 curve, laid out on one set of x positions so the two can be
 * read against each other.
 *
 * Time is measured in WEEKS FROM THE FIRST LOGGED WEIGHT, which is where the
 * expected curve starts: week 0 is that first entry at 0% loss, and every later
 * week reads that fraction off the curve (see src/lib/expectedCurve.js).
 *
 * The window reaches the curve's own last week and no further, so a series that
 * stops at week 64 is not drawn past it. It always shows the progress made so
 * far plus room ahead: a quarter of the elapsed time again, with a floor of 24
 * weeks, so an early curve is not squeezed into a sliver.
 *
 * Values are in the unit the profile displays (kg or lb), so the chart, the
 * tooltip and the goal line are all in one unit.
 */
const DAY_MS = 86400000;
const WEEK_MS = 7 * DAY_MS;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** A stored day key ("2026-03-04") as a local date. */
function dayOf(key) {
  const [y, m, d] = String(key || "").split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

/** The date a week offset from the first logged weight lands on. */
function dateAtWeek(startKey, week) {
  const d = dayOf(startKey);
  d.setDate(d.getDate() + Math.round(week * 7));
  return d;
}

const dayKeyOf = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** A week offset as the short date an axis shows: "Nov '25". */
export function weekAxisLabel(startKey, week) {
  const d = dateAtWeek(startKey, week);
  return `${MONTHS[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`;
}

/** A stored day key written out in full: "Oct 12, 2027". */
export function fullDateLabel(key) {
  const d = dayOf(key);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

/**
 * Builds the card's data from the full weight history, the profile and the shots
 * (the latest shot's medication decides which curve the user is compared with).
 * Returns null when no weight has ever been logged.
 */
export function buildExpectedProgress({ weightHistory = [], profile, shots = [], unit = "lb" }) {
  if (!weightHistory.length) return null;

  const first = weightHistory[0];
  const last = weightHistory[weightHistory.length - 1];
  const medication = shots[0]?.medication || profile?.default_medication || "";
  const seriesKey = seriesKeyForMedication(medication, shots[0]?.route);
  const seriesEnd = seriesEndWeek(seriesKey);

  const elapsedWeeks = Math.max(0, (dayOf(last.date) - dayOf(first.date)) / WEEK_MS);
  const ahead = Math.max(24, Math.ceil(elapsedWeeks * 1.5));
  const horizon = Math.max(Math.ceil(elapsedWeeks), Math.min(ahead, seriesEnd));

  // One x per week of the curve, plus one at each logged weight's own position,
  // so a weight logged mid-week sits where it happened.
  const byWeek = new Map();
  const pointAt = (week) => {
    const key = Math.round(week * 1000) / 1000;
    if (!byWeek.has(key)) {
      byWeek.set(key, { week: key, isoDate: dayKeyOf(dateAtWeek(first.date, key)), expected: null, actual: null });
    }
    return byWeek.get(key);
  };

  for (let w = 0; w <= Math.min(horizon, seriesEnd); w++) pointAt(w);

  weightHistory.forEach((entry) => {
    const week = Math.max(0, (dayOf(entry.date) - dayOf(first.date)) / WEEK_MS);
    pointAt(week).actual = fromKg(entry.kg, unit);
  });

  const points = [...byWeek.values()].sort((a, b) => a.week - b.week);
  points.forEach((p) => {
    p.expected = p.week > seriesEnd
      ? null
      : fromKg(first.kg * (1 - lossFraction(seriesKey, p.week)), unit);
  });

  return {
    seriesKey,
    seriesEnd,
    horizon,
    unit,
    points,
    startKey: first.date,
    startKg: first.kg,
    currentKg: last.kg,
    lostKg: first.kg - last.kg,
    goalKg: profile?.goal_weight_kg ?? null,
    loggedCount: weightHistory.length,
  };
}