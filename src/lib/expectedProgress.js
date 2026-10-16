import { lossFraction, seriesEndWeek, seriesKeyForMedication } from "@/lib/expectedCurve";
import { fromKg } from "@/lib/measure";

/**
 * The data behind the one weight graph: the user's own logged weights, their
 * 7-day average and the expected GLP-1 curve, laid out on a single set of x
 * positions so they can be read against each other.
 *
 * Time is measured in WEEKS FROM THE FIRST LOGGED WEIGHT, which is where the
 * expected curve starts: week 0 is that first entry at 0% loss, and every later
 * week reads that fraction off the curve (see src/lib/expectedCurve.js).
 *
 * A row is built for every DAY of the range, so a weight logged mid-week sits on
 * its own day, and the 7-day average is the average of the logged entries either
 * side of it. The window ends today, so the ranges keep meaning "the last 30,
 * 180 or 365 days"; a brand-new history gets two weeks of axis to itself rather
 * than a single point.
 *
 * "Since start" (daysBack null) is the exception: it runs from the first logged
 * weight and draws the whole curve to its own last week, so the long view ahead
 * is there. The 30-day range hides the curve — four weeks of a two-year curve is
 * a flat line that tells the user nothing.
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

const round1 = (v) => Math.round(v * 10) / 10;

/** A week offset as the short date the axis shows: "Oct 15". */
export function shortDateLabel(startKey, week) {
  const d = dateAtWeek(startKey, week);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

/** A stored day key written out in full: "Oct 12, 2027". */
export function fullDateLabel(key) {
  const d = dayOf(key);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

/**
 * Builds the graph's data from the full weight history, the profile and the
 * shots (the latest shot's medication decides which curve the user is compared
 * with). Returns null when no weight has ever been logged.
 */
export function buildWeightProgress({ weightHistory = [], profile, shots = [], unit = "lb", daysBack = null }) {
  if (!weightHistory.length) return null;

  const first = weightHistory[0];
  const last = weightHistory[weightHistory.length - 1];
  const medication = shots[0]?.medication || profile?.default_medication || "";
  const seriesKey = seriesKeyForMedication(medication, shots[0]?.route);
  const seriesEnd = seriesEndWeek(seriesKey);
  const showCurve = daysBack != null;

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayWeek = Math.max(0, (today - dayOf(first.date)) / WEEK_MS);
  // "Since start" runs the whole history out to the end of the curve — or to
  // today, when the user has already gone past it. Every other range is the last
  // N days, ending today.
  const startWeek = showCurve ? Math.max(0, todayWeek - daysBack / 7) : 0;
  const roughEnd = showCurve ? todayWeek : Math.max(todayWeek, seriesEnd);

  const startDay = Math.round(startWeek * 7);
  const endDay = Math.round(Math.max(roughEnd, startWeek + 2) * 7);
  const windowStart = startDay / 7;
  const windowEnd = endDay / 7;

  const byDay = {};
  weightHistory.forEach((entry) => { byDay[entry.date] = entry.weight; });

  const rows = [];
  for (let offset = startDay; offset <= endDay; offset++) {
    const key = dayKeyOf(dateAtWeek(first.date, offset / 7));
    rows.push({ week: offset / 7, isoDate: key, weight: byDay[key] ?? null, rollingAvg: null, expected: null });
  }

  // The 7-day rolling average, over the logged entries themselves.
  const logged = rows.filter((r) => r.weight != null);
  logged.forEach((row, i) => {
    const window = logged.slice(Math.max(0, i - 6), i + 1);
    row.rollingAvg = round1(window.reduce((a, r) => a + r.weight, 0) / window.length);
  });

  if (showCurve) {
    rows.forEach((row) => {
      if (row.week > seriesEnd) return;
      row.expected = round1(fromKg(first.kg * (1 - lossFraction(seriesKey, row.week)), unit));
    });
  }

  return {
    seriesKey, seriesEnd, showCurve,
    startKey: first.date,
    windowStart,
    windowEnd,
    rows,
    goalKg: profile?.goal_weight_kg ?? null,
    startKg: first.kg,
    currentKg: last.kg,
    lostKg: first.kg - last.kg,
    loggedCount: logged.length,
  };
}