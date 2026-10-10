// The Add Shot Log medication picker, and what a saved shot leaves behind.
//
// The picker offers two groups: the medications already saved in Meds first,
// then the read-only catalogue of common products. Choosing a row writes
// nothing — a catalogue choice becomes a Medication record only when the shot
// itself is saved, so browsing the list never leaves a stray regimen behind.

import {
  LISTED_MEDICATIONS,
  CUSTOM_MEDICATION_NAME,
  getIntervalDays,
  getMedicationConfig,
  matchesMedicationSearch,
  medicationFormTag,
} from "@/lib/medicationConfig";
import { pickerMedications } from "@/lib/medicationLink";
import { parseShotDate, toDayKey } from "@/lib/dateUtils";

/** The catalogue the picker browses: the shared list, with its form tag. */
const CATALOGUE_ROWS = LISTED_MEDICATIONS.map((entry) => ({
  key: `catalogue:${entry.id}`,
  catalogueId: entry.id,
  name: entry.brandName,
  generic: entry.genericName || "",
  route: entry.route || "",
  tag: medicationFormTag(entry.brandName),
  status: "",
}));

// Searching runs over the shown name, the generic name and the product it
// resolves to, so "bpc", "BPC-157" and "bpc157" all find the same product. Case,
// the ® mark, spaces and hyphens are ignored (see matchesMedicationSearch).
const matches = (row, query) =>
  matchesMedicationSearch(query, row.name, row.generic, row.catalogueId);

/** One row for a medication the user already has in Meds. */
function storeRow(medication) {
  const entry = getMedicationConfig(medication.medication_name);
  return {
    key: `mine:${medication.id || medication.medication_name}`,
    id: medication.id || "",
    catalogueId: entry?.id || "",
    name: medication.medication_name,
    generic: medication.generic_name || entry?.genericName || "",
    route: medication.route || "",
    // A name the app holds nothing for (one the user typed) carries no form tag:
    // nothing is assumed about a medication there is no information about.
    tag: entry ? medicationFormTag(medication.medication_name) : "",
    status: medication.status || "active",
  };
}

/**
 * The two groups the picker shows. "My medications" is the user's own store —
 * its active regimens plus the one this log is already on — and "All
 * medications" is the built-in catalogue with anything the user already has
 * removed, so one product never appears in both. The search narrows both.
 */
export function medicationPickerGroups({ medications = [], current = "", query = "" } = {}) {
  // Only a name that is really in the store travels in as "the current one";
  // a product merely chosen in the picker is not a saved medication yet.
  const currentRecord = medications.find((m) => m.medication_name === current) || null;
  const mine = pickerMedications(medications, currentRecord)
    .map(storeRow)
    .filter((row) => matches(row, query));
  // A product the user already has is never offered twice. It is matched on the
  // name and on the product it resolves to, so a regimen saved under an older
  // name of the same product still keeps the list free of repeats.
  const savedNames = new Set(medications.map((m) => m.medication_name));
  const savedIds = new Set(
    medications.map((m) => getMedicationConfig(m.medication_name)?.id).filter(Boolean),
  );
  const catalogue = CATALOGUE_ROWS
    .filter((row) => !savedNames.has(row.name) && !savedIds.has(row.catalogueId))
    .filter((row) => matches(row, query));
  return { mine, catalogue };
}

/**
 * The Medication record a picker choice becomes once the shot is saved: the
 * regimen starts on the earliest shot logged for it (the shot being saved is
 * included, so a backdated shot sets the start date), it carries the dose that
 * was just logged, and it is flagged so the user knows its schedule and
 * reminders still need adding.
 */
export function regimenFromShot({
  name,
  genericName = "",
  dose,
  doseUnit = "mg",
  route = "",
  shots = [],
  dateKey = "",
  customDoses = [],
}) {
  const entry = name === CUSTOM_MEDICATION_NAME ? null : getMedicationConfig(name);
  const logged = shots
    .filter((s) => s.medication === name && s.date)
    .map((s) => toDayKey(parseShotDate(s.date)))
    .filter(Boolean);
  const startDate = [...logged, dateKey].filter(Boolean).sort()[0] || "";
  const interval = getIntervalDays(name);
  return {
    medication_name: name,
    catalogue_id: entry?.id || "",
    generic_name: genericName || entry?.genericName || "",
    route: route || entry?.route || "",
    prescribed_dose: dose ?? null,
    dose_unit: doseUnit,
    frequency: interval === 7 ? "once weekly" : interval === 1 ? "once daily" : "",
    start_date: startDate,
    status: "active",
    regimen_source: "shot-log",
    needs_details: true,
    ...(customDoses.length ? { custom_doses: customDoses } : {}),
  };
}

/**
 * Writes a shot and the medication it belongs to as one step — what happens
 * behind "Save Shot".
 *
 * `regimen` is the record to create for a medication the user has not saved yet
 * (null when it already exists), and `doseToRemember` is a strength the label
 * does not list, kept on the existing record. Nothing is written before this
 * runs, and if the shot cannot be written the record created here is removed
 * again, so a failed save never leaves an orphan medication behind.
 */
export async function saveShotWithMedication({
  payload,
  regimen = null,
  doseToRemember = null,
  editingShotId = "",
  afterWrite,
  writers: {
    addMedication, deleteMedication, addShot, updateShot,
    addMedicationCustomDose, linkShotsToMedication,
  },
}) {
  // The shot is written from a copy: the medication it belongs to may only be
  // known once the record has been created.
  const shot = { ...payload };
  let created = null;
  try {
    if (regimen) {
      created = await addMedication(regimen);
      shot.medication_id = created.id;
    }
    if (editingShotId) {
      await updateShot(editingShotId, shot);
    } else {
      await addShot(shot);
      if (afterWrite) await afterWrite();
    }
    // Tidying up after the shot is safely written: its medication keeps the log
    // history in one place. A failure here never costs the saved shot.
    try {
      if (created) await linkShotsToMedication(created.medication_name, created.id);
      else if (doseToRemember) await addMedicationCustomDose(doseToRemember.id, doseToRemember.dose);
    } catch (followUpErr) {
      console.error("Could not finish linking the saved shot:", followUpErr);
    }
    return created;
  } catch (err) {
    // Nothing half-written: the record created for this save goes again.
    if (created) {
      try {
        await deleteMedication(created.id);
      } catch (rollbackErr) {
        console.error("Could not remove the medication created for a failed save:", rollbackErr);
      }
    }
    throw err;
  }
}