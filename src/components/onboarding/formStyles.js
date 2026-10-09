// ─────────────────────────────────────────────────────────────────────────────
// The account step's shared geometry.
//
// The provider buttons, the text fields and the primary button are all built
// from these strings, so their height, corner radius, width and tap targets can
// never drift apart from one page to the next — which is what keeps the Google
// and Apple buttons lined up with the fields beneath them.
//
// Only literal class names are used, never assembled ones: Tailwind finds what
// is written here exactly as it finds it in a component.
// ─────────────────────────────────────────────────────────────────────────────

/** The width, radius and text size every control shares. */
export const CONTROL = "w-full rounded-xl text-[16px] transition-all";

/** A text field: white, hairline border, indigo when it has focus. The
 *  placeholder is a mid grey rather than the browser's pale one, so what it
 *  asks for is as readable as the label above it. */
export const FIELD = `${CONTROL} h-[54px] border-2 border-gray-200 bg-white px-4 text-gray-700 placeholder:text-gray-500 outline-none focus:border-indigo-500`;

/**
 * A button. It has a minimum height rather than a fixed one, so a longer label
 * — or the largest Dynamic Type — makes it taller instead of clipping, while at
 * the usual text size it stands exactly as tall as a field.
 */
export const BUTTON = `${CONTROL} min-h-[54px] px-4 py-2 font-semibold leading-tight flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-60`;

/** The name of a field, always on show above it. */
export const LABEL = "block text-left text-[14px] font-semibold text-gray-700 mb-1.5";

/** The line under a field: what to type, or what went wrong. */
export const MESSAGE = "block text-left text-[13px] leading-snug mt-1.5";

/** A small round control — the password eye — with a full 44pt touch target. */
export const ICON_BUTTON = "absolute right-1 top-1/2 -translate-y-1/2 h-11 w-11 flex items-center justify-center rounded-lg";

/** The primary button — the same one every other onboarding page carries. */
export const CTA = "onb-cta-btn w-full max-w-[400px] rounded-full font-semibold text-base sm:text-lg transition-all duration-300 active:scale-95";
export const CTA_READY = `${CTA} bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/25`;
export const CTA_WAITING = `${CTA} bg-gray-200 text-gray-400 cursor-not-allowed`;