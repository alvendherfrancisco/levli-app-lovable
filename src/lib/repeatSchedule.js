// Repeat-schedule helpers.
//
// A repeat schedule holds the details of one logged dose (medication, dose,
// unit, delivery method, day/time, notes) and repeats it weekly. Occurrences
// are derived, never stored: an occurrence is "pending" until a Shot exists
// for that medication inside its weekly window. Levli never logs a dose on the
// user's behalf — a pending occurrence becomes a Shot only when confirmed.
//
// All date maths uses calendar days in LOCAL time (see dateUtils) so DST
// transitions never shift a scheduled dose.

import {
  toDayKey, fromDayKey, formatShotDate, parseShotDate, todayKey, calendarDaysBetween,
} from "@/lib/dateUtils";

const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// How far back an unresolved occurrence is still surfaced as pending.
const PENDING_LOOKBACK_DAYS = 60;

export function addDaysToKey(dayKey, days) {
  const d = fromDayKey(dayKey);
  d.setDate(d.getDate() + days);
  return toDayKey(d);
}

export function weekdayOfKey(dayKey) {
  return fromDayKey(dayKey).getDay();
}

export function weekdayName(dow) {
  return WEEKDAY_NAMES[dow] || "";
}

export function weekdayShort(dayKey) {
  return WEEKDAY_SHORT[weekdayOfKey(dayKey)] || "";
}

/** "Jun 29, 2026" → "2026-06-29" */
export function dayKeyOfShot(shot) {
  const d = parseShotDate(shot?.date);
  return d ? toDayKey(d) : null;
}

/** "2026-06-29" → "Jun 29, 2026" (the format Shot records use) */
export function shotDateFromKey(dayKey) {
  return dayKey ? formatShotDate(fromDayKey(dayKey)) : "";
}

/** "8:00 AM" (Shot format) → "08:00" (input value) */
export function shotTimeToInput(time) {
  const m = String(time || "").match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!m) return "08:00";
  let h = parseInt(m[1], 10);
  const min = m[2];
  const ap = (m[3] || "").toUpperCase();
  if (ap === "PM" && h !== 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${min}`;
}

/** "08:00" (input value) → "8:00 AM" (Shot format) */
export function inputTimeToShotTime(value) {
  const [hStr, mStr] = String(value || "08:00").split(":");
  let h = parseInt(hStr, 10);
  if (isNaN(h)) h = 8;
  const min = String(mStr || "00").padStart(2, "0");
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${min} ${ap}`;
}

/** The next date on/after today that falls on the same weekday as dayKey. */
export function nextOnOrAfter(dayKey) {
  const today = todayKey();
  if (!dayKey) return today;
  const d = fromDayKey(dayKey);
  let key = toDayKey(d);
  while (key < today) {
    d.setDate(d.getDate() + 7);
    key = toDayKey(d);
  }
  return key;
}

/** Move the repeat to a different weekday, keeping it in the future. */
export function shiftWeekday(dayKey, newDow) {
  const d = fromDayKey(dayKey);
  d.setDate(d.getDate() + ((newDow - d.getDay() + 7) % 7));
  return nextOnOrAfter(toDayKey(d));
}

/**
 * Every occurrence date up to and including untilKey (defaults to today),
 * capped by the course end date. Occurrences step weekly from start_date.
 */
export function getOccurrences(schedule, untilKey) {
  if (!schedule?.start_date) return [];
  const until = untilKey || todayKey();
  const last = schedule.end_date && schedule.end_date < until ? schedule.end_date : until;
  const out = [];
  const d = fromDayKey(schedule.start_date);
  let key = toDayKey(d);
  let guard = 0;
  while (key <= last && guard++ < 600) {
    out.push(key);
    d.setDate(d.getDate() + 7);
    key = toDayKey(d);
  }
  return out;
}

/** An occurrence is resolved once a dose for that medication was logged in its weekly window. */
function occurrenceResolved(dayKey, medDayKeys) {
  const windowEnd = addDaysToKey(dayKey, 7);
  return medDayKeys.some((k) => k >= dayKey && k < windowEnd);
}

/**
 * Confirmed-vs-pending summary for a course, used on the schedule cards.
 */
export function summarizeSchedule(schedule, shots) {
  const occurrences = getOccurrences(schedule, schedule.end_date || todayKey());
  const medDayKeys = (shots || []).map(dayKeyOfShot).filter((k) => k && k !== null);
  const medShots = (shots || [])
    .filter((s) => s.medication === schedule.medication)
    .map(dayKeyOfShot)
    .filter(Boolean);
  let confirmed = 0;
  occurrences.forEach((key) => { if (occurrenceResolved(key, medShots)) confirmed++; });
  const skipped = (schedule.skipped_dates || []).filter((k) => occurrences.includes(k)).length;
  return {
    total: occurrences.length,
    confirmed,
    skipped,
    remaining: Math.max(0, occurrences.length - confirmed - skipped),
    medDayKeys,
  };
}

/**
 * Unresolved occurrences that are due now or overdue, oldest first.
 * Each entry: { schedule, dayKey, daysLate }.
 */
export function getPendingDoses(schedules, shots) {
  const today = todayKey();
  const lookback = addDaysToKey(today, -PENDING_LOOKBACK_DAYS);
  const pending = [];

  for (const schedule of schedules || []) {
    if (schedule.status !== "active") continue;
    const skipped = new Set(schedule.skipped_dates || []);
    const medShots = (shots || [])
      .filter((s) => s.medication === schedule.medication)
      .map(dayKeyOfShot)
      .filter(Boolean);

    for (const key of getOccurrences(schedule, today)) {
      if (key < lookback) continue;
      if (skipped.has(key)) continue;
      if (occurrenceResolved(key, medShots)) continue;
      pending.push({ schedule, dayKey: key, daysLate: Math.max(0, calendarDaysBetween(key, today)) });
    }
  }

  return pending.sort((a, b) => a.dayKey.localeCompare(b.dayKey));
}

/** Next future occurrence of an active schedule, or null when finished. */
export function getNextOccurrence(schedule, fromKey) {
  if (!schedule?.start_date || schedule.status !== "active") return null;
  const base = fromKey || todayKey();
  const skipped = new Set(schedule.skipped_dates || []);
  const d = fromDayKey(schedule.start_date);
  let key = toDayKey(d);
  let guard = 0;
  while (guard++ < 600) {
    if (schedule.end_date && key > schedule.end_date) return null;
    if (key >= base && !skipped.has(key)) return key;
    d.setDate(d.getDate() + 7);
    key = toDayKey(d);
  }
  return null;
}

/** "Every Monday at 8:00 AM" */
export function describeRepeat(schedule) {
  if (!schedule?.start_date) return "";
  return `Every ${weekdayName(weekdayOfKey(schedule.start_date))} at ${inputTimeToShotTime(schedule.time)}`;
}

/** Complete Shot payload for a confirmed occurrence. */
export function buildShotFromSchedule(schedule, dayKey, site) {
  return {
    medication: schedule.medication,
    medication_id: schedule.medication_id || undefined,
    dose: schedule.dose,
    dose_unit: schedule.dose_unit || "mg",
    drugClass: schedule.drug_class,
    molecularClass: schedule.molecular_class,
    route: schedule.route,
    device_type: schedule.device_type,
    concentration: schedule.concentration || undefined,
    date: shotDateFromKey(dayKey),
    time: inputTimeToShotTime(schedule.time),
    site: site || "",
    notes: schedule.notes || "",
    // No pain is recorded for a confirmed repeat dose: the field is left unset
    // rather than claiming a deliberate "no pain".
  };
}