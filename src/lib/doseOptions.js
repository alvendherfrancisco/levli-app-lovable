// Dose chips — the picker's view of the central medications config.
//
// There are NO dose numbers in this file. The lists come from
// src/lib/medicationConfig, which is the single place a dose is defined.
//
// The user's own saved doses are still offered for products whose strengths are
// not fixed by a label (compounded / generic). For a product with a verified
// label list, a saved dose the label does not list is ignored here and blocked
// in the picker.

import {
  MEDICATION_CONFIG,
  getAllowedDoses,
  allowsAnyDose,
  getDoseValues,
  getDoseUnit,
  getMedicationConfig,
  isVerifiedMedication,
  validateDosePair,
} from "@/lib/medicationConfig";

export const DOSE_UNIT = "mg";

/** Every medication's label strengths, keyed by product name (read-only). */
export const DOSE_LISTS = (() => {
  const map = {};
  MEDICATION_CONFIG.forEach((entry) => {
    if (entry.allowedDoses?.length) {
      map[entry.brandName] = entry.allowedDoses.map((d) => d.value).sort((a, b) => a - b);
    }
  });
  return map;
})();

/**
 * The configured strengths for a medication (empty when it has none).
 *
 * A form may carry its own list: one product sold as a pen and as a tablet has a
 * different set of strengths for each, so the chips follow the form in hand. A
 * form with no list of its own (the pen form) uses the product's own list.
 */
export function getDoseList(medication, form) {
  const carried = form
    ? getMedicationConfig(medication)?.forms?.find((f) => f.id === form)?.doses
    : null;
  if (carried?.length) return carried.map((d) => Number(d.value)).sort((a, b) => a - b);
  return [...getDoseValues(medication)];
}

/** The unit shown with this medication's doses. */
export function doseUnitFor(medication) {
  return getDoseUnit(medication);
}

/** Custom doses the user has saved for a medication, ascending. */
export function getCustomDoses(customDoses = [], medication) {
  const saved = customDoses
    .filter((c) => c && c.medication === medication && Number(c.dose) > 0)
    .map((c) => Number(c.dose));
  // A saved dose the label does not list for this product is never offered.
  const usable = isVerifiedMedication(medication)
    ? saved.filter((d) => validateDosePair(medication, d).valid)
    : saved;
  return [...new Set(usable)].sort((a, b) => a - b);
}

/** Every chip offered: the label strengths plus the user's own valid doses. */
export function getDoseChips(medication, customDoses = [], form) {
  return [...new Set([...getDoseList(medication, form), ...getCustomDoses(customDoses, medication)])]
    .sort((a, b) => a - b);
}

/** The custom doses saved on a medication record (numbers), ascending. */
export function medicationCustomDoses(medication) {
  return [...new Set((medication?.custom_doses || []).map(Number).filter((d) => d > 0))]
    .sort((a, b) => a - b);
}

/**
 * Every chip offered for a medication: the strengths its label lists, the doses
 * saved on the medication itself, and any dose saved earlier on the profile for
 * the same product (so chips logged before this existed are not lost).
 */
export function chipsForMedication(medication, legacyCustomDoses = [], form) {
  const name = medication?.medication_name || "";
  const saved = [
    ...legacyCustomDoses,
    ...medicationCustomDoses(medication).map((dose) => ({ medication: name, dose })),
  ];
  return getDoseChips(name, saved, form);
}

/** true when the picker should accept a typed dose instead of only chips. */
export function medicationAllowsAnyDose(medication) {
  return allowsAnyDose(medication);
}

/** Adds a custom dose to the stored list, returning the new list to save. */
export function withCustomDose(customDoses = [], medication, dose) {
  const value = Number(dose);
  const kept = customDoses.filter(
    (c) => !(c && c.medication === medication && Number(c.dose) === value)
  );
  return [...kept, { medication, dose: value }];
}

// Re-exported so screens have one import for dose rules.
export { validateDosePair, getAllowedDoses };