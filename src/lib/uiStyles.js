// ─────────────────────────────────────────────────────────────────────────────
// The onboarding and account design tokens.
//
// Every onboarding screen, and both account screens, draw from this one set of
// values, so a heading, a card, a field, a chip or the primary button is the
// same thing on every screen and can never drift from the next one. Nothing
// here is screen-specific: change a value once and every screen follows.
//
// The colours are the theme tokens in src/lib/authStyles.js (which read the
// --auth-* values in src/index.css), so every screen here follows the device's
// light/dark setting together and nothing on them is ever drawn in a fixed
// white, grey or black. Light mode is exactly the look these screens have
// always had; the tokens are what make them dark when the device is.
//
// The two reference screens are "Create your account" and "Let's set your dose
// schedule"; the values below are theirs.
//
// Spacing uses one scale only: 4, 8, 12, 16, 24, 32px.
// ─────────────────────────────────────────────────────────────────────────────
import {
  AUTH_CARD, AUTH_DIVIDE, AUTH_FIELD, AUTH_FIELD_EYE, AUTH_FIELD_MARK,
  AUTH_HEADING, AUTH_LABEL_TEXT, AUTH_LINK, AUTH_LINK_UNDERLINE, AUTH_NOTICE,
} from "@/lib/authStyles";

// ── Page frame ───────────────────────────────────────────────────────────────
// Side margins are a flat 20px on every screen; nothing reaches past them.
export const HEAD_BLOCK = "text-center mb-4"; // 16px under the heading block
export const CARD = AUTH_CARD;
// A card whose own rows draw the padding, so they can run the full width.
export const CARD_FLUSH = "rounded-2xl border border-auth-border bg-auth-card shadow-sm dark:shadow-none";
export const CARD_GAP = "mb-3"; // 12px between stacked cards
export const STACK = "space-y-4"; // 16px between sections inside a card
// The hairline between two rows in a card.
export const DIVIDE_ROWS = AUTH_DIVIDE;

// ── Type ─────────────────────────────────────────────────────────────────────
export const HEADING = AUTH_HEADING;
export const SUBTITLE = "text-[15px] leading-relaxed text-auth-muted";
// A label's own text: one size, medium weight, primary text. Used above a field
// and inline beside one (the dose chips, a segmented row).
export const LABEL_TEXT = AUTH_LABEL_TEXT;
// A field label sitting above its field.
export const LABEL = `${LABEL_TEXT} mb-2 block`;
export const LIST_TEXT = "text-[16px] font-medium text-auth-text";
export const LIST_VALUE = "text-[15px] leading-snug text-auth-muted";
export const HELP_IN_CARD = "text-[12.5px] leading-snug text-auth-muted"; // left aligned, inside a card
export const HELP_ON_SCREEN = "text-center text-[12.5px] leading-relaxed text-auth-muted"; // outside a card
export const LINK = AUTH_LINK;
export const LINK_UNDERLINE = AUTH_LINK_UNDERLINE;
// The indigo accent wherever it is not a link: an icon in a circle, the tick on
// a chosen chip, a word that carries the chosen state.
export const ACCENT_TEXT = "text-auth-link";
// A field's own validation message, directly under that field. Red stays red —
// it only lifts a step on a dark surface so it stays readable there.
export const ERROR_TEXT = "text-[13px] leading-snug text-red-600 dark:text-red-400";

// ── Fields: one height, one pill, one hairline, one placeholder ───────────────
// A mark in the field's left slot (mail, lock, calendar, clock).
export const FIELD_ICON = `${AUTH_FIELD} pl-10 pr-4`;
// No mark: the amount, the interval.
export const FIELD_PLAIN = `${AUTH_FIELD} px-4`;
// A unit or a time written on the right of the field.
export const FIELD_TRAILING = `${AUTH_FIELD} pl-4 pr-16`;
// The account screens' own field.
export const FIELD = FIELD_ICON;
// The mark itself, in that fixed left slot.
export const FIELD_MARK = AUTH_FIELD_MARK;
// The eye that reveals a password: its own 44pt target in the field's right slot.
export const FIELD_EYE = AUTH_FIELD_EYE;

// ── Chips and the circles that carry a state ─────────────────────────────────
export const CHIP =
  "inline-flex h-11 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-4 text-[16px] font-medium transition-colors active:scale-[0.98]";
// The same chip for a label long enough to need a second line on a narrow
// phone. Same height, same pill, same text; it simply wraps instead of pushing
// past the screen's margin.
export const CHIP_WRAP =
  "inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-full px-4 py-2 text-center text-[16px] font-medium transition-colors active:scale-[0.98]";
export const CHIP_IDLE = "border border-auth-border bg-auth-card text-auth-text hover:border-auth-hover";
// Selected, everywhere: a light indigo fill on a light screen and a dark
// indigo-tinted one on a dark screen, a hairline indigo border and the indigo
// accent for the text and the tick. Never a solid dark fill and never a thick
// outline.
export const CHIP_ON = "border border-auth-tint-border bg-auth-tint text-auth-link";
export const ICON_CIRCLE = "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-auth-tint";
// The same circle where it stands alone as a screen's own mark: the slot the
// illustrations take on the other steps, holding a single centred icon.
export const ICON_CIRCLE_LG = "flex h-[72px] w-[72px] flex-shrink-0 items-center justify-center rounded-full bg-auth-tint";
export const CHECK_CIRCLE =
  "flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors";
export const CHECK_CIRCLE_OFF = "border-auth-border-strong";
export const CHECK_CIRCLE_ON = "border-primary bg-primary text-primary-foreground";

// ── Notices and the two buttons ──────────────────────────────────────────────
// What needs attention, in the amber that reads on either surface.
export const NOTICE = AUTH_NOTICE;
// What worked, in the same shape.
export const NOTICE_OK =
  "w-full rounded-xl border border-auth-ok-border bg-auth-ok px-3 py-2 text-center text-[13px] leading-snug text-auth-ok-text";
export const PRIMARY_BTN = "onb-cta-btn w-full rounded-full text-base font-semibold transition-all duration-300 active:scale-95 sm:text-lg";
export const PRIMARY_BTN_ON = "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-700";
// Disabled is faded indigo, never grey.
export const PRIMARY_BTN_OFF = "cursor-not-allowed bg-indigo-300 text-white shadow-none";