import React from "react";

/**
 * The time-range tabs a chart card offers (7 / 30 / 90 Days, 30 Days /
 * 180 Days / 1 Year / Since start). One look for every card: the chosen range is
 * the app's indigo pill and the rest are quiet text, so no card draws a selected
 * state of its own.
 *
 * The tabs share the row between them — each one takes an equal share of the
 * width and its label stays on one line — so a card offering four of them still
 * shows all four side by side on a phone, and choosing another range only changes
 * the colours: the row never resizes or shifts as the selection moves.
 */
export default function RangeTabs({ options, value, onChange, className = "mb-5" }) {
  return (
    <div className={`flex items-center gap-1 flex-wrap ${className}`}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          aria-pressed={value === option}
          className={`flex-1 min-w-[4.25rem] min-h-[38px] !px-1.5 sm:!px-2.5 rounded-full text-[11px] sm:text-xs font-medium whitespace-nowrap transition-colors ${
            value === option
              ? "bg-indigo-600 text-white"
              : "text-gray-500 dark:text-[#9A9DAE] hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-700 dark:hover:text-white"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}