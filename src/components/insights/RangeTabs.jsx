import React from "react";

/**
 * The time-range tabs a chart card offers (7 / 30 / 90 Days, 30 Days /
 * 180 Days / 1 Year). One look for every card: the chosen range is the app's
 * indigo pill and the rest are quiet text, so no card draws a selected state
 * of its own.
 */
export default function RangeTabs({ options, value, onChange, className = "mb-4" }) {
  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          aria-pressed={value === option}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            value === option
              ? "bg-indigo-600 text-white"
              : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}