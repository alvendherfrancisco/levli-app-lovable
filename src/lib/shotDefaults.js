// Smart defaults and simplified choices for the Add Shot form.
// Single source of truth for what a returning user sees pre-filled, and for
// which products have a fixed route / delivery choice.

import { getDoseMax, getMedicationRoutes, isCompoundedGeneric } from "@/lib/medicationData";
import { ROUTE_LABELS } from "@/lib/medicationCatalogue";

export const INJECTABLE_ROUTES = ["subcutaneous", "intramuscular", "intradermal"];

// Standard strength ladders (mg) for the branded pen products. Compounded /
// generic products have no ladder — strength varies by pharmacy.
const DOSE_LADDER = {
  "Ozempic®": [0.25, 0.5, 1, 2],
  "Wegovy®": [0.25, 0.5, 1, 1.7, 2.4],
  "Rybelsus®": [3, 7, 14],
  "Mounjaro®": [2.5, 5, 7.5, 10, 12.5, 15],
  "Zepbound®": [2.5, 5, 7.5, 10, 12.5, 15],
  "Saxenda®": [0.6, 1.2, 1.8, 2.4, 3],
  "Victoza®": [0.6, 1.2, 1.8],
  "Trulicity®": [0.75, 1.5, 3, 4.5],
};

/** Strength chips for a medication, never above its standard maximum. */
export function getDoseLadder(medication, unit = "mg") {
  if (unit !== "mg") return [];
  const ladder = DOSE_LADDER[medication] || [];
  const max = getDoseMax(medication);
  return max < 100 ? ladder.filter((d) => d <= max) : ladder;
}

// Brand products whose injection device fixes the route, so the Route field
// is hidden and the route is set silently.
const BRAND_PENS = [
  "Ozempic®", "Wegovy®", "Mounjaro®", "Zepbound®",
  "Saxenda®", "Victoza®", "Trulicity®",
];

// Products normally taken by a route other than their catalogue's first.
const PREFERRED_ROUTE = { "Rybelsus®": "oral_tablet" };

export function isBrandPen(medication) {
  return BRAND_PENS.includes(medication);
}

export function getDefaultRoute(medication) {
  return PREFERRED_ROUTE[medication] || getMedicationRoutes(medication)[0] || "subcutaneous";
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

/** Dose to pre-fill: the active regimen dose, else the last logged dose. */
export function getDoseDefault({ medication, medications = [], shots = [] }) {
  const regimen = activeRegimensFor(medications, medication)[0];
  const lastShot = shots.find((s) => s.medication === medication);
  const unit = regimen?.dose_unit || lastShot?.dose_unit || "mg";
  const raw = regimen?.prescribed_dose ?? lastShot?.dose;
  let dose = raw != null && Number(raw) > 0 ? Number(raw) : null;
  if (dose == null) dose = getDoseLadder(medication, unit)[0] ?? 2.5;
  const max = getDoseMax(medication);
  if (unit === "mg" && max < 100 && dose > max) dose = max;
  return { dose, unit };
}

/**
 * Everything a new shot log is pre-filled with: the user's active medication
 * (or the last one logged), its current dose, the next injection site and the
 * product's normal route. A dose above the product's standard maximum is never
 * suggested.
 */
export function getSmartShotDefaults({ medications = [], shots = [], profile, recommendedSite = "" }) {
  const activeRegimens = medications.filter((m) => m.status === "active").sort(byCreatedDesc);
  const medication =
    activeRegimens[0]?.medication_name || shots[0]?.medication || profile?.default_medication || "Ozempic®";
  const regimens = activeRegimensFor(medications, medication);
  const { dose, unit } = getDoseDefault({ medication, medications, shots });
  const route = regimens[0]?.route || getDefaultRoute(medication);

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
    deviceType,
    medicationId: regimens[0]?.id || "",
    site: recommendedSite,
  };
}