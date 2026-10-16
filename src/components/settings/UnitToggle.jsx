import React from "react";

/**
 * One measurement unit in Settings: what it applies to, and the two ways it can
 * be shown.
 *
 * It is the segmented control the Profile page used to carry — the same shape,
 * the same colours — and it writes only the profile's DISPLAY preference. What
 * is stored does not change: every value stays exactly as it was saved, and
 * every screen that shows that measurement re-renders in the chosen unit the
 * moment it is switched.
 */
export default function UnitToggle({ label, hint, value, options, onChange }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="min-w-0">
        <span className="text-sm text-gray-700 dark:text-gray-300 font-medium block">{label}</span>
        {hint && <span className="text-xs text-gray-500 dark:text-gray-400">{hint}</span>}
      </div>
      <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600 flex-shrink-0">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            aria-pressed={value === option}
            className={`px-5 py-2 text-sm font-medium transition-colors ${
              value === option
                ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300"
                : "bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}