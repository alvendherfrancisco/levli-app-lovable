// ─────────────────────────────────────────────────────────────────────────────
// How often a dose is taken, and which controls that frequency needs.
//
// The choices live with the product, not here: every entry in
// src/lib/medicationConfig carries a `schedule` block holding the frequencies
// its own prescribing information allows and the one to start on. This module
// is only the shared vocabulary — the labels, the controls a frequency asks
// for, the interval it runs at, and the shape a schedule is stored in.
//
// Nothing here recommends anything. `default` is the frequency a screen starts
// on and the person can always change it; the one instruction the app repeats
// is the prescriber's.
// ─────────────────────────────────────────────────────────────────────────────

import {
  getMinIntervalDays, intervalWarning, validateDosePair,
  getDoseUnit, getScheduleConfig,
} from "@/lib/medicationConfig";
import { todayKey } from "@/lib/dateUtils";

export const FREQUENCY = {
  DAILY: "daily",
  WEEKLY: "weekly",
  TWICE_WEEKLY: "twice_weekly",
  EVERY_X_DAYS: "every_x_days",
  AS_DIRECTED: "as_directed",
};

/** The flexible set, in the order it is offered. Used for a product Levli
    holds no entry for; every listed product carries its own list. */
export const FREQUENCY_ORDER = [
  FREQUENCY.DAILY,
  FREQUENCY.WEEKLY,
  FREQUENCY.TWICE_WEEKLY,
  FREQUENCY.EVERY_X_DAYS,
  FREQUENCY.AS_DIRECTED,
];

export const FREQUENCY_LABEL = {
  [FREQUENCY.DAILY]: "Once daily",
  [FREQUENCY.WEEKLY]: "Once weekly",
  [FREQUENCY.TWICE_WEEKLY]: "Twice weekly",
  [FREQUENCY.EVERY_X_DAYS]: "Every X days",
  [FREQUENCY.AS_DIRECTED]: "As directed by my prescriber / no fixed schedule",
};

/* What each frequency asks for. `days`: none | single | two. `time`: none |
   always | optional. A control that is "none" is not shown, and whatever it
   held is cleared — the screen never keeps a value behind a control it hid. */
const CONTROLS = {
  [FREQUENCY.DAILY]: { days: "none", interval: false, startDate: false, time: "always" },
  [FREQUENCY.WEEKLY]: { days: "single", interval: false, startDate: false, time: "none" },
  [FREQUENCY.TWICE_WEEKLY]: { days: "two", interval: false, startDate: false, time: "none" },
  [FREQUENCY.EVERY_X_DAYS]: { days: "none", interval: true, startDate: true, time: "none" },
  [FREQUENCY.AS_DIRECTED]: { days: "none", interval: false, startDate: false, time: "optional" },
};

export function controlsFor(key) {
  return CONTROLS[key] || CONTROLS[FREQUENCY.AS_DIRECTED];
}

/**
 * The frequencies this product may be dosed at, and the one to start on, read
 * from its own catalogue entry. A product with no entry of its own gets the
 * flexible set and nothing preselected.
 */
export function scheduleOptionsFor(medication) {
  const own = getScheduleConfig(medication);
  if (own?.allowed?.length) return own;
  return {
    allowed: [...FREQUENCY_ORDER],
    default: null,
    status: "no_label",
    source: "",
    verified: "",
    note: "Levli holds no label for this product, so the schedule is whatever your prescriber set.",
  };
}

/**
 * The interval in days a frequency runs at. Levli works the next dose out from
 * the last dose logged plus this interval — the weekday is only the anchor the
 * person chose. null means the frequency sets no interval of its own, and the
 * product's own label interval is used instead.
 */
export function intervalForFrequency(key, intervalDays) {
  if (key === FREQUENCY.DAILY) return 1;
  if (key === FREQUENCY.WEEKLY) return 7;
  // Two days a week sit three or four days apart; the shorter gap is the one a
  // next-dose date can be counted from.
  if (key === FREQUENCY.TWICE_WEEKLY) return 3;
  if (key === FREQUENCY.EVERY_X_DAYS) {
    const days = Number(intervalDays);
    return days > 0 ? days : null;
  }
  return null;
}

/**
 * Moves a schedule to a frequency: keeps only what that frequency asks for and
 * clears the rest, so nothing is stored behind a control that is no longer on
 * screen. An every-N-days schedule is given today as its start date, which can
 * then be changed.
 */
export function withFrequency(schedule, key, day = todayKey()) {
  const c = controlsFor(key);
  const days = schedule?.days || [];
  return {
    ...schedule,
    frequency: key,
    days: c.days === "none" ? [] : days.slice(0, c.days === "single" ? 1 : 2),
    interval_days: c.interval ? (schedule?.interval_days ?? null) : null,
    start_date: c.startDate ? (schedule?.start_date || day) : "",
    reminder_time: c.time === "none" ? "" : (schedule?.reminder_time || ""),
  };
}

/** A schedule holding nothing but the product and its own default frequency. */
export function emptySchedule(medication = "", day = todayKey()) {
  const base = {
    medication,
    frequency: null,
    days: [],
    interval_days: null,
    start_date: "",
    reminder_time: "",
    dose: "",
    dose_unit: getDoseUnit(medication),
  };
  const preset = scheduleOptionsFor(medication).default;
  return preset ? withFrequency(base, preset, day) : base;
}

/**
 * Keeps a stored schedule only while it still belongs to this product and is
 * still one that product may run at, and only while its dose is still a
 * strength of this product. Anything else is replaced with the product's own
 * default — so a frequency, a day or a strength from another medication can
 * never carry over. Returns the same object when nothing needs to change.
 */
export function reconcileSchedule(schedule, medication, day = todayKey()) {
  const own = scheduleOptionsFor(medication);
  const sameProduct = (schedule?.medication || "") === (medication || "");
  if (!sameProduct || !own.allowed.includes(schedule?.frequency)) {
    return emptySchedule(medication, day);
  }
  const dose = Number(schedule?.dose);
  if (dose > 0 && !validateDosePair(medication, dose).valid) {
    return { ...schedule, dose: "", dose_unit: getDoseUnit(medication) };
  }
  return schedule;
}

/** true when the schedule holds everything its frequency asks for. */
export function scheduleComplete(schedule) {
  if (!schedule?.frequency) return false;
  const c = controlsFor(schedule.frequency);
  if (c.days === "single") return (schedule.days || []).length === 1;
  if (c.days === "two") return (schedule.days || []).length === 2;
  if (c.interval) return Number(schedule.interval_days) > 0 && !!schedule.start_date;
  return true;
}

/** The schedule as the profile stores it. */
export function scheduleForProfile(schedule) {
  return {
    frequency: schedule?.frequency || "",
    medication: schedule?.medication || "",
    days: schedule?.days || [],
    interval_days: intervalForFrequency(schedule?.frequency, schedule?.interval_days),
    start_date: schedule?.start_date || "",
    reminder_time: schedule?.reminder_time || "",
  };
}

export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

/** How far apart two weekdays are, the short way round the week. */
export function dayGap(a, b) {
  const d = Math.abs(Number(a) - Number(b)) % 7;
  return Math.min(d, 7 - d);
}

/** A note when two chosen days sit closer together than a twice-weekly schedule
    implies. Below the product's own minimum interval the label's wording is
    used instead. */
export function daysHint(medication, days) {
  if ((days || []).length !== 2) return "";
  const gap = dayGap(days[0], days[1]);
  const min = getMinIntervalDays(medication);
  if (min && gap < min) return intervalWarning(medication, gap);
  if (gap < 3) return `These two days are only ${gap} day${gap === 1 ? "" : "s"} apart.`;
  return "";
}

/** A note when an every-N-days interval is shorter than the label allows. */
export function intervalHint(medication, intervalDays) {
  return intervalWarning(medication, intervalDays);
}