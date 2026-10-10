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

/** Product names that have been renamed. Still resolved, so a log or a regimen
    made under the old name keeps working — the two compounded products are now
    offered under their own plain name. */
const LEGACY_PRODUCT_NAMES = {
  compounded_semaglutide: ["Semaglutide (generic / compounded)"],
  compounded_tirzepatide: ["Tirzepatide (generic / compounded)"],
};

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
  // Ozempic — pen label colour, read from the manufacturer pen reference.
  ozempicGrey: { light: "#808285", dark: "#9A9C9F" },
  ozempicRed: { light: "#D61D29", dark: "#E4444F" },
  ozempicTeal: { light: "#00868B", dark: "#12999E" },
  ozempicGold: { light: "#F5A41C", dark: "#F8B84A" },
  // Ozempic tablets — the oral formulation's own pack colour per strength: the
  // green band on the 1.5 mg carton, the red badge on the 4 mg bottle and the
  // blue badge on the 9 mg bottle.
  ozempicTabletGreen: { light: "#23A455", dark: "#2FB866" },
  ozempicTabletRed: { light: "#B71C1C", dark: "#D02C2C" },
  ozempicTabletBlue: { light: "#0D47A1", dark: "#1F5CBF" },
  // Wegovy — one colour-coded pen label per strength, per the pen reference.
  wegovyTeal: { light: "#4BB4A5", dark: "#63C7B8" },
  wegovyRaspberry: { light: "#A93C66", dark: "#C25580" },
  wegovyTan: { light: "#A66E3E", dark: "#BC8654" },
  wegovyBlue: { light: "#0079A4", dark: "#1E93BF" },
  wegovyCharcoal: { light: "#3B4044", dark: "#585F64" },
  // Rybelsus — carton colour, per the tablet reference.
  rybelsusGreen: { light: "#009933", dark: "#12AC47" },
  rybelsusRed: { light: "#E32D1C", dark: "#EF5243" },
  rybelsusBlue: { light: "#008BCF", dark: "#21A0DE" },
  // Foundayo — one colour per step, per the dosing chart.
  foundayoBlue: { light: "#1A3D7D", dark: "#2F5AA5" },
  foundayoOlive: { light: "#597C2E", dark: "#74994A" },
  foundayoPurple: { light: "#733A8C", dark: "#8F55A8" },
  foundayoTeal: { light: "#006A77", dark: "#128492" },
  foundayoOrange: { light: "#C8642A", dark: "#DC7F45" },
  foundayoMagenta: { light: "#9C1C68", dark: "#B93E86" },
  // Mounjaro — carton and pen label colour, per the pen reference.
  mounjaroGrey: { light: "#727479", dark: "#8C8E93" },
  mounjaroPurple: { light: "#562866", dark: "#70407F" },
  mounjaroGreen: { light: "#009180", dark: "#0FA795" },
  mounjaroPink: { light: "#CC4678", dark: "#DE6591" },
  mounjaroBlue: { light: "#1775A6", dark: "#2E8EC0" },
  mounjaroOrange: { light: "#F38B38", dark: "#F6A25D" },
  // Zepbound — pen label colour, per the pen reference.
  zepboundGrey: { light: "#4A4F54", dark: "#666C72" },
  zepboundPurple: { light: "#4A2C6D", dark: "#6A478E" },
  zepboundGreen: { light: "#2E8C82", dark: "#41A79C" },
  zepboundPink: { light: "#D53880", dark: "#E45C98" },
  zepboundBlue: { light: "#0086D3", dark: "#1E9EE5" },
  zepboundOrange: { light: "#D86616", dark: "#EC8137" },
  // Saxenda — the pen's own blue, shared by every strength it delivers.
  saxendaPen: { light: "#253494", dark: "#3D4CAE" },
};

export const MEDICATION_CONFIG = [
  {
    id: "ozempic",
    brandName: "Ozempic®",
    name: "Ozempic",
    genericName: "semaglutide",
    route: "subcutaneous",
    // Sold as a weekly pen and as a once-daily tablet, and the two carry
    // different strengths, so the log sheet asks which one is being taken. The
    // pen strengths are `allowedDoses` below; the tablet's own list is on the
    // tablet form, each strength in the colour its own pack carries.
    forms: [
      { id: "injection", label: "Injection", route: "subcutaneous" },
      {
        id: "pill",
        label: "Pill",
        route: "oral_tablet",
        doses: [
          { value: 1.5, unit: "mg", color: COLOR_TOKENS.ozempicTabletGreen },
          { value: 4, unit: "mg", color: COLOR_TOKENS.ozempicTabletRed },
          { value: 9, unit: "mg", color: COLOR_TOKENS.ozempicTabletBlue },
        ],
      },
    ],
    dosingIntervalDays: 7,
    allowedDoses: [
      // Four strengths, four label colours, read from the manufacturer pen
      // reference (see colorScheme.source).
      { value: 0.25, unit: "mg", role: "initiation", color: COLOR_TOKENS.ozempicGrey },
      { value: 0.5, unit: "mg", role: "standard", color: COLOR_TOKENS.ozempicRed },
      { value: 1, unit: "mg", role: "standard", color: COLOR_TOKENS.ozempicTeal },
      { value: 2, unit: "mg", role: "standard", color: COLOR_TOKENS.ozempicGold },
    ],
    colorScheme: {
      basis: "pen and tablet",
      source: "https://media.base44.com/images/public/6a47a256ca9a7d18b85d511f/073735cb4_image.png",
      verified: "2026-10-10",
      status: "confirmed",
      note: "Two packs, two colour bases. Pen, from the pen reference image: grey 0.25 mg, red 0.5 mg, teal 1 mg, gold 2 mg — every pen shares one body and only the label band changes. Tablet, from the oral formulation's own pack (see tabletSources): green 1.5 mg, red 4 mg, blue 9 mg, the colour its carton band and its bottle's strength badge carry.",
      // The oral formulation's own pack, read for the tablet strengths: the carton
      // for 1.5 mg, the bottles' strength badges for 4 mg and 9 mg.
      tabletSources: [
        { strengths: "1.5 mg", url: "https://media.base44.com/images/public/6a47a256ca9a7d18b85d511f/84decc905_image.png" },
        { strengths: "4 mg, 9 mg", url: "https://media.base44.com/images/public/6a47a256ca9a7d18b85d511f/0ef9fd8c8_image.png" },
      ],
    },
    minIntervalDays: 2,
    maxDoseMg: 2,
    indicationNote:
      "Type 2 diabetes. Also lowers the risk of major heart events and of worsening kidney disease in adults with type 2 diabetes and established heart or kidney disease.",
    missedDoseRule:
      "Take a missed dose as soon as possible within 5 days after the missed dose. If more than 5 days have passed, contact your prescriber before continuing. The label says the missed dose is not taken and the next dose is taken on the usual day. Never take two doses less than 2 days (48 hours) apart.",
    retitrationDays: 5,
    missedDoseWindowDays: 5,
    missedDoseLabelQuote:
      "If a dose is missed, administer OZEMPIC as soon as possible within 5 days after the missed dose.",
    source: "https://www.novo-pi.com/ozempic.pdf",
    lastReviewed: "2026-10-05",
    verified: true,
    verifiedNote:
      "The tablet form carries the oral semaglutide strengths (1.5, 4 and 9 mg), each in its own pack colour: green 1.5 mg, red 4 mg, blue 9 mg — read from the oral formulation's carton band and bottle badge, not from a colour-coded pen. The pen strengths are a separate set and are not substitutable mg for mg.",
    exposureEligible: true,
  },
  {
    id: "wegovy",
    brandName: "Wegovy®",
    name: "Wegovy",
    genericName: "semaglutide",
    route: "subcutaneous",
    // Wegovy is sold as a pen and as a once-daily tablet, so the log sheet asks
    // which one is being taken instead of assuming the pen.
    forms: [
      { id: "injection", label: "Injection", route: "subcutaneous" },
      // The oral tablet's own once-daily strengths, each in the pack colour the
      // pen family uses for that step (see colorScheme.tabletSources): teal
      // 1.5 mg to start, raspberry 4 mg and tan 9 mg while stepping up, blue
      // 25 mg for maintenance.
      {
        id: "pill",
        label: "Pill",
        route: "oral_tablet",
        doses: [
          { value: 1.5, unit: "mg", role: "initiation", color: COLOR_TOKENS.wegovyTeal },
          { value: 4, unit: "mg", role: "titration_only", color: COLOR_TOKENS.wegovyRaspberry },
          { value: 9, unit: "mg", role: "titration_only", color: COLOR_TOKENS.wegovyTan },
          { value: 25, unit: "mg", role: "standard", color: COLOR_TOKENS.wegovyBlue },
        ],
      },
    ],
    dosingIntervalDays: 7,
    allowedDoses: [
      // One colour-coded pen label per strength, read from the manufacturer pen
      // reference (see colorScheme.source).
      { value: 0.25, unit: "mg", role: "initiation", color: COLOR_TOKENS.wegovyTeal },
      { value: 0.5, unit: "mg", role: "standard", color: COLOR_TOKENS.wegovyRaspberry },
      { value: 1, unit: "mg", role: "standard", color: COLOR_TOKENS.wegovyTan },
      { value: 1.7, unit: "mg", role: "standard", color: COLOR_TOKENS.wegovyBlue },
      { value: 2.4, unit: "mg", role: "standard", color: COLOR_TOKENS.wegovyCharcoal },
    ],
    colorScheme: {
      basis: "pen and tablet",
      source: "https://media.base44.com/images/public/6a47a256ca9a7d18b85d511f/fe3b5c170_image.png",
      verified: "2026-10-10",
      status: "confirmed",
      note: "The pen labels each strength in its own colour, read from the manufacturer pen reference image: teal 0.25 mg, raspberry 0.5 mg, tan 1 mg, blue 1.7 mg, charcoal 2.4 mg. The oral tablet carries the same four colours on its own pack for its own once-daily strengths, read from the maker's oral dosing chart (see tabletSources): teal 1.5 mg to start, raspberry 4 mg and tan 9 mg while stepping up, blue 25 mg for maintenance.",
      // The oral tablet's pack colours, from the maker's own dosing chart.
      tabletSources: [
        { strengths: "1.5 mg, 4 mg, 9 mg, 25 mg", url: "https://media.base44.com/images/public/6a47a256ca9a7d18b85d511f/622cdfaaf_image.png" },
      ],
    },
    minIntervalDays: 2,
    // The two forms have their own maxima: the pen tops out at 2.4 mg weekly, the
    // tablet at 25 mg once daily. This is the product's own maximum, so a 25 mg
    // tablet dose is not read back to the user as above the maximum.
    maxDoseMg: 25,
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
      "Wegovy is also sold as an oral tablet, once daily, in its own four strengths: 1.5 mg to start, 4 mg and 9 mg as step-up doses, 25 mg for maintenance. Each tablet strength carries the pack colour the pen family uses for that step, read from the maker's oral dosing chart, not from the pen. The label states the missed-dose rule as a condition on the next dose rather than a plain day count; the 4-day window is derived from it and the card shows the label's own wording.",
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
      // One colour per strength on the pen and carton label, read from the
      // manufacturer pen reference (see colorScheme.source).
      { value: 2.5, unit: "mg", role: "initiation", color: COLOR_TOKENS.mounjaroGrey },
      { value: 5, unit: "mg", role: "standard", color: COLOR_TOKENS.mounjaroPurple },
      { value: 7.5, unit: "mg", role: "standard", color: COLOR_TOKENS.mounjaroGreen },
      { value: 10, unit: "mg", role: "standard", color: COLOR_TOKENS.mounjaroPink },
      { value: 12.5, unit: "mg", role: "standard", color: COLOR_TOKENS.mounjaroBlue },
      { value: 15, unit: "mg", role: "standard", color: COLOR_TOKENS.mounjaroOrange },
    ],
    colorScheme: {
      basis: "pen",
      source: "https://media.base44.com/images/public/6a47a256ca9a7d18b85d511f/2db69ff87_image.png",
      verified: "2026-10-08",
      status: "confirmed",
      note: "Pen and carton label colour by strength, read from the manufacturer pen reference image: grey 2.5 mg, dark purple 5 mg, green 7.5 mg, magenta 10 mg, blue 12.5 mg, orange 15 mg. UK pens use a different set (yellow, maroon, green, teal, indigo, purple).",
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
      // One colour per strength on the pen label, read from the manufacturer
      // pen reference (see colorScheme.source).
      { value: 2.5, unit: "mg", role: "initiation", color: COLOR_TOKENS.zepboundGrey },
      { value: 5, unit: "mg", role: "standard", color: COLOR_TOKENS.zepboundPurple },
      { value: 7.5, unit: "mg", role: "standard", color: COLOR_TOKENS.zepboundGreen },
      { value: 10, unit: "mg", role: "standard", color: COLOR_TOKENS.zepboundPink },
      { value: 12.5, unit: "mg", role: "standard", color: COLOR_TOKENS.zepboundBlue },
      { value: 15, unit: "mg", role: "standard", color: COLOR_TOKENS.zepboundOrange },
    ],
    minIntervalDays: 3,
    maxDoseMg: 15,
    colorScheme: {
      basis: "pen",
      source: "https://media.base44.com/images/public/6a47a256ca9a7d18b85d511f/39eb42da9_image.png",
      verified: "2026-10-08",
      status: "confirmed",
      note: "Pen label colour by strength, read from the manufacturer pen reference image: dark grey 2.5 mg, deep purple 5 mg, teal 7.5 mg, magenta 10 mg, bright blue 12.5 mg, burnt orange 15 mg. 5 mg, 10 mg and 15 mg are the maintenance strengths.",
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
      // One pen delivers every strength, so every dose carries that pen's own
      // colour, exactly as the product does: the strength is set on the dose
      // selector, not by a change of label colour.
      { value: 0.6, unit: "mg", role: "titration_only", color: COLOR_TOKENS.saxendaPen },
      { value: 1.2, unit: "mg", role: "titration_only", color: COLOR_TOKENS.saxendaPen },
      { value: 1.8, unit: "mg", role: "titration_only", color: COLOR_TOKENS.saxendaPen },
      { value: 2.4, unit: "mg", role: "titration_only", color: COLOR_TOKENS.saxendaPen },
      { value: 3, unit: "mg", role: "standard", color: COLOR_TOKENS.saxendaPen },
    ],
    minIntervalDays: 1,
    maxDoseMg: 3,
    colorScheme: {
      basis: "pen",
      source: "https://media.base44.com/images/public/6a47a256ca9a7d18b85d511f/ca3ce7c7e_image.png",
      verified: "2026-10-08",
      status: "confirmed",
      note: "One royal-blue pen delivers every strength from 0.6 mg to 3 mg (read from the manufacturer pen reference image), so all five strengths share the pen's blue — as they do on the product itself, where the dose selector sets the strength.",
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
      // white, so the colour belongs to the strength's carton.
      { value: 3, unit: "mg", role: "initiation", color: COLOR_TOKENS.rybelsusGreen },
      { value: 7, unit: "mg", role: "standard", color: COLOR_TOKENS.rybelsusRed },
      { value: 14, unit: "mg", role: "standard", color: COLOR_TOKENS.rybelsusBlue },
    ],
    colorScheme: {
      basis: "strength",
      source: "https://media.base44.com/images/public/6a47a256ca9a7d18b85d511f/6f743ef88_image.png",
      verified: "2026-10-08",
      status: "confirmed",
      note: "Carton colour by strength, read from the manufacturer tablet reference image: green 3 mg, red 7 mg, blue 14 mg. That image also shows lower tablet strengths (1.5 mg, 4 mg, 9 mg) that this config does not list yet.",
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
      // Six strengths, six colours, read from the manufacturer dosing chart
      // (see colorScheme.source): no two strengths share a colour.
      { value: 0.8, unit: "mg", role: "initiation", color: COLOR_TOKENS.foundayoBlue },
      { value: 2.5, unit: "mg", role: "titration_only", color: COLOR_TOKENS.foundayoOlive },
      { value: 5.5, unit: "mg", role: "standard", color: COLOR_TOKENS.foundayoPurple },
      { value: 9, unit: "mg", role: "standard", color: COLOR_TOKENS.foundayoTeal },
      { value: 14.5, unit: "mg", role: "standard", color: COLOR_TOKENS.foundayoOrange },
      { value: 17.2, unit: "mg", role: "standard", color: COLOR_TOKENS.foundayoMagenta },
    ],
    colorScheme: {
      basis: "strength",
      source: "https://media.base44.com/images/public/6a47a256ca9a7d18b85d511f/f3e9c7ed3_image.png",
      verified: "2026-10-08",
      status: "confirmed",
      note: "Step colour per strength, read from the manufacturer dosing chart image: dark blue 0.8 mg, olive green 2.5 mg, purple 5.5 mg, teal 9 mg, burnt orange 14.5 mg, magenta 17.2 mg.",
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
    brandName: "Semaglutide",
    name: "Semaglutide",
    genericName: "semaglutide",
    route: "subcutaneous",
    // Compounded products come as a vial for injection and, from some
    // pharmacies, as a capsule or tablet, so the form is asked for. Neither form
    // carries a strength list: the amount is the prescriber's own.
    forms: [
      { id: "injection", label: "Injection", route: "subcutaneous" },
      { id: "pill", label: "Pill", route: "oral_tablet" },
    ],
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
    brandName: "Tirzepatide",
    name: "Tirzepatide",
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
  // A generic name belongs to the first product that carries it, so it never
  // shadows a product listed later.
  MEDICATION_CONFIG.forEach((entry) => {
    const key = normalise(entry.genericName);
    if (key && !map[key]) map[key] = entry;
  });
  // Then every product's own names, which always resolve to that product: a
  // name can be both a product's own name and another product's generic
  // ("Semaglutide" is the compounded product and Ozempic's active ingredient).
  MEDICATION_CONFIG.forEach((entry) => {
    [entry.brandName, entry.name, ...(LEGACY_PRODUCT_NAMES[entry.id] || [])]
      .filter(Boolean)
      .forEach((name) => { map[normalise(name)] = entry; });
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
/**
 * true when the product is taken by mouth (tablet or capsule) rather than
 * injected. The stored record's own route wins when it has one, so a product
 * the person set up themselves is described by what they chose.
 */
export function isOralMedication(name, route) {
  const r = route || getMedicationConfig(name)?.route || "";
  return r === "oral_tablet" || r === "oral_capsule";
}

export function allowsAnyDose(name) {
  const entry = getMedicationConfig(name);
  if (!entry) return true;
  return !!entry.allowsAnyDose || entry.allowedDoses.length === 0;
}

// ── How a product is taken, and whether it has strengths to offer ────────────
// Both answers live here, so every list, tag and form in the app describes a
// product the same way.

/** The forms a product comes in — the pen and/or the tablet it is sold as. */
export function medicationForms(name) {
  const entry = getMedicationConfig(name);
  // Nothing known, or a product the user named themselves: no form is assumed.
  if (!entry || entry.id === "custom") return [];
  if (entry.forms?.length) return entry.forms;
  return isOralMedication(name, entry.route)
    ? [{ id: "pill", label: "Pill", route: entry.route }]
    : [{ id: "injection", label: "Injection", route: "subcutaneous" }];
}

/** The small grey tag a picker row carries: how the product is taken. */
export function medicationFormTag(name) {
  const forms = medicationForms(name);
  if (!forms.length) return "";
  return forms.length > 1 ? "Pill or injection" : forms[0].label;
}

/**
 * true when a product has no strengths to offer — a compounded or research
 * product whose dose is only ever the one the prescriber stated. These are
 * logged by typing the amount with its unit, never from a row of chips.
 */
export function isFreeDoseMedication(name) {
  const entry = getMedicationConfig(name);
  if (!entry || entry.id === "custom") return false;
  return allowsAnyDose(name);
}

/**
 * A name reduced to what a search looks at: case, the ®/™ mark, spaces and
 * hyphens are all ignored, so "bpc" finds BPC-157 and "ghk cu" finds GHK-Cu.
 */
export function medicationSearchKey(value) {
  return String(value || "").toLowerCase().replace(/[®™]/g, "").replace(/[\s\-–—_.]/g, "");
}

/** true when a search term matches a name, or any other word passed with it. */
export function matchesMedicationSearch(query, ...values) {
  const q = medicationSearchKey(query);
  if (!q) return true;
  return values.some((value) => medicationSearchKey(value).includes(q));
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

/**
 * Every strength the label lists for a product, across all of its forms: the
 * pen's list and, for a product also sold as a tablet, the tablet's. A strength
 * is only ever accepted against this — never against one form alone — so a
 * tablet strength is a real strength of the product rather than a typo.
 */
export function getAllLabelStrengths(name) {
  const entry = getMedicationConfig(name);
  if (!entry) return [];
  const values = [
    ...entry.allowedDoses,
    ...(entry.forms || []).flatMap((form) => form.doses || []),
  ].map((d) => Number(d.value));
  return [...new Set(values)].sort((a, b) => a - b);
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
  const listed = getAllLabelStrengths(name).some((v) => Math.abs(v - value) < 1e-9);
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
// ONE product list for the whole app: the Log shot picker, onboarding, the
// Add / Edit Medication form, the inventory product list and the reports all
// read it, so changing it here changes every screen at once.
//
// The order is A to Z by the product's plain name, with the ® mark and any
// hyphen ignored (so TB-500 sits between Semaglutide and Tirzepatide), and
// "Others" is always last (see CUSTOM_MEDICATION_NAME).
//
// A product that is NOT here is still defined above (Trulicity, Victoza,
// Saxenda) so anyone already logging it keeps its strengths, its interval and
// its missed-dose rule — it is simply no longer offered as a new choice, and a
// product outside this list is logged through "Others" instead.
const LISTED_IDS = [
  "bpc157",
  "cjc1295",
  "foundayo",
  "ghkcu",
  "ipamorelin",
  "mounjaro",
  "ozempic",
  "rybelsus",
  "compounded_semaglutide",
  "tb500",
  "compounded_tirzepatide",
  "wegovy",
  "zepbound",
];

/** The products the pickers offer, A to Z (the custom entry is not one of them). */
export const LISTED_MEDICATIONS = LISTED_IDS
  .map((id) => MEDICATION_CONFIG.find((e) => e.id === id))
  .filter(Boolean)
  .sort((a, b) => medicationSearchKey(a.name).localeCompare(medicationSearchKey(b.name)));

/** Medication names for the pickers, in the order above, then "Others". */
export function getMedicationPickerNames() {
  return [...LISTED_MEDICATIONS.map((e) => e.brandName), CUSTOM_MEDICATION_NAME];
}

// ── Schedule options per product ────────────────────────────────────────────
// Which frequencies a product may be taken at, and the one it starts on, each
// with the prescribing information it was checked against and the date it was
// checked. A product whose label states one schedule offers only that one, as a
// confirmed row rather than a choice; a product whose protocol varies
// (compounded strengths, unapproved peptides, "Others") offers the full set and
// starts on nothing, so nothing is assumed for it.
//
// These are the label's own schedules, never a recommendation: whatever is
// pre-filled can be changed, and Levli never moves a dose.
//
// Team to confirm the flexible set and that no default is wanted for it.
const LABEL_SOURCES = {
  ozempic: "https://www.novo-pi.com/ozempic.pdf",
  wegovy: "https://www.accessdata.fda.gov/drugsatfda_docs/label/2025/215256s024lbl.pdf",
  mounjaro: "https://pi.lilly.com/us/mounjaro-uspi.pdf",
  zepbound: "https://pi.lilly.com/us/zepbound-uspi.pdf",
  trulicity: "https://pi.lilly.com/us/trulicity-uspi.pdf",
  victoza: "https://www.novo-pi.com/victoza.pdf",
  saxenda: "https://www.accessdata.fda.gov/drugsatfda_docs/label/2023/206321s016lbl.pdf",
  rybelsus: "https://www.accessdata.fda.gov/drugsatfda_docs/label/2024/213051s018lbl.pdf",
  foundayo: "https://www.accessdata.fda.gov/drugsatfda_docs/label/2026/220934Orig1s000lbl.pdf",
};

/** Products whose label states exactly one schedule, and which one that is. */
const STATED_SCHEDULES = {
  ozempic: "weekly",
  wegovy: "weekly",
  mounjaro: "weekly",
  zepbound: "weekly",
  trulicity: "weekly",
  victoza: "daily",
  saxenda: "daily",
  rybelsus: "daily",
  foundayo: "daily",
};

const WEEKLY_ONLY = ["weekly"];
const DAILY_ONLY = ["daily"];
const FLEXIBLE_SCHEDULES = ["daily", "weekly", "twice_weekly", "every_x_days", "as_directed"];
const SCHEDULES_CHECKED = "2026-10-08";

const buildSchedule = (entry) => {
  const stated = STATED_SCHEDULES[entry.id];
  if (stated === "weekly") {
    return {
      options: WEEKLY_ONLY,
      default: "weekly",
      source: LABEL_SOURCES[entry.id] || "",
      verified: SCHEDULES_CHECKED,
      note: "The label states one dose a week, on the same day each week.",
    };
  }
  if (stated === "daily") {
    return {
      options: DAILY_ONLY,
      default: "daily",
      source: LABEL_SOURCES[entry.id] || "",
      verified: SCHEDULES_CHECKED,
      note: "The label states one dose a day.",
    };
  }
  return {
    options: FLEXIBLE_SCHEDULES,
    default: "",
    source: "",
    verified: SCHEDULES_CHECKED,
    note: "Levli holds no approved schedule for this product, so you set it yourself.",
  };
};

MEDICATION_CONFIG.forEach((entry) => { entry.schedule = buildSchedule(entry); });