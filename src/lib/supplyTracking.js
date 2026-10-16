// ── Supply tracking ─────────────────────────────────────────────────────────
// How much of a medication is left, when it expires and which lot it came from
// are kept on the medication itself. The Stock screen these numbers used to
// live on is gone (its rows were moved onto the matching medication — see the
// one-time move in src/lib/AppState.jsx), and this file is the one place that
// reads them: what a count is measured in, how it is worded, and the single
// reminder it raises.
//
// Nothing here decides anything about the product. An expired count is a date,
// not a verdict, and the wording points at the pharmacist.

import { calendarDaysBetween, todayKey } from "@/lib/dateUtils";
import { getPrimaryRoute, isCompoundedGeneric } from "@/lib/medicationData";

/** Units a supply is counted in. */
export const SUPPLY_UNITS = ["doses", "tablets", "pens", "vials", "mL", "mg", "units"];

/** Counting down to this many (or fewer) is what "time to reorder" means. */
export const LOW_SUPPLY_DOSES = 2;

/** How near an expiry date has to be to be raised. */
export const EXPIRY_SOON_DAYS = 14;

/** The one line an expiry reminder carries, whatever the date says. */
export const CHECK_PHARMACIST = "Check the expiry date with your pharmacist.";

/** The unit a product's supply is most likely counted in. */
export function defaultSupplyUnit(name) {
  const trimmed = String(name || "").trim();
  if (!trimmed) return "doses";
  if (isCompoundedGeneric(trimmed)) return "mg";
  const route = getPrimaryRoute(trimmed);
  if (route === "oral_tablet" || route === "oral_capsule" || route === "buccal_sublingual") return "tablets";
  return "doses";
}

/** A stored unit, kept when the list offers it and replaced when it does not. */
export const supplyUnitOr = (unit, name) =>
  SUPPLY_UNITS.includes(unit) ? unit : defaultSupplyUnit(name);

/** "4 doses left" / "1 tablet left" — a count as a sentence fragment. */
export function supplyLeftLabel(count, unit) {
  const n = Number(count);
  if (!Number.isFinite(n)) return "";
  const word = String(unit || "doses");
  return `${n} ${n === 1 ? word.replace(/s$/, "") : word} left`;
}

/** The count a medication is showing, or "" when it has none to show. */
export function supplyLeftText(medication) {
  if (!medication?.track_supply) return "";
  const raw = medication.doses_left;
  if (raw === null || raw === undefined || raw === "") return "";
  return supplyLeftLabel(raw, medication.supply_unit);
}

/**
 * The one reminder a medication is raising, or null.
 *
 * Expiry is asked about before the count: a date is a fact about the product,
 * while a low count is only a note to reorder. A medication that is no longer
 * running raises nothing at all.
 */
export function supplyAlert(medication, today = todayKey()) {
  if (!medication?.track_supply) return null;
  if (medication.status && medication.status !== "active") return null;

  const expiry = medication.supply_expiry_date || "";
  if (expiry) {
    const days = calendarDaysBetween(today, expiry);
    if (days < 0) {
      return { kind: "expired", title: "Expired", detail: CHECK_PHARMACIST, signature: `expired:${expiry}` };
    }
    if (days <= EXPIRY_SOON_DAYS) {
      return {
        kind: "expiring",
        title: days === 0 ? "Expires today" : `Expires in ${days} day${days === 1 ? "" : "s"}`,
        detail: CHECK_PHARMACIST,
        signature: `expiring:${expiry}`,
      };
    }
  }

  const left = Number(medication.doses_left);
  const text = supplyLeftText(medication);
  if (text && Number.isFinite(left) && left <= LOW_SUPPLY_DOSES) {
    return {
      kind: "low",
      title: `${text}, time to reorder`,
      detail: "The count goes down by one each time you log a dose.",
      signature: `low:${left}`,
    };
  }
  return null;
}

/**
 * The reminders still to be raised, worst first, one per medication. An alert
 * the user dismissed stays away until what it says changes — a count that moves
 * or a different date brings it back.
 */
export function supplyAlerts(medications = [], today = todayKey()) {
  const order = { expired: 0, expiring: 1, low: 2 };
  return medications
    .map((medication) => {
      const alert = supplyAlert(medication, today);
      if (!alert || medication.supply_alert_dismissed === alert.signature) return null;
      return { medication, ...alert };
    })
    .filter(Boolean)
    .sort((a, b) => order[a.kind] - order[b.kind]);
}