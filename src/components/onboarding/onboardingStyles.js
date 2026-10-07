// ── Onboarding form styling ────────────────────────────────────────────────
// One place for the field and chip wording, so every onboarding screen uses the
// same surfaces, radius and type. Everything is written with theme tokens only
// (bg-background, text-foreground, border-border, bg-action …), so the flow
// follows light/dark mode with no hard-coded colours.

/** A text / date / number field. 48px tall, 16px text (no iOS zoom on focus). */
export const FIELD =
  "w-full min-h-[48px] rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground " +
  "placeholder:text-muted-foreground outline-none focus:border-primary transition-colors";

/** The compact secondary field used inside a selected-medication card. */
export const FIELD_SM =
  "w-full min-h-[44px] rounded-xl border border-border bg-background px-3 py-2 text-[15px] text-foreground " +
  "placeholder:text-muted-foreground outline-none focus:border-primary transition-colors";

const CHIP = "inline-flex items-center justify-center border transition-colors active:scale-[0.98]";

/** A selectable chip: filled when chosen, outlined when not. */
export function chip(selected, extra = "") {
  return `${CHIP} ${extra} ${
    selected ? "border-primary bg-action text-action-foreground" : "border-border bg-background text-foreground"
  }`;
}

/** The full-width selectable bar ("Others"). */
export function chipBar(selected) {
  return `${CHIP} w-full min-h-[52px] justify-between rounded-2xl px-4 text-left ${
    selected ? "border-primary bg-action text-action-foreground" : "border-border bg-background text-foreground"
  }`;
}