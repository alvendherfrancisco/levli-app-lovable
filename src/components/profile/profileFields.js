/**
 * The field and label the Profile screen's cards are drawn with — the app's own
 * look, not the sign-in screens' tokens, so a field here is the same field the
 * rest of the app shows.
 */
export const FIELD =
  "w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white " +
  "rounded-xl px-3 py-2.5 text-base outline-none focus:border-indigo-300";

export const LABEL = "text-sm text-gray-700 dark:text-gray-300 font-medium block mb-2";

/**
 * The same field where a native date control is drawn, with the width reset every
 * date field in the app carries: a date control has an intrinsic minimum from the
 * value it prints and the picker button beside it, so it would otherwise run past
 * the card's padding. The dark colour scheme is what makes the browser paint its
 * own glyph light on a dark surface.
 */
export const DATE_FIELD = `${FIELD} max-w-full min-w-0 box-border appearance-none dark:[color-scheme:dark]`;

/** The line under a field that says what it is for, or nothing at all. */
export const HINT = "text-xs text-gray-400 dark:text-gray-500 mt-2";

/** A value the field itself could not accept. */
export const FIELD_ERROR = "text-xs text-orange-500 dark:text-orange-400 mt-2";