// The Add Shot Log medication picker, and what a saved shot leaves behind.
//
// The picker offers two groups: the medications already saved in Meds first,
// then the read-only catalogue of common products. Choosing a row writes
// nothing — a catalogue choice becomes a Medication record only when the shot
// itself is saved, so browsing the list never leaves a stray regimen behind.

import {
  CUSTOM_MEDICATION_NAME,
  allowsAnyDose,
  describeAllowedDoses,
  displayBrandName,
  genericSubtitle,
  getCatalogueEntries,
  getDoseUnit,
  getIntervalDays,
  getMedicationConfig,
} from "@/lib/medicationConfig";
import { pickerMedications } from "@/lib/medicationLink";
import { parseShotDate, toDayKey } from "@/lib/dateUtils";

/**
 * The catalogue the picker browses: brand, generic, dose unit and strengths, in
 * the catalogue's own order. `name` is the stored name (how a log records it,
 * trademark mark included) and `display` is that name as it is drawn on screen;
 * the search below matches the stored name, so typing "Ozempic" still finds
 * "Ozempic®".
 */
const CATALOGUE_ROWS = getCatalogueEntries().map((entry) => ({
  key: `catalogue:${entry.id}`,
  catalogueId: entry.id,
  name: entry.brandName,
  display: displayBrandName(entry.brandName),
  generic: genericSubtitle(entry.brandName),
  unit: getDoseUnit(entry.brandName),
  strengths: describeAllowedDoses(entry.brandName),
  anyDose: allowsAnyDose(entry.brandName),
  route: entry.route || "",
  status: "",
}));

const searchText = (value) => String(value || "").trim().toLowerCase();

const matches = (row, query) =>
  !query || searchText(row.name).includes(query) || searchText(row.generic).includes(query);

/** One row for a medication the user already has in Meds. */
function storeRow(medication) {
  const entry = getMedicationConfig(medication.medication_name);
  return {
    key: `mine:${medication.id || medication.medication_name}`,
    id: medication.id || "",
    catalogueId: entry?.id || "",
    name: medication.medication_name,
    display: displayBrandName(medication.medication_name),
    generic: medication.generic_name || genericSubtitle(medication.medication_name) || entry?.genericName || "",
    unit: medication.dose_unit || getDoseUnit(medication.medication_name),
    strengths: describeAllowedDoses(medication.medication_name),
    anyDose: allowsAnyDose(medication.medication_name),
    route: medication.route || "",
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
  const q = searchText(query);
  // Only a name that is really in the store travels in as "the current one";
  // a product merely chosen in the picker is not a saved medication yet.
  const currentRecord = medications.find((m) => m.medication_name === current) || null;
  const mine = pickerMedications(medications, currentRecord)
    .map(storeRow)
    .filter((row) => matches(row, q));
  const saved = new Set(medications.map((m) => m.medication_name));
  const catalogue = CATALOGUE_ROWS
    .filter((row) => !saved.has(row.name))
    .filter((row) => matches(row, q));
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
  dose,
  doseUnit = "mg",
  route = "",
  shots = [],
  dateKey = "",
  customDoses = [],
  genericName = "",
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
    // A catalogue product's own generic name; for a typed "Others" entry, the
    // generic the user gave (optional, and empty when they gave none).
    generic_name: entry?.genericName || genericName || "",
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