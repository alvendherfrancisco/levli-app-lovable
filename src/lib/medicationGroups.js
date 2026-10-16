// ─────────────────────────────────────────────────────────────────────────────
// THE ADD MEDICATION QUICK-PICK — which products the grouped list offers, in the
// order it offers them, and the one-line facts shown once one is chosen.
//
// Everything here is derived from the central config (src/lib/medicationConfig.js)
// and the form table (src/lib/medicationForm.js) and never copied from them: a
// product added to the catalogue, renamed, or given a new strength appears in the
// list and in the facts with no further edit. Only the ORDER of the short default
// list is written down here, because that is a presentation choice.
//
// The default view is short on purpose — the products people start on. Searching
// reaches the whole catalogue, so the other GLP-1 products it carries (Victoza®,
// Saxenda®, Trulicity®) are found by typing and no supported product is ever out
// of reach.
// ─────────────────────────────────────────────────────────────────────────────
import {
  CUSTOM_MEDICATION_NAME, LISTED_MEDICATIONS, describeAllowedDoses, matchesMedicationSearch,
} from "@/lib/medicationConfig";
import { FORM_INJECTION, FORM_PILL, medicationFormChoice } from "@/lib/medicationForm";
import { labelledSchedule } from "@/lib/medicationRegimen";
import { isGlp1Gip } from "@/lib/medicationSchedule";

/** The order the GLP-1 group lists its start-on products in. */
const GLP1_FIRST_IDS = [
  "mounjaro", "zepbound", "ozempic", "wegovy", "rybelsus", "foundayo",
  "compounded_semaglutide", "compounded_tirzepatide",
];

/** The catalogue, without the "type your own name" row — that is not a product. */
const CATALOGUE = LISTED_MEDICATIONS.filter((e) => e.brandName !== CUSTOM_MEDICATION_NAME);

/** A research peptide: no generic name and no route, so nothing is known of it. */
const isPeptide = (entry) => !entry.genericName && !entry.route;

const FORM_WORD = { [FORM_INJECTION]: "Injection", [FORM_PILL]: "Oral" };

/** How a product is taken: "Injection", "Oral", or "Injection or oral". */
export function medicationType(name) {
  const { options, default: single } = medicationFormChoice(name);
  if (options.length > 1) return "Injection or oral";
  return FORM_WORD[single] || "";
}

/** The schedule the product's label states, e.g. "Once weekly" ("" when none). */
function usualSchedule(name) {
  return labelledSchedule(name);
}

/**
 * What is known about a chosen product — how it is taken, its usual schedule and
 * the strengths its label lists — or null for a name Levli holds nothing for.
 */
export function medicationFacts(name) {
  const entry = CATALOGUE.find((e) => e.brandName === name);
  if (!entry) return null;
  return {
    type: medicationType(name),
    schedule: usualSchedule(name),
    strengths: describeAllowedDoses(name),
  };
}

/** One row of the list: the name shown and stored, its generic, its type tag. */
function row(entry) {
  return {
    key: entry.id,
    value: entry.brandName,
    name: entry.brandName,
    generic: entry.genericName || "",
    tag: medicationType(entry.brandName),
  };
}

/**
 * The two grouped lists, narrowed by what has been typed. With no search the
 * GLP-1 group shows the short default list; with one it searches the whole
 * catalogue, so every product the app supports can be found by typing.
 */
export function medicationGroups(query = "") {
  const searching = !!String(query).trim();
  const matches = (entry) =>
    !searching || matchesMedicationSearch(query, entry.brandName, entry.genericName || "", entry.id);

  const glp1 = (searching
    ? CATALOGUE.filter((e) => isGlp1Gip(e.brandName))
    : GLP1_FIRST_IDS.map((id) => CATALOGUE.find((e) => e.id === id)).filter(Boolean)
  ).filter(matches);

  return {
    glp1: glp1.map(row),
    peptides: CATALOGUE.filter(isPeptide).filter(matches).map(row),
  };
}