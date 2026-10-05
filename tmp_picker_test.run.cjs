// src/lib/medicationConfig.js
var CUSTOM_MEDICATION_NAME = "Other / custom (prescriber-directed)";
var CUSTOM_MEDICATION_WARNING = "Levli can't verify this dose.";
var MEDICATION_CONFIG = [
  {
    id: "ozempic",
    brandName: "Ozempic\xAE",
    genericName: "semaglutide",
    route: "subcutaneous",
    dosingIntervalDays: 7,
    allowedDoses: [
      { value: 0.25, unit: "mg", role: "initiation" },
      { value: 0.5, unit: "mg", role: "standard" },
      { value: 1, unit: "mg", role: "standard" },
      { value: 2, unit: "mg", role: "standard" }
    ],
    minIntervalDays: 2,
    maxDoseMg: 2,
    indicationNote: "Type 2 diabetes. Also lowers the risk of major heart events and of worsening kidney disease in adults with type 2 diabetes and established heart or kidney disease.",
    missedDoseRule: "Take a missed dose as soon as possible within 5 days after the missed dose. If more than 5 days have passed, contact your prescriber before continuing \u2014 the label says the missed dose is not taken and the next dose is taken on the usual day. Never take two doses less than 2 days (48 hours) apart.",
    retitrationDays: 5,
    missedDoseWindowDays: 5,
    missedDoseLabelQuote: "If a dose is missed, administer OZEMPIC as soon as possible within 5 days after the missed dose.",
    source: "https://www.novo-pi.com/ozempic.pdf",
    lastReviewed: "2026-10-05",
    verified: true,
    verifiedNote: "",
    exposureEligible: true
  },
  {
    id: "wegovy",
    brandName: "Wegovy\xAE",
    genericName: "semaglutide",
    route: "subcutaneous",
    dosingIntervalDays: 7,
    allowedDoses: [
      { value: 0.25, unit: "mg", role: "initiation" },
      { value: 0.5, unit: "mg", role: "standard" },
      { value: 1, unit: "mg", role: "standard" },
      { value: 1.7, unit: "mg", role: "standard" },
      { value: 2.4, unit: "mg", role: "standard" }
    ],
    minIntervalDays: 2,
    maxDoseMg: 2.4,
    indicationNote: "Chronic weight management in adults and in adolescents aged 12 and older with obesity or with overweight plus a weight-related condition. Also lowers major heart-event risk in adults with established heart disease, and treats noncirrhotic MASH with moderate to advanced liver fibrosis.",
    missedDoseRule: "If the next scheduled dose is more than 2 days away (48 hours), take the missed dose as soon as possible. If the next dose is less than 2 days away, the label says the missed dose is not taken and the next dose is taken on the usual day. At least 2 days (48 hours) must separate two doses. If 2 or more weeks (14 days) have passed since the last dose, contact your prescriber about how to restart.",
    retitrationDays: 14,
    missedDoseWindowDays: 4,
    missedDoseLabelQuote: "If you miss a dose of WEGOVY and the next scheduled dose is more than 2 days away (48 hours), take the missed dose as soon as possible.",
    source: "https://www.accessdata.fda.gov/drugsatfda_docs/label/2025/215256s024lbl.pdf",
    lastReviewed: "2026-10-05",
    verified: true,
    verifiedNote: "Wegovy is also sold as an oral tablet (oral semaglutide 25 mg once daily). That form is not in this config, so it cannot be logged as Wegovy\xAE here. The label states the missed-dose rule as a condition on the next dose rather than a plain day count; the 4-day window is derived from it and the card shows the label's own wording.",
    exposureEligible: true
  },
  {
    id: "mounjaro",
    brandName: "Mounjaro\xAE",
    genericName: "tirzepatide",
    route: "subcutaneous",
    dosingIntervalDays: 7,
    allowedDoses: [
      { value: 2.5, unit: "mg", role: "initiation" },
      { value: 5, unit: "mg", role: "standard" },
      { value: 7.5, unit: "mg", role: "standard" },
      { value: 10, unit: "mg", role: "standard" },
      { value: 12.5, unit: "mg", role: "standard" },
      { value: 15, unit: "mg", role: "standard" }
    ],
    minIntervalDays: 3,
    maxDoseMg: 15,
    indicationNote: "Type 2 diabetes in adults and in children aged 10 and older. The 2.5 mg strength is for starting treatment only. The maximum strength is 15 mg for adults and 10 mg for children aged 10 to under 18.",
    missedDoseRule: "Take a missed dose within 4 days (96 hours) of when it was due if you can. If more than 4 days have passed, skip it and take the next dose on your usual day. At least 3 days (72 hours) must separate two doses.",
    retitrationDays: 4,
    missedDoseWindowDays: 4,
    missedDoseLabelQuote: "If a dose is missed, administer MOUNJARO as soon as possible within 4 days (96 hours) after the missed dose.",
    source: "https://pi.lilly.com/us/mounjaro-uspi.pdf",
    lastReviewed: "2026-10-05",
    verified: true,
    verifiedNote: "",
    exposureEligible: true
  },
  {
    id: "zepbound",
    brandName: "Zepbound\xAE",
    genericName: "tirzepatide",
    route: "subcutaneous",
    dosingIntervalDays: 7,
    allowedDoses: [
      { value: 2.5, unit: "mg", role: "initiation" },
      { value: 5, unit: "mg", role: "standard" },
      { value: 7.5, unit: "mg", role: "standard" },
      { value: 10, unit: "mg", role: "standard" },
      { value: 12.5, unit: "mg", role: "standard" },
      { value: 15, unit: "mg", role: "standard" }
    ],
    minIntervalDays: 3,
    maxDoseMg: 15,
    indicationNote: "Chronic weight management in adults with obesity, or with overweight plus a weight-related condition, and moderate-to-severe obstructive sleep apnoea with obesity. The 2.5 mg strength is for starting treatment only and is not a maintenance dose.",
    missedDoseRule: "Take a missed dose within 4 days (96 hours) of when it was due if you can. If more than 4 days have passed, skip it and take the next dose on your usual day. At least 3 days (72 hours) must separate two doses.",
    retitrationDays: 4,
    missedDoseWindowDays: 4,
    missedDoseLabelQuote: "If a dose is missed, administer ZEPBOUND as soon as possible within 4 days (96 hours) after the missed dose.",
    source: "https://pi.lilly.com/us/zepbound-uspi.pdf",
    lastReviewed: "2026-10-05",
    verified: true,
    verifiedNote: "",
    exposureEligible: true
  },
  {
    id: "victoza",
    brandName: "Victoza\xAE",
    genericName: "liraglutide",
    route: "subcutaneous",
    dosingIntervalDays: 1,
    allowedDoses: [
      { value: 0.6, unit: "mg", role: "initiation" },
      { value: 1.2, unit: "mg", role: "standard" },
      { value: 1.8, unit: "mg", role: "standard" }
    ],
    minIntervalDays: 1,
    maxDoseMg: 1.8,
    indicationNote: "Type 2 diabetes in adults and in children aged 10 and older. Also lowers the risk of major heart events in adults with type 2 diabetes and established heart disease.",
    missedDoseRule: "Do not take two doses on the same day. If you miss a dose, take your next dose at the usual time the following day, and speak to your prescriber before restarting if you have missed several days in a row.",
    retitrationDays: null,
    missedDoseWindowDays: 0,
    missedDoseLabelQuote: "If a dose is missed, resume the once-daily regimen at the next scheduled dose.",
    source: "https://www.novo-pi.com/victoza.pdf",
    lastReviewed: "2026-10-05",
    verified: true,
    verifiedNote: "Dose strengths (0.6 / 1.2 / 1.8 mg), the once-daily interval and the indications were read from the label. The label's missed-dose section was not visible in the copy I could read, so the missed-dose rule above is deliberately general \u2014 the label's own 12-hour window is NOT stated here.",
    exposureEligible: true
  },
  {
    id: "saxenda",
    brandName: "Saxenda\xAE",
    genericName: "liraglutide",
    route: "subcutaneous",
    dosingIntervalDays: 1,
    allowedDoses: [
      { value: 0.6, unit: "mg", role: "titration_only" },
      { value: 1.2, unit: "mg", role: "titration_only" },
      { value: 1.8, unit: "mg", role: "titration_only" },
      { value: 2.4, unit: "mg", role: "titration_only" },
      { value: 3, unit: "mg", role: "standard" }
    ],
    minIntervalDays: 1,
    maxDoseMg: 3,
    indicationNote: "Chronic weight management in adults and in adolescents aged 12 and older with obesity or with overweight plus a weight-related condition. The 3 mg strength is the maintenance dose; the lower strengths are for titration only.",
    missedDoseRule: "If you miss a daily dose, skip it and take the next dose at the usual time the following day. Never take two doses in one day. If Saxenda has not been taken for 3 days or more, contact your prescriber \u2014 the label says to restart at 0.6 mg and build up again.",
    retitrationDays: 3,
    missedDoseWindowDays: 0,
    missedDoseLabelQuote: "If a dose is missed, resume the once-daily regimen as prescribed with the next scheduled dose.",
    source: "https://www.accessdata.fda.gov/drugsatfda_docs/label/2023/206321s016lbl.pdf",
    lastReviewed: "2026-10-05",
    verified: true,
    verifiedNote: "Dose ladder, the 3 mg maintenance dose and the once-daily interval were read from the label. The 3-day restart rule matches the label wording quoted by Novo Nordisk's Saxenda dosing page; I did not open the exact label sentence myself.",
    exposureEligible: true
  },
  {
    id: "rybelsus",
    brandName: "Rybelsus\xAE",
    genericName: "semaglutide",
    route: "oral_tablet",
    dosingIntervalDays: 1,
    allowedDoses: [
      { value: 3, unit: "mg", role: "initiation" },
      { value: 7, unit: "mg", role: "standard" },
      { value: 14, unit: "mg", role: "standard" }
    ],
    minIntervalDays: 1,
    maxDoseMg: 14,
    indicationNote: "Type 2 diabetes in adults. The 3 mg strength is for starting treatment only (30 days) and is not effective for blood-sugar control on its own.",
    missedDoseRule: "If you miss a daily tablet, skip it and take the next tablet at the usual time the next morning. Never take two tablets to catch up.",
    retitrationDays: null,
    missedDoseWindowDays: 0,
    missedDoseLabelQuote: "If a dose is missed, the missed dose should be skipped and the next dose should be taken on the next day.",
    source: "https://www.accessdata.fda.gov/drugsatfda_docs/label/2024/213051s018lbl.pdf",
    lastReviewed: "2026-10-05",
    verified: true,
    verifiedNote: "",
    exposureEligible: true
  },
  {
    id: "trulicity",
    brandName: "Trulicity\xAE",
    genericName: "dulaglutide",
    route: "subcutaneous",
    dosingIntervalDays: 7,
    allowedDoses: [
      { value: 0.75, unit: "mg", role: "initiation" },
      { value: 1.5, unit: "mg", role: "standard" },
      { value: 3, unit: "mg", role: "standard" },
      { value: 4.5, unit: "mg", role: "standard" }
    ],
    minIntervalDays: 3,
    maxDoseMg: 4.5,
    indicationNote: "Type 2 diabetes in adults and in children aged 10 and older.",
    missedDoseRule: "Take the missed dose as soon as possible when there are at least 3 days (72 hours) until the next scheduled dose. If the next dose is due in 1 or 2 days, the label says the missed dose is not taken and the next dose is taken on its usual day.",
    retitrationDays: 3,
    missedDoseWindowDays: 3,
    missedDoseLabelQuote: "If a dose is missed, administer the missed dose as soon as possible if there are at least 3 days (72 hours) until the next scheduled dose.",
    source: "https://pi.lilly.com/us/trulicity-uspi.pdf",
    lastReviewed: "2026-10-05",
    verified: true,
    verifiedNote: "Dose strengths (0.75 / 1.5 / 3 / 4.5 mg), the once-weekly interval and the maximum dose were read from the label. The missed-dose window was carried over from the app's existing data and not re-read in this pass.",
    exposureEligible: true
  },
  {
    id: "compounded_semaglutide",
    brandName: "Semaglutide (generic / compounded)",
    genericName: "semaglutide",
    route: "subcutaneous",
    dosingIntervalDays: 7,
    allowedDoses: [],
    allowsAnyDose: true,
    minIntervalDays: 2,
    maxDoseMg: 2.4,
    indicationNote: "Compounded semaglutide \u2014 there is no FDA-approved label for these products, and strengths differ between pharmacies.",
    missedDoseRule: "Follow the instructions your prescriber or pharmacy gave you for a missed dose. Levli cannot check these products against a label.",
    retitrationDays: null,
    missedDoseWindowDays: null,
    missedDoseLabelQuote: "",
    source: "",
    lastReviewed: "2026-10-05",
    verified: false,
    verifiedNote: "Compounded and generic products have no approved prescribing information, so no dose list can be verified. Any dose may be logged and none is used for exposure modelling.",
    exposureEligible: false
  },
  {
    id: "compounded_tirzepatide",
    brandName: "Tirzepatide (generic / compounded)",
    genericName: "tirzepatide",
    route: "subcutaneous",
    dosingIntervalDays: 7,
    allowedDoses: [],
    allowsAnyDose: true,
    minIntervalDays: 3,
    maxDoseMg: 15,
    indicationNote: "Compounded tirzepatide \u2014 there is no FDA-approved label for these products, and strengths differ between pharmacies.",
    missedDoseRule: "Follow the instructions your prescriber or pharmacy gave you for a missed dose. Levli cannot check these products against a label.",
    retitrationDays: null,
    missedDoseWindowDays: null,
    missedDoseLabelQuote: "",
    source: "",
    lastReviewed: "2026-10-05",
    verified: false,
    verifiedNote: "Compounded and generic products have no approved prescribing information, so no dose list can be verified. No dose logged for these products is used for exposure modelling.",
    exposureEligible: false
  },
  {
    id: "custom",
    brandName: CUSTOM_MEDICATION_NAME,
    genericName: "",
    route: "",
    dosingIntervalDays: null,
    allowedDoses: [],
    allowsAnyDose: true,
    indicationNote: "A medication you name yourself, with a dose your prescriber directed. Levli holds no information about it.",
    missedDoseRule: "Follow your prescriber's instructions for a missed dose.",
    retitrationDays: null,
    missedDoseWindowDays: null,
    missedDoseLabelQuote: "",
    source: "",
    lastReviewed: "2026-10-05",
    verified: false,
    verifiedNote: "Nothing about a custom entry is verified. It is never used for exposure modelling or interval-based reminders.",
    exposureEligible: false
  }
];
var normalise = (name) => String(name || "").replace(/[®™]/g, "").trim().toLowerCase();
var BY_KEY = (() => {
  const map = {};
  MEDICATION_CONFIG.forEach((entry) => {
    map[normalise(entry.brandName)] = entry;
    if (entry.genericName && !map[normalise(entry.genericName)]) map[normalise(entry.genericName)] = entry;
  });
  return map;
})();
function getMedicationConfig(name) {
  if (!name) return null;
  const exact = MEDICATION_CONFIG.find((e) => e.brandName === name);
  if (exact) return exact;
  return BY_KEY[normalise(name)] || null;
}
function plainBrandName(name) {
  const entry = getMedicationConfig(name);
  return (entry?.brandName || String(name || "")).replace(/[®™]/g, "");
}
function allowsAnyDose(name) {
  const entry = getMedicationConfig(name);
  if (!entry) return true;
  return !!entry.allowsAnyDose || entry.allowedDoses.length === 0;
}
function isVerifiedMedication(name) {
  const entry = getMedicationConfig(name);
  return !!(entry && entry.verified && entry.allowedDoses.length > 0);
}
function getAllowedDoses(name) {
  const entry = getMedicationConfig(name);
  if (!entry) return [];
  return [...entry.allowedDoses].sort((a, b) => a.value - b.value);
}
function getDoseValues(name) {
  return getAllowedDoses(name).map((d) => d.value);
}
function getDoseUnit(name) {
  return getAllowedDoses(name)[0]?.unit || "mg";
}
function describeAllowedDoses(name) {
  const doses = getAllowedDoses(name);
  if (!doses.length) return "";
  const unit = doses[0].unit;
  const values = doses.map((d) => `${d.value}`);
  const list = values.length === 1 ? values[0] : `${values.slice(0, -1).join(", ")} or ${values[values.length - 1]}`;
  return `${list} ${unit}`;
}
function validateDosePair(name, dose) {
  const entry = getMedicationConfig(name);
  const value = Number(dose);
  if (!entry || !Number.isFinite(value) || value <= 0) {
    return { valid: true, unverified: true, message: "", severity: "none" };
  }
  if (allowsAnyDose(name)) {
    return {
      valid: true,
      unverified: !entry.verified,
      message: entry.verified ? "" : CUSTOM_MEDICATION_WARNING,
      severity: entry.verified ? "none" : "warn"
    };
  }
  const listed = entry.allowedDoses.some((d) => Math.abs(d.value - value) < 1e-9);
  if (listed) return { valid: true, unverified: false, message: "", severity: "none" };
  return {
    valid: false,
    unverified: false,
    message: `This dose isn't listed for ${plainBrandName(name)}. Check your pen or prescription.`,
    severity: "block"
  };
}
function getIntervalDays(name) {
  return getMedicationConfig(name)?.dosingIntervalDays ?? null;
}

// src/lib/dateUtils.js
var MONTH_IDX = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
function parseShotDate(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.replace(",", "").split(" ");
  return new Date(parseInt(parts[2]), MONTH_IDX[parts[0]] ?? 0, parseInt(parts[1]));
}
function toDayKey(date) {
  const d = date instanceof Date ? date : new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// src/lib/medicationLink.js
var MED_STATUS = {
  ACTIVE: "active",
  PAUSED: "paused",
  DISCONTINUED: "discontinued",
  SWITCHED: "switched",
  ARCHIVED: "archived"
};
var isActiveMedication = (medication) => medication?.status === MED_STATUS.ACTIVE;
function pickerMedications(medications = [], current = null) {
  const active = medications.filter(isActiveMedication);
  if (!current?.medication_name) return active;
  if (active.some((m) => m.medication_name === current.medication_name)) return active;
  return [...active, current];
}

// src/lib/shotMedication.js
var CATALOGUE_ROWS = MEDICATION_CONFIG.filter((entry) => entry.id !== "custom").map((entry) => ({
  key: `catalogue:${entry.id}`,
  catalogueId: entry.id,
  name: entry.brandName,
  display: plainBrandName(entry.brandName),
  generic: entry.genericName || "",
  unit: getDoseUnit(entry.brandName),
  strengths: describeAllowedDoses(entry.brandName),
  anyDose: allowsAnyDose(entry.brandName),
  route: entry.route || "",
  status: ""
}));
var searchText = (value) => String(value || "").trim().toLowerCase();
var matches = (row, query) => !query || searchText(row.name).includes(query) || searchText(row.generic).includes(query);
function storeRow(medication) {
  const entry = getMedicationConfig(medication.medication_name);
  return {
    key: `mine:${medication.id || medication.medication_name}`,
    id: medication.id || "",
    catalogueId: entry?.id || "",
    name: medication.medication_name,
    display: plainBrandName(medication.medication_name),
    generic: medication.generic_name || entry?.genericName || "",
    unit: medication.dose_unit || getDoseUnit(medication.medication_name),
    strengths: describeAllowedDoses(medication.medication_name),
    anyDose: allowsAnyDose(medication.medication_name),
    route: medication.route || "",
    status: medication.status || "active"
  };
}
function medicationPickerGroups({ medications = [], current = "", query = "" } = {}) {
  const q = searchText(query);
  const currentRecord = medications.find((m) => m.medication_name === current) || null;
  const mine = pickerMedications(medications, currentRecord).map(storeRow).filter((row) => matches(row, q));
  const saved = new Set(medications.map((m) => m.medication_name));
  const catalogue = CATALOGUE_ROWS.filter((row) => !saved.has(row.name)).filter((row) => matches(row, q));
  return { mine, catalogue };
}
function regimenFromShot({
  name,
  dose,
  doseUnit = "mg",
  route = "",
  shots = [],
  dateKey = "",
  customDoses = []
}) {
  const entry = name === CUSTOM_MEDICATION_NAME ? null : getMedicationConfig(name);
  const logged = shots.filter((s) => s.medication === name && s.date).map((s) => toDayKey(parseShotDate(s.date))).filter(Boolean);
  const startDate = [...logged, dateKey].filter(Boolean).sort()[0] || "";
  const interval = getIntervalDays(name);
  return {
    medication_name: name,
    catalogue_id: entry?.id || "",
    generic_name: entry?.genericName || "",
    route: route || entry?.route || "",
    prescribed_dose: dose ?? null,
    dose_unit: doseUnit,
    frequency: interval === 7 ? "once weekly" : interval === 1 ? "once daily" : "",
    start_date: startDate,
    status: "active",
    regimen_source: "shot-log",
    needs_details: true,
    ...customDoses.length ? { custom_doses: customDoses } : {}
  };
}
async function saveShotWithMedication({
  payload,
  regimen = null,
  doseToRemember = null,
  editingShotId = "",
  afterWrite,
  writers: {
    addMedication,
    deleteMedication,
    addShot,
    updateShot,
    addMedicationCustomDose,
    linkShotsToMedication
  }
}) {
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
    try {
      if (created) await linkShotsToMedication(created.medication_name, created.id);
      else if (doseToRemember) await addMedicationCustomDose(doseToRemember.id, doseToRemember.dose);
    } catch (followUpErr) {
      console.error("Could not finish linking the saved shot:", followUpErr);
    }
    return created;
  } catch (err) {
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

// src/lib/doseOptions.js
var DOSE_LISTS = (() => {
  const map = {};
  MEDICATION_CONFIG.forEach((entry) => {
    if (entry.allowedDoses?.length) {
      map[entry.brandName] = entry.allowedDoses.map((d) => d.value).sort((a, b) => a - b);
    }
  });
  return map;
})();
function getDoseList(medication) {
  return [...getDoseValues(medication)];
}
function getCustomDoses(customDoses = [], medication) {
  const saved = customDoses.filter((c) => c && c.medication === medication && Number(c.dose) > 0).map((c) => Number(c.dose));
  const usable = isVerifiedMedication(medication) ? saved.filter((d) => validateDosePair(medication, d).valid) : saved;
  return [...new Set(usable)].sort((a, b) => a - b);
}
function getDoseChips(medication, customDoses = []) {
  return [.../* @__PURE__ */ new Set([...getDoseList(medication), ...getCustomDoses(customDoses, medication)])].sort((a, b) => a - b);
}
function medicationCustomDoses(medication) {
  return [...new Set((medication?.custom_doses || []).map(Number).filter((d) => d > 0))].sort((a, b) => a - b);
}
function chipsForMedication(medication, legacyCustomDoses = []) {
  const name = medication?.medication_name || "";
  const saved = [
    ...legacyCustomDoses,
    ...medicationCustomDoses(medication).map((dose) => ({ medication: name, dose }))
  ];
  return getDoseChips(name, saved);
}

// tmp_picker_test.mjs
var checks = [];
var ok = (name, pass) => checks.push({ name, pass: !!pass });
function fakes({ failShot = false } = {}) {
  const state = { records: [], shots: [], removed: [], linked: [], doses: [], updated: [] };
  return {
    state,
    writers: {
      addMedication: async (data) => {
        const rec = { id: `rec${state.records.length + 1}`, ...data };
        state.records.push(rec);
        return rec;
      },
      deleteMedication: async (id) => {
        state.removed.push(id);
        state.records = state.records.filter((r) => r.id !== id);
      },
      addShot: async (s) => {
        if (failShot) throw new Error("network");
        state.shots.push(s);
        return s;
      },
      updateShot: async (id, s) => {
        state.updated.push({ id, ...s });
      },
      addMedicationCustomDose: async (id, dose) => {
        state.doses.push({ id, dose });
      },
      linkShotsToMedication: async () => 1
    }
  };
}
(async () => {
  const empty = medicationPickerGroups({ medications: [], current: "", query: "" });
  ok("catalogue is offered when nothing is saved", empty.mine.length === 0 && empty.catalogue.length > 1);
  const wegovy = empty.catalogue.find((r) => r.name === "Wegovy\xAE");
  ok(
    "a catalogue row carries brand, generic, unit and strengths",
    wegovy?.display === "Wegovy" && wegovy.generic === "semaglutide" && wegovy.unit === "mg" && wegovy.strengths.includes("2.4")
  );
  const compounded = empty.catalogue.find((r) => r.name.includes("compounded"));
  ok(
    "a compounded row has no verified strengths but says the pharmacy sets them",
    compounded.generic === "semaglutide" && compounded.strengths === "" && compounded.anyDose === true
  );
  const genericSearch = medicationPickerGroups({ medications: [], query: "semaglu" });
  ok("search matches the generic name", genericSearch.catalogue.length > 1 && genericSearch.catalogue.every((r) => r.generic === "semaglutide"));
  const brandSearch = medicationPickerGroups({ medications: [], query: "mounjar" });
  ok("search matches the brand name", brandSearch.catalogue.length === 1 && brandSearch.catalogue[0].name === "Mounjaro\xAE");
  const noMatch = medicationPickerGroups({ medications: [], query: "zzzz" });
  ok("a search with no match empties both groups", noMatch.mine.length === 0 && noMatch.catalogue.length === 0);
  const newRegimen = regimenFromShot({ name: "Wegovy\xAE", dose: 2.4, doseUnit: "mg", route: "subcutaneous", shots: [], dateKey: "2026-10-01" });
  ok("a picked catalogue product becomes a linked record", newRegimen.catalogue_id === "wegovy" && newRegimen.generic_name === "semaglutide");
  ok("its start date is the shot's own date", newRegimen.start_date === "2026-10-01");
  ok("its dose and label frequency are carried over", newRegimen.prescribed_dose === 2.4 && newRegimen.frequency === "once weekly");
  ok("it is flagged as needing its schedule", newRegimen.needs_details === true && newRegimen.regimen_source === "shot-log");
  ok("a label strength is not stored as a custom dose", newRegimen.custom_doses === void 0);
  const compoundedRegimen = regimenFromShot({ name: "Semaglutide (generic / compounded)", dose: 1.7, route: "subcutaneous", shots: [], dateKey: "2026-10-01", customDoses: [1.7] });
  ok("a compounded strength is remembered as a chip", Array.isArray(compoundedRegimen.custom_doses) && compoundedRegimen.custom_doses[0] === 1.7);
  ok("a compounded product claims no label frequency", compoundedRegimen.frequency === "");
  const saved = [{ id: "med1", medication_name: "Ozempic\xAE", generic_name: "semaglutide", dose_unit: "mg", route: "subcutaneous", status: "active", custom_doses: [1.5] }];
  const groups = medicationPickerGroups({ medications: saved, current: "Ozempic\xAE", query: "" });
  ok("a saved medication is listed under My medications", groups.mine.length === 1 && groups.mine[0].id === "med1");
  ok("and never offered twice from the catalogue", !groups.catalogue.some((r) => r.name === "Ozempic\xAE"));
  const chips = chipsForMedication(saved[0], []);
  ok("its label strengths and its saved dose are the chips", chips.includes(0.25) && chips.includes(2) && chips.includes(1.5));
  ok("a strength the label does not list is not offered as a chip", !chips.includes(3));
  const paused = [{ id: "med2", medication_name: "Mounjaro\xAE", status: "paused" }];
  ok(
    "the log's own paused medication stays reachable",
    medicationPickerGroups({ medications: paused, current: "Mounjaro\xAE" }).mine.some((r) => r.id === "med2")
  );
  ok(
    "a paused medication is not offered for a different log",
    medicationPickerGroups({ medications: paused, current: "Ozempic\xAE" }).mine.length === 0
  );
  ok(
    "a product chosen but not saved is never shown as saved",
    medicationPickerGroups({ medications: [], current: "Ozempic\xAE" }).mine.length === 0
  );
  const custom = regimenFromShot({ name: "Compounded X", dose: 0.5, doseUnit: "mL", route: "subcutaneous", shots: [], dateKey: "2026-09-30", customDoses: [0.5] });
  ok("a typed entry gets a record with no catalogue link", custom.catalogue_id === "" && custom.generic_name === "");
  ok("it keeps the unit that was typed", custom.dose_unit === "mL");
  ok("it too is flagged for its schedule", custom.needs_details === true);
  const history = [
    { medication: "Wegovy\xAE", date: "2026-09-20" },
    { medication: "Wegovy\xAE", date: "2026-10-02" },
    { medication: "Ozempic\xAE", date: "2026-01-01" }
  ];
  ok(
    "a backdated shot becomes the start date",
    regimenFromShot({ name: "Wegovy\xAE", dose: 2.4, dateKey: "2026-09-10", shots: history }).start_date === "2026-09-10"
  );
  ok(
    "an older existing shot still wins over a later one",
    regimenFromShot({ name: "Wegovy\xAE", dose: 2.4, dateKey: "2026-10-05", shots: history }).start_date === "2026-09-20"
  );
  ok(
    "another medication's history is ignored",
    regimenFromShot({ name: "Mounjaro\xAE", dose: 5, dateKey: "2026-10-05", shots: history }).start_date === "2026-10-05"
  );
  const failing = fakes({ failShot: true });
  const payloadFail = { medication: "Wegovy\xAE", dose: 2.4 };
  let threw = false;
  try {
    await saveShotWithMedication({ payload: payloadFail, regimen: newRegimen, writers: failing.writers });
  } catch {
    threw = true;
  }
  ok("a failed shot write reports the failure", threw);
  ok("no medication record is left orphaned", failing.state.records.length === 0);
  ok("the record it created is the one removed", failing.state.removed.length === 1 && failing.state.removed[0] === "rec1");
  ok("the caller's payload is left alone", payloadFail.medication_id === void 0 && failing.state.linked.length === 0);
  const working = fakes();
  await saveShotWithMedication({ payload: { medication: "Wegovy\xAE", dose: 2.4 }, regimen: newRegimen, writers: working.writers });
  ok(
    "a successful save creates the record and links the shot to it",
    working.state.records.length === 1 && working.state.shots[0].medication_id === working.state.records[0].id
  );
  const existing = fakes();
  await saveShotWithMedication({
    payload: { medication: "Ozempic\xAE", dose: 3, medication_id: "med1" },
    regimen: null,
    doseToRemember: { id: "med1", dose: 3 },
    writers: existing.writers
  });
  ok("an existing medication is not created again", existing.state.records.length === 0);
  ok("the shot keeps its link to the existing record", existing.state.shots[0].medication_id === "med1");
  ok(
    "a new strength is remembered on the existing record",
    existing.state.doses.length === 1 && existing.state.doses[0].id === "med1" && existing.state.doses[0].dose === 3
  );
  const editing = fakes();
  await saveShotWithMedication({
    payload: { medication: "Wegovy\xAE", dose: 2.4 },
    regimen: null,
    editingShotId: "shot9",
    writers: editing.writers
  });
  ok("editing a shot writes it in place", editing.state.updated.length === 1 && editing.state.updated[0].id === "shot9");
  ok("editing never touches a medication record", editing.state.records.length === 0 && editing.state.removed.length === 0);
  const failed = checks.filter((c) => !c.pass);
  console.log(`PICKER TEST: ${checks.length - failed.length}/${checks.length} passed`);
  failed.forEach((c) => console.log(`  FAILED: ${c.name}`));
})();
