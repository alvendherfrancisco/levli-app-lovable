import { lossFraction, seriesEndWeek, seriesKeyForMedication } from "@/lib/expectedCurve";
import { fromKg } from "@/lib/measure";

/**
 * The data behind the one weight graph: the user's own logged weights, their
 * 7-day average and the expected GLP-1 curve, laid out on a single set of x
 * positions so they can be read against each other.
 *
 * Time is measured in WEEKS FROM THE FIRST LOGGED WEIGHT, which is where the
 * expected curve starts: week 0 is that first entry at 0% loss, and every later
 * week reads that fraction off the curve (see src/lib/expectedCurve.js). A range
 * that reaches back further than that first entry therefore begins at a NEGATIVE
 * week — the axis is always the calendar range the user asked for, and the part
 * before their first logged weight is simply empty.
 *
 * A range is that calendar window: the last 30, 180 or 365 days up to today, in
 * full, whatever the length of the history, so choosing a tab changes the axis
 * and the entries it carries. The 7-day average is taken over the logged entries
 * themselves, either side of each one.
 *
 * "Since start" (daysBack null) is the exception: it runs from the first logged
 * weight rather than the last N days, out to the end of the curve (or to today,
 * when the user has already gone past it), so the long view ahead is on screen.
 *
 * showCurve (false on the card's 30-day range) drops the expected values
 * altogether: four weeks of a two-year curve is a flat line that adds nothing.
 *
 * The expected curve starts at the first logged weight, follows the typical
 * shape, and flattens at the goal weight from the profile, which is a floor it
 * never crosses. Where the typical curve ends above the goal it simply stays
 * above it: it is never stretched down to hit the goal on a date.
 *
 * Values are in the unit the profile displays (kg or lb), so the chart, the
 * tooltip and the goal line are all in one unit.
 */
const DAY_MS = 86400000;
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

/**
 * The date a tick lands on, written the way its range reads: dates ("Oct 15") on
 * a month or so, months ("Oct") on the longer half-year, and months with their
 * year ("Oct '26") on a range of a year or more — where the year is what tells
 * the two ends of the range apart. Every form is short enough to sit under the
 * axis without being cut off.
 */
export function weekAxisLabel(startKey, week, spanDays) {
  const d = dateAtWeek(startKey, week);
  const month = MONTHS[d.getMonth()];
  if (spanDays <= 45) return `${month} ${d.getDate()}`;
  if (spanDays <= 200) return month;
  return `${month} '${String(d.getFullYear()).slice(2)}`;
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
export function buildWeightProgress({ weightHistory = [], profile, shots = [], unit = "lb", daysBack = null, showCurve = true }) {
  if (!weightHistory.length) return null;

  const first = weightHistory[0];
  const last = weightHistory[weightHistory.length - 1];
  const medication = shots[0]?.medication || profile?.default_medication || "";
  const seriesKey = seriesKeyForMedication(medication, shots[0]?.route);
  const seriesEnd = seriesEndWeek(seriesKey);
  const sinceStart = daysBack == null;

  const today = new Date(); today.setHours(0, 0, 0, 0);
  // Days from the first logged weight to today. The day ranges are measured from
  // today, so this is what a range hangs off — and because a range is a window of
  // calendar days rather than of history, its start can fall before that first
  // entry, which is the negative week the axis then begins at.
  const todayDay = Math.max(0, Math.round((today - dayOf(first.date)) / DAY_MS));

  const startDay = sinceStart ? 0 : todayDay - Math.round(daysBack);
  const endDay = sinceStart ? Math.max(todayDay, Math.round(seriesEnd * 7)) : todayDay;

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

  // The goal is a floor the curve settles on rather than a date it is stretched
  // to. A goal at or above the starting weight is not a target the curve can
  // flatten onto, so it is left out of the comparison.
  const goalKg = profile?.goal_weight_kg ?? null;
  const goalBelowStart = goalKg != null && goalKg < first.kg;

  if (showCurve) {
    rows.forEach((row) => {
      // Nothing before the first logged weight, and nothing past the typical
      // curve's own last week: the curve is never extended beyond its data.
      if (row.week < 0 || row.week > seriesEnd) return;
      const kg = first.kg * (1 - lossFraction(seriesKey, row.week));
      row.expected = round1(fromKg(goalBelowStart ? Math.max(goalKg, kg) : kg, unit));
    });
  }

  return {
    seriesKey, seriesEnd, showCurve,
    startKey: first.date,
    windowStart: startDay / 7,
    windowEnd: endDay / 7,
    rows,
    goalKg,
    startKg: first.kg,
    currentKg: last.kg,
    lostKg: first.kg - last.kg,
    loggedCount: logged.length,
  };
}