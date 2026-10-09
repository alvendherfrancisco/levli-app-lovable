// ─────────────────────────────────────────────────────────────────────────────
// The onboarding and account design tokens.
//
// Every onboarding screen, and both account screens, draw from this one set of
// values, so a heading, a card, a field, a chip or the primary button is the
// same thing on every screen and can never drift from the next one. Nothing
// here is screen-specific: change a value once and every screen follows.
//
// The two reference screens are "Create your account" and "Let's set your dose
// schedule"; the values below are theirs.
//
// Spacing uses one scale only: 4, 8, 12, 16, 24, 32px.
// ─────────────────────────────────────────────────────────────────────────────

// ── Page frame ───────────────────────────────────────────────────────────────
// Side margins are a flat 20px on every screen; nothing reaches past them.
export const HEAD_BLOCK = "text-center mb-4"; // 16px under the heading block
export const CARD = "rounded-2xl border border-gray-200 bg-white p-5 shadow-sm";
// A card whose own rows draw the padding, so they can run the full width.
export const CARD_FLUSH = "rounded-2xl border border-gray-200 bg-white shadow-sm";
export const CARD_GAP = "mb-3"; // 12px between stacked cards
export const STACK = "space-y-4"; // 16px between sections inside a card

// ── Type ─────────────────────────────────────────────────────────────────────
export const HEADING = "text-[24px] sm:text-[28px] font-bold leading-tight text-gray-800";
export const SUBTITLE = "text-[15px] leading-relaxed text-gray-500";
// A label's own text: one size, medium weight, dark text. Used above a field
// and inline beside one (the dose chips, a segmented row).
export const LABEL_TEXT = "text-sm font-medium text-gray-900";
// A field label sitting above its field.
export const LABEL = `${LABEL_TEXT} mb-2 block`;
export const LIST_TEXT = "text-[16px] font-medium text-gray-900";
export const LIST_VALUE = "text-[15px] leading-snug text-gray-500";
export const HELP_IN_CARD = "text-[12.5px] leading-snug text-gray-500"; // left aligned, inside a card
export const HELP_ON_SCREEN = "text-center text-[12.5px] leading-relaxed text-gray-500"; // outside a card
export const LINK = "font-medium text-indigo-600 hover:underline";
export const LINK_UNDERLINE = "text-indigo-600 underline";
// A field's own validation message, directly under that field.
export const ERROR_TEXT = "text-[13px] leading-snug text-red-600";

// ── Fields: one height, one pill, one hairline, one placeholder ───────────────
const FIELD_BASE =
  "h-12 w-full rounded-full border border-gray-200 bg-white text-[16px] text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-indigo-500";
// A mark in the field's left slot (mail, lock, calendar, clock).
export const FIELD_ICON = `${FIELD_BASE} pl-10 pr-4`;
// No mark: the amount, the interval.
export const FIELD_PLAIN = `${FIELD_BASE} px-4`;
// A unit or a time written on the right of the field.
export const FIELD_TRAILING = `${FIELD_BASE} pl-4 pr-16`;
// The account screens' own field.
export const FIELD = FIELD_ICON;
// The mark itself, in that fixed left slot.
export const FIELD_MARK = "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400";

// ── Chips and the circles that carry a state ─────────────────────────────────
export const CHIP =
  "inline-flex h-11 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-4 text-[16px] font-medium transition-colors active:scale-[0.98]";
// The same chip for a label long enough to need a second line on a narrow
// phone. Same height, same pill, same text; it simply wraps instead of pushing
// past the screen's margin.
export const CHIP_WRAP =
  "inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-full px-4 py-2 text-center text-[16px] font-medium transition-colors active:scale-[0.98]";
export const CHIP_IDLE = "border border-gray-200 bg-white text-gray-900 hover:border-gray-300";
// Selected, everywhere: a light indigo fill, a hairline indigo border, indigo
// text. Never a solid dark fill and never a thick outline.
export const CHIP_ON = "border border-indigo-500 bg-indigo-50 text-indigo-700";
export const ICON_CIRCLE = "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-50";
export const CHECK_CIRCLE =
  "flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors";
export const CHECK_CIRCLE_OFF = "border-gray-300";
export const CHECK_CIRCLE_ON = "border-primary bg-primary text-primary-foreground";

// ── Notices and the two buttons ──────────────────────────────────────────────
export const NOTICE =
  "w-full rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-center text-[13px] leading-snug text-amber-800";
export const PRIMARY_BTN = "onb-cta-btn w-full rounded-full text-base font-semibold transition-all duration-300 active:scale-95 sm:text-lg";
export const PRIMARY_BTN_ON = "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-700";
// Disabled is faded indigo, never grey.
export const PRIMARY_BTN_OFF = "cursor-not-allowed bg-indigo-300 text-white shadow-none";