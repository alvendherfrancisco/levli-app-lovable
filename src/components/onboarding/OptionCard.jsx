import React from "react";
import { Check } from "lucide-react";
import { sound } from "@/lib/sounds";

/**
 * One selectable card, shared by every multi-select step so the shape can never
 * drift apart: one corner radius, one padding, one hairline border and one soft
 * shadow — the same card the sign-in and account screens are drawn on — with the
 * 44pt tinted circular icon container on the left and the status circle on the
 * right.
 *
 * The card is a label wrapped around a real checkbox, which is how the state is
 * announced — a screen reader reads it as a checkbox with "checked" or "not
 * checked" — and it is what makes the whole card tappable, focusable and
 * toggleable from the keyboard. The visible circle on the right mirrors that
 * checkbox rather than replacing it.
 *
 * Nothing here is a fixed height: the card has a minimum height so a row of
 * cards lines up, and text set to a larger size grows its card instead of being
 * clipped.
 */
export default function OptionCard({ icon: Icon, label, description, selected, onToggle }) {
  return (
    <label
      className={`flex items-center gap-3 min-h-[68px] w-full rounded-2xl border p-3 cursor-pointer shadow-sm transition-colors focus-within:ring-2 focus-within:ring-primary ${
        selected
          ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-500/10"
          : "border-gray-200 bg-white dark:bg-white/[0.04] dark:border-white/[0.12]"
      }`}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={(e) => { sound.tap(); onToggle(e.target.checked); }}
        className="sr-only"
      />

      <span className="w-11 h-11 rounded-full bg-indigo-50 dark:bg-indigo-500/15 flex items-center justify-center flex-shrink-0">
        <Icon size={22} strokeWidth={2} className="text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
      </span>

      <span className="flex-1 min-w-0">
        <span className="block text-base font-semibold text-gray-900 dark:text-[#E8E9F0] leading-snug">
          {label}
        </span>
        {description && (
          <span className="block text-sm text-gray-500 dark:text-[#9A9DAE] leading-snug mt-0.5">
            {description}
          </span>
        )}
      </span>

      <span
        aria-hidden="true"
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
          selected ? "bg-primary border-primary text-primary-foreground" : "border-border"
        }`}
      >
        {selected && <Check size={14} strokeWidth={3} />}
      </span>
    </label>
  );
}