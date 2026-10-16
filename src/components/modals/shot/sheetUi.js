// ─────────────────────────────────────────────────────────────────────────────
// The Add Shot Log sheet's own design values, in one place.
//
// Every field, chip and label in the sheet is drawn from here, so a field
// written later lines up with the one above it: one 52px pill field (a 1px
// hairline, 16px inner padding, 16px text, left aligned), one 20px-radius
// multi-line box, one chip, one 8px gap under a label.
//
// The palette is the sheet's own and is unchanged: the app's light hairline and
// indigo in light mode, a low-opacity white on the dark surface.
// ─────────────────────────────────────────────────────────────────────────────

// A label above its field: one size, medium weight, the sheet's normal text.
export const SHEET_LABEL_TEXT = "text-sm font-medium text-gray-900 dark:text-[#E8E9F0]";
export const SHEET_LABEL = `${SHEET_LABEL_TEXT} mb-2 block`;
// The label and whatever sits level with it on the right (a unit, a value).
export const SHEET_LABEL_ROW = "flex items-baseline justify-between gap-2 mb-2";
// The unit beside a label, and any other small grey word: never bold.
export const SHEET_HINT = "text-xs text-gray-400 dark:text-gray-500";

// The field's build, without its padding, so a field that carries a mark on the
// left can set its own padding instead of fighting one already there.
const FIELD =
  "w-full max-w-full min-w-0 box-border appearance-none h-[52px] rounded-full border border-gray-200 bg-white " +
  "text-[16px] leading-tight text-gray-900 outline-none transition-colors placeholder:text-gray-400 " +
  "dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-[#E8E9F0] dark:placeholder:text-gray-500 " +
  "focus:border-indigo-300";

// Every field in the sheet: the same height, the same pill, one fill.
export const SHEET_FIELD = `${FIELD} px-4`;
// A field the app draws its own mark in on the right (a dropdown's chevron), so
// the value never runs underneath it. The dark-mode colour scheme is what makes
// a dropdown's own list dark on a dark surface.
export const SHEET_FIELD_SELECT = `${FIELD} pl-4 pr-11 dark:[color-scheme:dark]`;
// A date or time field: the same field with room for its own mark on the left.
// The dark-mode colour scheme is what makes the browser paint a time field's own
// glyph light on a dark surface.
export const SHEET_DATE_FIELD = `${FIELD} pl-4 pr-3 text-left dark:[color-scheme:dark]`;
export const SHEET_DATE_FIELD_MARK = `${FIELD} pl-10 pr-3 text-left dark:[color-scheme:dark]`;

// The multi-line field: the same border and fill, a 20px radius, and enough
// height that it reads as a box rather than a line.
export const SHEET_TEXTAREA =
  "w-full max-w-full min-w-0 min-h-[96px] rounded-[20px] border border-gray-200 bg-white px-4 py-3 " +
  "text-[16px] leading-snug text-gray-900 outline-none transition-colors resize-none placeholder:text-gray-400 " +
  "dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-[#E8E9F0] dark:placeholder:text-gray-500 " +
  "focus:border-indigo-300";

// A chip: as tall as a field, a pill, wrapping onto the next row when the row is
// full. The width is never set, so the gaps between chips stay equal.
export const SHEET_CHIP =
  "inline-flex min-h-[52px] shrink-0 items-center justify-center gap-2 rounded-full px-4 text-[16px] font-medium transition-colors active:scale-[0.98]";
export const SHEET_CHIP_OFF =
  "border border-gray-200 bg-white text-gray-700 dark:border-white/[0.12] dark:bg-white/[0.05] dark:text-[#E8E9F0]";
// The same chip a step smaller, for a short choice inside a panel (a number of
// weeks) rather than a field's own row.
export const SHEET_CHIP_SM =
  "inline-flex min-h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-full px-3.5 text-sm font-medium transition-colors active:scale-[0.98]";
// Chosen: a light indigo fill, a thin indigo hairline, indigo words. Never a
// solid fill and never a thick outline.
export const SHEET_CHIP_ON =
  "border-[1.5px] border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-500/40 dark:bg-indigo-500/20 dark:text-indigo-300";

// A thin divider between the form and the section that follows it.
export const SHEET_DIVIDER = "border-t border-gray-100 dark:border-white/[0.08]";

// A block inside the sheet (a notice, a summary line).
export const SHEET_BLOCK = "rounded-2xl border border-gray-100 dark:border-white/[0.08] px-3.5 py-3";