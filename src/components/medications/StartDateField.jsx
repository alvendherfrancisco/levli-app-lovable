import React from "react";
import DateInput from "@/components/DateInput";
import OptionChips from "@/components/OptionChips";

/** Today, as the value a date input expects ("YYYY-MM-DD"). */
const pad = (n) => String(n).padStart(2, "0");
const dayKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const shift = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return dayKey(d);
};

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
      <DateInput id="start-date" value={value} onChange={onChange} ariaLabel="Start date" />

      {value === today && (
        <p className="text-xs text-gray-500 dark:text-[#9A9DAE] mt-1.5 leading-snug">
          Pre-filled with today — change it if you started earlier.
        </p>
      )}

      {error && <p className="text-sm font-medium text-red-600 dark:text-red-400 mt-2">{error}</p>}
    </OptionChips>
  );
}