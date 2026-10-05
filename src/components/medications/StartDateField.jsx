import React from "react";
import OptionChips from "@/components/OptionChips";

/** Today, as the value a date input expects ("YYYY-MM-DD"). */
const pad = (n) => String(n).padStart(2, "0");
const dayKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const shift = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return dayKey(d);
};

const chipClass = (selected) =>
  `min-h-[44px] rounded-xl border-2 px-3 text-sm font-semibold ${
    selected
      ? "bg-indigo-600 border-indigo-600 text-white"
      : "bg-white dark:bg-white/[0.05] border-gray-200 dark:border-white/[0.12] text-gray-900 dark:text-[#E8E9F0]"
  }`;

/**
 * The date of the first dose: pre-filled with today, with Today and Yesterday
 * as one-tap choices and a date picker for anything earlier.
 */
export default function StartDateField({ value, onChange, error }) {
  const today = shift(0);
  const yesterday = shift(-1);

  // The date itself is required, so today/yesterday are a shortcut: one of them
  // is picked or nothing is, and tapping the picked one changes nothing.
  const shortcut = value === today ? today : value === yesterday ? yesterday : null;

  return (
    <OptionChips
      label="Start date"
      options={[{ value: today, label: "Today" }, { value: yesterday, label: "Yesterday" }]}
      value={shortcut}
      onChange={onChange}
      required
      soundOnSelect
      wrapClass="flex flex-wrap gap-2 mb-2"
      labelClass="text-sm font-semibold text-gray-700 dark:text-gray-300"
    >
      <input
        id="start-date"
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-w-0 box-border min-h-[52px] rounded-xl border border-gray-200 dark:border-white/[0.12] dark:bg-white/[0.05] dark:text-[#E8E9F0] px-3 py-2.5 text-sm outline-none focus:border-indigo-400 dark:[color-scheme:dark]"
      />

      {value === today && (
        <p className="text-xs text-gray-500 dark:text-[#9A9DAE] mt-1.5 leading-snug">
          Pre-filled with today — change it if you started earlier.
        </p>
      )}

      {error && <p className="text-sm font-medium text-red-600 dark:text-red-400 mt-2">{error}</p>}
    </OptionChips>
  );
}