// ─────────────────────────────────────────────────────────────────────────────
// The flow's own theme: the sign-in screens (Login, Create account) and every
// onboarding screen.
//
// All of them follow the device's light/dark setting, so their colours are the
// --auth-* tokens in src/index.css (mapped to classes in tailwind.config.js).
// Every class below is the same in both modes: only the token's value changes,
// so nothing anywhere in the flow is ever drawn in a fixed white, grey or black
// — and because the onboarding screens draw their cards, fields, chips and text
// through these same definitions (see src/lib/uiStyles.js), every screen
// switches together from this one place.
//
// The one thing that is not a token is the primary pill: it is the app's own
// indigo with white text in both modes (and its faded indigo while disabled), so
// it comes from uiStyles.js like every other screen's.
// ─────────────────────────────────────────────────────────────────────────────

// ── The page ─────────────────────────────────────────────────────────────────
// The page's own surface: the token's base colour, plus — in dark mode only — the
// soft indigo glow drawn by .auth-screen in src/index.css.
export const AUTH_SCREEN = "auth-screen";

// ── The card ─────────────────────────────────────────────────────────────────
// One surface, one hairline border, and the soft shadow only where there is light
// behind it to cast one.
export const AUTH_CARD =
  "rounded-2xl border border-auth-border bg-auth-card p-5 shadow-sm dark:shadow-none";

// ── Fields ───────────────────────────────────────────────────────────────────
// Dark fill, light text, a mid-grey placeholder and mark, and a hairline that
// turns indigo on focus in both modes.
export const AUTH_FIELD =
  "h-12 w-full rounded-full border border-auth-input-border bg-auth-input text-[16px] text-auth-text outline-none transition-colors placeholder:text-auth-faint focus:border-auth-focus";
// The same field where a mark sits in it (AUTH_FIELD_MARK, at 12px from the
// edge). The value and the placeholder both start clear of the mark at 40px, so
// neither ever runs underneath it; without that slot the text begins at the
// field's own edge. A field with no mark in it — an amount, an interval — keeps
// the plain one above. A password field adds its own pr-14 for the eye.
export const AUTH_FIELD_ICON = `${AUTH_FIELD} pl-10`;
export const AUTH_FIELD_MARK = "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-auth-faint";
// The eye that reveals a password: its own 44pt target in the field's right slot.
export const AUTH_FIELD_EYE =
  "absolute right-1.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-auth-faint transition-colors hover:text-auth-muted";

// ── Type ─────────────────────────────────────────────────────────────────────
export const AUTH_HEADING = "text-[24px] sm:text-[28px] font-bold leading-tight text-auth-heading";
export const AUTH_SUBTITLE = "text-[15px] leading-relaxed text-auth-muted";
export const AUTH_BODY = "text-[15px] text-auth-muted";
export const AUTH_HELP = "text-[12.5px] leading-relaxed text-auth-muted";
export const AUTH_LABEL = "text-sm font-medium text-auth-text mb-2 block";
export const AUTH_LABEL_TEXT = "text-sm font-medium text-auth-text";

// ── Rows ─────────────────────────────────────────────────────────────────────
// The hairline between two rows inside a card: present but quiet, and never a
// heavier line in dark mode than in light.
export const AUTH_DIVIDE = "divide-y divide-auth-divider";

// ── Links ────────────────────────────────────────────────────────────────────
// The lighter indigo, which stays readable on a dark surface. The small one is
// the field label's own size, so a label and the link beside it sit level on the
// same baseline.
export const AUTH_LINK = "font-medium text-auth-link hover:underline";
export const AUTH_LINK_UNDERLINE = "text-auth-link underline";
export const AUTH_LINK_SMALL = "text-sm font-medium text-auth-link hover:underline";

// ── Notices ──────────────────────────────────────────────────────────────────
// What has gone wrong, said in the amber that reads on both surfaces.
export const AUTH_NOTICE =
  "w-full rounded-xl border border-auth-notice-border bg-auth-notice px-3 py-2 text-center text-[13px] leading-snug text-auth-notice-text";

// ── The provider row ─────────────────────────────────────────────────────────
// The "or" divider: a low-contrast hairline with the word sitting on the card's
// own surface, so the line never runs through it.
export const AUTH_DIVIDER_LINE = "w-full border-t border-auth-border";
export const AUTH_DIVIDER_TEXT = "bg-auth-card px-3 text-auth-faint";
// Google keeps its own brand colours on the card's surface. Apple's circle is the
// inverse of the surface it sits on: black on light, white on dark.
export const AUTH_PROVIDER_BTN = "border border-auth-border bg-auth-card hover:border-auth-hover";
export const AUTH_APPLE_BTN = "bg-auth-apple text-auth-apple-fg hover:opacity-90";