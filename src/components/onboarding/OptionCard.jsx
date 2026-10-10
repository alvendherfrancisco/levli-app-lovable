import React from "react";
import { Check } from "lucide-react";
import { sound } from "@/lib/sounds";
import {
  ACCENT_TEXT, CHECK_CIRCLE, CHECK_CIRCLE_OFF, CHECK_CIRCLE_ON, ICON_CIRCLE, LIST_TEXT,
} from "@/lib/uiStyles";

/**
 * One row in a card of choices.
 *
 * The rows sit inside a single white card (the caller draws the card and its
 * divider lines), so the row itself carries no border, no shadow and no
 * horizontal padding of its own — only its compact 56pt height, the icon circle
 * on the left and the status circle on the right. The card's own inner padding
 * is what holds both circles in from its edges, so every row starts and stops on
 * the card's content line, exactly like the rows of the card below it. Every row
 * is the same height, so a list of them lines up exactly.
 *
 * The row is a label wrapped around a real checkbox, which is how the state is
 * announced — a screen reader reads it as a checkbox with "checked" or "not
 * checked" — and it is what makes the whole row tappable, focusable and
 * toggleable from the keyboard. The visible circle on the right mirrors that
 * checkbox rather than replacing it.
 *
 * Icon circle, list text and status circle are the app's shared tokens, so a row
 * here is the same row as a row anywhere else.
 */
export default function OptionCard({ icon: Icon, label, selected, onToggle }) {
  return (
    <label
      className={`flex min-h-[56px] w-full cursor-pointer items-center gap-3 py-2 transition-colors focus-within:bg-auth-surface ${
        selected ? "bg-auth-tint" : "bg-auth-card"
      }`}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={(e) => { sound.tap(); onToggle(e.target.checked); }}
        className="sr-only"
      />

      <span className={ICON_CIRCLE}>
        <Icon size={20} strokeWidth={1.5} className={ACCENT_TEXT} aria-hidden="true" />
      </span>

      <span className={`min-w-0 flex-1 ${LIST_TEXT}`}>
        {label}
      </span>

      <span
        aria-hidden="true"
        className={`${CHECK_CIRCLE} ${selected ? CHECK_CIRCLE_ON : CHECK_CIRCLE_OFF}`}
      >
        {selected && <Check size={13} strokeWidth={2.5} />}
      </span>
    </label>
  );
}