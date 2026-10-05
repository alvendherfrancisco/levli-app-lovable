// ── Delivery methods (device types) ────────────────────────────────────────
// Single source of truth for which delivery devices may be selected for a
// medication. Screens read from here instead of hard-coding their own lists.
// To adjust later, edit METHODS_BY_MEDICATION (per medication, takes priority)
// or METHODS_BY_ROUTE (the default for a route).

import { getMedicationRoutes, getPrimaryRoute } from "@/lib/medicationData";

// Every delivery method that can currently be offered.
export const DELIVERY_METHODS = [
  { value: "prefilled_syringe", label: "Prefilled syringe" },
  { value: "single_dose_pen", label: "Single-dose pen" },
  { value: "multidose_pen", label: "Multidose pen" },
  { value: "vial_syringe", label: "Vial + syringe" },
  { value: "patch", label: "Patch" },
  { value: "other", label: "Other" },
];

// Retired delivery methods and routes. They are never offered for new entries
// or edits, but stay labelled so existing records still display what they were
// saved with.
export const RETIRED_DELIVERY_METHODS = ["pump"];
export const RETIRED_ROUTES = ["pump_infusion"];

const INJECTABLE_METHODS = [
  "prefilled_syringe",
  "single_dose_pen",
  "multidose_pen",
  "vial_syringe",
  "other",
];

// A route with no entry here offers no delivery choice (the field is hidden).
const METHODS_BY_ROUTE = {
  subcutaneous: INJECTABLE_METHODS,
  intramuscular: INJECTABLE_METHODS,
  intradermal: INJECTABLE_METHODS,
  reconstituted_vial: ["vial_syringe", "prefilled_syringe", "other"],
  intravenous_infusion: ["vial_syringe", "other"],
  transdermal: ["patch"],
  pump_infusion: [], // retired route — legacy records only
};

// Per-medication overrides, keyed by the medication name shown in the app.
// Takes priority over the route defaults, e.g.:
//   "Ozempic®": ["single_dose_pen", "multidose_pen"]
const METHODS_BY_MEDICATION = {};

const LABELS = DELIVERY_METHODS.reduce((acc, m) => ({ ...acc, [m.value]: m.label }), {});
LABELS.pump = "Pump"; // legacy label, retained for existing records

export function getDeliveryMethodLabel(value) {
  return LABELS[value] || value || "";
}

function allowedValues(medication, route) {
  const byMedication = METHODS_BY_MEDICATION[medication];
  if (byMedication) return byMedication;
  const r = route || getPrimaryRoute(medication);
  return METHODS_BY_ROUTE[r] || [];
}

// Selectable delivery methods for a medication on a given route.
export function getDeliveryMethods(medication, route) {
  const allowed = allowedValues(medication, route);
  return DELIVERY_METHODS.filter(
    (m) => allowed.includes(m.value) && !RETIRED_DELIVERY_METHODS.includes(m.value)
  );
}

// Routes offered in the UI (retired routes remain readable on old records).
export function getSelectableRoutes(medication) {
  return getMedicationRoutes(medication).filter((r) => !RETIRED_ROUTES.includes(r));
}

// Shorter device wording for the optional "Device type" field on a shot log.
// Only the label shown in the picker changes — the value stored stays the one
// every other screen (History, Insights, the report) already understands.
const SHOT_DEVICE_LABELS = {
  single_dose_pen: "Pen",
  multidose_pen: "Multidose pen",
  prefilled_syringe: "Prefilled syringe",
  vial_syringe: "Vial and syringe",
  patch: "Patch",
  other: "Other",
};

/** Device choices offered on a shot log for a medication on a given route. */
export function getShotDeviceOptions(medication, route) {
  return getDeliveryMethods(medication, route).map((m) => ({
    value: m.value,
    label: SHOT_DEVICE_LABELS[m.value] || m.label,
  }));
}