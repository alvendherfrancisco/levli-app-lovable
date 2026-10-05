// Missed-dose state for the next scheduled dose, driven by the central
// medication config. Four states and no clinical advice: on time, still inside
// the label's missed-dose window, past that window, and a longer break.
//
// The window itself comes from medicationConfig.missedDoseWindowDays — this
// module only turns dates into a state.

import { addDaysToShotDate, daysUntilShotDate } from "@/lib/dateUtils";

export const MISSED_STATE = {
  ON_TIME: "on_time",
  WITHIN_WINDOW: "within_window",
  OVERDUE: "overdue",
  LONG_GAP: "long_gap",
};

/** More than this many days without a dose counts as a longer break. */
export const LONG_GAP_DAYS = 14;
/** This many scheduled doses passed counts as a longer break too. */
export const LONG_GAP_MISSED_DOSES = 2;

/**
 * @param {{ lastShot: object|null, intervalDays: number, windowDays: number|null }} args
 * @returns {{ state: string, dueDate: string|null, daysLeft: number,
 *            daysLate: number, daysSinceLast: number, missedDoses: number }}
 */
export function evaluateDoseSchedule({ lastShot, intervalDays, windowDays }) {
  const base = {
    state: MISSED_STATE.ON_TIME,
    dueDate: null, daysLeft: 0, daysLate: 0, daysSinceLast: 0, missedDoses: 0,
  };
  if (!lastShot?.date || !intervalDays || intervalDays <= 0) return base;

  const dueDate = addDaysToShotDate(lastShot.date, intervalDays);
  const daysLeft = daysUntilShotDate(dueDate);
  const daysLate = Math.max(0, -daysLeft);
  const daysSinceLast = Math.max(0, -daysUntilShotDate(lastShot.date));
  const missedDoses = daysLate > 0 ? Math.floor(daysLate / intervalDays) : 0;
  const longGap = daysSinceLast > LONG_GAP_DAYS || missedDoses >= LONG_GAP_MISSED_DOSES;

  let state;
  if (longGap) state = MISSED_STATE.LONG_GAP;
  else if (daysLate === 0) state = MISSED_STATE.ON_TIME;
  else if (windowDays != null && windowDays > 0 && daysLate <= windowDays) state = MISSED_STATE.WITHIN_WINDOW;
  else state = MISSED_STATE.OVERDUE;

  return { state, dueDate, daysLeft, daysLate, daysSinceLast, missedDoses };
}