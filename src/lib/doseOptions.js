// ─────────────────────────────────────────────────────────────────────────────
// Dose chips — ONE central config.
// Edit the numbers below to change the tappable dose chips shown in the app.
// Every value is in mg, listed in ascending order. Products that aren't listed
// here still get the "Other" chip, so a dose can always be logged.
// ─────────────────────────────────────────────────────────────────────────────

import { COMPOUNDED_SEMAGLUTIDE, COMPOUNDED_TIRZEPATIDE } from "@/lib/medicationCatalogue";

export const DOSE_UNIT = "mg";

export const DOSE_LISTS = {
  "Ozempic®": [0.25, 0.5, 1, 2],
  "Wegovy®": [0.25, 0.5, 1, 1.7, 2.4],
  "Rybelsus®": [3, 7, 14],
  "Mounjaro®": [2.5, 5, 7.5, 10, 12.5, 15],
  "Zepbound®": [2.5, 5, 7.5, 10, 12.5, 15],
  "Saxenda®": [0.6, 1.2, 1.8, 2.4, 3],
  "Victoza®": [0.6, 1.2, 1.8],
  "Trulicity®": [0.75, 1.5, 3, 4.5],
  [COMPOUNDED_SEMAGLUTIDE]: [0.25, 0.5, 1, 1.7, 2, 2.4],
  [COMPOUNDED_TIRZEPATIDE]: [2.5, 5, 7.5, 10, 12.5, 15],
};

/** The configured strengths for a medication (empty when it has no list yet). */
export function getDoseList(medication) {
  return DOSE_LISTS[medication] || [];
}

/** Custom doses the user has saved for a medication, ascending. */
export function getCustomDoses(customDoses = [], medication) {
  return customDoses
    .filter((c) => c && c.medication === medication && Number(c.dose) > 0)
    .map((c) => Number(c.dose))
    .sort((a, b) => a - b);
}

/** Every chip offered: the configured strengths plus the user's own doses. */
export function getDoseChips(medication, customDoses = []) {
  return Array.from(new Set([...getDoseList(medication), ...getCustomDoses(customDoses, medication)]))
    .sort((a, b) => a - b);
}

/** Adds a custom dose to the stored list, returning the new list to save. */
export function withCustomDose(customDoses = [], medication, dose) {
  const value = Number(dose);
  const kept = customDoses.filter(
    (c) => !(c && c.medication === medication && Number(c.dose) === value)
  );
  return [...kept, { medication, dose: value }];
}