/**
 * The official prescribing information the app's dosing and half-life figures
 * come from. Every entry links to the regulator's own page so a reader can
 * check the source; no third-party summaries are used.
 */
export const MEDICAL_INFO_LAST_REVIEWED = "2026-10-05";

const EMA = (slug) => `https://www.ema.europa.eu/en/medicines/human/EPAR/${slug}`;
// The FDA label search page — stable entry point for US product information.
const FDA_LABELS = "https://www.accessdata.fda.gov/scripts/cder/daf/";

export const MEDICAL_SOURCES = [
  { product: "Ozempic® (semaglutide)", regulator: "European Medicines Agency", url: EMA("ozempic") },
  { product: "Wegovy® (semaglutide)", regulator: "European Medicines Agency", url: EMA("wegovy") },
  { product: "Rybelsus® (semaglutide)", regulator: "European Medicines Agency", url: EMA("rybelsus") },
  { product: "Mounjaro® (tirzepatide)", regulator: "European Medicines Agency", url: EMA("mounjaro") },
  { product: "Saxenda® (liraglutide)", regulator: "European Medicines Agency", url: EMA("saxenda") },
  { product: "Zepbound® (tirzepatide)", regulator: "US Food and Drug Administration", url: FDA_LABELS },
];

export const REPORTING_SYSTEMS = [
  { label: "UK — MHRA Yellow Card", url: "https://yellowcard.mhra.gov.uk/" },
  { label: "US — FDA MedWatch", url: "https://www.fda.gov/safety/medwatch-fda-safety-information-and-adverse-event-reporting-program" },
];