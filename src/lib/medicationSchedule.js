// ─────────────────────────────────────────────────────────────────────────────
// SCHEDULES — the one place "how often?" is answered.
//
// Which frequencies a product offers, and the one it starts on, are stored on
// the product's own catalogue entry (src/lib/medicationConfig.js → `schedule`),
// checked against its prescribing information and stamped with the date it was
// checked and the source it came from. Nothing in this module decides them: it
// reads them, then turns the chosen frequency into the controls a screen shows,
// the wording that is stored, and the day interval the app uses afterwards.
//
// Onboarding and Add / Edit Medication both ask the question through here and
// through src/components/schedule/, so there is one implementation of the
// question and one of the answer.
//
// Nothing here recommends a regimen: a pre-filled frequency is the product's
// own label schedule, which the user can change.
// ─────────────────────────────────────────────────────────────────────────────

import { getMedicationConfig, plainBrandName } from "./medicationConfig.js";

/** The frequency a medication is taken at. */
export const SCHEDULE = {
  DAILY: "daily",
  WEEKLY: "weekly",
  TWICE_WEEKLY: "twice_weekly",
  EVERY_X_DAYS: "every_x_days",
  AS_DIRECTED: "as_directed",
};

/**
 * What each frequency means, in one place:
 *  - days      how many weekdays the user picks (0 = none)
 *  - time      whether the schedule carries a reminder time
 *  - interval  the day interval this frequency runs at (null when only the
 *              user's own number decides it)
 * The labels are the words shown on the chip and stored in `frequency`.
 */
export const FREQUENCY_INFO = {
  [SCHEDULE.DAILY]: { label: "Once daily", days: 0, time: true, interval: 1 },
  [SCHEDULE.WEEKLY]: { label: "Once weekly", days: 1, time: true, interval: 7 },
  [SCHEDULE.TWICE_WEEKLY]: { label: "Twice weekly", days: 2, time: true, interval: 3 },
  [SCHEDULE.EVERY_X_DAYS]: { label: "Every X days", days: 0, time: true, interval: null },
  [SCHEDULE.AS_DIRECTED]: {
    label: "As directed by my prescriber",
    days: 0,
    time: false,
    optionalTime: true,
    interval: null,
  },
};

/** The order frequencies are offered in, when a product does not set its own. */
const KIND_ORDER = [
  SCHEDULE.DAILY,
  SCHEDULE.WEEKLY,
  SCHEDULE.TWICE_WEEKLY,
  SCHEDULE.EVERY_X_DAYS,
  SCHEDULE.AS_DIRECTED,
];

/** Full weekday names — the letters alone are ambiguous to a screen reader. */
export const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const WEEKDAY_SHORT = ["S", "M", "T", "W", "T", "F", "S"];

/** A sensible reminder time to start from. The user can change it. */
export const DEFAULT_REMINDER_TIME = "08:00";

/** Shown when a second GLP-1 / GIP medicine is added. Not medical advice. */
export const MULTIPLE_GLP1_NOTE =
  "Taking more than one of these? Confirm your plan with your prescriber.";

/** The schedules this product offers, in the order its entry lists them. */
export function getScheduleOptions(medication) {
  const listed = getMedicationConfig(medication)?.schedule?.options || [];
  const ids = listed.filter((id) => FREQUENCY_INFO[id]);
  return (ids.length ? ids : KIND_ORDER).map((id) => ({ id, label: FREQUENCY_INFO[id].label }));
}

/** The frequency this product starts on ("" when the user has to choose). */
export function getDefaultSchedule(medication) {
  const stated = getMedicationConfig(medication)?.schedule?.default;
  if (stated && FREQUENCY_INFO[stated]) return stated;
  const options = getScheduleOptions(medication);
  return options.length === 1 ? options[0].id : "";
}

/** true when the label states exactly one schedule, so there is nothing to pick. */
export function hasSingleSchedule(medication) {
  return getScheduleOptions(medication).length === 1;
}

/** Where this product's schedule was checked, for provenance in the UI. */
export function getScheduleSource(medication) {
  const cfg = getMedicationConfig(medication)?.schedule;
  return { url: cfg?.source || "", verified: cfg?.verified || "", note: cfg?.note || "" };
}

/** A fresh schedule for a medication: its own default, nothing half-filled. */
export function emptySchedule(medication, today = "") {
  return {
    kind: getDefaultSchedule(medication),
    reminderDays: [],
    intervalDays: "",
    startDate: today,
    reminderTime: DEFAULT_REMINDER_TIME,
  };
}

/**
 * The same schedule with a different frequency, keeping only what the new one
 * uses. A control the frequency does not show keeps nothing: its value is
 * cleared rather than left behind to be saved by mistake.
 */
export function withScheduleKind(state, kind) {
  const info = FREQUENCY_INFO[kind];
  const from = state || {};
  if (!info) {
    return { ...emptySchedule("", from.startDate), kind: "" };
  }
  return {
    ...from,
    kind,
    reminderDays: info.days ? (from.reminderDays || []).slice(0, info.days) : [],
    intervalDays: kind === SCHEDULE.EVERY_X_DAYS ? from.intervalDays || "" : "",
    startDate: kind === SCHEDULE.EVERY_X_DAYS ? from.startDate || "" : from.startDate,
    reminderTime: info.time || info.optionalTime ? from.reminderTime ?? DEFAULT_REMINDER_TIME : "",
  };
}

/** The frequency a stored wording means, for records saved before this module. */
export function legacyKind(text, medication) {
  const t = String(text || "").toLowerCase();
  if (!t) return getDefaultSchedule(medication);
  if (/twice weekly|2x weekly|two times a week|two days a week/.test(t)) return SCHEDULE.TWICE_WEEKLY;
  if (/every\s*\d+\s*days?/.test(t)) return SCHEDULE.EVERY_X_DAYS;
  if (/directed|prescriber|irregular|no fixed|as needed/.test(t)) return SCHEDULE.AS_DIRECTED;
  if (/daily|every day|once a day/.test(t)) return SCHEDULE.DAILY;
  if (/weekly|a week|once a week/.test(t)) return SCHEDULE.WEEKLY;
  return getDefaultSchedule(medication);
}

/** The schedule held on a stored Medication record, as the form's state. */
export function scheduleStateFromRecord(record, medication, today = "") {
  const base = emptySchedule(medication, today);
  if (!record) return base;
  const kind = FREQUENCY_INFO[record.schedule_kind]
    ? record.schedule_kind
    : legacyKind(record.frequency, medication);
  const info = FREQUENCY_INFO[kind] || {};
  const storedDays = Array.isArray(record.reminder_days)
    ? record.reminder_days
        .map(Number)
        .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6)
    : [];
  const legacyInterval = String(record.frequency || "").match(/every\s*(\d+)\s*days?/i);
  return {
    kind,
    reminderDays: info.days ? storedDays.slice(0, info.days) : [],
    intervalDays: record.interval_days ? String(record.interval_days) : legacyInterval ? legacyInterval[1] : "",
    startDate: record.start_date || base.startDate,
    reminderTime: record.reminder_time ?? base.reminderTime,
  };
}

/** The day interval a schedule runs at, or null when nothing decides it. */
export function getDayInterval(state) {
  const info = FREQUENCY_INFO[state?.kind];
  if (!info) return null;
  if (state.kind === SCHEDULE.EVERY_X_DAYS) {
    const days = parseInt(String(state.intervalDays ?? ""), 10);
    return Number.isFinite(days) && days > 0 ? days : null;
  }
  return info.interval ?? null;
}

/** The frequency in words — what is stored in `frequency` and read back. */
export function describeSchedule(state) {
  const info = FREQUENCY_INFO[state?.kind];
  if (!info) return "";
  if (state.kind === SCHEDULE.EVERY_X_DAYS) {
    const days = getDayInterval(state);
    return days ? `Every ${days} days` : "";
  }
  return info.label;
}

/** The Medication fields a chosen schedule writes, in one place. */
export function medicationScheduleFields(state) {
  const kind = FREQUENCY_INFO[state?.kind] ? state.kind : "";
  const info = FREQUENCY_INFO[kind] || {};
  const days = info.days
    ? (state.reminderDays || [])
        .map(Number)
        .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6)
        .slice(0, info.days)
    : [];
  const fields = {
    frequency: describeSchedule(state),
    reminder_days: days,
    reminder_time: state.reminderTime || "",
  };
  if (kind) fields.schedule_kind = kind;
  const interval = getDayInterval(state);
  if (interval) fields.interval_days = interval;
  return fields;
}

/**
 * What is still missing before the schedule can be saved, in plain words, or
 * null when it is complete. Only the controls the chosen frequency shows are
 * ever required.
 */
export function validateScheduleSelection({
  medication, kind, reminderDays = [], intervalDays, startDate, needsStartDate = false,
}) {
  const name = plainBrandName(medication) || "this medication";
  const info = FREQUENCY_INFO[kind];
  if (!info) return `Choose how often you take ${name}.`;
  if (info.days === 1 && reminderDays.length !== 1) return "Pick the day you take it.";
  if (info.days === 2 && reminderDays.length !== 2) return "Pick both days you take it.";
  if (kind === SCHEDULE.EVERY_X_DAYS) {
    const days = parseInt(String(intervalDays ?? ""), 10);
    if (!Number.isFinite(days) || days < 1) return "Enter how many days are between doses.";
    if (needsStartDate && !startDate) return "Enter the date of your first dose.";
  }
  return null;
}

/** true when two chosen weekdays sit next to each other. A hint, never a block. */
export function daysAreClose(first, second) {
  const gap = Math.abs(Number(first) - Number(second));
  return Math.min(gap, 7 - gap) < 2;
}

// ── More than one GLP-1 / GIP medicine ──────────────────────────────────────
// A neutral note only. Nothing is blocked and no advice is given: the wording
// and the combinations that trigger it are for the clinical team to confirm.
const GLP1_GIP_GENERICS = new Set([
  "semaglutide",
  "tirzepatide",
  "liraglutide",
  "dulaglutide",
  "exenatide",
  "lixisenatide",
  "orforglipron",
]);

/** true when this medication is a GLP-1 or GIP receptor agonist. */
export function isGlp1Gip(medication) {
  const generic = getMedicationConfig(medication)?.genericName;
  return !!generic && GLP1_GIP_GENERICS.has(generic.toLowerCase());
}

/** true when another active medication is a GLP-1 / GIP with a different ingredient. */
export function hasSecondGlp1Gip(medications = [], medication) {
  const generic = getMedicationConfig(medication)?.genericName;
  if (!generic || !GLP1_GIP_GENERICS.has(generic.toLowerCase())) return false;
  return medications.some((m) => {
    if (!m || m.medication_name === medication) return false;
    if (m.status && !["active", "paused"].includes(m.status)) return false;
    const other = getMedicationConfig(m.medication_name)?.genericName;
    return !!other && other.toLowerCase() !== generic.toLowerCase() && GLP1_GIP_GENERICS.has(other.toLowerCase());
  });
}