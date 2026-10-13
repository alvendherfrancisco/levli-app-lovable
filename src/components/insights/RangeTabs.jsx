import React from "react";

/**
 * The time-range tabs a chart card offers (7 / 30 / 90 Days, 30 Days /
 * 180 Days / 1 Year). One look for every card: the chosen range is the app's
 * indigo pill and the rest are quiet text, so no card draws a selected state
 * of its own.
 *
 * Every tab is the same 44px-tall pill with the same minimum width, so choosing
 * another range only changes the colours — the row never resizes or shifts as
 * the selection moves — and each tab is a comfortable touch target.
 */
export default function RangeTabs({ options, value, onChange, className = "mb-5" }) {
  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          aria-pressed={value === option}
          className={`min-h-[44px] min-w-[4.75rem] px-4 rounded-full text-xs font-medium transition-colors ${
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