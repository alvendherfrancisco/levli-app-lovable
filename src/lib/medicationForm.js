// ─────────────────────────────────────────────────────────────────────────────
// HOW A MEDICATION IS LOGGED — the ONE place the form is decided.
//
// The form decides what the log sheet asks for and how it words itself: an
// injection is a shot with a site, a tablet is a dose. It also decides which
// strengths are offered, because the same product can be sold as a pen and as a
// tablet and the two carry different strengths (see src/lib/medicationConfig.js,
// where each form's own list lives).
//
// The table below is the single answer to "how does this product come?", so a
// product can never be a pill on one screen and an injection on the next. Update
// it — and the strengths the form carries in the central config — when an
// approval or a product's forms change.
// ─────────────────────────────────────────────────────────────────────────────

import { CUSTOM_MEDICATION_NAME, getMedicationConfig, isOralMedication } from "@/lib/medicationConfig";

/** The forms a product can be logged as. */
export const FORM_INJECTION = "injection";
export const FORM_PILL = "pill";
export const FORM_OTHER = "other";

/** The route each form logs as. "Other" carries none: its route is the user's. */
export const FORM_ROUTES = {
  [FORM_INJECTION]: "subcutaneous",
  [FORM_PILL]: "oral_tablet",
  [FORM_OTHER]: "",
};

/** The name each form is offered under. */
export const FORM_LABELS = {
  [FORM_INJECTION]: "Injection",
  [FORM_PILL]: "Pill",
  [FORM_OTHER]: "Other",
};

/** The routes that count as an injection, and as a tablet or capsule. */
export const INJECTION_ROUTES = ["subcutaneous", "intramuscular", "intradermal"];
export const ORAL_ROUTES = ["oral_tablet", "oral_capsule"];

// ONE table, keyed by the product's id in the central config.
//   "injection" | "pill"  sold in that one form: the form is set silently and no
//                         Form choice is shown.
//   "both"                sold as an injection and as a tablet: the Form choice
//                         is shown, starting on the form last used for it.
//   "choice"              nothing is known about it (a product the user names):
//                         every form is offered.
// A product that is not listed keeps the reading the app has always used, taken
// from the route on its own record, so nothing already logged changes meaning.
const FORM_BY_ID = {
  // Injections only — the pen, the syringe or the vial is how they come.
  bpc157: FORM_INJECTION,
  cjc1295: FORM_INJECTION,
  ghkcu: FORM_INJECTION,
  ipamorelin: FORM_INJECTION,
  mounjaro: FORM_INJECTION,
  saxenda: FORM_INJECTION,
  tb500: FORM_INJECTION,
  trulicity: FORM_INJECTION,
  victoza: FORM_INJECTION,
  zepbound: FORM_INJECTION,
  compounded_tirzepatide: FORM_INJECTION,
  // Tablets only.
  foundayo: FORM_PILL,
  rybelsus: FORM_PILL,
  // Sold as both, so the form is asked for.
  wegovy: "both",
  ozempic: "both",
  compounded_semaglutide: "both",
  // A product the user names themselves.
  custom: "choice",
};

/** The table entry for a medication, or "" when nothing is recorded for it. */
function formKind(name, custom = false) {
  if (custom || name === CUSTOM_MEDICATION_NAME) return "choice";
  const entry = getMedicationConfig(name);
  if (!entry) return "";
  return FORM_BY_ID[entry.id] || "";
}

/** The form a stored route belongs to. */
export function formForRoute(route) {
  if (!route) return "";
  if (ORAL_ROUTES.includes(route)) return FORM_PILL;
  if (INJECTION_ROUTES.includes(route)) return FORM_INJECTION;
  return FORM_OTHER;
}

/** The form last logged for a medication, or "" when it has never been logged. */
export function lastUsedForm(name, shots = []) {
  const shot = shots.find((s) => s.medication === name && s.route);
  return shot ? formForRoute(shot.route) : "";
}

/**
 * What a log offers for a medication: the forms to choose between (empty when
 * the product comes in only one) and the one it starts on. A product sold in two
 * forms starts on the form last used for it, or Injection when it has never been
 * logged. Anything with no history at all leaves the form unset, and the route on
 * the record decides — exactly as the app has always read it.
 */
export function medicationFormChoice(name, { custom = false, shots = [] } = {}) {
  const kind = formKind(name, custom);
  if (kind === "both") {
    return { options: [FORM_INJECTION, FORM_PILL], default: lastUsedForm(name, shots) || FORM_INJECTION };
  }
  if (kind === "choice") {
    return {
      options: [FORM_INJECTION, FORM_PILL, FORM_OTHER],
      default: lastUsedForm(name, shots) || FORM_INJECTION,
    };
  }
  return { options: [], default: kind };
}

/** The form's own route, or "" when the form does not fix one. */
export function formRoute(form) {
  return FORM_ROUTES[form] || "";
}

/** The name a form is offered under. */
export function formLabel(form) {
  return FORM_LABELS[form] || "";
}

/**
 * Whether this medication is logged as a dose rather than a shot: a tablet is a
 * dose, an injection is a shot, and a product sold as both follows the form in
 * use. A product with nothing recorded for it falls back to the route on its own
 * record — the reading every screen already made.
 */
export function logsAsDose(name, { route = "", shots = [], custom = false } = {}) {
  const kind = formKind(name, custom);
  if (kind === FORM_PILL) return true;
  if (kind === FORM_INJECTION) return false;
  if (kind) {
    const used = lastUsedForm(name, shots) || formForRoute(route);
    if (used) return used !== FORM_INJECTION;
  }
  return isOralMedication(name, route);
}

/** The nouns for what is logged: "shot"/"shots" or "dose"/"doses". */
export function logWords(name, options) {
  return logsAsDose(name, options)
    ? { one: "dose", many: "doses", One: "Dose", Many: "Doses" }
    : { one: "shot", many: "shots", One: "Shot", Many: "Shots" };
}