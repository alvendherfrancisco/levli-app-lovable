/**
 * The app's buttons, in one place.
 *
 * Every button in the app is the same pill: a full radius (half its own height),
 * one indigo fill and white semibold text for a primary action, with no drop
 * shadow — a Save button sits on the page, and only the floating action button
 * is lifted. The values behind these classes are the button tokens in
 * src/index.css (`--btn-*`), which are also mapped in tailwind.config.js as
 * `rounded-pill`, `h-btn`, `h-btn-sm`, `bg-btn`, `text-btn`, `border-btn-line`
 * and `shadow-btn` — so a new button follows the same style whether it is
 * written with these classes or with the tokens directly.
 *
 * Sizes: a primary action is 54px tall, a small one 38px. Use the `_SM` classes
 * inside a card, a sheet footer or a row; use the plain ones for the one main
 * action on a screen or a sheet.
 *
 * Colours: primary is indigo (a lighter faded indigo when disabled, a darker one
 * while pressed); secondary is a 1px hairline pill with dark text; a destructive
 * button is red — a soft red fill on the light theme, a red outline — and is
 * never indigo. A text button is indigo text with no box at all.
 */
export const PILL = "btn-pill";
export const PILL_SM = "btn-pill btn-pill-sm";

export const PRIMARY = "btn-pill btn-primary w-full";
export const PRIMARY_SM = "btn-pill btn-pill-sm btn-primary";
export const PRIMARY_ICON = "btn-pill btn-primary btn-pill-icon";

export const SECONDARY = "btn-pill btn-secondary w-full";
export const SECONDARY_SM = "btn-pill btn-pill-sm btn-secondary";
export const SECONDARY_ICON = "btn-pill btn-secondary btn-pill-icon";

export const DANGER = "btn-pill btn-danger w-full";
export const DANGER_SM = "btn-pill btn-pill-sm btn-danger";
export const DANGER_SOLID = "btn-pill btn-danger-solid w-full";

export const LINK = "btn-link";

/** A chip in a filter row: the same pill at the small height. */
export const CHIP = "btn-pill btn-pill-sm btn-chip";