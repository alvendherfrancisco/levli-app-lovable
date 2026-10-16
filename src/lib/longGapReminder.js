import { fromDayKey, toDayKey, todayKey } from "@/lib/dateUtils";

/**
 * The long-gap reminder the person has put away.
 *
 * Putting a reminder away is a choice about this device's screen, not something
 * that belongs in the account, so it is kept beside the other device choices (the
 * sound preference, the report options) and never leaves the phone. One entry per
 * medication holds the LAST day its reminder stays hidden: put away today, it is
 * back tomorrow; snoozed, three days later. A dose logged in the meantime takes
 * the reminder away by itself, because it only exists while the schedule says the
 * break is still running.
 */
const KEY = "levli:longGapReminder";

const read = () => {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
};

const write = (value) => {
  try { localStorage.setItem(KEY, JSON.stringify(value)); } catch { /* private mode: it simply shows */ }
};

/** Whether this medication's long-gap reminder is put away today. */
export function isLongGapHidden(medicationKey) {
  if (!medicationKey) return false;
  return String(read()[medicationKey] || "") >= todayKey();
}

/** Puts this medication's reminder away for `days` days, today being the first. */
export function hideLongGap(medicationKey, days) {
  if (!medicationKey) return;
  const until = fromDayKey(todayKey());
  until.setDate(until.getDate() + days - 1);
  write({ ...read(), [medicationKey]: toDayKey(until) });
}