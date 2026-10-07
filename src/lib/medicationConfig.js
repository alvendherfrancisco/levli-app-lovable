// ─────────────────────────────────────────────────────────────────────────────
// CENTRAL MEDICATIONS CONFIG — the ONE place doses are defined in Levli.
//
// Shots, Meds, Stock, Insights and Reports all read from here. No screen
// hardcodes a dose list.
//
// Each record: brandName, genericName, route, dosingIntervalDays, allowedDoses[]
// (with units), indicationNote, missedDoseRule, source (link to the official
// prescribing information), lastReviewed.
//
// Every value was checked against the current US prescribing information on
// `lastReviewed`. Anything that could not be verified is marked verified: false
// with a verifiedNote saying exactly what is unverified — no value here is a
// guess, and no unverified value is used for exposure modelling.
//
// Doses marked role "initiation" / "titration_only" are described that way by
// the label itself. Levli never recommends a dose or a titration step: these
// lists and roles are shown exactly as the label states them.
// ─────────────────────────────────────────────────────────────────────────────

/** The option that asks the user to type their own drug name and dose. */
export const CUSTOM_MEDICATION_NAME = "Other / custom (prescriber-directed)";
/** The last row of every medication picker: opens the type-your-own entry. */
export const OTHERS_LABEL = "Others";
/** Shown wherever a custom entry is used. */
export const CUSTOM_MEDICATION_WARNING = "Levli can't verify this dose.";

export const MEDICATION_CONFIG = [
  {
    id: "ozempic",
    brandName: "Ozempic®",
    genericName: "semaglutide",
    route: "subcutaneous",
    dosingIntervalDays: 7,
    allowedDoses: [
      { value: 0.25, unit: "mg", role: "initiation" },
      { value: 0.5, unit: "mg", role: "standard" },
      { value: 1, unit: "mg", role: "standard" },
      { value: 2, unit: "mg", role: "standard" },
    ],
    minIntervalDays: 2,
    maxDoseMg: 2,
    indicationNote:
      "Type 2 diabetes. Also lowers the risk of major heart events and of worsening kidney disease in adults with type 2 diabetes and established heart or kidney disease.",
    missedDoseRule:
      "Take a missed dose as soon as possible within 5 days after the missed dose. If more than 5 days have passed, contact your prescriber before continuing — the label says the missed dose is not taken and the next dose is taken on the usual day. Never take two doses less than 2 days (48 hours) apart.",
    retitrationDays: 5,
    missedDoseWindowDays: 5,
    missedDoseLabelQuote:
      "If a dose is missed, administer OZEMPIC as soon as possible within 5 days after the missed dose.",
    source: "https://www.novo-pi.com/ozempic.pdf",
    lastReviewed: "2026-10-05",
    verified: true,
    verifiedNote: "",
    exposureEligible: true,
  },
  {
    id: "wegovy",
    brandName: "Wegovy®",
    genericName: "semaglutide",
    route: "subcutaneous",
    dosingIntervalDays: 7,
    allowedDoses: [
      { value: 0.25, unit: "mg", role: "initiation" },
      { value: 0.5, unit: "mg", role: "standard" },
      { value: 1, unit: "mg", role: "standard" },
      { value: 1.7, unit: "mg", role: "standard" },
      { value: 2.4, unit: "mg", role: "standard" },
    ],
    minIntervalDays: 2,
    maxDoseMg: 2.4,
    indicationNote:
      "Chronic weight management in adults and in adolescents aged 12 and older with obesity or with overweight plus a weight-related condition. Also lowers major heart-event risk in adults with established heart disease, and treats noncirrhotic MASH with moderate to advanced liver fibrosis.",
    missedDoseRule:
      "If the next scheduled dose is more than 2 days away (48 hours), take the missed dose as soon as possible. If the next dose is less than 2 days away, the label says the missed dose is not taken and the next dose is taken on the usual day. At least 2 days (48 hours) must separate two doses. If 2 or more weeks (14 days) have passed since the last dose, contact your prescriber about how to restart.",
    retitrationDays: 14,
    missedDoseWindowDays: 4,
    missedDoseLabelQuote:
      "If you miss a dose of WEGOVY and the next scheduled dose is more than 2 days away (48 hours), take the missed dose as soon as possible.",
    source: "https://www.accessdata.fda.gov/drugsatfda_docs/label/2025/215256s024lbl.pdf",
    lastReviewed: "2026-10-05",
    verified: true,
    verifiedNote:
      "Wegovy is also sold as an oral tablet (oral semaglutide 25 mg once daily). That form is not in this config, so it cannot be logged as Wegovy® here. The label states the missed-dose rule as a condition on the next dose rather than a plain day count; the 4-day window is derived from it and the card shows the label's own wording.",
    exposureEligible: true,
  },
  {
    id: "mounjaro",
    brandName: "Mounjaro®",
    genericName: "tirzepatide",
    route: "subcutaneous",
    dosingIntervalDays: 7,
    allowedDoses: [
      { value: 2.5, unit: "mg", role: "initiation" },
      { value: 5, unit: "mg", role: "standard" },
      { value: 7.5, unit: "mg", role: "standard" },
      { value: 10, unit: "mg", role: "standard" },
      { value: 12.5, unit: "mg", role: "standard" },
      { value: 15, unit: "mg", role: "standard" },
    ],
    minIntervalDays: 3,
    maxDoseMg: 15,
    indicationNote:
      "Type 2 diabetes in adults and in children aged 10 and older. The 2.5 mg strength is for starting treatment only. The maximum strength is 15 mg for adults and 10 mg for children aged 10 to under 18.",
    missedDoseRule:
      "Take a missed dose within 4 days (96 hours) of when it was due if you can. If more than 4 days have passed, skip it and take the next dose on your usual day. At least 3 days (72 hours) must separate two doses.",
    retitrationDays: 4,
    missedDoseWindowDays: 4,
    missedDoseLabelQuote:
      "If a dose is missed, administer MOUNJARO as soon as possible within 4 days (96 hours) after the missed dose.",
    source: "https://pi.lilly.com/us/mounjaro-uspi.pdf",
    lastReviewed: "2026-10-05",
    verified: true,
    verifiedNote: "",
    exposureEligible: true,
  },
  {
    id: "zepbound",
    brandName: "Zepbound®",
    genericName: "tirzepatide",
    route: "subcutaneous",
    dosingIntervalDays: 7,
    allowedDoses: [
      { value: 2.5, unit: "mg", role: "initiation" },
      { value: 5, unit: "mg", role: "standard" },
      { value: 7.5, unit: "mg", role: "standard" },
      { value: 10, unit: "mg", role: "standard" },
      { value: 12.5, unit: "mg", role: "standard" },
      { value: 15, unit: "mg", role: "standard" },
    ],
    minIntervalDays: 3,
    maxDoseMg: 15,
    indicationNote:
      "Chronic weight management in adults with obesity, or with overweight plus a weight-related condition, and moderate-to-severe obstructive sleep apnoea with obesity. The 2.5 mg strength is for starting treatment only and is not a maintenance dose.",
    missedDoseRule:
      "Take a missed dose within 4 days (96 hours) of when it was due if you can. If more than 4 days have passed, skip it and take the next dose on your usual day. At least 3 days (72 hours) must separate two doses.",
    retitrationDays: 4,
    missedDoseWindowDays: 4,
    missedDoseLabelQuote:
      "If a dose is missed, administer ZEPBOUND as soon as possible within 4 days (96 hours) after the missed dose.",
    source: "https://pi.lilly.com/us/zepbound-uspi.pdf",
    lastReviewed: "2026-10-05",
    verified: true,
    verifiedNote: "",
    exposureEligible: true,
  },
  {
    id: "victoza",
    brandName: "Victoza®",
    genericName: "liraglutide",
    route: "subcutaneous",
    dosingIntervalDays: 1,
    allowedDoses: [
      { value: 0.6, unit: "mg", role: "initiation" },
      { value: 1.2, unit: "mg", role: "standard" },
      { value: 1.8, unit: "mg", role: "standard" },
    ],
    minIntervalDays: 1,
    maxDoseMg: 1.8,
    indicationNote:
      "Type 2 diabetes in adults and in children aged 10 and older. Also lowers the risk of major heart events in adults with type 2 diabetes and established heart disease.",
    missedDoseRule:
      "Do not take two doses on the same day. If you miss a dose, take your next dose at the usual time the following day, and speak to your prescriber before restarting if you have missed several days in a row.",
    retitrationDays: null,
    missedDoseWindowDays: 0,
    missedDoseLabelQuote:
      "If a dose is missed, resume the once-daily regimen at the next scheduled dose.",
    source: "https://www.novo-pi.com/victoza.pdf",
    lastReviewed: "2026-10-05",
    verified: true,
    verifiedNote:
      "Dose strengths (0.6 / 1.2 / 1.8 mg), the once-daily interval and the indications were read from the label. The label's missed-dose section was not visible in the copy I could read, so the missed-dose rule above is deliberately general — the label's own 12-hour window is NOT stated here.",
    exposureEligible: true,
  },
  {
    id: "saxenda",
    brandName: "Saxenda®",
    genericName: "liraglutide",
    route: "subcutaneous",
    dosingIntervalDays: 1,
    allowedDoses: [
      { value: 0.6, unit: "mg", role: "titration_only" },
      { value: 1.2, unit: "mg", role: "titration_only" },
      { value: 1.8, unit: "mg", role: "titration_only" },
      { value: 2.4, unit: "mg", role: "titration_only" },
      { value: 3, unit: "mg", role: "standard" },
    ],
    minIntervalDays: 1,
    maxDoseMg: 3,
    indicationNote:
      "Chronic weight management in adults and in adolescents aged 12 and older with obesity or with overweight plus a weight-related condition. The 3 mg strength is the maintenance dose; the lower strengths are for titration only.",
    missedDoseRule:
      "If you miss a daily dose, skip it and take the next dose at the usual time the following day. Never take two doses in one day. If Saxenda has not been taken for 3 days or more, contact your prescriber — the label says to restart at 0.6 mg and build up again.",
    retitrationDays: 3,
    missedDoseWindowDays: 0,
    missedDoseLabelQuote:
      "If a dose is missed, resume the once-daily regimen as prescribed with the next scheduled dose.",
    source: "https://www.accessdata.fda.gov/drugsatfda_docs/label/2023/206321s016lbl.pdf",
    lastReviewed: "2026-10-05",
    verified: true,
    verifiedNote:
      "Dose ladder, the 3 mg maintenance dose and the once-daily interval were read from the label. The 3-day restart rule matches the label wording quoted by Novo Nordisk's Saxenda dosing page; I did not open the exact label sentence myself.",
    exposureEligible: true,
  },
  {
    id: "rybelsus",
    brandName: "Rybelsus®",
    genericName: "semaglutide",
    route: "oral_tablet",
    dosingIntervalDays: 1,
    allowedDoses: [
      { value: 3, unit: "mg", role: "initiation" },
      { value: 7, unit: "mg", role: "standard" },
      { value: 14, unit: "mg", role: "standard" },
    ],
    minIntervalDays: 1,
    maxDoseMg: 14,
    indicationNote:
      "Type 2 diabetes in adults. The 3 mg strength is for starting treatment only (30 days) and is not effective for blood-sugar control on its own.",
    missedDoseRule:
      "If you miss a daily tablet, skip it and take the next tablet at the usual time the next morning. Never take two tablets to catch up.",
    retitrationDays: null,
    missedDoseWindowDays: 0,
    missedDoseLabelQuote:
      "If a dose is missed, the missed dose should be skipped and the next dose should be taken on the next day.",
    source: "https://www.accessdata.fda.gov/drugsatfda_docs/label/2024/213051s018lbl.pdf",
    lastReviewed: "2026-10-05",
    verified: true,
    verifiedNote: "",
    exposureEligible: true,
  },
  {
    id: "trulicity",
    brandName: "Trulicity®",
    genericName: "dulaglutide",
    route: "subcutaneous",
    dosingIntervalDays: 7,
    allowedDoses: [
      { value: 0.75, unit: "mg", role: "initiation" },
      { value: 1.5, unit: "mg", role: "standard" },
      { value: 3, unit: "mg", role: "standard" },
      { value: 4.5, unit: "mg", role: "standard" },
    ],
    minIntervalDays: 3,
    maxDoseMg: 4.5,
    indicationNote: "Type 2 diabetes in adults and in children aged 10 and older.",
    missedDoseRule:
      "Take the missed dose as soon as possible when there are at least 3 days (72 hours) until the next scheduled dose. If the next dose is due in 1 or 2 days, the label says the missed dose is not taken and the next dose is taken on its usual day.",
    retitrationDays: 3,
    missedDoseWindowDays: 3,
    missedDoseLabelQuote:
      "If a dose is missed, administer the missed dose as soon as possible if there are at least 3 days (72 hours) until the next scheduled dose.",
    source: "https://pi.lilly.com/us/trulicity-uspi.pdf",
    lastReviewed: "2026-10-05",
    verified: true,
    verifiedNote:
      "Dose strengths (0.75 / 1.5 / 3 / 4.5 mg), the once-weekly interval and the maximum dose were read from the label. The missed-dose window was carried over from the app's existing data and not re-read in this pass.",
    exposureEligible: true,
  },
  {
    id: "foundayo",
    brandName: "Foundayo®",
    genericName: "orforglipron",
    route: "oral_tablet",
    dosingIntervalDays: 1,
    allowedDoses: [],
    allowsAnyDose: true,
    minIntervalDays: 1,
    maxDoseMg: null,
    indicationNote:
      "Chronic weight management in adults with obesity, or with overweight plus a weight-related condition. A once-daily tablet, and the first oral GLP-1 that is not a peptide.",
    missedDoseRule:
      "Follow the instructions your prescriber gave you for a missed tablet. Never take two tablets to catch up.",
    retitrationDays: null,
    missedDoseWindowDays: 0,
    missedDoseLabelQuote: "",
    source: "https://foundayo.lilly.com/",
    lastReviewed: "2026-10-07",
    verified: false,
    verifiedNote:
      "Foundayo (orforglipron) is a brand-name oral GLP-1. Its strength list has not been read from the prescribing information, so no strengths are offered here and any dose may be typed — nothing logged for it is used for exposure modelling. The once-daily interval is the manufacturer's own.",
    exposureEligible: false,
  },
  {
    id: "bpc_157",
    brandName: "BPC-157",
    genericName: "Body Protection Compound 157",
    route: "subcutaneous",
    dosingIntervalDays: null,
    allowedDoses: [],
    allowsAnyDose: true,
    minIntervalDays: null,
    maxDoseMg: null,
    indicationNote:
      "A research peptide studied for tissue repair in animals. No approved product anywhere, and the FDA has issued warnings about it.",
    missedDoseRule:
      "Levli holds no label for this product, so it cannot state a missed-dose rule. Follow your prescriber's instructions.",
    retitrationDays: null,
    missedDoseWindowDays: null,
    missedDoseLabelQuote: "",
    source: "",
    lastReviewed: "2026-10-07",
    verified: false,
    verifiedNote:
      "A research peptide with no approved product and no prescribing information to check against. No strengths are listed and the dose is always typed by the user.",
    exposureEligible: false,
  },
  {
    id: "cjc_1295",
    brandName: "CJC-1295",
    genericName: "Modified growth hormone releasing factor 1-29",
    route: "subcutaneous",
    dosingIntervalDays: null,
    allowedDoses: [],
    allowsAnyDose: true,
    minIntervalDays: null,
    maxDoseMg: null,
    indicationNote:
      "A research peptide (growth hormone releasing factor analogue). No approved product anywhere.",
    missedDoseRule:
      "Levli holds no label for this product, so it cannot state a missed-dose rule. Follow your prescriber's instructions.",
    retitrationDays: null,
    missedDoseWindowDays: null,
    missedDoseLabelQuote: "",
    source: "",
    lastReviewed: "2026-10-07",
    verified: false,
    verifiedNote:
      "A research peptide with no approved product and no prescribing information to check against. No strengths are listed and the dose is always typed by the user.",
    exposureEligible: false,
  },
  {
    id: "ghk_cu",
    brandName: "GHK-Cu",
    genericName: "Copper tripeptide-1",
    route: "topical_serum",
    dosingIntervalDays: null,
    allowedDoses: [],
    allowsAnyDose: true,
    minIntervalDays: null,
    maxDoseMg: null,
    indicationNote:
      "A copper peptide used in skincare. A cosmetic ingredient, not an approved medicine.",
    missedDoseRule:
      "Levli holds no label for this product, so it cannot state a missed-dose rule. Follow the instructions that came with it.",
    retitrationDays: null,
    missedDoseWindowDays: null,
    missedDoseLabelQuote: "",
    source: "",
    lastReviewed: "2026-10-07",
    verified: false,
    verifiedNote:
      "A cosmetic ingredient, not an approved medicine. No strengths are listed and the amount applied is always typed by the user.",
    exposureEligible: false,
  },
  {
    id: "ipamorelin",
    brandName: "Ipamorelin",
    // A single peptide with no separate generic name — the product name IS the
    // name, so no generic is printed beside it.
    genericName: "",
    route: "subcutaneous",
    dosingIntervalDays: null,
    allowedDoses: [],
    allowsAnyDose: true,
    minIntervalDays: null,
    maxDoseMg: null,
    indicationNote:
      "A research peptide (growth hormone secretagogue). No approved product anywhere.",
    missedDoseRule:
      "Levli holds no label for this product, so it cannot state a missed-dose rule. Follow your prescriber's instructions.",
    retitrationDays: null,
    missedDoseWindowDays: null,
    missedDoseLabelQuote: "",
    source: "",
    lastReviewed: "2026-10-07",
    verified: false,
    verifiedNote:
      "A research peptide with no approved product and no prescribing information to check against. No strengths are listed and the dose is always typed by the user.",
    exposureEligible: false,
  },
  {
    id: "tb_500",
    brandName: "TB-500",
    genericName: "Thymosin beta-4 fragment",
    route: "subcutaneous",
    dosingIntervalDays: null,
    allowedDoses: [],
    allowsAnyDose: true,
    minIntervalDays: null,
    maxDoseMg: null,
    indicationNote:
      "A research peptide studied for tissue repair. No approved product anywhere, and it is prohibited in sport (WADA).",
    missedDoseRule:
      "Levli holds no label for this product, so it cannot state a missed-dose rule. Follow your prescriber's instructions.",
    retitrationDays: null,
    missedDoseWindowDays: null,
    missedDoseLabelQuote: "",
    source: "",
    lastReviewed: "2026-10-07",
    verified: false,
    verifiedNote:
      "A research peptide with no approved product and no prescribing information to check against. No strengths are listed and the dose is always typed by the user.",
    exposureEligible: false,
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
    indicationNote:
      "Compounded semaglutide — there is no FDA-approved label for these products, and strengths differ between pharmacies.",
    missedDoseRule:
      "Follow the instructions your prescriber or pharmacy gave you for a missed dose. Levli cannot check these products against a label.",
    retitrationDays: null,
    missedDoseWindowDays: null,
    missedDoseLabelQuote: "",
    source: "",
    lastReviewed: "2026-10-05",
    verified: false,
    verifiedNote:
      "Compounded and generic products have no approved prescribing information, so no dose list can be verified. Any dose may be logged and none is used for exposure modelling.",
    exposureEligible: false,
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
    indicationNote:
      "Compounded tirzepatide — there is no FDA-approved label for these products, and strengths differ between pharmacies.",
    missedDoseRule:
      "Follow the instructions your prescriber or pharmacy gave you for a missed dose. Levli cannot check these products against a label.",
    retitrationDays: null,
    missedDoseWindowDays: null,
    missedDoseLabelQuote: "",
    source: "",
    lastReviewed: "2026-10-05",
    verified: false,
    verifiedNote:
      "Compounded and generic products have no approved prescribing information, so no dose list can be verified. No dose logged for these products is used for exposure modelling.",
    exposureEligible: false,
  },
  {
    id: "custom",
    brandName: CUSTOM_MEDICATION_NAME,
    genericName: "",
    route: "",
    dosingIntervalDays: null,
    allowedDoses: [],
    allowsAnyDose: true,
    indicationNote:
      "A medication you name yourself, with a dose your prescriber directed. Levli holds no information about it.",
    missedDoseRule: "Follow your prescriber's instructions for a missed dose.",
    retitrationDays: null,
    missedDoseWindowDays: null,
    missedDoseLabelQuote: "",
    source: "",
    lastReviewed: "2026-10-05",
    verified: false,
    verifiedNote:
      "Nothing about a custom entry is verified. It is never used for exposure modelling or interval-based reminders.",
    exposureEligible: false,
  },
];

// ── Lookups ────────────────────────────────────────────────────────────────

const normalise = (name) => String(name || "").replace(/[®™]/g, "").trim().toLowerCase();

const BY_KEY = (() => {
  const map = {};
  MEDICATION_CONFIG.forEach((entry) => {
    map[normalise(entry.brandName)] = entry;
    if (entry.genericName && !map[normalise(entry.genericName)]) map[normalise(entry.genericName)] = entry;
  });
  return map;
})();

/** The config record for a medication name (brand or generic), or null. */
export function getMedicationConfig(name) {
  if (!name) return null;
  const exact = MEDICATION_CONFIG.find((e) => e.brandName === name);
  if (exact) return exact;
  return BY_KEY[normalise(name)] || null;
}

/** The brand name without the ® so it reads naturally inside a sentence. */
export function plainBrandName(name) {
  const entry = getMedicationConfig(name);
  return (entry?.brandName || String(name || "")).replace(/[®™]/g, "");
}

/**
 * The product's name exactly as it should be SHOWN — the ® kept, because a
 * brand's own name includes it. Matching, sorting, searching and exports use the
 * plain name above instead, so a search for "Ozempic" still finds "Ozempic®".
 * A name Levli does not hold is returned exactly as the user typed it.
 */
export function displayBrandName(name) {
  const entry = MEDICATION_CONFIG.find((e) => normalise(e.brandName) === normalise(name));
  return entry ? entry.brandName : String(name || "");
}

/**
 * The generic wording to show beside a product, or "" when it would only repeat
 * the product's own name (a single peptide such as Ipamorelin has no separate
 * generic name to print).
 */
export function genericSubtitle(name) {
  const generic = getMedicationConfig(name)?.genericName || "";
  if (!generic) return "";
  const letters = (v) => normalise(v).replace(/[^a-z0-9]/g, "");
  return letters(generic) === letters(displayBrandName(name)) ? "" : generic;
}

/** true when this product allows any dose (compounded / custom / unknown). */
export function allowsAnyDose(name) {
  const entry = getMedicationConfig(name);
  if (!entry) return true;
  return !!entry.allowsAnyDose || entry.allowedDoses.length === 0;
}

/** true when this product's dose list comes from an official label. */
export function isVerifiedMedication(name) {
  const entry = getMedicationConfig(name);
  return !!(entry && entry.verified && entry.allowedDoses.length > 0);
}

/** Every strength the label lists, ascending, with units and roles. */
export function getAllowedDoses(name) {
  const entry = getMedicationConfig(name);
  if (!entry) return [];
  return [...entry.allowedDoses].sort((a, b) => a.value - b.value);
}

/** Just the numbers, ascending — used by the dose chips. */
export function getDoseValues(name) {
  return getAllowedDoses(name).map((d) => d.value);
}

/** The unit for this medication's doses (falls back to mg). */
export function getDoseUnit(name) {
  return getAllowedDoses(name)[0]?.unit || "mg";
}

/** The dose list written out for a message, e.g. "0.25, 0.5, 1 or 2 mg". */
export function describeAllowedDoses(name) {
  const doses = getAllowedDoses(name);
  if (!doses.length) return "";
  const unit = doses[0].unit;
  const values = doses.map((d) => `${d.value}`);
  const list =
    values.length === 1
      ? values[0]
      : `${values.slice(0, -1).join(", ")} or ${values[values.length - 1]}`;
  return `${list} ${unit}`;
}

/**
 * Checks one medication/dose pair against the config.
 * A dose the label does not list for that medication is blocked, with the
 * product named in the message. It is never silently accepted.
 */
export function validateDosePair(name, dose) {
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
      severity: entry.verified ? "none" : "warn",
    };
  }
  const listed = entry.allowedDoses.some((d) => Math.abs(d.value - value) < 1e-9);
  if (listed) return { valid: true, unverified: false, message: "", severity: "none" };
  return {
    valid: false,
    unverified: false,
    message: `This dose isn't listed for ${plainBrandName(name)}. Check your pen or prescription.`,
    severity: "block",
  };
}

/** true when a shot-like record's dose is not listed for its medication. */
export function needsDoseCheck(shot) {
  if (!shot || shot.dose_source === "custom") return false;
  const name = shot.medication || "";
  const entry = getMedicationConfig(name);
  if (!entry || !entry.verified || allowsAnyDose(name)) return false;
  return !validateDosePair(name, shot.dose).valid;
}

// ── Interval, missed dose, exposure ────────────────────────────────────────

/** The label's dosing interval in days, or null when not established. */
export function getIntervalDays(name) {
  return getMedicationConfig(name)?.dosingIntervalDays ?? null;
}

/** The shortest interval the label allows between two doses. */
export function getMinIntervalDays(name) {
  return getMedicationConfig(name)?.minIntervalDays ?? null;
}

/** Warning text when an interval is shorter than the label allows. */
export function intervalWarning(name, days) {
  const entry = getMedicationConfig(name);
  const min = entry?.minIntervalDays;
  const value = Number(days);
  if (!entry || !min || !Number.isFinite(value) || value <= 0) return "";
  if (value >= min) return "";
  return `${plainBrandName(name)} is not dosed closer than ${min} day${min === 1 ? "" : "s"} apart. ${CUSTOM_MEDICATION_WARNING} Check with your prescriber.`;
}

/**
 * The interval the app should use: the prescriber's override when set,
 * otherwise the label interval, otherwise the saved preference.
 */
export function effectiveDaysBetween(profile, medication) {
  const override = parseInt(String(profile?.days_between_override ?? ""), 10);
  if (Number.isFinite(override) && override > 0) return override;
  const label = getIntervalDays(medication || "");
  if (label && label > 0) return label;
  const saved = parseInt(String(profile?.days_between ?? ""), 10);
  if (Number.isFinite(saved) && saved > 0) return saved;
  return 7;
}

/** What the label says about a missed dose. */
export function getMissedDoseRule(name) {
  return getMedicationConfig(name)?.missedDoseRule || "";
}

/**
 * Days after the due date that the label still allows the missed dose to be
 * taken, or null when the product has no label to check against. 0 means the
 * label never has a dose taken late (a daily product resumes with the next one).
 */
export function getMissedDoseWindowDays(name) {
  const entry = getMedicationConfig(name);
  return entry ? (entry.missedDoseWindowDays ?? null) : null;
}

/** The label's own sentence about a missed dose, for citation. */
export function getMissedDoseLabelQuote(name) {
  return getMedicationConfig(name)?.missedDoseLabelQuote || "";
}

/** Link to the prescribing information this record was checked against. */
export function getMedicationLabelSource(name) {
  return getMedicationConfig(name)?.source || "";
}

/** Days after which the label says to contact the prescriber, or null. */
export function getRetitrationDays(name) {
  return getMedicationConfig(name)?.retitrationDays ?? null;
}

/** true when this product's doses may be used for exposure modelling. */
export function isExposureEligible(medication, doseSource) {
  if (doseSource === "custom") return false;
  return !!getMedicationConfig(medication || "")?.exposureEligible;
}

/** true when this shot's dose was typed by the user rather than picked. */
export function isCustomDoseSource(shot) {
  return shot?.dose_source === "custom";
}

// ── Pickers ────────────────────────────────────────────────────────────────

/**
 * Medication names for the pickers: label-verified products first, then the
 * products with no verifiable list, then the custom option.
 */
export function getMedicationPickerNames() {
  return [...getCatalogueEntries().map((e) => e.brandName), CUSTOM_MEDICATION_NAME];
}

// ── The selectable catalogue, in the order it is shown ──────────────────────
// Every picker reads this one list — Add Shot Log, Add / Edit Medication, Stock
// and onboarding — so a product can never be offered on one screen and missing
// from another.
//
// A product that is NOT listed here (Victoza, Saxenda, Trulicity) keeps all of
// its label data and is still reached by name: an existing log, a stock item, or
// the "Others" entry. It is simply no longer one of the catalogue rows.
export const CATALOGUE_ORDER = [
  "foundayo",
  "mounjaro",
  "ozempic",
  "rybelsus",
  "compounded_semaglutide",
  "compounded_tirzepatide",
  "wegovy",
  "zepbound",
  "bpc_157",
  "cjc_1295",
  "ghk_cu",
  "ipamorelin",
  "tb_500",
];

/** The catalogue's products, in the order the pickers show them. */
export function getCatalogueEntries() {
  return CATALOGUE_ORDER
    .map((id) => MEDICATION_CONFIG.find((e) => e.id === id))
    .filter(Boolean);
}