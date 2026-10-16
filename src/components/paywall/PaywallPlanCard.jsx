import React from "react";
import { Check } from "lucide-react";

/**
 * One plan in the row of three: its name, what it costs and how often, and — for
 * the yearly plan — what it saves. Selected, the card takes an indigo border and
 * a soft tint and shows its check; unselected, it is a quiet outline. The border
 * eases between the two, so choosing reads as a change rather than a jump.
 *
 * The card is only as tall as its content: the three sit in one grid row, so they
 * are always exactly the same height as each other.
 */
export default function PaywallPlanCard({ plan, selected, onSelect }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={() => onSelect(plan.id)}
      className={`relative flex h-full flex-col items-center justify-center rounded-2xl border-[1.5px] px-2 py-3 text-center transition-colors duration-200 ${
        selected
          ? "border-indigo-500 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-500/15"
          : "border-cardline bg-white dark:bg-gray-900"
      }`}
    >
      {selected && (
        <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 dark:bg-indigo-400">
          <Check size={10} strokeWidth={4} className="text-white dark:text-gray-900" aria-hidden="true" />
        </span>
      )}

      <span className="text-[11px] font-semibold text-gray-500 dark:text-[#9A9DAE]">{plan.name}</span>
      <span className="mt-1 text-sm font-bold text-gray-900 dark:text-white">
        {plan.price}
        <span className="font-medium text-gray-500 dark:text-[#9A9DAE]"> {plan.period}</span>
      </span>
      {plan.detail && (
        <span className="mt-0.5 text-[10px] text-gray-500 dark:text-[#9A9DAE]">{plan.detail}</span>
      )}
      {plan.badge && (
        <span className="mt-1.5 rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-semibold text-amber-700 dark:bg-amber-400/15 dark:text-amber-300">
          {plan.badge}
        </span>
      )}
    </button>
  );
}