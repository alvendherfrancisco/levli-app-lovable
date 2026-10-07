// ─────────────────────────────────────────────────────────────────────────────
// The medication step's selection model.
//
// One list of entries is built while the user chooses, and it becomes Medication
// records ONCE — when onboarding is completed. Nothing is written while the step
// is being filled in, and a medication that is already saved under the same name
// is linked to (its dose updated) rather than created a second time.
//
// The stored name is always the name a record keeps (a brand's own name, mark
// and all); the ® is only ever how it reads on screen.
// ─────────────────────────────────────────────────────────────────────────────

import { getMedicationConfig, getDoseUnit, getDoseValues } from "@/lib/medicationConfig";
import { getMolecularClass } from "@/lib/medicationData";
import { parseStrengthList } from "@/lib/medicationRegimen";

const todayKey = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const positiveNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
};

/** A catalogue product the user picked. Its dose is pre-filled from a saved regimen. */
export function newCatalogueEntry(name, savedRegimen) {
  const config = getMedicationConfig(name);
  const savedDose = positiveNumber(savedRegimen?.prescribed_dose);
  return {
    key: `cat:${config?.id || name}`,
    name,
    isCustom: false,
    generic: "",
    strengths: "",
    dose: savedDose != null ? String(savedDose) : "",
    unit: savedRegimen?.dose_unit || getDoseUnit(name),
    deviceType: savedRegimen?.device_type || "",
    notes: "",
    extraDoses: [],
  };
}

/** The "Others" entry: everything about it is typed by the user. */
export function newCustomEntry() {
  return {
    key: "custom",
    name: "",
    isCustom: true,
    generic: "",
    strengths: "",
    dose: "",
    unit: "mg",
    deviceType: "",
    notes: "",
    extraDoses: [],
  };
}

/** The dose chips on offer for an entry: the label's strengths, then any saved ones. */
export function doseChipsFor(entry, savedRegimen) {
  if (!entry || entry.isCustom) return [];
  return [...new Set([
    ...getDoseValues(entry.name),
    ...(savedRegimen?.custom_doses || []).map(Number),
    ...(entry.extraDoses || []).map(Number),
  ].filter((n) => Number.isFinite(n) && n > 0))].sort((a, b) => a - b);
}

/** A step is ready when at least one medication is chosen and every entry is named. */
export function selectionIsComplete(meds = []) {
  if (!meds.length) return false;
  return meds.every((m) => String(m.name || "").trim().length > 0);
}

/** The dose(s) chosen, as one line for the schedule step. */
export function doseSummaryFor(meds = []) {
  const named = meds.filter((m) => m.name && positiveNumber(m.dose) != null);
  if (!named.length) return "";
  return named.map((m) => `${m.name} · ${m.dose} ${m.unit}`).join("   ·   ");
}

/**
 * What to write when onboarding is completed:
 *   creates — a record per chosen medication that is not already saved
 *   updates — the dose / delivery method / notes for one that is, so a change
 *             made here is not thrown away
 */
export function buildMedicationWrites(meds = [], { frequency = "", savedRegimens = [] } = {}) {
  const creates = [];
  const updates = [];
  const savedByName = new Map(savedRegimens.map((r) => [r.medication_name, r]));

  meds.forEach((m) => {
    const name = String(m.name || "").trim();
    if (!name) return;

    const config = getMedicationConfig(name);
    const dose = positiveNumber(m.dose);
    const unit = m.unit || getDoseUnit(name);
    const notes = String(m.notes || "").trim();
    // The strengths an entry carries: typed on a custom entry, or added through
    // the dose chips' "Other" on a catalogue one.
    const customDoses = m.isCustom
      ? parseStrengthList(m.strengths)
      : [...new Set((m.extraDoses || []).map(Number).filter((n) => Number.isFinite(n) && n > 0))];

    const shared = {};
    if (dose != null) {
      shared.prescribed_dose = dose;
      shared.dose_unit = unit;
    }
    if (m.deviceType) shared.device_type = m.deviceType;
    if (notes) shared.notes = notes;

    const existing = savedByName.get(name);
    if (existing) {
      // Already in Meds — linked, never duplicated.
      if (Object.keys(shared).length) updates.push({ id: existing.id, ...shared });
      return;
    }

    const record = {
      medication_name: name,
      catalogue_id: config?.id || "",
      generic_name: config?.genericName || String(m.generic || "").trim() || "",
      route: config?.route || "",
      dose_unit: unit,
      frequency,
      start_date: todayKey(),
      regimen_source: "user-entered",
      needs_details: false,
      status: "active",
      ...shared,
    };

    const molecularClass = getMolecularClass(name);
    if (molecularClass) record.molecular_class = molecularClass;
    if (customDoses.length) record.custom_doses = customDoses;

    creates.push(record);
  });

  return { creates, updates };
}