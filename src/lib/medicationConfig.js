// ─────────────────────────────────────────────────────────────────────────────
// CENTRAL MEDICATIONS CONFIG — the ONE place doses are defined in Levli.
//
// Shots, Meds, Stock, Insights and Reports all read from here. No screen
// hardcodes a dose list.
//
// Each record: brandName (the display name — the ®/™ mark lives here and nowhere
// else), name (the same name plain, used for matching, sorting and exports),
// genericName, route, dosingIntervalDays, allowedDoses[] (with units),
// indicationNote, missedDoseRule, source (link to the official prescribing
// information), lastReviewed.
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
export const CUSTOM_MEDICATION_NAME = "Others";

/** The name this option carried before it was renamed. Still resolved, so a log
    made under the old name keeps working. */
export const LEGACY_CUSTOM_NAMES = ["Other / custom (prescriber-directed)"];

/** Unapproved research peptides: there is no approved product anywhere, so no
    strengths, no schedule and no missed-dose rule. Levli logs only what the user
    types for one of these, and never models exposure for it. */
const RESEARCH_PEPTIDE_NAMES = [
  { id: "bpc157", name: "BPC-157" },
  { id: "cjc1295", name: "CJC-1295" },
  { id: "ghkcu", name: "GHK-Cu" },
  { id: "ipamorelin", name: "Ipamorelin" },
  { id: "tb500", name: "TB-500" },
];

const researchPeptideEntry = ({ id, name }) => ({
  id,
  brandName: name,
  name,
  genericName: "",
  route: "",
  dosingIntervalDays: null,
  allowedDoses: [],
  allowsAnyDose: true,
  minIntervalDays: null,
  maxDoseMg: null,
  indicationNote:
    `${name} is not an approved medicine in the US, EU or UK. Levli holds no prescribing information for it and records only what you enter.`,
  missedDoseRule: "",
  retitrationDays: null,
  missedDoseWindowDays: null,
  missedDoseLabelQuote: "",
  source: "",
  lastReviewed: "2026-10-07",
  verified: false,
  verifiedNote:
    `${name} has no approved product or label to check against, so it carries no strength list, no schedule and no missed-dose rule. A typed dose is never used for exposure modelling.`,
  exposureEligible: false,
});
/** Shown wherever a custom entry is used. */
export const CUSTOM_MEDICATION_WARNING = "Levli can't verify this dose.";

// ── Colour tokens ───────────────────────────────────────────────────────────
// Each token is the colour the manufacturer prints on the pen, tablet or carton
// for that strength, as a light and a dark variant. The light variant is the
// colour as it appears on the product; the dark variant is the same hue lifted
// so it holds its shape on a dark screen. Where a colour cannot carry its own
// text at WCAG AA, src/lib/doseColors.js keeps the hue and steps the lightness
// of the chip it draws, so the token itself stays the maker's colour.
//
// Nothing in the UI hard-codes a dose colour: it is read from here.
const COLOR_TOKENS = {
  // Ozempic — pen label colour.
  ozempicRed: { light: "#C8102E", dark: "#CE2A3C" },
  ozempicBlue: { light: "#1A57A5", dark: "#2E6FC4" },
  ozempicYellow: { light: "#E0A616", dark: "#EFBB33" },
  // Wegovy — one colour-coded pen per strength.
  wegovyLightGreen: { light: "#8FC043", dark: "#A3D25C" },
  wegovyPink: { light: "#D6336C", dark: "#C92A62" },
  wegovyBrown: { light: "#7A5230", dark: "#8E6238" },
  wegovyBlue: { light: "#1D6FB8", dark: "#2472BB" },
  wegovyBlack: { light: "#2B383D", dark: "#4A5A61" },
  // Rybelsus — carton and blister colour.
  rybelsusGreen: { light: "#0B7F35", dark: "#127F3C" },
  rybelsusRed: { light: "#C81E28", dark: "#D63A45" },
  rybelsusBlue: { light: "#0B69B0", dark: "#1976BE" },
  // Foundayo — tablet colour.
  foundayoPink: { light: "#E08CA8", dark: "#EDA3BC" },
  foundayoYellow: { light: "#EBD79A", dark: "#F2E3B4" },
  foundayoPurpleGrey: { light: "#AFA6CF", dark: "#C2BADA" },
  // Mounjaro — carton and pen label colour.
  mounjaroGrey: { light: "#75787B", dark: "#8A8D91" },
  mounjaroPurple: { light: "#592C7F", dark: "#7B4AA8" },
  mounjaroGreen: { light: "#00857D", dark: "#159C93" },
  mounjaroPink: { light: "#D45780", dark: "#E27A9C" },
  mounjaroBlue: { light: "#0069A0", dark: "#1E86BF" },
  mounjaroOrange: { light: "#F58233", dark: "#FA9C5C" },
};

export const MEDICATION_CONFIG = [
  {
    id: "ozempic",
    brandName: "Ozempic®",
    name: "Ozempic",
    genericName: "semaglutide",
    route: "subcutaneous",
    dosingIntervalDays: 7,
    allowedDoses: [
      // Coloured by pen, exactly as the maker does: the red-label pen delivers
      // both 0.25 mg and 0.5 mg, so those two strengths share one colour.
      { value: 0.25, unit: "mg", role: "initiation", color: COLOR_TOKENS.ozempicRed },
      { value: 0.5, unit: "mg", role: "standard", color: COLOR_TOKENS.ozempicRed },
      { value: 1, unit: "mg", role: "standard", color: COLOR_TOKENS.ozempicBlue },
      { value: 2, unit: "mg", role: "standard", color: COLOR_TOKENS.ozempicYellow },
    ],
    colorScheme: {
      basis: "pen",
      source: "https://www.ozempic.com/ozempic-pen/dosing.html",
      verified: "2026-10-08",
      status: "confirmed",
      note: "Pen label colour by strength: red-label pen 0.25 mg and 0.5 mg, blue-label pen 1 mg, yellow-label pen 2 mg (Ozempic pen dosing page; Novo Nordisk pen administration page).",
    },
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
    name: "Wegovy",
    genericName: "semaglutide",
    route: "subcutaneous",
    dosingIntervalDays: 7,
    allowedDoses: [
      // One colour-coded pen per strength, as the maker does.
      { value: 0.25, unit: "mg", role: "initiation", color: COLOR_TOKENS.wegovyLightGreen },
      { value: 0.5, unit: "mg", role: "standard", color: COLOR_TOKENS.wegovyPink },
      { value: 1, unit: "mg", role: "standard", color: COLOR_TOKENS.wegovyBrown },
      { value: 1.7, unit: "mg", role: "standard", color: COLOR_TOKENS.wegovyBlue },
      { value: 2.4, unit: "mg", role: "standard", color: COLOR_TOKENS.wegovyBlack },
    ],
    colorScheme: {
      basis: "pen",
      source: "https://www.wegovy.com/obesity/starting-wegovy/starting-wegovy-pen.html",
      verified: "2026-10-08",
      status: "confirmed",
      note: "Each strength has its own colour-coded pen: light green 0.25 mg, pink 0.5 mg, brown 1 mg, blue 1.7 mg, black 2.4 mg (Wegovy pen guide; pen-label references for the colour names).",
    },
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
    name: "Mounjaro",
    genericName: "tirzepatide",
    route: "subcutaneous",
    dosingIntervalDays: 7,
    allowedDoses: [
      // One colour per strength on the carton and pen label, as the maker does.
      { value: 2.5, unit: "mg", role: "initiation", color: COLOR_TOKENS.mounjaroGrey },
      { value: 5, unit: "mg", role: "standard", color: COLOR_TOKENS.mounjaroPurple },
      { value: 7.5, unit: "mg", role: "standard", color: COLOR_TOKENS.mounjaroGreen },
      { value: 10, unit: "mg", role: "standard", color: COLOR_TOKENS.mounjaroPink },
      { value: 12.5, unit: "mg", role: "standard", color: COLOR_TOKENS.mounjaroBlue },
      { value: 15, unit: "mg", role: "standard", color: COLOR_TOKENS.mounjaroOrange },
    ],
    colorScheme: {
      basis: "pen",
      source: "https://www.goodrx.com/mounjaro/appearance",
      verified: "2026-10-08",
      status: "confirmed",
      note: "US pen and carton label colour by strength, from manufacturer-supplied product photos: grey 2.5 mg, purple 5 mg, green 7.5 mg, pink 10 mg, blue 12.5 mg, orange 15 mg. Re-verify against Lilly material at sign-off: UK pens use a different set (yellow, maroon, green, teal, indigo, purple).",
    },
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
    name: "Zepbound",
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
    colorScheme: {
      basis: "",
      source: "",
      verified: "",
      status: "review",
      note: "No manufacturer-stated colour found, so the standard scale is used. A third-party guide records the pen and vial colour blocks as dark grey, dark purple, dark teal, pink, blue and red for 2.5 mg through 15 mg, and Lilly's own pages describe a colour-coded pen without naming the colours. Confirm against Lilly packaging and this becomes a colour block on each dose above.",
    },
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
    name: "Victoza",
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
    colorScheme: {
      basis: "pen",
      source: "",
      verified: "",
      status: "review",
      note: "One pen delivers 0.6 mg, 1.2 mg and 1.8 mg, so every dose would share a single colour — no manufacturer-stated colour found for that pen, so the standard scale is used. Not offered as a new choice in the pickers; kept so existing logs resolve.",
    },
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
    name: "Saxenda",
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
    colorScheme: {
      basis: "pen",
      source: "",
      verified: "",
      status: "review",
      note: "One pen delivers every strength from 0.6 mg to 3 mg, so every dose shares a single colour — no manufacturer-stated colour found for that pen, so the standard scale is used until one is sourced.",
    },
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
    name: "Rybelsus",
    genericName: "semaglutide",
    route: "oral_tablet",
    dosingIntervalDays: 1,
    allowedDoses: [
      // Coloured by carton, as the maker does: the tablets themselves are all
      // white to light yellow, so the colour belongs to the strength's carton.
      { value: 3, unit: "mg", role: "initiation", color: COLOR_TOKENS.rybelsusGreen },
      { value: 7, unit: "mg", role: "standard", color: COLOR_TOKENS.rybelsusRed },
      { value: 14, unit: "mg", role: "standard", color: COLOR_TOKENS.rybelsusBlue },
    ],
    colorScheme: {
      basis: "strength",
      source: "https://www.novonordisk.ca/content/dam/nncorp/ca/en/products/Rybelsus-CI-EN-monograph.pdf",
      verified: "2026-10-08",
      status: "confirmed",
      note: "Carton and blister colour by strength: green 3 mg, red 7 mg, blue 14 mg (Novo Nordisk product monograph; Health Canada product register).",
    },
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
    name: "Trulicity",
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
    colorScheme: {
      basis: "",
      source: "",
      verified: "",
      status: "review",
      note: "No manufacturer-stated colour found, so the standard scale is used. Not offered as a new choice in the pickers; kept so existing logs resolve.",
    },
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
    name: "Foundayo",
    genericName: "orforglipron",
    route: "oral_tablet",
    dosingIntervalDays: 1,
    allowedDoses: [
      // The label gives each strength a tablet colour, and colours two
      // strengths alike (pink, light yellow, grayish purple). Those pairs share
      // a colour here — the tablets differ in shape as well, and the dose number
      // is always shown, so nothing is identified by colour alone.
      { value: 0.8, unit: "mg", role: "initiation", color: COLOR_TOKENS.foundayoPink },
      { value: 2.5, unit: "mg", role: "titration_only", color: COLOR_TOKENS.foundayoYellow },
      { value: 5.5, unit: "mg", role: "standard", color: COLOR_TOKENS.foundayoPurpleGrey },
      { value: 9, unit: "mg", role: "standard", color: COLOR_TOKENS.foundayoPink },
      { value: 14.5, unit: "mg", role: "standard", color: COLOR_TOKENS.foundayoYellow },
      { value: 17.2, unit: "mg", role: "standard", color: COLOR_TOKENS.foundayoPurpleGrey },
    ],
    colorScheme: {
      basis: "strength",
      source: "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=8ac446c5-feba-474f-a103-23facb9b5c62",
      verified: "2026-10-08",
      status: "confirmed",
      note: "Tablet colour by strength from the FDA label: pink 0.8 mg and 9 mg, light yellow 2.5 mg and 14.5 mg, grayish purple 5.5 mg and 17.2 mg.",
    },
    minIntervalDays: 1,
    maxDoseMg: 17.2,
    indicationNote:
      "Chronic weight management in adults with obesity, or with overweight plus a weight-related condition. A once-daily tablet taken with or without food. The label states it should not be used with another GLP-1 receptor agonist medicine.",
    missedDoseRule: "",
    retitrationDays: null,
    missedDoseWindowDays: null,
    missedDoseLabelQuote: "",
    source: "https://www.accessdata.fda.gov/drugsatfda_docs/label/2026/220934Orig1s000lbl.pdf",
    lastReviewed: "2026-10-07",
    verified: true,
    verifiedNote:
      "Tablet strengths (0.8 / 2.5 / 5.5 / 9 / 14.5 / 17.2 mg), the once-daily interval, the titration order and the 17.2 mg maximum were read from the FDA prescribing information (approval 2026). The label's missed-dose wording was not read in this pass, so Levli states none for it. No published half-life is held, so it is kept out of the exposure estimate.",
    exposureEligible: false,
  },
  ...RESEARCH_PEPTIDE_NAMES.map(researchPeptideEntry),
  {
    id: "compounded_semaglutide",
    brandName: "Semaglutide (generic / compounded)",
    name: "Semaglutide (generic / compounded)",
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
    name: "Tirzepatide (generic / compounded)",
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
    name: CUSTOM_MEDICATION_NAME,
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
  const customEntry = MEDICATION_CONFIG.find((e) => e.id === "custom");
  MEDICATION_CONFIG.forEach((entry) => {
    map[normalise(entry.brandName)] = entry;
    if (entry.name) map[normalise(entry.name)] = entry;
    if (entry.genericName && !map[normalise(entry.genericName)]) map[normalise(entry.genericName)] = entry;
  });
  // A log made while this option still carried its old name still resolves to it.
  LEGACY_CUSTOM_NAMES.forEach((name) => { if (customEntry) map[normalise(name)] = customEntry; });
  return map;
})();

/** The config record for a medication name (brand or generic), or null. */
export function getMedicationConfig(name) {
  if (!name) return null;
  const exact = MEDICATION_CONFIG.find((e) => e.brandName === name);
  if (exact) return exact;
  return BY_KEY[normalise(name)] || null;
}

/**
 * The product's plain name — no ® or ™ — for matching, sorting, exports and
 * reading inside a sentence. The stored display name is never changed by this.
 */
export function plainBrandName(name) {
  const entry = getMedicationConfig(name);
  return entry?.name || String(name || "").replace(/[®™]/g, "");
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

// ── What the pickers offer, and in what order ───────────────────────────────
// The product list, in the order it is shown. A product that is NOT here is
// still defined above (Trulicity, Victoza) so anyone already logging it
// keeps its strengths, its interval and its missed-dose rule — it is simply no
// longer offered as a new choice, and a product outside this list is logged
// through "Others" instead.
const LISTED_IDS = [
  "foundayo",
  "mounjaro",
  "ozempic",
  "rybelsus",
  "compounded_semaglutide",
  "compounded_tirzepatide",
  "saxenda",
  "wegovy",
  "zepbound",
  "bpc157",
  "cjc1295",
  "ghkcu",
  "ipamorelin",
  "tb500",
];

/** The products the pickers offer, in order (the custom entry is not one of them). */
export const LISTED_MEDICATIONS = LISTED_IDS
  .map((id) => MEDICATION_CONFIG.find((e) => e.id === id))
  .filter(Boolean);

/** Medication names for the pickers, in the order above, then "Others". */
export function getMedicationPickerNames() {
  return [...LISTED_MEDICATIONS.map((e) => e.brandName), CUSTOM_MEDICATION_NAME];
}