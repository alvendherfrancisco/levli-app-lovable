// Smart defaults and simplified choices for the Add Shot form.
// Single source of truth for what a returning user sees pre-filled, and for
// which products have a fixed route / delivery choice.

import { getMedicationRoutes, isCompoundedGeneric } from "@/lib/medicationData";
import { ROUTE_LABELS } from "@/lib/medicationCatalogue";
import { chipsForMedication } from "@/lib/doseOptions";
import { INJECTION_ROUTES, formRoute, medicationFormChoice } from "@/lib/medicationForm";
import { evaluateDoseSchedule } from "@/lib/missedDose";
import { parseShotDate, toDayKey } from "@/lib/dateUtils";

// The routes that count as an injection. The form module owns the list, so the
// sheet's fields, its wording and its defaults all read one answer.
export const INJECTABLE_ROUTES = INJECTION_ROUTES;

// Strength lists and dose chips live in the one central config:
// src/lib/doseOptions.js

// Brand products whose injection device fixes the route, so the Route field
// is hidden and the route is set silently.
const BRAND_PENS = [
  "Ozempic®", "Wegovy®", "Mounjaro®", "Zepbound®",
  "Saxenda®", "Victoza®", "Trulicity®",
];

// Products normally taken by a route other than their catalogue's first.
const PREFERRED_ROUTE = { "Rybelsus®": "oral_tablet", "Foundayo®": "oral_tablet" };

export function isBrandPen(medication) {
  return BRAND_PENS.includes(medication);
}

export function getDefaultRoute(medication) {
  return PREFERRED_ROUTE[medication] || getMedicationRoutes(medication)[0] || "subcutaneous";
}

// The device a product normally comes in. Only a compounded injectable is
// pre-selected (its vial is the usual form); everything else starts empty.
export function getDefaultDeviceType(medication, route) {
  const r = route || getDefaultRoute(medication);
  if (isCompoundedGeneric(medication) && INJECTABLE_ROUTES.includes(r)) return "vial_syringe";
  return "";
}

// The three routes offered for compounded / generic products.
export const ROUTE_CHOICES = [
  { value: "subcutaneous", label: "Subcutaneous injection" },
  { value: "oral_tablet", label: "Oral" },
  { value: "buccal_sublingual", label: "Sublingual" },
];

const ROUTE_LABEL_OVERRIDES = {
  oral_tablet: "Oral",
  oral_capsule: "Oral",
  buccal_sublingual: "Sublingual",
};

/** Routes offered for a medication, with simplified labels. */
export function getRouteChoices(medication) {
  if (isCompoundedGeneric(medication)) return ROUTE_CHOICES;
  return getMedicationRoutes(medication).map((r) => ({
    value: r,
    label: ROUTE_LABEL_OVERRIDES[r] || ROUTE_LABELS[r] || r,
  }));
}

// Delivery choice for compounded / generic products.
export const COMPOUNDED_DEVICES = [
  { value: "vial_syringe", label: "Vial & syringe" },
  { value: "single_dose_pen", label: "Pen" },
];

function byCreatedDesc(a, b) {
  return String(b.created_date || "").localeCompare(String(a.created_date || ""));
}

/** Active regimen records for a medication, newest first. */
export function activeRegimensFor(medications = [], medication) {
  return medications
    .filter((m) => m.status === "active" && m.medication_name === medication)
    .sort(byCreatedDesc);
}

/**
 * The dose to pre-fill for a medication: its prescribed dose when that is one
 * of the chips on offer, otherwise the dose last logged for it when that is a
 * chip, otherwise nothing at all. A dose is never invented and never silently
 * adjusted — the chips are the only values offered.
 */
export function getDoseDefault({ medication, medications = [], shots = [], legacyCustomDoses = [], form }) {
  const regimen = activeRegimensFor(medications, medication)[0];
  const lastShot = shots.find((s) => s.medication === medication);
  const unit = regimen?.dose_unit || lastShot?.dose_unit || "mg";
  // The chips follow the form in hand: a pen strength is never offered as a
  // tablet's dose.
  const chips = chipsForMedication(
    { medication_name: medication, custom_doses: regimen?.custom_doses },
    legacyCustomDoses,
    form,
  );
  const prescribed = regimen?.prescribed_dose != null && Number(regimen.prescribed_dose) > 0
    ? Number(regimen.prescribed_dose) : null;
  const logged = lastShot?.dose != null && Number(lastShot.dose) > 0 ? Number(lastShot.dose) : null;
  const pick = prescribed ?? logged;
  return { dose: pick != null && chips.includes(pick) ? pick : "", unit };
}

/**
 * The active medication whose next dose falls first — an overdue one before a
 * due-later one. Each medication's own schedule decides it: a running repeat
 * when there is one, otherwise its last dose and its own interval. A regimen
 * with nothing to count from is skipped, so the order of the rest still holds.
 */
function nextDueMedication(regimens, shots) {
  let pick = "";
  let pickKey = null;
  regimens.forEach((regimen) => {
    const lastShot = shots.find(
      (s) => (s.medication_id && s.medication_id === regimen.id) || s.medication === regimen.medication_name
    );
    const { dueDate } = evaluateDoseSchedule({
      lastShot,
      intervalDays: regimen.interval_days || null,
      windowDays: 0,
    });
    const key = dueDate ? toDayKey(parseShotDate(dueDate)) : "";
    if (!key) return;
    if (pickKey === null || key < pickKey) { pickKey = key; pick = regimen.medication_name; }
  });
  return pick;
}

/**
 * Everything a new shot log is pre-filled with: the user's active medication
 * (or the last one logged), its current dose, the next injection site and the
 * product's normal route. A dose above the product's standard maximum is never
 * suggested.
 */
export function getSmartShotDefaults({ medications = [], shots = [], profile, recommendedSite = "" }) {
  const activeRegimens = medications.filter((m) => m.status === "active").sort(byCreatedDesc);
  // The user's own active medication is the source: with more than one running,
  // the one that is next due (an overdue one first) is the dose about to be
  // taken, so that is the one the sheet opens on. The last logged medication
  // covers an entry whose regimen has not been saved yet, and with none at all
  // the sheet asks for a medication rather than inventing one.
  const medication = nextDueMedication(activeRegimens, shots)
    || activeRegimens[0]?.medication_name
    || shots[0]?.medication
    || "";
  const regimens = activeRegimensFor(medications, medication);
  // How the product is logged: a product sold as a pen and as a tablet opens on
  // the form last used for it, and the strengths offered are that form's own.
  const form = medicationFormChoice(medication, { shots }).default;
  const { dose, unit } = getDoseDefault({
    medication, medications, shots, legacyCustomDoses: profile?.custom_doses || [],
    form: form || undefined,
  });
  const route = formRoute(form) || regimens[0]?.route || getDefaultRoute(medication);

  let deviceType = "";
  if (isCompoundedGeneric(medication) && INJECTABLE_ROUTES.includes(route)) {
    const lastDevice = shots.find((s) => s.medication === medication)?.device_type;
    const allowed = COMPOUNDED_DEVICES.map((d) => d.value);
    deviceType = allowed.includes(lastDevice) ? lastDevice : "vial_syringe";
  }

  return {
    medication,
    dose,
    doseUnit: unit,
    route,
    form,
    deviceType,
    medicationId: regimens[0]?.id || "",
    site: recommendedSite,
  };
}