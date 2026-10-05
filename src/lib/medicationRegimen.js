// ─────────────────────────────────────────────────────────────────────────────
// REGIMEN FORM RULES — what the Add / Edit Medication form offers, and what it
// accepts.
//
// Strengths, dosing interval, unit and route are NOT redefined here: they are
// read from the central medications config (src/lib/medicationConfig.js), so the
// form can never offer a strength the label does not list and each dose list has
// exactly one source of truth.
//
// Levli never suggests, generates or adjusts a dose: every strength the form
// shows is one the label itself lists, and anything else is only ever typed by
// the user from their own prescription.
// ─────────────────────────────────────────────────────────────────────────────
import {
  MEDICATION_CONFIG, getAllowedDoses, getDoseUnit, getIntervalDays, plainBrandName,
} from "@/lib/medicationConfig";
import { formatLocaleDate, fromDayKey } from "@/lib/dateUtils";

/** The products the picker offers, in the order it shows them. */
const PICKER_IDS = [
  "ozempic", "wegovy", "rybelsus", "mounjaro", "zepbound", "trulicity", "victoza", "saxenda",
];

/** Plain route wording for this form (the label's route, said simply). */
const FORM_ROUTE_LABELS = {
  subcutaneous: "Injection under the skin",
  oral_tablet: "Tablet by mouth",
};

/** The value that means "the user typed their own schedule". */
export const OTHER_SCHEDULE = "__other_schedule__";

/** The schedule the label states, in plain words ("" when the product has none). */
export function labelledSchedule(name) {
  const days = getIntervalDays(name);
  if (days === 7) return "Once weekly";
  if (days === 1) return "Once daily";
  return "";
}

/** A product's picker entry, built from the central config. */
function buildOption(entry) {
  const oral = entry.route === "oral_tablet" || entry.route === "oral_capsule";
  return {
    value: entry.brandName,
    label: `${plainBrandName(entry.brandName)} (${entry.genericName}${oral ? " tablet" : ""})`,
    generic: entry.genericName,
    strengths: getAllowedDoses(entry.brandName),
    unit: getDoseUnit(entry.brandName),
    schedule: labelledSchedule(entry.brandName),
    route: entry.route,
    routeLabel: FORM_ROUTE_LABELS[entry.route] || "",
  };
}

/** Every product the picker offers, in order. */
export const MEDICATION_OPTIONS = PICKER_IDS.map((id) =>
  buildOption(MEDICATION_CONFIG.find((e) => e.id === id)));

/** The row that asks the user to type their own medication name. */
export const OTHER_MEDICATION_OPTION = { value: "", label: "Other medication (type name)", generic: "" };

/** The option record for a stored medication name, or null for a typed name. */
export function findMedicationOption(name) {
  return MEDICATION_OPTIONS.find((o) => o.value === name) || null;
}

/** Above this many strengths the dose list becomes a dropdown (≤ 6 → buttons). */
export const STRENGTH_BUTTON_LIMIT = 6;

/** true when a value is one of the strengths the label lists for this product. */
export function isLabelStrength(name, value) {
  const text = String(value ?? "").trim();
  if (!text) return false;
  const num = Number(text);
  if (!Number.isFinite(num)) return false;
  return getAllowedDoses(name).some((d) => Math.abs(d.value - num) < 1e-9);
}

/** The typed schedule, when the user chose to write their own. */
export function scheduleText(schedule, scheduleOther) {
  if (!schedule || schedule === OTHER_SCHEDULE) return String(scheduleOther || "").trim();
  return schedule;
}

// ── Copy ───────────────────────────────────────────────────────────────────

export const NON_STANDARD_DOSE_MESSAGE =
  "This isn't a standard pen strength. Please check it matches your prescription.";
export const NON_STANDARD_DOSE_CONFIRM = "I've checked this dose against my prescription.";
export const MG_VIAL_NOTE =
  "Doses here are in mg, as shown on your pen. If your medication comes in a vial and is measured in units or mL, ask your pharmacist to confirm before logging.";
export const PRESCRIBER_ONLY_NOTE = "Enter only what your prescriber told you.";
export const DOSE_STEP_HELPER = "For example: starter dose, or maintenance dose.";
export const REGIMEN_FOOTER =
  "This app is a tracker, not medical advice. Always follow your doctor's or pharmacist's instructions.";

export const INDICATION_OPTIONS = ["Type 2 diabetes", "Weight management", "Heart health", "Other"];

export const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "discontinued", label: "Stopped" },
];

/** Stored status values that are not one of the three plain choices. */
const STATUS_EXTRA_LABELS = { switched: "Switched to another medication" };

/** The status choices, keeping an existing value that is not one of the three. */
export function statusOptionsFor(current) {
  const extra = STATUS_EXTRA_LABELS[current];
  return extra ? [...STATUS_OPTIONS, { value: current, label: extra }] : STATUS_OPTIONS;
}

// ── Validation ─────────────────────────────────────────────────────────────

const DAY_MS = 24 * 60 * 60 * 1000;
/** A start date further ahead than this is treated as a typing mistake. */
const MAX_FUTURE_DAYS = 365;

const parseDate = (value) => {
  if (!value) return null;
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
};

/**
 * Checks the whole form. Returns null when it is ready to save, otherwise the
 * field to fix and the plain-language reason.
 *
 * A dose the label does not list is never blocked — it only has to be confirmed
 * against the user's prescription.
 */
export function validateRegimenForm({
  selectedName, isCustom, customName, dose, doseConfirmed, isStandardDose,
  startDate, plannedEndDate,
}) {
  if (isCustom && !String(customName || "").trim()) {
    return { field: "name", message: "Type the medication name from your prescription." };
  }
  if (!isCustom && !selectedName) {
    return { field: "name", message: "Choose your medication from the list." };
  }

  const doseText = String(dose ?? "").trim();
  const doseNum = Number(doseText);
  if (!doseText || !Number.isFinite(doseNum) || doseNum <= 0) {
    return { field: "dose", message: "Enter your dose as a number greater than 0." };
  }
  if (!isCustom && !isStandardDose && !doseConfirmed) {
    return { field: "dose", message: NON_STANDARD_DOSE_MESSAGE };
  }

  if (!startDate) {
    return { field: "startDate", message: "Enter the date you started this medication." };
  }
  const start = parseDate(startDate);
  if (!start) return { field: "startDate", message: "Check the start date." };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (start.getTime() - today.getTime() > MAX_FUTURE_DAYS * DAY_MS) {
    return { field: "startDate", message: "That start date is more than a year away. Please check it." };
  }

  if (plannedEndDate) {
    const end = parseDate(plannedEndDate);
    if (!end) return { field: "plannedEndDate", message: "Check the planned end date." };
    if (end.getTime() <= start.getTime()) {
      return { field: "plannedEndDate", message: "The stop date needs to be after the first dose date." };
    }
  }

  return null;
}

/** A date key ("YYYY-MM-DD") written out plainly, e.g. "Oct 6, 2026". */
export function plainDateLabel(key) {
  return key ? formatLocaleDate(fromDayKey(key)) : "";
}

/**
 * The one-line summary of what is about to be saved, e.g.
 * "Ozempic (semaglutide), 1 mg, once weekly, starting Oct 6, 2026".
 */
export function summariseRegimen({ option, isCustom, customName, dose, unit, schedule, scheduleOther, startDate }) {
  const name = option ? option.label : String(customName || "").trim();
  const doseText = String(dose ?? "").trim();
  const when = scheduleText(schedule, scheduleOther);
  return [
    name,
    doseText ? `${doseText} ${isCustom ? unit : option?.unit || "mg"}` : "",
    when ? when.toLowerCase() : "",
    startDate ? `starting ${plainDateLabel(startDate)}` : "",
  ].filter(Boolean).join(", ");
}