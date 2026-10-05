// Adherence calculation helpers.
// Doses logged / doses scheduled inside the measuring window. The window is the
// overlap of the period asked for, the medication's own start, and the day the
// medication was marked stopped — nothing after a stop is counted.
// No clinical interpretation.

import { getDosingInterval } from "@/lib/medicationData";
import { parseShotDate, calendarDaysBetween, todayKey, fromDayKey, toDayKey } from "@/lib/dateUtils";

/** Accepts both "Mon DD, YYYY" shot dates and "YYYY-MM-DD" day keys. */
function asDate(value) {
  if (!value) return null;
  const s = String(value);
  return s.includes("-") && !s.includes(",") ? fromDayKey(s) : parseShotDate(s);
}

function atMidnight(d) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/**
 * Adherence for one medication.
 * @param {Array} shots — all shot records
 * @param {string} medication — brand name
 * @param {number} periodDays — window length (e.g. 30, 90)
 * @param {{ startDate?: string, stoppedDate?: string }} [options] — the
 *        regimen's start date and the date the medication was marked stopped
 * @returns {{ logged: number, scheduled: number, adherencePct: number|null,
 *            startDate: string|null, endDate: string|null, days: number }}
 */
export function calcAdherence(shots, medication, periodDays, options = {}) {
  const interval = getDosingInterval(medication);
  const empty = {
    logged: 0, scheduled: 0, adherencePct: null, startDate: null, endDate: null, days: periodDays,
  };
  if (!interval || interval <= 0 || periodDays <= 0) return empty;

  const today = atMidnight(fromDayKey(todayKey()));
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() - periodDays);

  const doseDates = (shots || [])
    .filter((s) => s.medication === medication)
    .map((s) => parseShotDate(s.date))
    .filter(Boolean)
    .map(atMidnight);
  if (!doseDates.length) return { ...empty, startDate: toDayKey(cutoff), endDate: toDayKey(today) };

  // Window start: the later of the period start, the regimen's start date and
  // the first dose actually logged.
  const regimenStart = asDate(options.startDate);
  const firstDose = new Date(Math.min(...doseDates.map((d) => d.getTime())));
  let start = cutoff;
  if (regimenStart && regimenStart > start) start = atMidnight(regimenStart);
  if (firstDose > start) start = firstDose;

  // Window end: the day the medication was stopped, if it has been.
  const stopped = asDate(options.stoppedDate);
  let end = today;
  if (stopped && atMidnight(stopped) < end) end = atMidnight(stopped);

  const startKey = toDayKey(start);
  const endKey = toDayKey(end);
  if (end < start) return { ...empty, startDate: startKey, endDate: endKey };

  const logged = doseDates.filter((d) => d >= start && d <= end).length;
  const scheduled = Math.floor(calendarDaysBetween(startKey, endKey) / interval);
  const adherencePct = scheduled > 0 ? Math.min(100, Math.round((logged / scheduled) * 100)) : null;

  return { logged, scheduled, adherencePct, startDate: startKey, endDate: endKey, days: periodDays };
}