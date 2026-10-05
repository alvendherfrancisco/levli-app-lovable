var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// tmp_report_check.mjs
var tmp_report_check_exports = {};
__export(tmp_report_check_exports, {
  runChecks: () => runChecks
});
module.exports = __toCommonJS(tmp_report_check_exports);

// src/lib/dateUtils.js
var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
var MONTH_IDX = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
function parseShotDate(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.replace(",", "").split(" ");
  return new Date(parseInt(parts[2]), MONTH_IDX[parts[0]] ?? 0, parseInt(parts[1]));
}
function formatShotDate(date) {
  return `${MONTHS[date.getMonth()]} ${String(date.getDate()).padStart(2, "0")}, ${date.getFullYear()}`;
}
function toDayKey(date) {
  const d = date instanceof Date ? date : new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function fromDayKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function todayKey() {
  return toDayKey(/* @__PURE__ */ new Date());
}
function calendarDaysBetween(startDateStr, endDateStr) {
  const a = startDateStr && startDateStr.includes("-") && !startDateStr.includes(",") ? fromDayKey(startDateStr) : parseShotDate(startDateStr);
  const b = endDateStr && endDateStr.includes("-") && !endDateStr.includes(",") ? fromDayKey(endDateStr) : parseShotDate(endDateStr);
  if (!a || !b) return 0;
  a.setHours(0, 0, 0, 0);
  b.setHours(0, 0, 0, 0);
  return Math.round((b - a) / 864e5);
}

// src/lib/repeatSchedule.js
function shotDateFromKey(dayKey) {
  return dayKey ? formatShotDate(fromDayKey(dayKey)) : "";
}

// src/lib/units.js
function weightToKg(value, unit) {
  if (value == null) return null;
  return unit === "kg" ? value : value * 0.453592;
}
function kgToUnit(kg, unit) {
  if (kg == null) return null;
  return unit === "kg" ? kg : kg / 0.453592;
}
function convertWeight(value, fromUnit, toUnit) {
  if (value == null) return null;
  if (fromUnit === toUnit) return value;
  return kgToUnit(weightToKg(value, fromUnit), toUnit);
}

// src/lib/measure.js
var KG_PER_LB = 0.45359237;
var LB_PER_KG = 1 / KG_PER_LB;
var CM_PER_IN = 2.54;
var BMI_PLAUSIBLE = { min: 12, max: 70 };
var roundKg = (kg) => kg == null ? null : Math.round(kg * 100) / 100;
function toKg(value, unit) {
  const n = typeof value === "number" ? value : parseFloat(value);
  if (!Number.isFinite(n)) return null;
  return roundKg(unit === "kg" ? n : n * KG_PER_LB);
}
function heightCmFromParts(ft, inch) {
  const f = parseFloat(ft) || 0;
  const i = parseFloat(inch) || 0;
  const totalIn = f * 12 + i;
  return totalIn > 0 ? Math.round(totalIn * CM_PER_IN * 10) / 10 : null;
}
function heightPartsFromCm(cm) {
  const totalIn = cm / CM_PER_IN;
  const ft = Math.floor(totalIn / 12);
  return { ft, inch: Math.round((totalIn - ft * 12) * 10) / 10 };
}
function heightCmOf(profile = {}) {
  const cm = parseFloat(profile.height_cm);
  if (Number.isFinite(cm) && cm > 0) return cm;
  return heightCmFromParts(profile.height_ft, profile.height_in);
}
function heightText(cm, unit) {
  if (!Number.isFinite(cm) || cm <= 0) return null;
  if (unit === "cm") return `${Math.round(cm)} cm`;
  const { ft, inch } = heightPartsFromCm(cm);
  return `${ft} ft ${inch} in (${Math.round(cm)} cm)`;
}
function bmiFor(kg, cm) {
  if (!Number.isFinite(kg) || !Number.isFinite(cm) || cm <= 0) return null;
  const m = cm / 100;
  return Math.round(kg / (m * m) * 10) / 10;
}
function bmiPlausible(bmi) {
  return Number.isFinite(bmi) && bmi >= BMI_PLAUSIBLE.min && bmi <= BMI_PLAUSIBLE.max;
}
function shownBmi(kg, cm) {
  const bmi = bmiFor(kg, cm);
  return bmiPlausible(bmi) ? bmi : null;
}

// src/lib/medicationConfig.js
var CUSTOM_MEDICATION_NAME = "Other / custom (prescriber-directed)";
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
function getIntervalDays(name) {
  return getMedicationConfig(name)?.dosingIntervalDays ?? null;
}

// src/lib/medicationCatalogue.js
var ROUTES = {
  SC: "subcutaneous",
  IM: "intramuscular",
  ID: "intradermal",
  IV: "intravenous_infusion",
  NASAL: "nasal",
  ORAL_TAB: "oral_tablet",
  ORAL_CAP: "oral_capsule",
  BUCCAL: "buccal_sublingual",
  TD: "transdermal",
  TOP_CREAM: "topical_cream",
  TOP_SERUM: "topical_serum",
  TOP_GEL: "topical_gel",
  IMPLANT: "implant",
  PUMP: "pump_infusion",
  RECON_VIAL: "reconstituted_vial",
  PFS: "prefilled_syringe",
  SD_PEN: "single_dose_pen",
  MD_PEN: "multidose_pen"
};
var MOL = {
  PEPTIDE: "peptide",
  PEPTIDE_ANALOGUE: "peptide_analogue",
  PROTEIN: "protein",
  MAB: "monoclonal_antibody",
  SMALL_MOL: "small_molecule",
  HORMONE: "hormone",
  AA_DERIV: "amino_acid_derivative",
  COSMETIC: "cosmetic_peptide",
  RADIOLIGAND: "radioligand_peptide"
};
var DEFAULT_CAPS = {
  supports_inventory: false,
  supports_refill_prediction: false,
  supports_injection_site_rotation: true,
  supports_reconstitution: false,
  supports_oral_timing_rules: false,
  supports_topical_tracking: false,
  supports_pk_estimation: true,
  supports_relative_exposure_only: true,
  supports_cgm_context: false,
  supports_weight_tracking: true,
  supports_clinic_administration: false,
  supports_missed_dose_guidance: true,
  supports_titration_tracking: true,
  supports_side_effect_rules: true,
  supports_storage_tracking: true,
  supports_temperature_excursion_logging: true,
  research_only: false,
  compounded_product: false,
  cosmetic_only: false,
  dosing_calculations_prohibited: false,
  clinical_review_required: false
};
var caps = (overrides = {}) => ({ ...DEFAULT_CAPS, ...overrides });
var COMPOUNDED_SEMAGLUTIDE = "Semaglutide (generic / compounded)";
var COMPOUNDED_TIRZEPATIDE = "Tirzepatide (generic / compounded)";
var MEDICATION_CATALOGUE = [
  // ═════════════════════════════════════════════════════════════════════════
  // A. METABOLIC, OBESITY AND DIABETES PEPTIDES
  // ═════════════════════════════════════════════════════════════════════════
  {
    id: "semaglutide",
    generic_name: "Semaglutide",
    brand_names: ["Ozempic\xAE", "Wegovy\xAE", "Rybelsus\xAE", COMPOUNDED_SEMAGLUTIDE],
    aliases: [],
    dev_codes: ["NN9536", "NNC0113-0217"],
    medication_class: "metabolic",
    molecular_class: MOL.PEPTIDE_ANALOGUE,
    amino_acid_length: 31,
    receptor_targets: "GLP-1 receptor",
    mechanism_of_action: "GLP-1 receptor agonist",
    manufacturer: "Novo Nordisk",
    routes: [ROUTES.SC, ROUTES.ORAL_TAB],
    approval: {
      US: { status: "approved", brands: ["Ozempic\xAE", "Wegovy\xAE", "Rybelsus\xAE"], date: "2017-12-05" },
      EU: { status: "approved", brands: ["Ozempic\xAE", "Wegovy\xAE", "Rybelsus\xAE"] },
      UK: { status: "approved", brands: ["Ozempic\xAE", "Wegovy\xAE", "Rybelsus\xAE"] }
    },
    dosing_interval_days: { subcutaneous: 7, oral_tablet: 1 },
    half_life_days: { subcutaneous: 7, oral_tablet: 1 },
    // oral ~1 week despite daily dosing
    dose_max: { "Ozempic\xAE": 2, "Wegovy\xAE": 2.4, "Rybelsus\xAE": 14, "Semaglutide": 2.4 },
    missed_dose: {
      subcutaneous: { weekly: true, retitrationDays: 5, advice: "If more than 5 days have passed, skip this dose and contact your prescriber \u2014 you may need to restart the dose escalation." },
      oral_tablet: { weekly: false, retitrationDays: 0, advice: "If you miss a daily dose, skip it and take the next dose at the usual time \u2014 do not take a double dose." }
    },
    capability: caps(),
    last_review: "2025-01-15"
  },
  {
    id: "tirzepatide",
    generic_name: "Tirzepatide",
    brand_names: ["Mounjaro\xAE", "Zepbound\xAE", COMPOUNDED_TIRZEPATIDE],
    medication_class: "metabolic",
    molecular_class: MOL.PEPTIDE_ANALOGUE,
    amino_acid_length: 39,
    receptor_targets: "GIP and GLP-1 receptors",
    mechanism_of_action: "GIP/GLP-1 dual receptor agonist",
    manufacturer: "Eli Lilly",
    routes: [ROUTES.SC],
    approval: {
      US: { status: "approved", brands: ["Mounjaro\xAE", "Zepbound\xAE"], date: "2022-05-13" },
      EU: { status: "approved", brands: ["Mounjaro\xAE"] },
      UK: { status: "approved", brands: ["Mounjaro\xAE", "Zepbound\xAE"] }
    },
    dosing_interval_days: { subcutaneous: 7 },
    half_life_days: { subcutaneous: 5 },
    dose_max: { "Mounjaro\xAE": 15, "Zepbound\xAE": 15, "Tirzepatide": 15 },
    missed_dose: {
      subcutaneous: { weekly: true, retitrationDays: 5, advice: "If more than 5 days have passed, take it as soon as you remember and contact your prescriber; you may need to restart titration." }
    },
    capability: caps(),
    last_review: "2025-01-15"
  },
  {
    id: "liraglutide",
    generic_name: "Liraglutide",
    brand_names: ["Victoza\xAE", "Saxenda\xAE"],
    medication_class: "metabolic",
    molecular_class: MOL.PEPTIDE_ANALOGUE,
    amino_acid_length: 31,
    receptor_targets: "GLP-1 receptor",
    mechanism_of_action: "GLP-1 receptor agonist",
    manufacturer: "Novo Nordisk",
    routes: [ROUTES.SC],
    approval: {
      US: { status: "approved", brands: ["Victoza\xAE", "Saxenda\xAE"], date: "2010-01-25" },
      EU: { status: "approved", brands: ["Victoza\xAE", "Saxenda\xAE"] },
      UK: { status: "approved", brands: ["Victoza\xAE", "Saxenda\xAE"] }
    },
    dosing_interval_days: { subcutaneous: 1 },
    half_life_days: { subcutaneous: 0.5 },
    dose_max: { "Saxenda\xAE": 3, "Victoza\xAE": 1.8, "Liraglutide": 3 },
    missed_dose: {
      subcutaneous: { weekly: false, retitrationDays: 0, advice: "If you miss a daily dose, skip it and take the next dose at the usual time \u2014 do not take a double dose." }
    },
    capability: caps(),
    last_review: "2025-01-15"
  },
  {
    id: "dulaglutide",
    generic_name: "Dulaglutide",
    brand_names: ["Trulicity\xAE"],
    medication_class: "metabolic",
    molecular_class: MOL.PEPTIDE_ANALOGUE,
    receptor_targets: "GLP-1 receptor",
    mechanism_of_action: "GLP-1 receptor agonist (fusion protein)",
    manufacturer: "Eli Lilly",
    routes: [ROUTES.SC],
    approval: {
      US: { status: "approved", brands: ["Trulicity\xAE"], date: "2014-09-18" },
      EU: { status: "approved" },
      UK: { status: "approved" }
    },
    dosing_interval_days: { subcutaneous: 7 },
    half_life_days: { subcutaneous: 5 },
    dose_max: { "Trulicity\xAE": 4.5, "Dulaglutide": 4.5 },
    missed_dose: {
      subcutaneous: { weekly: true, retitrationDays: 3, advice: "If a dose is missed, it can be taken within 3 days. After that, skip and take the next dose on the regular day." }
    },
    capability: caps(),
    last_review: "2025-01-15"
  },
  {
    id: "exenatide",
    generic_name: "Exenatide",
    brand_names: ["Byetta\xAE", "Bydureon\xAE"],
    medication_class: "metabolic",
    molecular_class: MOL.PEPTIDE,
    amino_acid_length: 39,
    receptor_targets: "GLP-1 receptor",
    mechanism_of_action: "GLP-1 receptor agonist (incretin mimetic)",
    manufacturer: "AstraZeneca",
    routes: [ROUTES.SC],
    approval: {
      US: { status: "approved", brands: ["Byetta\xAE", "Bydureon\xAE"], date: "2005-04-28" },
      EU: { status: "approved" },
      UK: { status: "approved" }
    },
    dosing_interval_days: { subcutaneous: { "Byetta\xAE": 0.5, "Bydureon\xAE": 7 } },
    // Byetta BID, Bydureon weekly
    half_life_days: { subcutaneous: { "Byetta\xAE": 0.1, "Bydureon\xAE": 2.4 } },
    dose_max: { "Byetta\xAE": 0.02, "Bydureon\xAE": 2, "Exenatide": 2 },
    capability: caps(),
    last_review: "2025-01-15"
  },
  {
    id: "lixisenatide",
    generic_name: "Lixisenatide",
    brand_names: ["Adlyxin\xAE", "Lyxumia\xAE"],
    medication_class: "metabolic",
    molecular_class: MOL.PEPTIDE_ANALOGUE,
    receptor_targets: "GLP-1 receptor",
    mechanism_of_action: "GLP-1 receptor agonist",
    manufacturer: "Sanofi",
    routes: [ROUTES.SC],
    approval: {
      US: { status: "approved", brands: ["Adlyxin\xAE"], date: "2016-07-27" },
      EU: { status: "approved", brands: ["Lyxumia\xAE"] },
      UK: { status: "approved" }
    },
    dosing_interval_days: { subcutaneous: 1 },
    half_life_days: { subcutaneous: 0.2 },
    dose_max: { "Adlyxin\xAE": 0.02, "Lixisenatide": 0.02 },
    capability: caps(),
    last_review: "2025-01-15"
  },
  {
    id: "pramlintide",
    generic_name: "Pramlintide",
    brand_names: ["Symlin\xAE"],
    medication_class: "metabolic",
    molecular_class: MOL.PEPTIDE_ANALOGUE,
    amino_acid_length: 37,
    receptor_targets: "Amylin receptor",
    mechanism_of_action: "Amylin receptor agonist",
    manufacturer: "AstraZeneca",
    routes: [ROUTES.SC],
    approval: {
      US: { status: "approved", brands: ["Symlin\xAE"], date: "2005-03-16" },
      EU: { status: "not_approved" },
      UK: { status: "not_approved" }
    },
    dosing_interval_days: { subcutaneous: 0.33 },
    // TID with meals
    half_life_days: { subcutaneous: 0.2 },
    dose_max: { "Symlin\xAE": 0.12, "Pramlintide": 0.12 },
    capability: caps(),
    last_review: "2025-01-15"
  },
  {
    id: "retatrutide",
    generic_name: "Retatrutide",
    brand_names: [],
    medication_class: "metabolic",
    molecular_class: MOL.PEPTIDE_ANALOGUE,
    amino_acid_length: 39,
    receptor_targets: "GIP, GLP-1, and glucagon receptors",
    mechanism_of_action: "GIP/GLP-1/glucagon triple receptor agonist",
    manufacturer: "Eli Lilly",
    routes: [ROUTES.SC],
    approval: {
      US: { status: "investigational" },
      EU: { status: "investigational" },
      UK: { status: "investigational" }
    },
    dosing_interval_days: {},
    half_life_days: {},
    dose_max: { "Retatrutide": 12 },
    missed_dose: {},
    capability: caps({
      research_only: true,
      supports_pk_estimation: false,
      supports_missed_dose_guidance: false,
      supports_titration_tracking: false,
      dosing_calculations_prohibited: true,
      clinical_review_required: true
    }),
    last_review: "2025-01-15"
  },
  {
    id: "cagrilintide",
    generic_name: "Cagrilintide",
    brand_names: [],
    medication_class: "metabolic",
    molecular_class: MOL.PEPTIDE_ANALOGUE,
    receptor_targets: "Amylin receptor",
    mechanism_of_action: "Long-acting amylin analogue",
    manufacturer: "Novo Nordisk",
    routes: [ROUTES.SC],
    approval: { US: { status: "investigational" }, EU: { status: "investigational" }, UK: { status: "investigational" } },
    dosing_interval_days: {},
    half_life_days: {},
    dose_max: {},
    capability: caps({ research_only: true, supports_pk_estimation: false, supports_missed_dose_guidance: false, dosing_calculations_prohibited: true }),
    last_review: "2025-01-15"
  },
  {
    id: "cagrisema",
    generic_name: "CagriSema (cagrilintide + semaglutide)",
    brand_names: [],
    medication_class: "metabolic",
    molecular_class: MOL.PEPTIDE_ANALOGUE,
    mechanism_of_action: "Fixed-dose combination of cagrilintide and semaglutide",
    manufacturer: "Novo Nordisk",
    routes: [ROUTES.SC],
    approval: { US: { status: "investigational" }, EU: { status: "investigational" }, UK: { status: "investigational" } },
    dosing_interval_days: {},
    half_life_days: {},
    dose_max: {},
    capability: caps({ research_only: true, supports_pk_estimation: false, supports_missed_dose_guidance: false, dosing_calculations_prohibited: true }),
    last_review: "2025-01-15"
  },
  {
    id: "orforglipron",
    generic_name: "Orforglipron",
    brand_names: [],
    medication_class: "metabolic",
    molecular_class: MOL.SMALL_MOL,
    // NON-PEPTIDE — small molecule GLP-1 agonist
    receptor_targets: "GLP-1 receptor",
    mechanism_of_action: "Oral non-peptide GLP-1 receptor agonist",
    manufacturer: "Eli Lilly",
    routes: [ROUTES.ORAL_TAB],
    approval: { US: { status: "investigational" }, EU: { status: "investigational" }, UK: { status: "investigational" } },
    dosing_interval_days: {},
    half_life_days: {},
    dose_max: {},
    capability: caps({ research_only: true, supports_pk_estimation: false, supports_injection_site_rotation: false, supports_missed_dose_guidance: false, dosing_calculations_prohibited: true }),
    last_review: "2025-01-15"
  },
  {
    id: "metformin",
    generic_name: "Metformin",
    brand_names: ["Glucophage\xAE"],
    medication_class: "metabolic",
    molecular_class: MOL.SMALL_MOL,
    // NON-PEPTIDE — biguanide
    mechanism_of_action: "Biguanide; reduces hepatic glucose production",
    manufacturer: "Various (generic)",
    routes: [ROUTES.ORAL_TAB],
    approval: { US: { status: "approved" }, EU: { status: "approved" }, UK: { status: "approved" } },
    dosing_interval_days: { oral_tablet: 0.5 },
    // BID
    half_life_days: { oral_tablet: 0.25 },
    dose_max: { "Metformin": 2.55 },
    // 2550 mg
    capability: caps({ supports_injection_site_rotation: false, supports_pk_estimation: false, supports_missed_dose_guidance: false, supports_titration_tracking: false }),
    last_review: "2025-01-15"
  },
  // ═════════════════════════════════════════════════════════════════════════
  // B. PITUITARY, GROWTH-HORMONE AND ENDOCRINE PEPTIDES
  // ═════════════════════════════════════════════════════════════════════════
  {
    id: "somatropin",
    generic_name: "Somatropin",
    brand_names: ["Genotropin\xAE", "Humatrope\xAE", "Norditropin\xAE", "Saizen\xAE"],
    medication_class: "endocrine",
    molecular_class: MOL.PROTEIN,
    // NOT a peptide — 191-aa protein (rhGH)
    amino_acid_length: 191,
    receptor_targets: "Growth hormone receptor",
    mechanism_of_action: "Recombinant human growth hormone",
    manufacturer: "Pfizer, Eli Lilly, Novo Nordisk, Merck",
    routes: [ROUTES.SC],
    approval: { US: { status: "approved" }, EU: { status: "approved" }, UK: { status: "approved" } },
    dosing_interval_days: { subcutaneous: 1 },
    half_life_days: { subcutaneous: 0.15 },
    dose_max: {},
    capability: caps({ supports_weight_tracking: false, supports_pk_estimation: false, supports_missed_dose_guidance: false, supports_titration_tracking: false, clinical_review_required: true }),
    last_review: "2025-01-15"
  },
  {
    id: "tesamorelin",
    generic_name: "Tesamorelin",
    brand_names: ["Egrifta\xAE"],
    medication_class: "endocrine",
    molecular_class: MOL.PEPTIDE_ANALOGUE,
    // GHRH analogue — 44-aa peptide
    amino_acid_length: 44,
    receptor_targets: "GHRH receptor",
    mechanism_of_action: "Growth hormone-releasing hormone analogue",
    manufacturer: "Theratechnologies",
    routes: [ROUTES.SC],
    approval: { US: { status: "approved", brands: ["Egrifta\xAE"] }, EU: { status: "not_approved" }, UK: { status: "not_approved" } },
    dosing_interval_days: { subcutaneous: 1 },
    half_life_days: { subcutaneous: 0.3 },
    dose_max: { "Egrifta\xAE": 2, "Tesamorelin": 2 },
    capability: caps({ supports_pk_estimation: false, supports_missed_dose_guidance: false, clinical_review_required: true }),
    last_review: "2025-01-15"
  },
  {
    id: "sermorelin",
    generic_name: "Sermorelin",
    brand_names: ["Geref\xAE"],
    medication_class: "endocrine",
    molecular_class: MOL.PEPTIDE,
    // GHRH fragment 1-29
    amino_acid_length: 29,
    receptor_targets: "GHRH receptor",
    mechanism_of_action: "Growth hormone-releasing hormone fragment",
    manufacturer: "EMD Serono (discontinued brand)",
    routes: [ROUTES.SC],
    approval: { US: { status: "discontinued", note: "Brand discontinued; compounded versions exist" }, EU: { status: "not_approved" }, UK: { status: "not_approved" } },
    dosing_interval_days: { subcutaneous: 1 },
    half_life_days: { subcutaneous: 0.05 },
    dose_max: {},
    capability: caps({ supports_pk_estimation: false, supports_missed_dose_guidance: false, compounded_product: true, clinical_review_required: true }),
    last_review: "2025-01-15"
  },
  {
    id: "octreotide",
    generic_name: "Octreotide",
    brand_names: ["Sandostatin\xAE", "Sandostatin LAR\xAE"],
    medication_class: "endocrine",
    molecular_class: MOL.PEPTIDE_ANALOGUE,
    // Somatostatin analogue — 8-aa
    amino_acid_length: 8,
    receptor_targets: "Somatostatin receptors (SSTR2, SSTR5)",
    mechanism_of_action: "Somatostatin receptor agonist",
    manufacturer: "Novartis",
    routes: [ROUTES.SC, ROUTES.IM],
    approval: { US: { status: "approved" }, EU: { status: "approved" }, UK: { status: "approved" } },
    dosing_interval_days: { subcutaneous: 0.33, intramuscular: { "Sandostatin LAR\xAE": 28 } },
    half_life_days: { subcutaneous: 0.4, intramuscular: 1.8 },
    dose_max: { "Sandostatin\xAE": 1.5, "Sandostatin LAR\xAE": 40, "Octreotide": 40 },
    capability: caps({ supports_pk_estimation: false, supports_missed_dose_guidance: false, clinical_review_required: true }),
    last_review: "2025-01-15"
  },
  {
    id: "lanreotide",
    generic_name: "Lanreotide",
    brand_names: ["Somatuline\xAE", "Somatuline Depot\xAE"],
    medication_class: "endocrine",
    molecular_class: MOL.PEPTIDE_ANALOGUE,
    amino_acid_length: 8,
    receptor_targets: "Somatostatin receptors",
    mechanism_of_action: "Somatostatin receptor agonist (depot)",
    manufacturer: "Ipsen",
    routes: [ROUTES.SC],
    approval: { US: { status: "approved" }, EU: { status: "approved" }, UK: { status: "approved" } },
    dosing_interval_days: { subcutaneous: 28 },
    half_life_days: { subcutaneous: 5.8 },
    dose_max: { "Somatuline\xAE": 0.12, "Lanreotide": 0.12 },
    capability: caps({ supports_pk_estimation: false, supports_missed_dose_guidance: false, clinical_review_required: true }),
    last_review: "2025-01-15"
  },
  {
    id: "pasireotide",
    generic_name: "Pasireotide",
    brand_names: ["Signifor\xAE", "Signifor LAR\xAE"],
    medication_class: "endocrine",
    molecular_class: MOL.PEPTIDE_ANALOGUE,
    amino_acid_length: 6,
    receptor_targets: "Somatostatin receptors (SSTR1-5, esp. SSTR5)",
    mechanism_of_action: "Somatostatin receptor agonist",
    manufacturer: "Novartis",
    routes: [ROUTES.SC, ROUTES.IM],
    approval: { US: { status: "approved" }, EU: { status: "approved" }, UK: { status: "approved" } },
    dosing_interval_days: { subcutaneous: 0.5, intramuscular: 28 },
    half_life_days: { subcutaneous: 0.5 },
    dose_max: { "Signifor\xAE": 1.8, "Signifor LAR\xAE": 60, "Pasireotide": 60 },
    capability: caps({ supports_pk_estimation: false, supports_missed_dose_guidance: false, clinical_review_required: true }),
    last_review: "2025-01-15"
  },
  {
    id: "teriparatide",
    generic_name: "Teriparatide",
    brand_names: ["Forteo\xAE"],
    medication_class: "endocrine",
    molecular_class: MOL.PEPTIDE,
    // PTH fragment 1-34
    amino_acid_length: 34,
    receptor_targets: "PTH-1 receptor",
    mechanism_of_action: "Parathyroid hormone analogue (anabolic)",
    manufacturer: "Eli Lilly",
    routes: [ROUTES.SC],
    approval: { US: { status: "approved" }, EU: { status: "approved" }, UK: { status: "approved" } },
    dosing_interval_days: { subcutaneous: 1 },
    half_life_days: { subcutaneous: 0.05 },
    dose_max: { "Forteo\xAE": 0.02, "Teriparatide": 0.02 },
    capability: caps({ supports_pk_estimation: false, supports_missed_dose_guidance: false, supports_weight_tracking: false, clinical_review_required: true }),
    last_review: "2025-01-15"
  },
  {
    id: "abaloparatide",
    generic_name: "Abaloparatide",
    brand_names: ["Tymlos\xAE"],
    medication_class: "endocrine",
    molecular_class: MOL.PEPTIDE_ANALOGUE,
    // PTHrP analogue — 34-aa
    amino_acid_length: 34,
    receptor_targets: "PTH-1 receptor",
    mechanism_of_action: "Parathyroid hormone-related protein analogue",
    manufacturer: "Radius Health",
    routes: [ROUTES.SC],
    approval: { US: { status: "approved" }, EU: { status: "approved" }, UK: { status: "approved" } },
    dosing_interval_days: { subcutaneous: 1 },
    half_life_days: { subcutaneous: 0.07 },
    dose_max: { "Tymlos\xAE": 0.08, "Abaloparatide": 0.08 },
    capability: caps({ supports_pk_estimation: false, supports_missed_dose_guidance: false, supports_weight_tracking: false, clinical_review_required: true }),
    last_review: "2025-01-15"
  },
  {
    id: "leuprolide",
    generic_name: "Leuprolide",
    brand_names: ["Lupron Depot\xAE", "Eligard\xAE", "Lupron\xAE"],
    medication_class: "endocrine",
    molecular_class: MOL.PEPTIDE_ANALOGUE,
    // GnRH agonist — 9-aa
    amino_acid_length: 9,
    receptor_targets: "GnRH receptor",
    mechanism_of_action: "GnRH receptor agonist (continuous desensitising)",
    manufacturer: "AbbVie, Tolmar",
    routes: [ROUTES.SC, ROUTES.IM],
    approval: { US: { status: "approved" }, EU: { status: "approved" }, UK: { status: "approved" } },
    dosing_interval_days: { subcutaneous: { "Eligard\xAE": 28 }, intramuscular: { "Lupron Depot\xAE": 28 } },
    half_life_days: {},
    dose_max: {},
    capability: caps({ supports_pk_estimation: false, supports_missed_dose_guidance: false, supports_weight_tracking: false, supports_titration_tracking: false, clinical_review_required: true }),
    last_review: "2025-01-15"
  },
  {
    id: "goserelin",
    generic_name: "Goserelin",
    brand_names: ["Zoladex\xAE"],
    medication_class: "endocrine",
    molecular_class: MOL.PEPTIDE_ANALOGUE,
    amino_acid_length: 10,
    receptor_targets: "GnRH receptor",
    mechanism_of_action: "GnRH receptor agonist (depot implant)",
    manufacturer: "AstraZeneca",
    routes: [ROUTES.IMPLANT],
    // SC implant
    approval: { US: { status: "approved" }, EU: { status: "approved" }, UK: { status: "approved" } },
    dosing_interval_days: { implant: 28 },
    half_life_days: {},
    dose_max: {},
    capability: caps({ supports_pk_estimation: false, supports_missed_dose_guidance: false, supports_weight_tracking: false, supports_injection_site_rotation: true, clinical_review_required: true }),
    last_review: "2025-01-15"
  },
  {
    id: "degarelix",
    generic_name: "Degarelix",
    brand_names: ["Firmagon\xAE"],
    medication_class: "endocrine",
    molecular_class: MOL.PEPTIDE_ANALOGUE,
    // GnRH antagonist
    amino_acid_length: 7,
    receptor_targets: "GnRH receptor",
    mechanism_of_action: "GnRH receptor antagonist",
    manufacturer: "Ferring",
    routes: [ROUTES.SC],
    approval: { US: { status: "approved" }, EU: { status: "approved" }, UK: { status: "approved" } },
    dosing_interval_days: { subcutaneous: 28 },
    half_life_days: { subcutaneous: 7 },
    dose_max: { "Firmagon\xAE": 0.12, "Degarelix": 0.12 },
    capability: caps({ supports_pk_estimation: false, supports_missed_dose_guidance: false, supports_weight_tracking: false, clinical_review_required: true }),
    last_review: "2025-01-15"
  },
  {
    id: "desmopressin",
    generic_name: "Desmopressin",
    brand_names: ["DDAVP\xAE", "Minirin\xAE", "Noctiva\xAE"],
    medication_class: "endocrine",
    molecular_class: MOL.PEPTIDE_ANALOGUE,
    // Vasopressin analogue — 9-aa
    amino_acid_length: 9,
    receptor_targets: "V2 vasopressin receptor",
    mechanism_of_action: "Vasopressin analogue (antidiuretic)",
    manufacturer: "Ferring, various",
    routes: [ROUTES.NASAL, ROUTES.ORAL_TAB, ROUTES.SC],
    approval: { US: { status: "approved" }, EU: { status: "approved" }, UK: { status: "approved" } },
    dosing_interval_days: {},
    half_life_days: {},
    dose_max: {},
    capability: caps({ supports_pk_estimation: false, supports_injection_site_rotation: false, supports_weight_tracking: false, clinical_review_required: true }),
    last_review: "2025-01-15"
  },
  // ═════════════════════════════════════════════════════════════════════════
  // C. FERTILITY AND REPRODUCTIVE MEDICINES
  // ═════════════════════════════════════════════════════════════════════════
  {
    id: "follitropin_alfa",
    generic_name: "Follitropin alfa",
    brand_names: ["Gonal-f\xAE"],
    medication_class: "fertility",
    molecular_class: MOL.PROTEIN,
    // Recombinant FSH — NOT a peptide (glycoprotein)
    receptor_targets: "FSH receptor",
    mechanism_of_action: "Recombinant follicle-stimulating hormone",
    manufacturer: "Merck/EMD Serono",
    routes: [ROUTES.SC],
    approval: { US: { status: "approved" }, EU: { status: "approved" }, UK: { status: "approved" } },
    dosing_interval_days: { subcutaneous: 1 },
    half_life_days: { subcutaneous: 1 },
    dose_max: {},
    capability: caps({ supports_pk_estimation: false, supports_missed_dose_guidance: false, supports_weight_tracking: false, supports_titration_tracking: false, clinical_review_required: true, dosing_calculations_prohibited: true }),
    note: "Must track clinician-provided regimen only \u2014 do not infer dosing.",
    last_review: "2025-01-15"
  },
  {
    id: "choriogonadotropin_alfa",
    generic_name: "Choriogonadotropin alfa",
    brand_names: ["Ovidrel\xAE", "Ovitrelle\xAE"],
    medication_class: "fertility",
    molecular_class: MOL.PROTEIN,
    // Recombinant hCG — glycoprotein, not peptide
    receptor_targets: "LH/hCG receptor",
    mechanism_of_action: "Recombinant human chorionic gonadotropin",
    manufacturer: "Merck/EMD Serono",
    routes: [ROUTES.SC],
    approval: { US: { status: "approved" }, EU: { status: "approved" }, UK: { status: "approved" } },
    dosing_interval_days: {},
    half_life_days: { subcutaneous: 1.3 },
    dose_max: { "Ovidrel\xAE": 0.25 },
    capability: caps({ supports_pk_estimation: false, supports_missed_dose_guidance: false, supports_weight_tracking: false, clinical_review_required: true, dosing_calculations_prohibited: true }),
    last_review: "2025-01-15"
  },
  {
    id: "menotropins",
    generic_name: "Menotropins",
    brand_names: ["Menopur\xAE", "Repronex\xAE"],
    medication_class: "fertility",
    molecular_class: MOL.PROTEIN,
    // Urinary gonadotropin extract
    receptor_targets: "FSH and LH receptors",
    mechanism_of_action: "Urinary-derived gonadotropin (FSH + LH)",
    manufacturer: "Ferring",
    routes: [ROUTES.SC],
    approval: { US: { status: "approved" }, EU: { status: "approved" }, UK: { status: "approved" } },
    dosing_interval_days: { subcutaneous: 1 },
    half_life_days: {},
    dose_max: {},
    capability: caps({ supports_pk_estimation: false, supports_missed_dose_guidance: false, supports_weight_tracking: false, clinical_review_required: true, dosing_calculations_prohibited: true }),
    last_review: "2025-01-15"
  },
  // ═════════════════════════════════════════════════════════════════════════
  // D. GASTROINTESTINAL AND SHORT-BOWEL THERAPIES
  // ═════════════════════════════════════════════════════════════════════════
  {
    id: "teduglutide",
    generic_name: "Teduglutide",
    brand_names: ["Gattex\xAE", "Revestive\xAE"],
    medication_class: "gastrointestinal",
    molecular_class: MOL.PEPTIDE_ANALOGUE,
    // GLP-2 analogue — 33-aa
    amino_acid_length: 33,
    receptor_targets: "GLP-2 receptor",
    mechanism_of_action: "GLP-2 receptor agonist (intestinal adaptation)",
    manufacturer: "Shire/Takeda",
    routes: [ROUTES.SC],
    approval: { US: { status: "approved" }, EU: { status: "approved" }, UK: { status: "approved" } },
    dosing_interval_days: { subcutaneous: 1 },
    half_life_days: { subcutaneous: 0.08 },
    dose_max: { "Gattex\xAE": 0.05, "Teduglutide": 0.05 },
    capability: caps({ supports_pk_estimation: false, supports_missed_dose_guidance: false, supports_weight_tracking: false, clinical_review_required: true }),
    last_review: "2025-01-15"
  },
  {
    id: "linaclotide",
    generic_name: "Linaclotide",
    brand_names: ["Linzess\xAE", "Constella\xAE"],
    medication_class: "gastrointestinal",
    molecular_class: MOL.PEPTIDE,
    // 14-aa peptide
    amino_acid_length: 14,
    receptor_targets: "Guanylate cyclase-C",
    mechanism_of_action: "Guanylate cyclase-C agonist (minimal systemic absorption)",
    manufacturer: "AbbVie/Allergan, Ironwood",
    routes: [ROUTES.ORAL_CAP],
    approval: { US: { status: "approved" }, EU: { status: "approved" }, UK: { status: "approved" } },
    dosing_interval_days: { oral_capsule: 1 },
    half_life_days: {},
    // Not established — minimal systemic absorption
    dose_max: { "Linzess\xAE": 0.29, "Linaclotide": 0.29 },
    capability: caps({ supports_pk_estimation: false, supports_injection_site_rotation: false, supports_missed_dose_guidance: false, supports_weight_tracking: false, supports_titration_tracking: false, clinical_review_required: true }),
    last_review: "2025-01-15"
  },
  {
    id: "plecanatide",
    generic_name: "Plecanatide",
    brand_names: ["Trulance\xAE"],
    medication_class: "gastrointestinal",
    molecular_class: MOL.PEPTIDE_ANALOGUE,
    // 16-aa peptide analogue
    amino_acid_length: 16,
    receptor_targets: "Guanylate cyclase-C",
    mechanism_of_action: "Guanylate cyclase-C agonist (minimal systemic absorption)",
    manufacturer: "Bausch Health",
    routes: [ROUTES.ORAL_TAB],
    approval: { US: { status: "approved" }, EU: { status: "not_approved" }, UK: { status: "not_approved" } },
    dosing_interval_days: { oral_tablet: 1 },
    half_life_days: {},
    dose_max: { "Trulance\xAE": 3, "Plecanatide": 3 },
    capability: caps({ supports_pk_estimation: false, supports_injection_site_rotation: false, supports_missed_dose_guidance: false, supports_weight_tracking: false, clinical_review_required: true }),
    last_review: "2025-01-15"
  },
  // ═════════════════════════════════════════════════════════════════════════
  // F. NEUROLOGY, PAIN AND MIGRAINE — CGRP PATHWAY
  // Note: These are monoclonal antibodies, NOT peptides. Correctly labelled.
  // ═════════════════════════════════════════════════════════════════════════
  {
    id: "erenumab",
    generic_name: "Erenumab",
    brand_names: ["Aimovig\xAE"],
    medication_class: "neurology",
    molecular_class: MOL.MAB,
    // NOT a peptide — fully human monoclonal antibody
    receptor_targets: "CGRP receptor",
    mechanism_of_action: "CGRP receptor antagonist (monoclonal antibody)",
    manufacturer: "Amgen/Novartis",
    routes: [ROUTES.SC],
    approval: { US: { status: "approved" }, EU: { status: "approved" }, UK: { status: "approved" } },
    dosing_interval_days: { subcutaneous: 30 },
    half_life_days: { subcutaneous: 28 },
    dose_max: { "Aimovig\xAE": 0.14, "Erenumab": 0.14 },
    capability: caps({ supports_pk_estimation: false, supports_missed_dose_guidance: false, supports_weight_tracking: false, supports_titration_tracking: false, clinical_review_required: true }),
    last_review: "2025-01-15"
  },
  {
    id: "fremanezumab",
    generic_name: "Fremanezumab",
    brand_names: ["Ajovy\xAE"],
    medication_class: "neurology",
    molecular_class: MOL.MAB,
    // NOT a peptide — humanized monoclonal antibody
    receptor_targets: "CGRP ligand",
    mechanism_of_action: "CGRP ligand antagonist (monoclonal antibody)",
    manufacturer: "Teva",
    routes: [ROUTES.SC],
    approval: { US: { status: "approved" }, EU: { status: "approved" }, UK: { status: "approved" } },
    dosing_interval_days: { subcutaneous: 30 },
    // monthly or quarterly
    half_life_days: { subcutaneous: 31 },
    dose_max: { "Ajovy\xAE": 0.675, "Fremanezumab": 0.675 },
    capability: caps({ supports_pk_estimation: false, supports_missed_dose_guidance: false, supports_weight_tracking: false, clinical_review_required: true }),
    last_review: "2025-01-15"
  },
  {
    id: "galcanezumab",
    generic_name: "Galcanezumab",
    brand_names: ["Emgality\xAE"],
    medication_class: "neurology",
    molecular_class: MOL.MAB,
    // NOT a peptide — humanized monoclonal antibody
    receptor_targets: "CGRP ligand",
    mechanism_of_action: "CGRP ligand antagonist (monoclonal antibody)",
    manufacturer: "Eli Lilly",
    routes: [ROUTES.SC],
    approval: { US: { status: "approved" }, EU: { status: "approved" }, UK: { status: "approved" } },
    dosing_interval_days: { subcutaneous: 30 },
    half_life_days: { subcutaneous: 27 },
    dose_max: { "Emgality\xAE": 0.24, "Galcanezumab": 0.24 },
    capability: caps({ supports_pk_estimation: false, supports_missed_dose_guidance: false, supports_weight_tracking: false, clinical_review_required: true }),
    last_review: "2025-01-15"
  },
  {
    id: "eptinezumab",
    generic_name: "Eptinezumab",
    brand_names: ["Vyepti\xAE"],
    medication_class: "neurology",
    molecular_class: MOL.MAB,
    // NOT a peptide — humanized monoclonal antibody
    receptor_targets: "CGRP ligand",
    mechanism_of_action: "CGRP ligand antagonist (monoclonal antibody, IV infusion)",
    manufacturer: "Lundbeck",
    routes: [ROUTES.IV],
    approval: { US: { status: "approved" }, EU: { status: "approved" }, UK: { status: "approved" } },
    dosing_interval_days: { intravenous_infusion: 90 },
    half_life_days: { intravenous_infusion: 27 },
    dose_max: { "Vyepti\xAE": 0.3, "Eptinezumab": 0.3 },
    capability: caps({ supports_pk_estimation: false, supports_injection_site_rotation: false, supports_missed_dose_guidance: false, supports_weight_tracking: false, supports_clinic_administration: true, clinical_review_required: true }),
    last_review: "2025-01-15"
  },
  // ═════════════════════════════════════════════════════════════════════════
  // G. ONCOLOGY AND RADIOLIGAND PEPTIDE THERAPY
  // Clinician-administered only — no consumer self-injection.
  // ═════════════════════════════════════════════════════════════════════════
  {
    id: "lutetium_177_dotatate",
    generic_name: "Lutetium Lu 177 dotatate",
    brand_names: ["Lutathera\xAE"],
    medication_class: "oncology",
    molecular_class: MOL.RADIOLIGAND,
    // Radiolabelled peptide (somatostatin analogue)
    amino_acid_length: 8,
    receptor_targets: "Somatostatin receptor subtype 2 (SSTR2)",
    mechanism_of_action: "Peptide receptor radionuclide therapy (radioligand)",
    manufacturer: "Advanced Accelerator Applications (Novartis)",
    routes: [ROUTES.IV],
    approval: { US: { status: "approved" }, EU: { status: "approved" }, UK: { status: "approved" } },
    dosing_interval_days: { intravenous_infusion: 56 },
    // q8 weeks × 4
    half_life_days: {},
    dose_max: { "Lutathera\xAE": 7400 },
    // MBq
    capability: caps({ supports_pk_estimation: false, supports_injection_site_rotation: false, supports_missed_dose_guidance: false, supports_weight_tracking: false, supports_titration_tracking: false, supports_clinic_administration: true, clinical_review_required: true, dosing_calculations_prohibited: true }),
    note: "Hospital-administered radioligand therapy. Tracking only \u2014 no self-administration.",
    last_review: "2025-01-15"
  },
  {
    id: "lutetium_177_psm617",
    generic_name: "Lutetium Lu 177 vipivotide tetraxetan",
    brand_names: ["Pluvicto\xAE"],
    medication_class: "oncology",
    molecular_class: MOL.RADIOLIGAND,
    // Radiolabelled peptide (PSMA-targeting)
    receptor_targets: "Prostate-specific membrane antigen (PSMA)",
    mechanism_of_action: "PSMA-targeted radioligand therapy",
    manufacturer: "Novartis",
    routes: [ROUTES.IV],
    approval: { US: { status: "approved" }, EU: { status: "approved" }, UK: { status: "approved" } },
    dosing_interval_days: { intravenous_infusion: 42 },
    // q6 weeks × 6
    half_life_days: {},
    dose_max: { "Pluvicto\xAE": 7400 },
    capability: caps({ supports_pk_estimation: false, supports_injection_site_rotation: false, supports_missed_dose_guidance: false, supports_weight_tracking: false, supports_clinic_administration: true, clinical_review_required: true, dosing_calculations_prohibited: true }),
    note: "Hospital-administered radioligand therapy. Tracking only \u2014 no self-administration.",
    last_review: "2025-01-15"
  },
  // ═════════════════════════════════════════════════════════════════════════
  // J. DERMATOLOGY AND COSMETIC TOPICAL PEPTIDES
  // These are cosmetic ingredients, NOT medicines. No systemic PK.
  // ═════════════════════════════════════════════════════════════════════════
  {
    id: "ghk_cu",
    generic_name: "GHK-Cu (Copper tripeptide-1)",
    brand_names: [],
    medication_class: "dermatology_cosmetic",
    molecular_class: MOL.COSMETIC,
    // Cosmetic peptide — NOT a medicine
    amino_acid_length: 3,
    mechanism_of_action: "Cosmetic ingredient; wound-healing signal peptide (in vitro evidence)",
    routes: [ROUTES.TOP_SERUM, ROUTES.TOP_CREAM],
    approval: {
      US: { status: "cosmetic_ingredient", note: "Not an FDA-approved drug; cosmetic use only" },
      EU: { status: "cosmetic_ingredient" },
      UK: { status: "cosmetic_ingredient" }
    },
    dosing_interval_days: {},
    half_life_days: {},
    // Systemic PK not meaningful for topical cosmetic
    dose_max: {},
    capability: caps({
      cosmetic_only: true,
      supports_pk_estimation: false,
      supports_injection_site_rotation: false,
      supports_missed_dose_guidance: false,
      supports_weight_tracking: false,
      supports_titration_tracking: false,
      supports_side_effect_rules: false,
      supports_storage_tracking: false,
      supports_temperature_excursion_logging: false,
      dosing_calculations_prohibited: true
    }),
    note: "Cosmetic ingredient \u2014 do not model systemic pharmacokinetics. Evidence is in-vitro/animal; human clinical evidence is limited.",
    last_review: "2025-01-15"
  },
  {
    id: "palmitoyl_pentapeptide",
    generic_name: "Palmitoyl pentapeptide-4 (Matrixyl)",
    brand_names: [],
    medication_class: "dermatology_cosmetic",
    molecular_class: MOL.COSMETIC,
    amino_acid_length: 5,
    mechanism_of_action: "Cosmetic signal peptide (collagen stimulation claim)",
    routes: [ROUTES.TOP_SERUM, ROUTES.TOP_CREAM],
    approval: { US: { status: "cosmetic_ingredient" }, EU: { status: "cosmetic_ingredient" }, UK: { status: "cosmetic_ingredient" } },
    dosing_interval_days: {},
    half_life_days: {},
    dose_max: {},
    capability: caps({
      cosmetic_only: true,
      supports_pk_estimation: false,
      supports_injection_site_rotation: false,
      supports_missed_dose_guidance: false,
      supports_weight_tracking: false,
      supports_titration_tracking: false,
      supports_side_effect_rules: false,
      supports_storage_tracking: false,
      dosing_calculations_prohibited: true
    }),
    last_review: "2025-01-15"
  },
  {
    id: "acetyl_hexapeptide",
    generic_name: "Acetyl hexapeptide-8 (Argireline)",
    brand_names: [],
    medication_class: "dermatology_cosmetic",
    molecular_class: MOL.COSMETIC,
    amino_acid_length: 6,
    mechanism_of_action: "Cosmetic neurotransmitter-inhibiting peptide (topical 'botox-like' claim)",
    routes: [ROUTES.TOP_SERUM, ROUTES.TOP_CREAM],
    approval: { US: { status: "cosmetic_ingredient" }, EU: { status: "cosmetic_ingredient" }, UK: { status: "cosmetic_ingredient" } },
    dosing_interval_days: {},
    half_life_days: {},
    dose_max: {},
    capability: caps({
      cosmetic_only: true,
      supports_pk_estimation: false,
      supports_injection_site_rotation: false,
      supports_missed_dose_guidance: false,
      supports_weight_tracking: false,
      supports_titration_tracking: false,
      supports_side_effect_rules: false,
      supports_storage_tracking: false,
      dosing_calculations_prohibited: true
    }),
    note: "Cosmetic claim of 'botox-like' effect is not supported by robust human clinical evidence.",
    last_review: "2025-01-15"
  },
  // ═════════════════════════════════════════════════════════════════════════
  // K. UNAPPROVED AND RESEARCH PEPTIDES
  // Neutral logging only — NO dosing, reconstitution, cycling, or optimisation.
  // ═════════════════════════════════════════════════════════════════════════
  {
    id: "bpc157",
    generic_name: "BPC-157 (Body Protection Compound 157)",
    brand_names: [],
    medication_class: "research_peptide",
    molecular_class: MOL.PEPTIDE,
    // 15-aa peptide derived from gastric juice
    amino_acid_length: 15,
    mechanism_of_action: "Unknown; investigated for tissue repair (animal studies only)",
    routes: [ROUTES.SC, ROUTES.ORAL_CAP],
    approval: { US: { status: "unapproved", note: "Not approved by FDA; not an investigational drug; regulatory warnings issued" }, EU: { status: "unapproved" }, UK: { status: "unapproved" } },
    dosing_interval_days: {},
    half_life_days: {},
    dose_max: {},
    capability: caps({
      research_only: true,
      supports_pk_estimation: false,
      supports_injection_site_rotation: false,
      supports_missed_dose_guidance: false,
      supports_weight_tracking: false,
      supports_titration_tracking: false,
      supports_side_effect_rules: false,
      supports_storage_tracking: false,
      dosing_calculations_prohibited: true,
      clinical_review_required: true
    }),
    note: "No human clinical trials. No approved product anywhere. FDA has issued warnings. Neutral disclosure logging only.",
    last_review: "2025-01-15"
  },
  {
    id: "tb500",
    generic_name: "TB-500 (Thymosin beta-4 fragment)",
    brand_names: [],
    medication_class: "research_peptide",
    molecular_class: MOL.PEPTIDE,
    mechanism_of_action: "Investigated for tissue repair; actin-sequestering peptide fragment",
    routes: [ROUTES.SC],
    approval: { US: { status: "unapproved", note: "Not FDA-approved; WADA prohibited" }, EU: { status: "unapproved" }, UK: { status: "unapproved" } },
    dosing_interval_days: {},
    half_life_days: {},
    dose_max: {},
    capability: caps({
      research_only: true,
      supports_pk_estimation: false,
      supports_injection_site_rotation: false,
      supports_missed_dose_guidance: false,
      supports_weight_tracking: false,
      supports_titration_tracking: false,
      supports_side_effect_rules: false,
      dosing_calculations_prohibited: true,
      clinical_review_required: true
    }),
    note: "No approved product. WADA-prohibited in sport. Neutral disclosure logging only.",
    last_review: "2025-01-15"
  },
  {
    id: "cjc1295",
    generic_name: "CJC-1295 (Modified growth hormone releasing factor 1-29)",
    brand_names: [],
    medication_class: "research_peptide",
    molecular_class: MOL.PEPTIDE_ANALOGUE,
    // GHRH analogue
    amino_acid_length: 29,
    receptor_targets: "GHRH receptor",
    mechanism_of_action: "Growth hormone-releasing hormone analogue (investigational)",
    routes: [ROUTES.SC],
    approval: { US: { status: "unapproved" }, EU: { status: "unapproved" }, UK: { status: "unapproved" } },
    dosing_interval_days: {},
    half_life_days: {},
    dose_max: {},
    capability: caps({
      research_only: true,
      supports_pk_estimation: false,
      supports_injection_site_rotation: false,
      supports_missed_dose_guidance: false,
      supports_weight_tracking: false,
      supports_titration_tracking: false,
      supports_side_effect_rules: false,
      dosing_calculations_prohibited: true,
      clinical_review_required: true
    }),
    note: "No approved product. Often sold with ipamorelin. Neutral logging only.",
    last_review: "2025-01-15"
  },
  {
    id: "ipamorelin",
    generic_name: "Ipamorelin",
    brand_names: [],
    medication_class: "research_peptide",
    molecular_class: MOL.PEPTIDE,
    // GHRP — pentapeptide
    amino_acid_length: 5,
    receptor_targets: "Ghrelin receptor (GHS-R1a)",
    mechanism_of_action: "Growth hormone secretagogue (ghrelin mimetic)",
    routes: [ROUTES.SC],
    approval: { US: { status: "unapproved" }, EU: { status: "unapproved" }, UK: { status: "unapproved" } },
    dosing_interval_days: {},
    half_life_days: {},
    dose_max: {},
    capability: caps({
      research_only: true,
      supports_pk_estimation: false,
      supports_injection_site_rotation: false,
      supports_missed_dose_guidance: false,
      supports_weight_tracking: false,
      supports_titration_tracking: false,
      supports_side_effect_rules: false,
      dosing_calculations_prohibited: true,
      clinical_review_required: true
    }),
    note: "No approved product. Neutral logging only.",
    last_review: "2025-01-15"
  },
  {
    id: "aod9604",
    generic_name: "AOD-9604 (Lipotropin fragment 177-191)",
    brand_names: [],
    medication_class: "research_peptide",
    molecular_class: MOL.PEPTIDE,
    // hGH fragment
    amino_acid_length: 15,
    mechanism_of_action: "Investigated as lipolytic hGH fragment (animal studies)",
    routes: [ROUTES.SC],
    approval: { US: { status: "unapproved" }, EU: { status: "unapproved" }, UK: { status: "unapproved" } },
    dosing_interval_days: {},
    half_life_days: {},
    dose_max: {},
    capability: caps({
      research_only: true,
      supports_pk_estimation: false,
      supports_injection_site_rotation: false,
      supports_missed_dose_guidance: false,
      supports_weight_tracking: false,
      supports_titration_tracking: false,
      supports_side_effect_rules: false,
      dosing_calculations_prohibited: true
    }),
    note: "Clinical development discontinued. No approved product. Neutral logging only.",
    last_review: "2025-01-15"
  },
  {
    id: "melanotan_ii",
    generic_name: "Melanotan II",
    brand_names: [],
    medication_class: "research_peptide",
    molecular_class: MOL.PEPTIDE_ANALOGUE,
    amino_acid_length: 7,
    receptor_targets: "Melanocortin receptors (MC1R, MC3R, MC4R, MC5R)",
    mechanism_of_action: "Non-selective melanocortin receptor agonist",
    routes: [ROUTES.SC],
    approval: { US: { status: "unapproved", note: "FDA, MHRA and TGA warnings issued; not approved anywhere" }, EU: { status: "unapproved" }, UK: { status: "unapproved" } },
    dosing_interval_days: {},
    half_life_days: {},
    dose_max: {},
    capability: caps({
      research_only: true,
      supports_pk_estimation: false,
      supports_injection_site_rotation: false,
      supports_missed_dose_guidance: false,
      supports_weight_tracking: false,
      supports_titration_tracking: false,
      supports_side_effect_rules: false,
      dosing_calculations_prohibited: true,
      clinical_review_required: true
    }),
    note: "Regulatory warnings from FDA, MHRA, TGA. Serious adverse events reported. Not approved anywhere.",
    last_review: "2025-01-15"
  },
  {
    id: "pt141_bremelanotide",
    generic_name: "Bremelanotide (PT-141)",
    brand_names: ["Vyleesi\xAE"],
    medication_class: "metabolic",
    molecular_class: MOL.PEPTIDE_ANALOGUE,
    // Melanocortin receptor agonist
    amino_acid_length: 7,
    receptor_targets: "Melanocortin receptors (MC3R, MC4R)",
    mechanism_of_action: "Melanocortin receptor agonist (approved for HSDD in women)",
    manufacturer: "AMAG Pharmaceuticals",
    routes: [ROUTES.NASAL],
    // Vyleesi is nasal; PT-141 was SC in research
    approval: { US: { status: "approved", brands: ["Vyleesi\xAE"] }, EU: { status: "not_approved" }, UK: { status: "not_approved" } },
    dosing_interval_days: {},
    half_life_days: { nasal: 1.7 },
    dose_max: { "Vyleesi\xAE": 1.75 },
    capability: caps({ supports_pk_estimation: false, supports_injection_site_rotation: false, supports_missed_dose_guidance: false, supports_weight_tracking: false, supports_titration_tracking: false, clinical_review_required: true }),
    last_review: "2025-01-15"
  }
];
var ALL_MEDICATION_NAMES = (() => {
  const names = [];
  MEDICATION_CATALOGUE.forEach((m) => {
    if (m.brand_names?.length) m.brand_names.forEach((b) => names.push(b));
    else names.push(m.generic_name);
    if (m.brand_names?.length && !names.includes(m.generic_name)) names.push(m.generic_name);
  });
  return names;
})();
var NAME_TO_ENTRY = (() => {
  const map = {};
  MEDICATION_CATALOGUE.forEach((m) => {
    map[m.generic_name] = m;
    if (m.brand_names) m.brand_names.forEach((b) => {
      map[b] = m;
    });
  });
  return map;
})();
var ROUTE_LABELS = {
  [ROUTES.SC]: "Subcutaneous injection",
  [ROUTES.IM]: "Intramuscular injection",
  [ROUTES.ID]: "Intradermal injection",
  [ROUTES.IV]: "IV infusion (clinic)",
  [ROUTES.NASAL]: "Nasal spray",
  [ROUTES.ORAL_TAB]: "Oral tablet",
  [ROUTES.ORAL_CAP]: "Oral capsule",
  [ROUTES.BUCCAL]: "Buccal / sublingual",
  [ROUTES.TD]: "Transdermal patch",
  [ROUTES.TOP_CREAM]: "Topical cream",
  [ROUTES.TOP_SERUM]: "Topical serum",
  [ROUTES.TOP_GEL]: "Topical gel",
  [ROUTES.IMPLANT]: "Implant (clinic)",
  [ROUTES.PUMP]: "Pump / continuous infusion",
  [ROUTES.RECON_VIAL]: "Reconstituted vial",
  [ROUTES.PFS]: "Prefilled syringe",
  [ROUTES.SD_PEN]: "Single-dose pen",
  [ROUTES.MD_PEN]: "Multidose pen"
};
var SOURCE_DEFAULTS = {
  source_url: "",
  source_document_version: "",
  source_organisation: "",
  source_access_date: "",
  source_status: "needs_sourcing"
};
MEDICATION_CATALOGUE.forEach((m) => {
  Object.keys(SOURCE_DEFAULTS).forEach((k) => {
    if (m[k] === void 0) m[k] = SOURCE_DEFAULTS[k];
  });
});

// src/lib/medicationData.js
var DRUG_CLASS = (() => {
  const map = {};
  MEDICATION_CATALOGUE.forEach((m) => {
    map[m.generic_name] = m.generic_name;
    if (m.brand_names) m.brand_names.forEach((b) => {
      map[b] = m.generic_name;
    });
  });
  return map;
})();
var MEDICATIONS = (() => {
  const names = [];
  MEDICATION_CATALOGUE.forEach((m) => {
    const usStatus = m.approval?.US?.status;
    if (m.capability?.cosmetic_only) return;
    if (m.capability?.research_only && usStatus === "unapproved") return;
    if (m.brand_names?.length) {
      m.brand_names.forEach((b) => names.push(b));
    } else {
      names.push(m.generic_name);
    }
  });
  return names;
})();
var DOSING_INTERVAL_DAYS = (() => {
  const map = {};
  MEDICATION_CATALOGUE.forEach((m) => {
    if (!m.dosing_interval_days) return;
    const routes = Object.keys(m.dosing_interval_days);
    for (const r of routes) {
      const val = m.dosing_interval_days[r];
      if (typeof val === "number") {
        map[m.generic_name] = val;
        break;
      }
      if (val && typeof val === "object") {
        const firstBrand = Object.keys(val)[0];
        if (firstBrand) {
          map[m.generic_name] = val[firstBrand];
          break;
        }
      }
    }
  });
  return map;
})();
var HALF_LIFE_INDEX = (() => {
  const byKey = {};
  const byGeneric = {};
  MEDICATION_CATALOGUE.forEach((m) => {
    if (!m.half_life_days) return;
    if (m.capability?.research_only || m.capability?.cosmetic_only) return;
    if (m.capability?.supports_pk_estimation === false) return;
    const routes = Object.keys(m.half_life_days);
    let firstNumeric = null;
    for (const r of routes) {
      const val = m.half_life_days[r];
      if (typeof val === "number") {
        byKey[`${m.generic_name}||${r}`] = val;
        if (firstNumeric === null) firstNumeric = val;
      } else if (val && typeof val === "object") {
        for (const [brand, v] of Object.entries(val)) {
          byKey[`${m.generic_name}|${brand}|${r}`] = v;
          if (firstNumeric === null) firstNumeric = v;
        }
      }
    }
    if (firstNumeric !== null) byGeneric[m.generic_name] = firstNumeric;
  });
  return { byKey, byGeneric };
})();
var HALF_LIFE_DAYS = HALF_LIFE_INDEX.byGeneric;
var DOSE_MAX = (() => {
  const map = {};
  MEDICATION_CATALOGUE.forEach((m) => {
    if (!m.dose_max) return;
    Object.entries(m.dose_max).forEach(([brand, max]) => {
      map[brand] = max;
    });
  });
  return map;
})();
var INVESTIGATIONAL = (() => {
  const set = /* @__PURE__ */ new Set();
  MEDICATION_CATALOGUE.forEach((m) => {
    const usStatus = m.approval?.US?.status;
    if (usStatus === "investigational" || usStatus === "unapproved" || usStatus === "discontinued") {
      set.add(m.generic_name);
      if (m.brand_names) m.brand_names.forEach((b) => set.add(b));
    }
  });
  return set;
})();
function getDosingInterval(medication) {
  const fromConfig = getIntervalDays(medication);
  if (fromConfig) return fromConfig;
  const generic = DRUG_CLASS[medication] || medication;
  return DOSING_INTERVAL_DAYS[generic] || null;
}
var MISSED_DOSE_RULES = (() => {
  const map = {};
  MEDICATION_CATALOGUE.forEach((m) => {
    if (!m.missed_dose) return;
    if (m.capability?.supports_missed_dose_guidance === false) return;
    const routes = Object.keys(m.missed_dose);
    for (const r of routes) {
      const rule = m.missed_dose[r];
      if (rule && typeof rule.advice === "string") {
        map[m.generic_name] = rule;
        break;
      }
    }
  });
  return map;
})();

// src/lib/adherence.js
function asDate(value) {
  if (!value) return null;
  const s = String(value);
  return s.includes("-") && !s.includes(",") ? fromDayKey(s) : parseShotDate(s);
}
function atMidnight(d) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}
function calcAdherence(shots, medication, periodDays, options = {}) {
  const interval = getDosingInterval(medication);
  const empty = {
    logged: 0,
    scheduled: 0,
    adherencePct: null,
    startDate: null,
    endDate: null,
    days: periodDays
  };
  if (!interval || interval <= 0 || periodDays <= 0) return empty;
  const today = atMidnight(fromDayKey(todayKey()));
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() - periodDays);
  const doseDates = (shots || []).filter((s) => s.medication === medication).map((s) => parseShotDate(s.date)).filter(Boolean).map(atMidnight);
  if (!doseDates.length) return { ...empty, startDate: toDayKey(cutoff), endDate: toDayKey(today) };
  const regimenStart = asDate(options.startDate);
  const firstDose = new Date(Math.min(...doseDates.map((d) => d.getTime())));
  let start = cutoff;
  if (regimenStart && regimenStart > start) start = atMidnight(regimenStart);
  if (firstDose > start) start = firstDose;
  const stopped = asDate(options.stoppedDate);
  let end = today;
  if (stopped && atMidnight(stopped) < end) end = atMidnight(stopped);
  const startKey = toDayKey(start);
  const endKey = toDayKey(end);
  if (end < start) return { ...empty, startDate: startKey, endDate: endKey };
  const logged = doseDates.filter((d) => d >= start && d <= end).length;
  const scheduled = Math.floor(calendarDaysBetween(startKey, endKey) / interval);
  const adherencePct = scheduled > 0 ? Math.min(100, Math.round(logged / scheduled * 100)) : null;
  return { logged, scheduled, adherencePct, startDate: startKey, endDate: endKey, days: periodDays };
}

// src/lib/reportOptions.js
var RANGE_OPTIONS = [
  { id: "4w", label: "Last 4 weeks", days: 28 },
  { id: "3m", label: "Last 3 months", days: 90 },
  { id: "6m", label: "Last 6 months", days: 182 },
  { id: "all", label: "All time", days: null },
  { id: "custom", label: "Custom", days: null }
];
var DEFAULT_RANGE = "all";
var CORE_SECTIONS = [
  { id: "weight", label: "Weight progress" },
  { id: "doses", label: "Doses taken" },
  { id: "sideEffects", label: "Side effects" }
];
var OPTIONAL_SECTIONS = [
  { id: "injectionSites", label: "Injection sites and pain" },
  { id: "nutrition", label: "Nutrition (calories, protein, fiber, carbs)" },
  { id: "water", label: "Water" },
  { id: "exercise", label: "Exercise" },
  { id: "journal", label: "Journal" },
  { id: "progressPictures", label: "Progress pictures" }
];
var CORE_IDS = CORE_SECTIONS.map((s) => s.id);
var OPTIONAL_IDS = OPTIONAL_SECTIONS.map((s) => s.id);

// src/lib/reportData.js
var MONTHS2 = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
var BMI_SUSPICIOUS_LOW = 15;
function addDaysToKey(key, days) {
  const d = fromDayKey(key);
  d.setDate(d.getDate() + days);
  return toDayKey(d);
}
function formatDay(key) {
  if (!key) return "\u2014";
  const d = fromDayKey(key);
  return `${d.getDate()} ${MONTHS2[d.getMonth()]} ${d.getFullYear()}`;
}
function formatDayShort(key) {
  if (!key) return "\u2014";
  const d = fromDayKey(key);
  return `${d.getDate()} ${MONTHS2[d.getMonth()]}`;
}
function signed(value, digits = 1) {
  if (value == null || !Number.isFinite(value)) return "";
  return `${value < 0 ? "-" : "+"}${Math.abs(value).toFixed(digits)}`;
}
var DAY_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;
function asText(value, fallback = "") {
  if (value == null) return fallback;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}
function asNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
function asDayKey(value) {
  return typeof value === "string" && DAY_KEY_RE.test(value) ? value : null;
}
function parseDate(value) {
  if (typeof value !== "string") return null;
  const d = parseShotDate(value);
  return d && Number.isFinite(d.getTime()) ? d : null;
}
function shotDayKey(shot) {
  const explicit = asDayKey(shot?.date);
  if (explicit) return explicit;
  const d = parseDate(shot?.date);
  return d ? toDayKey(d) : "";
}
function eventDayKey(event) {
  if (!event) return "";
  const explicit = asDayKey(event.day_key) || asDayKey(event.onset_date);
  if (explicit) return explicit;
  const d = parseDate(event.onset_date);
  return d ? toDayKey(d) : "";
}
function journalDayKey(entry) {
  const explicit = asDayKey(entry?.date);
  if (explicit) return explicit;
  const d = parseDate(entry?.date);
  return d ? toDayKey(d) : "";
}
function heightLabel(profile = {}) {
  return heightText(heightCmOf(profile), profile.height_unit || "in");
}
function plausibleBmi(profile, weight, unit) {
  const cm = heightCmOf(profile);
  if (weight == null || !cm) return null;
  const kg = convertWeight(weight, unit, "kg");
  if (kg == null || !Number.isFinite(kg)) return null;
  const bmi = shownBmi(kg, cm);
  if (bmi == null) return null;
  const outstanding = !profile?.unit_check_status || profile.unit_check_status === "pending";
  return outstanding && bmi < BMI_SUSPICIOUS_LOW ? null : bmi;
}
function resolveRange({ rangeId, customFrom, customTo, dayKeys = [] }) {
  const today = todayKey();
  if (rangeId === "all") {
    const earliest = dayKeys.filter(Boolean).sort()[0];
    return {
      from: earliest || today,
      to: today,
      name: "All time",
      label: earliest ? `All time (${formatDay(earliest)} \u2013 ${formatDay(today)})` : "All time"
    };
  }
  if (rangeId === "custom") {
    const a = asDayKey(customFrom) || addDaysToKey(today, -90);
    const b = asDayKey(customTo) || today;
    const from2 = a <= b ? a : b;
    const to = a <= b ? b : a;
    return { from: from2, to, name: "Custom", label: `Custom (${formatDay(from2)} \u2013 ${formatDay(to)})` };
  }
  const option = RANGE_OPTIONS.find((r) => r.id === rangeId) || RANGE_OPTIONS.find((r) => r.id === DEFAULT_RANGE) || RANGE_OPTIONS[0];
  const from = addDaysToKey(today, -(option.days - 1));
  return { from, to: today, name: option.label, label: option.label };
}
function buildWeightSeries(weightHistory = [], range, profileUnit, reportUnit) {
  const points = weightHistory.filter((w) => w && asDayKey(w.date) && w.date >= range.from && w.date <= range.to).map((w) => {
    const raw = typeof w.weight === "number" ? w.weight : parseFloat(w.weight);
    const converted = Number.isFinite(raw) ? convertWeight(raw, profileUnit, reportUnit) : null;
    return {
      dayKey: w.date,
      ts: fromDayKey(w.date).getTime(),
      value: Number.isFinite(converted) ? Math.round(converted * 10) / 10 : null,
      label: formatDayShort(w.date)
    };
  }).filter((p) => Number.isFinite(p.ts) && Number.isFinite(p.value));
  return points.map((point, i) => {
    const window = points.slice(Math.max(0, i - 6), i + 1);
    const avg = window.reduce((a, p) => a + p.value, 0) / window.length;
    return { ...point, rollingAvg: Math.round(avg * 10) / 10 };
  });
}
function round1(n) {
  return Math.round(n * 10) / 10;
}
function summarizeWeight(series, profile, profileUnit, reportUnit) {
  if (!series.length) {
    return { count: 0, start: null, end: null, change: null, changePct: null, goal: null, goalLabel: null, goalDistance: null };
  }
  const start = series[0];
  const end = series[series.length - 1];
  const change = round1(end.value - start.value);
  const changePct = start.value > 0 ? round1((end.value - start.value) / start.value * 100) : null;
  const goalKg = parseFloat(profile?.goal_weight_kg) || toKg(profile?.goal_weight, profileUnit);
  const goal = Number.isFinite(goalKg) && goalKg > 0 ? round1(convertWeight(goalKg, "kg", reportUnit)) : null;
  let goalDistance = null;
  if (goal != null) {
    const diff = round1(end.value - goal);
    goalDistance = {
      value: Math.abs(diff),
      direction: Math.abs(diff) < 0.05 ? "at" : diff > 0 ? "above" : "below"
    };
  }
  return {
    count: series.length,
    start: start.value,
    end: end.value,
    change,
    changePct,
    goal,
    goalLabel: goal != null ? `${goal} ${reportUnit}` : null,
    goalDistance
  };
}
function weightTableRows(series = [], unit) {
  return series.map((point, i) => {
    const change = i > 0 ? round1(point.value - series[i - 1].value) : null;
    return {
      id: point.dayKey,
      dayLabel: formatDay(point.dayKey),
      valueLabel: `${point.value} ${unit}`,
      change,
      changeLabel: change == null ? "" : `${signed(change)} ${unit}`
    };
  }).reverse();
}
function medicationList(shots = []) {
  const seen = [];
  [...shots].sort((a, b) => (shotDayKey(b) || "").localeCompare(shotDayKey(a) || "")).forEach((s) => {
    if (s.medication && !seen.includes(s.medication)) seen.push(s.medication);
  });
  return seen;
}
function routeLabel(shot) {
  const route = asText(shot.route).replace(/_/g, " ");
  return [route, asText(shot.concentration)].filter(Boolean).join(" \xB7 ");
}
function doseRows(shotsDesc = []) {
  return shotsDesc.map((s) => {
    const dose = asNumber(s.dose);
    const unit = asText(s.dose_unit, "mg");
    return {
      id: s.id,
      day: shotDayKey(s),
      dayLabel: formatDay(shotDayKey(s)),
      time: asText(s.time, "\u2014"),
      medication: asText(s.medication, "\u2014"),
      dose,
      unit,
      doseLabel: dose != null ? `${dose} ${unit}` : "\u2014",
      site: asText(s.site, "\u2014"),
      pain: asNumber(s.pain),
      detail: asText(routeLabel(s)),
      notes: asText(s.notes)
    };
  });
}
function doseChangeSummary(rowsAsc = [], multipleMeds = false) {
  const steps = [];
  rowsAsc.forEach((row) => {
    const key = `${row.medication}|${row.dose}|${row.unit}`;
    const last = steps[steps.length - 1];
    if (last && last.key === key) {
      last.count += 1;
      return;
    }
    steps.push({ key, medication: row.medication, dose: row.dose, unit: row.unit, day: row.day, count: 1 });
  });
  if (steps.length === 1) {
    const only = steps[0];
    const name = multipleMeds ? `${only.medication} ` : "";
    return [`${name}${only.dose} ${only.unit} throughout (${only.count} dose${only.count === 1 ? "" : "s"})`];
  }
  return steps.map((step) => {
    const name = multipleMeds ? `${step.medication} ` : "";
    return `${name}${step.dose} ${step.unit} from ${formatDayShort(step.day)}`;
  });
}
function currentDoses(allShots = [], medications = [], range = {}) {
  const named = medications.length > 1;
  return medications.map((medication) => {
    const rows = allShots.filter((s) => s.medication === medication).map((s) => ({ day: shotDayKey(s), dose: asNumber(s.dose), unit: asText(s.dose_unit, "mg") })).filter((row) => row.day && row.dose != null && (!range?.to || row.day <= range.to)).sort((a, b) => b.day.localeCompare(a.day));
    if (!rows.length) return null;
    const latest = rows[0];
    let since = latest.day;
    rows.forEach((row) => {
      if (row.dose !== latest.dose || row.unit !== latest.unit) return;
      if (row.day < since) since = row.day;
    });
    const days = range?.to ? calendarDaysBetween(since, range.to) : null;
    const duration = days == null || days < 1 ? "" : days < 14 ? `for ${days} day${days === 1 ? "" : "s"}` : `for ${Math.round(days / 7)} weeks`;
    return {
      medication,
      label: `${latest.dose} ${latest.unit}`,
      // The medication is only named when the report holds more than one, so a
      // single-medication tile reads "for 6 weeks · since 12 Aug".
      sub: [named ? medication : "", duration, `since ${formatDayShort(since)}`].filter(Boolean).join(" \xB7 ")
    };
  }).filter(Boolean);
}
function duplicateDoseNote(rows = []) {
  const seen = /* @__PURE__ */ new Map();
  rows.forEach((row) => {
    const key = [row.day, row.time, row.dose, row.unit, row.site].join("|");
    seen.set(key, (seen.get(key) || 0) + 1);
  });
  const extras = [...seen.values()].reduce((total, count) => total + (count > 1 ? count - 1 : 0), 0);
  if (!extras) return "";
  return extras === 1 ? "1 entry shares the same timestamp and may be a duplicate." : `${extras} entries share the same timestamp and may be duplicates.`;
}
function doseFootnotes(rows = []) {
  const byMedication = /* @__PURE__ */ new Map();
  rows.forEach((row) => {
    if (!byMedication.has(row.medication)) byMedication.set(row.medication, { details: [], doses: [] });
    const entry = byMedication.get(row.medication);
    if (row.detail && !entry.details.includes(row.detail)) entry.details.push(row.detail);
    if (row.doseLabel !== "\u2014" && !entry.doses.includes(row.doseLabel)) entry.doses.push(row.doseLabel);
  });
  return [...byMedication.entries()].map(([medication, entry]) => [
    medication,
    entry.details.join(" / "),
    // Rows arrive newest first, so the dose list reverses to the order of use.
    entry.doses.length ? `doses ${[...entry.doses].reverse().join(", ")}` : ""
  ].filter(Boolean).join(" \xB7 "));
}
function adherenceFor(shots = [], shotsInRange = [], medicationFilter, days) {
  const meds = medicationFilter && medicationFilter !== "all" ? [medicationFilter] : [...new Set(shotsInRange.map((s) => s.medication).filter(Boolean))];
  let logged = 0;
  let scheduled = 0;
  meds.forEach((med) => {
    if (!getDosingInterval(med)) {
      logged += shotsInRange.filter((s) => s.medication === med).length;
      return;
    }
    const result = calcAdherence(shots, med, days);
    logged += result.logged;
    scheduled += result.scheduled || 0;
  });
  return { logged, scheduled: scheduled > 0 ? scheduled : null, days, medications: meds };
}
function cleanSymptom(text) {
  const cleaned = String(text || "").replace(/[\u{1F000}-\u{1FAFF}\u{2190}-\u{2BFF}\u{FE0F}\u{20E3}]/gu, "").replace(/\s+/g, " ").trim();
  return cleaned || String(text || "").trim();
}
function sideEffectRows(events = [], dayMetrics = {}, range) {
  const structured = events.map((e) => ({ day: eventDayKey(e), event: e })).filter(({ day: day2 }) => day2 && day2 >= range.from && day2 <= range.to).map(({ day: day2, event }) => ({
    id: event.id,
    day: day2,
    dayLabel: formatDay(day2),
    symptom: cleanSymptom(event.symptom),
    severity: asText(event.severity),
    legacy: false
  }));
  const legacy = Object.values(dayMetrics).filter((m) => m.day_key >= range.from && m.day_key <= range.to && m.side_effects).map((m) => ({
    id: `legacy-${m.day_key}`,
    day: m.day_key,
    dayLabel: formatDay(m.day_key),
    symptom: cleanSymptom(m.side_effects),
    severity: "",
    legacy: true
  }));
  return [...structured, ...legacy].sort((a, b) => b.day.localeCompare(a.day));
}
function inRange(dayKey, range) {
  return !!dayKey && dayKey >= range.from && dayKey <= range.to;
}
function weekBuckets(range) {
  const buckets = [];
  let start = range.from;
  while (start <= range.to && buckets.length < 520) {
    buckets.push({ start, end: addDaysToKey(start, 6) });
    start = addDaysToKey(start, 7);
  }
  return buckets;
}
function weeklyAverage(dayMetrics = {}, range, field) {
  return weekBuckets(range).map((bucket) => {
    const values = Object.values(dayMetrics).filter((m) => inRange(m.day_key, range) && m.day_key >= bucket.start && m.day_key <= bucket.end && m[field] != null).map((m) => Number(m[field])).filter((v) => Number.isFinite(v));
    if (!values.length) return null;
    const avg = values.reduce((a, v) => a + v, 0) / values.length;
    return { label: `Week of ${formatDayShort(bucket.start)}`, days: values.length, value: round1(avg) };
  }).filter(Boolean);
}
function averageOf(rows, field) {
  const values = rows.map((r) => Number(r[field])).filter((v) => Number.isFinite(v));
  if (!values.length) return null;
  return Math.round(values.reduce((a, v) => a + v, 0) / values.length);
}
function metricRows(dayMetrics, range, fields) {
  return Object.values(dayMetrics).filter((m) => inRange(m.day_key, range) && fields.some((f) => m[f] != null));
}
function nutritionData(dayMetrics, range) {
  const rows = metricRows(dayMetrics, range, ["calories", "protein", "fiber", "carbs"]);
  if (!rows.length) return null;
  return {
    days: rows.length,
    calories: averageOf(rows, "calories"),
    protein: averageOf(rows, "protein"),
    fiber: averageOf(rows, "fiber"),
    carbs: averageOf(rows, "carbs"),
    weekly: weeklyAverage(dayMetrics, range, "calories")
  };
}
function waterData(dayMetrics, range, liquidUnit) {
  const rows = metricRows(dayMetrics, range, ["water"]);
  if (!rows.length) return null;
  return {
    days: rows.length,
    unit: liquidUnit || "oz",
    average: averageOf(rows, "water"),
    total: Math.round(rows.reduce((a, r) => a + (Number(r.water) || 0), 0)),
    weekly: weeklyAverage(dayMetrics, range, "water")
  };
}
function exerciseData(dayMetrics, range) {
  const rows = metricRows(dayMetrics, range, ["exercise_min"]);
  if (!rows.length) return null;
  return {
    days: rows.length,
    average: averageOf(rows, "exercise_min"),
    total: Math.round(rows.reduce((a, r) => a + (Number(r.exercise_min) || 0), 0)),
    weekly: weeklyAverage(dayMetrics, range, "exercise_min")
  };
}
function journalRows(journalEntries = [], range) {
  const rows = journalEntries.map((entry) => ({ entry, day: journalDayKey(entry) })).filter(({ day: day2 }) => inRange(day2, range)).map(({ entry, day: day2 }) => ({
    id: entry.id,
    day: day2,
    dayLabel: formatDay(day2),
    time: asText(entry.time),
    mood: asText(entry.mood),
    category: asText(entry.category),
    text: asText(entry.text)
  })).sort((a, b) => b.day.localeCompare(a.day));
  return rows.length ? rows : null;
}
function progressPictureRows(photos = [], range) {
  const rows = photos.filter((p) => inRange(p.day_key, range) && p.url).map((p) => ({ id: p.id, dayKey: p.day_key, dayLabel: formatDay(p.day_key), url: p.url })).sort((a, b) => a.dayKey.localeCompare(b.dayKey));
  return rows.length ? rows : null;
}
function injectionSiteData(shotsInRange = []) {
  const siteOf = (s) => asText(s.site).trim();
  const painOf = (s) => asNumber(s.pain);
  const withSite = shotsInRange.filter((s) => siteOf(s));
  if (!withSite.length) return null;
  const counts = /* @__PURE__ */ new Map();
  withSite.forEach((s) => counts.set(siteOf(s), (counts.get(siteOf(s)) || 0) + 1));
  const painShots = shotsInRange.filter((s) => (painOf(s) || 0) > 0);
  return {
    counts: [...counts.entries()].map(([site, count]) => ({ site, count, pct: Math.round(count / withSite.length * 100) })).sort((a, b) => b.count - a.count || a.site.localeCompare(b.site)),
    totalDosesWithSite: withSite.length,
    sitesUsed: counts.size,
    pain: painShots.map((s) => ({
      id: s.id,
      dayLabel: formatDay(shotDayKey(s)),
      pain: painOf(s),
      medication: asText(s.medication, "\u2014"),
      doseLabel: asNumber(s.dose) != null ? `${asNumber(s.dose)} ${asText(s.dose_unit, "mg")}` : "\u2014"
    })).sort((a, b) => b.dayLabel.localeCompare(a.dayLabel)),
    painReported: painShots.length,
    averagePain: painShots.length ? round1(painShots.reduce((a, s) => a + (painOf(s) || 0), 0) / painShots.length) : null
  };
}
function periodLabel(range) {
  const days = `${range.days} day${range.days === 1 ? "" : "s"}`;
  const name = range.name && range.name !== "Custom" ? `${range.name} \xB7 ` : "";
  return `${name}${formatDay(range.from)} \u2013 ${formatDay(range.to)} \xB7 ${days}`;
}
function goalSub(goalDistance, unit) {
  if (!goalDistance) return "";
  return goalDistance.direction === "above" ? `${goalDistance.value} ${unit} to go` : "Goal reached";
}
function summaryTiles({ current = [], weight, series = [], adherence, dosesCount, bmi, unit }) {
  const tiles = current.map((dose) => ({
    id: `dose-${dose.medication}`,
    label: current.length > 1 ? `Current dose \xB7 ${dose.medication}` : "Current dose",
    value: dose.label,
    sub: dose.sub
  }));
  if (dosesCount > 0) {
    tiles.push({
      id: "doses",
      label: "Doses logged",
      value: String(dosesCount),
      sub: adherence.scheduled ? `of ${adherence.scheduled} scheduled` : "in this period"
    });
  }
  if (series.length) {
    const first = series[0];
    const last = series[series.length - 1];
    tiles.push({ id: "start", label: "Start weight", value: `${weight.start} ${unit}`, sub: `on ${formatDayShort(first.dayKey)}` });
    tiles.push({ id: "current", label: "Current weight", value: `${weight.end} ${unit}`, sub: `on ${formatDayShort(last.dayKey)}` });
    tiles.push({
      id: "change",
      label: "Total change",
      value: `${signed(weight.change)} ${unit}`,
      sub: weight.changePct != null ? `${signed(weight.changePct)}%` : ""
    });
    if (weight.goalLabel) {
      tiles.push({ id: "goal", label: "Goal weight", value: weight.goalLabel, sub: goalSub(weight.goalDistance, unit) });
    }
    if (bmi != null) tiles.push({ id: "bmi", label: "BMI", value: String(bmi), sub: "" });
  }
  return tiles;
}
function buildReport(state, options) {
  const {
    shots = [],
    weightHistory = [],
    dayMetrics = {},
    adverseEvents = [],
    journalEntries = [],
    progressPhotosList = []
  } = state || {};
  const profile = state?.profile || {};
  const profileUnit = profile.weight_unit || "lb";
  const unit = options.weightUnit || profileUnit;
  const shotsDesc = [...shots].sort((a, b) => (shotDayKey(b) || "").localeCompare(shotDayKey(a) || ""));
  const medications = medicationList(shots);
  const dayKeys = [
    ...weightHistory.map((w) => w.date),
    ...shotsDesc.map(shotDayKey),
    ...adverseEvents.map(eventDayKey),
    ...Object.keys(dayMetrics)
  ].map((key) => asDayKey(key)).filter(Boolean);
  const range = resolveRange({
    rangeId: options.rangeId || DEFAULT_RANGE,
    customFrom: options.customFrom,
    customTo: options.customTo,
    dayKeys
  });
  range.days = calendarDaysBetween(range.from, range.to) + 1;
  const medicationFilter = options.medication || "all";
  const shotsInRange = shotsDesc.filter((s) => {
    const key = shotDayKey(s);
    if (!inRange(key, range)) return false;
    return medicationFilter === "all" || s.medication === medicationFilter;
  });
  const series = buildWeightSeries(weightHistory, range, profileUnit, unit);
  const weight = summarizeWeight(series, profile, profileUnit, unit);
  const doses = doseRows(shotsInRange);
  const changes = doseChangeSummary([...doses].reverse(), new Set(doses.map((d) => d.medication)).size > 1);
  const adherence = adherenceFor(shots, shotsInRange, medicationFilter, range.days);
  const sideEffects = sideEffectRows(adverseEvents, dayMetrics, range);
  const medicationsInRange = medicationList(shotsInRange);
  const current = currentDoses(
    shots,
    medicationFilter === "all" ? medicationsInRange : [medicationFilter],
    range
  );
  const optional = {
    injectionSites: injectionSiteData(shotsInRange),
    nutrition: nutritionData(dayMetrics, range),
    water: waterData(dayMetrics, range, profile.liquid_unit || "oz"),
    exercise: exerciseData(dayMetrics, range),
    journal: journalRows(journalEntries, range),
    progressPictures: progressPictureRows(progressPhotosList, range)
  };
  const available = {};
  OPTIONAL_IDS.forEach((id) => {
    available[id] = !!optional[id];
  });
  const selected = [.../* @__PURE__ */ new Set([...CORE_IDS, ...options.sections || []])].filter((id) => CORE_IDS.includes(id) || available[id]);
  const bmi = plausibleBmi(profile, weight.end, unit);
  const name = (options.name || "").trim();
  const covered = medicationFilter === "all" ? medicationsInRange : [medicationFilter];
  return {
    range,
    unit,
    available,
    sections: selected,
    hasAnyData: !!(shotsInRange.length || series.length || sideEffects.length),
    header: {
      name,
      generatedLabel: formatDay(todayKey()),
      periodLabel: periodLabel(range),
      medications: medicationFilter === "all" ? medications : [medicationFilter],
      heightLabel: heightLabel(profile)
    },
    summaryTiles: summaryTiles({ current, weight, series, adherence, dosesCount: doses.length, bmi, unit }),
    // `series` carries the plotted points through to the chart and the PDF.
    // `table` is the compact table underneath it.
    weight: { ...weight, series, table: weightTableRows(series, unit) },
    doses: {
      rows: doses,
      changes,
      adherence,
      count: doses.length,
      duplicateNote: duplicateDoseNote(doses),
      footnotes: doseFootnotes(doses),
      medications: covered
    },
    sideEffects: { rows: sideEffects, total: sideEffects.length },
    optional,
    has: {
      weight: series.length > 0,
      doses: doses.length > 0,
      sideEffects: sideEffects.length > 0
    }
  };
}

// src/lib/reportFixtures.js
var day = (offset) => addDaysToKey(todayKey(), offset);
function weeklyDoses({ medication, steps, startOffset, route, concentration, sites }) {
  const shots = [];
  let offset = startOffset;
  steps.forEach(({ dose, count, unit = "mg", concentration: conc }) => {
    for (let i = 0; i < count; i += 1) {
      const index = shots.length;
      shots.push({
        id: `${medication}-${index}`,
        medication,
        dose,
        dose_unit: unit,
        dose_source: "label",
        route,
        concentration: conc || concentration,
        device_type: "multidose_pen",
        // Shots are stored the way the app stores them ("Jun 29, 2026").
        date: shotDateFromKey(day(offset)),
        time: "08:00",
        site: sites[index % sites.length],
        pain: [0, 1, 0, 2][index % 4]
      });
      offset += 7;
    }
  });
  return shots;
}
var PHOTO = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240"><rect width="240" height="240" fill="rgb(226,232,240)"/><circle cx="120" cy="84" r="34" fill="rgb(148,163,184)"/><rect x="56" y="130" width="128" height="90" rx="26" fill="rgb(148,163,184)"/></svg>'
)}`;
var minimal = {
  profile: { height_cm: 170, height_unit: "cm", weight_unit: "kg", unit_check_status: "kept_kg" },
  shots: [{
    id: "min-1",
    medication: "Ozempic\xAE",
    dose: 0.25,
    dose_unit: "mg",
    dose_source: "label",
    route: "subcutaneous",
    concentration: "0.68 mg/mL",
    date: shotDateFromKey(day(-3)),
    time: "09:15",
    site: "Left abdomen",
    pain: 1
  }],
  weightHistory: [],
  dayMetrics: {},
  adverseEvents: [],
  journalEntries: [],
  progressPhotosList: []
};
var duplicates = {
  profile: { height_cm: 178, height_unit: "in", weight_unit: "lb", unit_check_status: "converted" },
  shots: [
    {
      id: "dup-1",
      medication: "Ozempic\xAE",
      dose: 1,
      dose_unit: "mg",
      dose_source: "label",
      route: "subcutaneous",
      concentration: "1.34 mg/mL",
      date: shotDateFromKey(day(-14)),
      time: "08:00",
      site: "Right thigh",
      pain: 0
    },
    {
      id: "dup-2",
      medication: "Ozempic\xAE",
      dose: 1,
      dose_unit: "mg",
      dose_source: "label",
      route: "subcutaneous",
      concentration: "1.34 mg/mL",
      date: shotDateFromKey(day(-21)),
      time: "08:00",
      site: "Left thigh",
      pain: 0
    },
    {
      id: "dup-3",
      medication: "Ozempic\xAE",
      dose: 1,
      dose_unit: "mg",
      dose_source: "label",
      route: "subcutaneous",
      concentration: "1.34 mg/mL",
      date: shotDateFromKey(day(-21)),
      time: "08:00",
      site: "Left thigh",
      pain: 0
    }
  ],
  weightHistory: [],
  dayMetrics: {},
  adverseEvents: [],
  journalEntries: [],
  progressPhotosList: []
};
var fullMetrics = {};
for (let i = 0; i < 24; i += 1) {
  const key = day(-i * 3);
  fullMetrics[key] = {
    day_key: key,
    calories: 1520 + i % 5 * 45,
    protein: 96 + i % 4 * 6,
    fiber: 18 + i % 3,
    carbs: 132 + i % 6 * 5,
    water: 64 + i % 3 * 8,
    exercise_min: i % 3 === 0 ? 0 : 25 + i % 4 * 5
  };
}
var full = {
  profile: {
    height_cm: 172,
    height_unit: "cm",
    weight_unit: "lb",
    // logged in pounds; the report is exported in kilograms
    unit_check_status: "converted",
    goal_weight_kg: 90,
    liquid_unit: "oz"
  },
  shots: weeklyDoses({
    medication: "Ozempic\xAE",
    startOffset: -84,
    route: "subcutaneous",
    concentration: "1.34 mg/mL",
    sites: ["Left abdomen", "Right abdomen", "Left thigh", "Right thigh"],
    // A dose change halfway through the period: 6 weeks at 0.5 mg, then 1 mg.
    steps: [
      { dose: 0.5, count: 6 },
      { dose: 1, count: 7, concentration: "2.68 mg/mL" }
    ]
  }),
  weightHistory: [
    { date: day(-84), weight: 231.5 },
    { date: day(-77), weight: 230.2 },
    { date: day(-70), weight: 228.8 },
    { date: day(-63), weight: 227.9 },
    { date: day(-56), weight: 226.4 },
    { date: day(-49), weight: 225.8 },
    { date: day(-42), weight: 224.9 },
    { date: day(-35), weight: 223.6 },
    { date: day(-28), weight: 222.8 },
    { date: day(-21), weight: 221.5 },
    { date: day(-14), weight: 220.9 },
    { date: day(-7), weight: 219.4 }
  ],
  dayMetrics: fullMetrics,
  adverseEvents: [
    {
      id: "ae-1",
      symptom: "Nausea",
      severity: "moderate",
      symptom_key: "nausea",
      onset_date: day(-40),
      day_key: day(-40),
      duration: "3 days",
      resolved: true
    },
    {
      id: "ae-2",
      symptom: "Headache",
      severity: "mild",
      symptom_key: "headache",
      onset_date: day(-33),
      day_key: day(-33),
      duration: "1 day",
      resolved: true
    },
    {
      id: "ae-3",
      symptom: "Injection site reaction",
      severity: "mild",
      symptom_key: "injection_site",
      onset_date: day(-20),
      day_key: day(-20),
      duration: "2 days",
      resolved: true
    },
    {
      id: "ae-4",
      symptom: "Diarrhoea",
      severity: "moderate",
      symptom_key: "diarrhoea",
      onset_date: day(-12),
      day_key: day(-12),
      duration: "ongoing",
      resolved: false
    },
    {
      id: "ae-5",
      symptom: "Constipation, bloating",
      severity: "mild",
      symptom_key: "constipation",
      onset_date: day(-5),
      day_key: day(-5),
      duration: "2 days",
      resolved: true
    }
  ],
  journalEntries: [
    { id: "j-1", date: shotDateFromKey(day(-45)), time: "21:30", mood: "Hopeful", category: "Side effects", text: "First week on the higher dose. Queasy in the evenings, better if I eat small meals." },
    { id: "j-2", date: shotDateFromKey(day(-9)), time: "07:45", mood: "Steady", category: "Progress", text: "Clothes fitting better. Walking after dinner most evenings." }
  ],
  progressPhotosList: [{ id: "p-1", day_key: day(-45), url: PHOTO }]
};
var edgeCases = {
  profile: { height_cm: 178, height_unit: "cm", weight_unit: "lb", unit_check_status: "pending" },
  shots: [{
    id: "edge-1",
    medication: "Mounjaro\xAE",
    dose: 2.5,
    dose_unit: "mg",
    dose_source: "label",
    route: "subcutaneous",
    concentration: "0.5 mg/0.5 mL",
    date: shotDateFromKey(day(-10)),
    time: "19:00",
    site: "Right abdomen",
    pain: 2
  }],
  weightHistory: [{ date: day(-10), weight: 55 }],
  dayMetrics: {},
  adverseEvents: [],
  journalEntries: [],
  progressPhotosList: []
};
var REPORT_FIXTURES = [
  {
    id: "minimal",
    title: "1 \xB7 Minimal data",
    note: "One dose, no weight, no side effects. Expect one weight line, no chart, and no optional sections.",
    state: minimal,
    options: { rangeId: "all", medication: "all", weightUnit: "kg", name: "Sample patient", sections: [] }
  },
  {
    id: "duplicates",
    title: "2 \xB7 Duplicate entries, no weight",
    note: "Two doses logged at the same timestamp, dose and site; no weight entries at all.",
    state: duplicates,
    options: { rangeId: "all", medication: "all", weightUnit: "lb", name: "Sample patient", sections: ["injectionSites"] }
  },
  {
    id: "full",
    title: "3 \xB7 Full data \u2014 weight history, dose change, side effects",
    note: "90 days: 13 doses with a 0.5 mg \u2192 1 mg change, 12 weight entries exported in kg while the profile is in lb, 5 side effects, plus nutrition, water, exercise, journal and one photo.",
    state: full,
    options: {
      rangeId: "3m",
      medication: "all",
      weightUnit: "kg",
      name: "Sample patient",
      sections: ["injectionSites", "nutrition", "water", "exercise", "journal", "progressPictures"]
    }
  },
  {
    id: "edge",
    title: "4 \xB7 Edge cases \u2014 one entry, implausible BMI",
    note: "A single weight entry (so no trend line), a weight and height that cannot produce a real BMI (left out silently), and no report name.",
    state: edgeCases,
    options: { rangeId: "all", medication: "all", weightUnit: "lb", name: "", sections: ["injectionSites"] }
  }
];

// tmp_report_check.mjs
function runChecks() {
  const lines = [];
  const log = (...args) => lines.push(args.join(" "));
  const problems = [];
  const check = (label, condition, detail = "") => {
    if (!condition) problems.push(`${label} ${detail}`);
    log(`${condition ? "ok  " : "FAIL"} ${label} ${detail}`);
  };
  log("=== fixtures:", REPORT_FIXTURES.length, "===");
  for (const fixture of REPORT_FIXTURES) {
    const r = buildReport(fixture.state, fixture.options);
    log("\n" + "\u2500".repeat(72));
    log(`${fixture.id} :: ${r.hasAnyData ? "has data" : "NO DATA"}`);
    log(`header: name=${JSON.stringify(r.header.name)} height=${r.header.heightLabel}`);
    log(`        period=${r.header.periodLabel}`);
    log(`        medications=${r.header.medications.join(", ") || "(none)"}`);
    log("tiles:");
    r.summaryTiles.forEach((t) => log(`   ${t.label} = ${t.value}${t.sub ? `  [${t.sub}]` : ""}`));
    log(`weight: ${r.has.weight ? `${r.weight.count} entries (start ${r.weight.start}, end ${r.weight.end}, change ${r.weight.change}, pct ${r.weight.changePct}, goal ${r.weight.goalLabel})` : "none"}`);
    if (r.weight.table.length) {
      log(`   table (${r.weight.table.length} rows): ${r.weight.table.slice(0, 3).map((x) => `${x.dayLabel} ${x.valueLabel} ${x.changeLabel || "\u2014"}`).join(" | ")}`);
    }
    log(`doses: ${r.doses.count} | ${r.doses.changes.join(" \xB7 ")}`);
    log(`   adherence: ${JSON.stringify(r.doses.adherence)}`);
    log(`   duplicateNote: ${JSON.stringify(r.doses.duplicateNote)}`);
    log(`   footnotes: ${JSON.stringify(r.doses.footnotes)}`);
    log(`side effects: ${r.sideEffects.total} ${r.sideEffects.rows.slice(0, 2).map((x) => `(${x.dayLabel} ${x.symptom} ${x.severity})`).join(" ")}`);
    log(`sections: ${r.sections.join(", ")}`);
    const opt = Object.entries(r.available).filter(([, v]) => v).map(([k]) => k);
    log(`optional available: ${opt.join(", ") || "(none)"}`);
    if (fixture.id === "minimal") {
      check("minimal: no weight section", !r.has.weight);
      check("minimal: one dose", r.doses.count === 1, String(r.doses.count));
      check("minimal: no BMI tile", !r.summaryTiles.some((t) => t.id === "bmi"));
      check("minimal: no side effects", r.sideEffects.total === 0);
      check("minimal: no optional sections", r.sections.length === 3, r.sections.join(","));
    }
    if (fixture.id === "duplicates") {
      check("duplicates: note says 1 entry", r.doses.duplicateNote === "1 entry shares the same timestamp and may be a duplicate.", JSON.stringify(r.doses.duplicateNote));
      check("duplicates: no weight", !r.has.weight);
      check("duplicates: three rows kept", r.doses.count === 3, String(r.doses.count));
      check("duplicates: site column data present", r.doses.rows.every((x) => x.site && x.site !== "\u2014"));
    }
    if (fixture.id === "full") {
      check("full: 13 doses", r.doses.count === 13, String(r.doses.count));
      check("full: two dose steps", r.doses.changes.length === 2, r.doses.changes.join(" \xB7 "));
      check("full: weight in kg (profile lb)", r.weight.start > 95 && r.weight.start < 112, String(r.weight.start));
      check("full: BMI tile shown", r.summaryTiles.some((t) => t.id === "bmi"), JSON.stringify(r.summaryTiles.find((t) => t.id === "bmi")));
      check("full: goal tile with distance", r.summaryTiles.some((t) => t.id === "goal" && /to go|Goal reached/.test(t.sub)));
      check("full: 12 weight table rows", r.weight.table.length === 12, String(r.weight.table.length));
      check("full: oldest row has no change", r.weight.table[r.weight.table.length - 1].changeLabel === "");
      check("full: 5 side effects", r.sideEffects.total === 5);
      check("full: all optional sections selected", r.sections.length === 9, r.sections.join(","));
      check("full: adherence counts the logged doses", r.doses.adherence.logged === 13, JSON.stringify(r.doses.adherence));
      check("full: core sections always present", ["weight", "doses", "sideEffects"].every((id) => r.sections.includes(id)), r.sections.join(","));
      check("full: route footnote lists doses", r.doses.footnotes.length === 1 && /doses/.test(r.doses.footnotes[0]), JSON.stringify(r.doses.footnotes));
      check("full: current-dose tile names the step", /weeks|days/.test(r.summaryTiles[0].sub), r.summaryTiles[0].sub);
    }
    if (fixture.id === "edge") {
      check("edge: BMI omitted", !r.summaryTiles.some((t) => t.id === "bmi"));
      check("edge: no goal tile", !r.summaryTiles.some((t) => t.id === "goal"));
      check("edge: one weight entry", r.weight.count === 1);
      check("edge: no name line", r.header.name === "");
      check("edge: single change cell empty", r.weight.table[0].changeLabel === "");
    }
  }
  log("\n" + "\u2550".repeat(72));
  if (problems.length) {
    log(`PROBLEMS (${problems.length}):`);
    problems.forEach((p) => log(" -", p));
  } else {
    log("ALL CHECKS PASSED");
  }
  return { problems, report: lines.join("\n") };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  runChecks
});
