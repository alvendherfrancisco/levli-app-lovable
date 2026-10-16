import React from "react";
import { Check } from "lucide-react";

/**
 * One plan on the paywall: a radio circle, the plan's name and its badge, the
 * price on one line and one muted line under it. Selected, the circle fills with
 * the check and the card takes an indigo border and a soft tint. Every card keeps
 * the same height, so the three read as one set to compare.
 */
export default function PaywallPlanCard({ plan, selected, onSelect }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={() => onSelect(plan.id)}
      className={`flex min-h-[96px] w-full items-center gap-3 rounded-2xl border-[1.5px] p-4 text-left transition-colors ${
        selected
          ? "border-indigo-500 bg-indigo-50 dark:border-indigo-400/70 dark:bg-indigo-500/15"
          : "border-cardline bg-white dark:bg-gray-900"
      }`}
    >
      <span
        className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 ${
          selected
            ? "border-indigo-600 bg-indigo-600 dark:border-indigo-400 dark:bg-indigo-400"
            : "border-gray-300 dark:border-white/25"
        }`}
      >
        {selected && (
          <Check size={12} strokeWidth={3} className="text-white dark:text-gray-900" aria-hidden="true" />
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex min-h-[20px] items-center gap-2">
          <span className="text-sm font-semibold text-gray-900 dark:text-white">{plan.name}</span>
          {plan.badge && (
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
              {plan.badge}
            </span>
          )}
        </span>
        <span className="mt-1 block text-lg font-bold text-gray-900 dark:text-white">{plan.priceLine}</span>
        <span className="mt-0.5 block text-xs leading-snug text-gray-500 dark:text-[#9A9DAE]">{plan.detailLine}</span>
      </span>
    </button>
  );
}