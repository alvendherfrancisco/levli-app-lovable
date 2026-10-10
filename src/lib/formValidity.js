// ─────────────────────────────────────────────────────────────────────────────
// One rule for "is there anything here to save yet".
//
// Every form in the app asks the same question before its primary action may
// run: has the person actually put something in? These predicates are that
// question, in one place, so a number field, a selection, a photo and a text
// field are judged the same way and no form invents a rule of its own.
//
// The distinction that matters: a value the app pre-filled (a date, a time, a
// unit) is not input, while a value the person typed or chose is. A form
// holding nothing but defaults is therefore not valid yet.
// ─────────────────────────────────────────────────────────────────────────────

/** Empty, whitespace-only, or missing. */
export const isBlank = (value) => value == null || String(value).trim() === "";

/** The number a field holds, or null when it holds no usable number. */
export function toNumber(value) {
  if (value == null) return null;
  const n = typeof value === "number" ? value : parseFloat(String(value).trim());
  return Number.isFinite(n) ? n : null;
}

/** A real positive amount — weight, dose, exercise minutes, quantity. */
export const isAboveZero = (value) => {
  const n = toNumber(value);
  return n != null && n > 0;
};

/** A number at or under the ceiling an entry can plausibly reach. */
export const isWithinMax = (value, max) => {
  const n = toNumber(value);
  return n == null || n <= max;
};

/** At least one field holds a value above zero — nutrition's own rule: a row of
 *  zeros is not data. */
export const anyAboveZero = (values = {}) => Object.values(values).some(isAboveZero);

/** A stable serialisation, so two option objects holding the same content
 *  compare equal whatever order their keys were built in. */
function stable(value) {
  if (value == null) return "null";
  if (typeof value !== "object") return String(value).trim();
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  return `{${Object.keys(value).sort().map((k) => `${k}:${stable(value[k])}`).join(",")}}`;
}

/** Two values that mean the same thing, whatever their type ("0.0" vs 0) — a
 *  schedule held as an option object included. */
function same(a, b) {
  const emptyA = a == null || (typeof a !== "object" && String(a).trim() === "");
  const emptyB = b == null || (typeof b !== "object" && String(b).trim() === "");
  if (emptyA || emptyB) return emptyA && emptyB;
  if (typeof a === "object" || typeof b === "object") return stable(a) === stable(b);
  if (typeof a === "boolean" || typeof b === "boolean") return a === b;
  const na = toNumber(a);
  const nb = toNumber(b);
  if (na != null && nb != null) return na === nb;
  return String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
}

/**
 * True when something has actually changed from what was saved — the rule for
 * editing: an untouched entry has nothing to save, so the button stays dimmed
 * until the person changes something.
 */
export function hasChanged(current = {}, saved = {}) {
  const keys = new Set([...Object.keys(current), ...Object.keys(saved)]);
  for (const key of keys) if (!same(current[key], saved[key])) return true;
  return false;
}