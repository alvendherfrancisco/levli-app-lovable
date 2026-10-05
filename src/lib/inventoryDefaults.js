// ── Inventory defaults ─────────────────────────────────────────────────────
// What the Add / Edit Product form can pre-fill by itself: the unit a quantity
// is counted in, and the beyond-use ("in-use") period a label states once the
// product is opened. Both live here, so the modal never hard-codes them and
// every suggested value comes from one place.

import { fromDayKey, toDayKey } from "@/lib/dateUtils";
import { getMedicationConfig } from "@/lib/medicationConfig";
import { getEntry } from "@/lib/medicationCatalogue";
import { getPrimaryRoute, isCompoundedGeneric } from "@/lib/medicationData";

/** Units a quantity can be counted in. */
export const QUANTITY_UNITS = ["doses", "tablets", "mg", "mL", "units", "pens", "vials"];

/** Amounts offered as one-tap chips in the quantity field. */
export const QUANTITY_AMOUNTS = [1, 2, 4, 6, 12];

/** Places a product is kept in, offered as chips. */
export const STORAGE_OPTIONS = ["Refrigerator", "Room temperature", "Travel case"];

/** Days-before-expiry choices. */
export const EXPIRY_WARNING_OPTIONS = [7, 14, 30];

/** Status choices when editing. Stored values: active, depleted, archived. */
export const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "depleted", label: "Used up" },
  { value: "archived", label: "Discarded" },
];

/** A stored status the three choices above do not cover (legacy records). */
const STATUS_EXTRA_LABELS = { expired: "Expired" };

/** The status choices, keeping whatever the record already holds selectable. */
export function statusOptionsFor(current) {
  const extra = STATUS_EXTRA_LABELS[current];
  return extra ? [...STATUS_OPTIONS, { value: current, label: extra }] : STATUS_OPTIONS;
}

/**
 * The generic active ingredient shown under a product's brand name. Empty when
 * it would only repeat the name itself (compounded and generic entries).
 */
export function genericNameFor(name) {
  const trimmed = String(name || "").trim();
  if (!trimmed) return "";
  const generic = getMedicationConfig(trimmed)?.genericName || getEntry(trimmed)?.generic_name || "";
  return generic.toLowerCase() === trimmed.toLowerCase() ? "" : generic;
}

/**
 * The unit a product's quantity is counted in: tablets for an oral product,
 * mg for a compounded / generic one (its dose is the measure), doses otherwise.
 */
export function defaultQuantityUnit(name) {
  const trimmed = String(name || "").trim();
  if (!trimmed) return "doses";
  if (isCompoundedGeneric(trimmed)) return "mg";
  const route = getPrimaryRoute(trimmed);
  if (route === "oral_tablet" || route === "oral_capsule" || route === "buccal_sublingual") return "tablets";
  return "doses";
}

/**
 * Beyond-use periods, in days after the product is opened, as stated in the
 * product's own information. Only products whose label gives a figure are
 * listed here: anything missing leaves the in-use expiry empty rather than
 * guessing, and the field is always editable whatever is suggested.
 */
const IN_USE_DAYS = {
  "Ozempic®": 56,
  "Mounjaro®": 30,
  "Victoza®": 30,
  "Saxenda®": 30,
};

/** The label's in-use period for a product, or null when it states none. */
export function inUsePeriodDays(name) {
  const trimmed = String(name || "").trim();
  if (!trimmed) return null;
  const key = Object.keys(IN_USE_DAYS).find((k) => k.toLowerCase() === trimmed.toLowerCase());
  return key ? IN_USE_DAYS[key] : null;
}

/**
 * The opened date plus the label's in-use period, as a YYYY-MM-DD key. Empty
 * when either the opened date or the label's period is missing.
 */
export function suggestedInUseExpiry(name, openedDate) {
  const days = inUsePeriodDays(name);
  if (!days || !openedDate) return "";
  const date = fromDayKey(openedDate);
  if (!date) return "";
  date.setDate(date.getDate() + days);
  return toDayKey(date);
}