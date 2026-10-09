// ─────────────────────────────────────────────────────────────────────────────
// The one field and label style the account screens draw.
//
// Creating an account and signing in are the same form read twice, so the field
// is defined once here: a 48pt input, softly rounded, with a hairline border and
// the field's own mark in a fixed slot on the left. Both screens import it, so
// the two can never drift apart.
// ─────────────────────────────────────────────────────────────────────────────

export const FIELD =
  "h-12 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-4 text-[16px] text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-indigo-500";

export const LABEL = "mb-2 block text-sm font-medium text-gray-900";