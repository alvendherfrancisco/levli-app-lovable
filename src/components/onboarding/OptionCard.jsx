import React from "react";
import { Check } from "lucide-react";
import { sound } from "@/lib/sounds";

/**
 * One row in a card of choices.
 *
 * The rows sit inside a single white card (the caller draws the card and its
 * divider lines), so the row itself carries no border and no shadow — only its
 * own compact height, the icon circle on the left and the status circle on the
 * right. Every row is the same height, so a list of them lines up exactly.
 *
 * The row is a label wrapped around a real checkbox, which is how the state is
 * announced — a screen reader reads it as a checkbox with "checked" or "not
 * checked" — and it is what makes the whole row tappable, focusable and
 * toggleable from the keyboard. The visible circle on the right mirrors that
 * checkbox rather than replacing it.
 */
export default function OptionCard({ icon: Icon, label, selected, onToggle }) {
  return (
    <label
      className={`flex min-h-[56px] w-full cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors focus-within:bg-gray-50 dark:focus-within:bg-white/[0.06] ${
        selected ? "bg-indigo-50/70 dark:bg-indigo-500/10" : "bg-white dark:bg-transparent"
      }`}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={(e) => { sound.tap(); onToggle(e.target.checked); }}
        className="sr-only"
      />

      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-500/15">
        <Icon size={20} strokeWidth={2} className="text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
      </span>

      <span className="min-w-0 flex-1 text-base font-medium text-gray-900 dark:text-[#E8E9F0]">
        {label}
      </span>

      <span
        aria-hidden="true"
        className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border transition-colors ${
          selected
            ? "border-primary bg-primary text-primary-foreground"
            : "border-gray-300 dark:border-white/25"
        }`}
      >
        {selected && <Check size={14} strokeWidth={3} />}
      </span>
    </label>
  );
}