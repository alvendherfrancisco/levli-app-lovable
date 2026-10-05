// ─────────────────────────────────────────────────────────────────────────────
// OPTION GROUPS — the one "tap again to clear" rule, in one place.
//
// Optional single-select fields can be cleared by tapping the selected option
// again (or with the Clear control beside the label). Required fields cannot:
// the tap does nothing, and only another option changes the value. Every form
// reads this rule from here rather than repeating it.
// ─────────────────────────────────────────────────────────────────────────────

/** A value counts as set when it is neither null, undefined nor empty. */
export const isSet = (value) => value !== null && value !== undefined && value !== "";

/**
 * Whether a tap on `option` has to be refused: the field is required and the
 * option is already the value, so there is nothing left to choose.
 */
export const isBlockedClear = (value, option, { required = false } = {}) =>
  !!required && value === option;

/**
 * The value a single-select group holds after `option` is tapped.
 *  - a different option → that option
 *  - the selected option → null (cleared), unless the field is required
 */
export function nextSingle(value, option, { required = false } = {}) {
  if (value !== option) return option;
  return required ? value : null;
}