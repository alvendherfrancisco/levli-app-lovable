// ─────────────────────────────────────────────────────────────────────────────
// What the Medication Level card and Home's level line show.
//
// One dose's typical shape is a table (src/lib/medicationLevelCurves.js), and the
// level on any day is those shapes added together — one for every dose the user
// has logged, counted from the day it was taken. That is what makes the level
// build up over the first weeks of a weekly schedule, and it is checked against
// the workbook's "Weekly dosing" sheet day for day.
//
// Two of the tables — oral semaglutide and orforglipron — are the app's own
// estimate rather than a published curve, and carry `estimated` for the card to
// say so. Both are taken once a day, which is what `daily` marks: the level
// climbs to a steady figure and holds, instead of rising and falling around each
// dose.
//
// Everything reads the same dose data the Shots screen does, so a dose added,
// edited or deleted — a past one included — moves the graph, the Home line and
// the phase at once. The figure is a share of the peak of one dose, so it passes
// 100% when doses stack, and it is never a blood-test result.
// ─────────────────────────────────────────────────────────────────────────────

import { MEDICATION_CURVES, curveValue, levelNote } from "@/lib/medicationLevelCurves";
import { shotsOfMedication } from "@/lib/medicationLink";
import { isOralMedication, plainBrandName } from "@/lib/medicationConfig";
import { addDaysToKey } from "@/lib/repeatSchedule";
import { calendarDaysBetween, parseShotDate, toDayKey, todayKey } from "@/lib/dateUtils";

/** The ranges the card offers, and how far back each one reaches. */
export const LEVEL_RANGES = { "7 days": 7, "30 days": 30, "90 days": 90 };
export const DEFAULT_LEVEL_RANGE = "30 days";

/** How each phase is drawn: a warm word for rising, indigo at the peak, amber on
 *  the way down, and a quiet grey once little is left. */
export const PHASE_TONE = {
  Rising: "bg-teal-50 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300",
  "Peak window": "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300",
  Declining: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  Low: "bg-gray-100 text-gray-600 dark:bg-white/[0.06] dark:text-[#9A9DAE]",
  // The phase an oral product settles into: taken every day, it holds its level
  // rather than rising and falling around each dose.
  Steady: "bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
};

// Which curve a brand or generic name follows — the one table that answers it.
// Mounjaro®, Zepbound® and tirzepatide are the same molecule; so are Wegovy®,
// Ozempic® and semaglutide. Anything else the app carries has no curve yet.
const CURVE_BY_NAME = {
  mounjaro: "tirzepatide",
  zepbound: "tirzepatide",
  tirzepatide: "tirzepatide",
  wegovy: "semaglutide",
  ozempic: "semaglutide",
  semaglutide: "semaglutide",
};

/** The curve a product follows, or null when the app has none for it. */
export function curveForMedication(name, route) {
  if (!name) return null;
  const key = plainBrandName(name).toLowerCase().trim();
  // A product taken by mouth has no injection curve — a tablet is not the shape
  // those tables describe. Two of them have an estimated shape of their own
  // (see medicationLevelCurves: the card marks it as the app's own estimate);
  // anything else taken by mouth has none yet.
  if (isOralMedication(name, route)) {
    if (key === "rybelsus" || key === "wegovy" || key === "ozempic" || key.startsWith("semaglutide")) {
      return MEDICATION_CURVES.oral_semaglutide;
    }
    if (key === "foundayo" || key.startsWith("orforglipron")) return MEDICATION_CURVES.orforglipron;
    return null;
  }
  // A compounded or generic entry names its molecule first ("Semaglutide
  // (generic / compounded)"), and it is the same molecule the curve follows.
  const id = CURVE_BY_NAME[key]
    || (key.startsWith("semaglutide") ? "semaglutide" : null)
    || (key.startsWith("tirzepatide") ? "tirzepatide" : null);
  return id ? MEDICATION_CURVES[id] : null;
}

/**
 * The curve this medication is logged against. The form the person actually logs
 * wins over the catalogue: someone taking the Wegovy® tablet has no pen curve,
 * and someone logging a pen has one whatever the regimen's own route says.
 */
export function levelCurveFor(medication, shots = []) {
  if (!medication) return null;
  const mine = shotsOfMedication(shots, medication);
  const loggedRoute = mine.find((s) => s.route)?.route || "";
  return curveForMedication(medication.medication_name, loggedRoute || medication.route || "");
}

/**
 * The medications the card can draw, in the order they are held. When nothing
 * has been set up yet the account's own default medication is used, so a new
 * account sees the card — and its example curve — rather than nothing.
 */
export function levelMedicationOptions({ medications = [], shots = [], profile = null }) {
  // An archived regimen is off the schedule and out of the shot pickers, so it is
  // not offered here either. Its logged doses stay in History and in the reports.
  const supported = medications
    .filter((m) => (m.status || "active") !== "archived")
    .filter((m) => levelCurveFor(m, shots))
    .map((m) => ({ id: m.id || m.medication_name, name: m.medication_name, medication: m }));
  if (supported.length || medications.length) return supported;

  const fallback = profile?.default_medication;
  if (fallback && curveForMedication(fallback)) {
    return [{ id: "default", name: fallback, medication: { medication_name: fallback } }];
  }
  return [];
}

/**
 * Which of the offered medications the card opens on: the one whose most recent
 * dose is newest, so the graph starts on what the person is actually taking. With
 * nothing logged yet it is simply the first.
 */
export function defaultLevelMedication(options = [], shots = []) {
  let best = options[0] || null;
  let bestKey = "";
  options.forEach((option) => {
    const keys = shotsOfMedication(shots, option.medication)
      .map((shot) => toDayKey(parseShotDate(shot.date)) || "");
    const last = keys.sort().pop() || "";
    if (last > bestKey) { best = option; bestKey = last; }
  });
  return best;
}

/** The phase the person is in, read from the last dose and what is left. */
export function phaseFor({ daysSinceLast, level, curve, dosesLogged = 0 }) {
  if (daysSinceLast == null || !curve) return null;
  if (level != null && level <= 15) return "Low";
  // An oral product is taken every day: its level climbs towards its steady
  // figure over the first week of doses and then holds there.
  if (curve.daily) return dosesLogged >= 7 ? "Steady" : "Rising";
  if (daysSinceLast <= curve.peakDay - 1) return "Rising";
  if (daysSinceLast <= curve.peakDay + 1) return "Peak window";
  return "Declining";
}

const round1 = (value) => Math.round(value * 10) / 10;

/** Days since the most recent dose taken on or before `key`, or null. */
function daysSinceDoseBefore(doses, key) {
  let last = null;
  for (const dose of doses) {
    if (dose.dayKey <= key) last = dose;
    else break;
  }
  return last ? calendarDaysBetween(last.dayKey, key) : null;
}

/**
 * Everything the graph, the summary and the Home line read.
 *
 * `nextDoseKey` and `intervalDays` come from the medication's own schedule (see
 * medicationLink). The forecast uses them to assume the next dose is taken on
 * time — it is drawn as a dashed continuation and never suggests changing when a
 * dose is taken.
 *
 * Returns `{ supported: false }` for a product the app has no curve for.
 */
export function buildMedicationLevel({
  shots = [],
  medication = null,
  rangeDays = 30,
  nextDoseKey = null,
  intervalDays = null,
  today = todayKey(),
}) {
  const curve = levelCurveFor(medication, shots);
  if (!curve) return { supported: false };

  // One entry per logged dose, oldest first: the day it was taken and how strong
  // it was against the first dose logged for this medication, so a step up in
  // strength scales that dose's own curve.
  const doses = shotsOfMedication(shots, medication)
    .map((shot) => ({
      dayKey: toDayKey(parseShotDate(shot.date)) || "",
      dose: Number(shot.dose) || 0,
      unit: shot.dose_unit || "mg",
    }))
    .filter((dose) => /^\d{4}-\d{2}-\d{2}$/.test(dose.dayKey))
    .sort((a, b) => a.dayKey.localeCompare(b.dayKey));

  const reference = doses[0] || null;
  const drawn = doses.map((dose) => ({
    ...dose,
    scale: reference && reference.dose > 0 && dose.dose > 0 && dose.unit === reference.unit
      ? dose.dose / reference.dose
      : 1,
  }));

  const startKey = addDaysToKey(today, -(rangeDays - 1));
  // Past today the graph is a forecast, and 14 days of it are drawn — 7 when the
  // medication carries no interval, so nothing is assumed that is not known.
  const forecastDays = intervalDays > 0 ? 14 : 7;
  const endKey = addDaysToKey(today, forecastDays);

  const assumed = [];
  if (intervalDays > 0 && nextDoseKey) {
    const lastScale = drawn.length ? drawn[drawn.length - 1].scale : 1;
    let key = nextDoseKey;
    for (let guard = 0; key <= endKey && guard < 8; guard += 1) {
      if (key > today) assumed.push({ dayKey: key, scale: lastScale });
      key = addDaysToKey(key, intervalDays);
    }
  }

  const hasDoses = drawn.length > 0;
  // With nothing logged the card still draws the shape of one dose, faintly, from
  // the start of the range, so the graph has something to say before the first log.
  const sources = hasDoses ? [...drawn, ...assumed] : [{ dayKey: startKey, scale: 1 }];
  // The level is a percentage of a single dose's peak: the shares are added up
  // and read as %, so doses stacking takes it past 100.
  const levelOn = (key) => 100 * sources.reduce(
    (sum, dose) => sum + curveValue(curve, calendarDaysBetween(dose.dayKey, key)) * dose.scale,
    0,
  );

  const doseKeys = new Set(drawn.map((dose) => dose.dayKey));
  const assumedKeys = new Set(assumed.map((dose) => dose.dayKey));

  const points = [];
  for (let key = startKey; key <= endKey; key = addDaysToKey(key, 1)) {
    const past = key <= today;
    const value = round1(levelOn(key));
    points.push({
      key,
      // The solid line is what has happened; the dashed one carries today's value
      // as well, so the two meet exactly.
      level: past ? value : null,
      forecast: past && key !== today ? null : value,
      doseLevel: doseKeys.has(key) ? value : null,
      doseHere: doseKeys.has(key),
      assumedHere: assumedKeys.has(key),
      sinceDose: daysSinceDoseBefore(drawn, key),
      isToday: key === today,
    });
  }

  const lastDoseKey = hasDoses ? drawn[drawn.length - 1].dayKey : null;
  const daysSinceLast = lastDoseKey ? calendarDaysBetween(lastDoseKey, today) : null;
  const todayValue = hasDoses ? round1(levelOn(today)) : null;
  const phase = phaseFor({ daysSinceLast, level: todayValue, curve, dosesLogged: drawn.length });

  return {
    supported: true,
    curve,
    hasDoses,
    points,
    forecastDays,
    doses: drawn,
    today: {
      key: today,
      level: todayValue,
      phase,
      daysSinceLast,
      note: hasDoses ? levelNote(curve, daysSinceLast) : "",
    },
  };
}

/** Home's one line: "Medication level today: 78% of peak, day 3 after dose". */
export function levelSummaryText(level) {
  const percent = Math.round(level.today.level);
  const days = level.today.daysSinceLast;
  const when = days == null ? "" : days === 0 ? ", dose taken today" : `, day ${days} after dose`;
  return `Medication level today: ${percent}% of peak${when}`;
}