import React from "react";
import { OTHER_SCHEDULE } from "@/lib/medicationRegimen";
import OptionChips from "@/components/OptionChips";

/**
 * How often the medication is taken, as plain choices. A known product starts on
 * the schedule its own label states (once weekly for the injections, once daily
 * for Rybelsus, Victoza and Saxenda); writing your own is a deliberate second
 * choice. A medication the user typed themselves starts with nothing chosen.
 */

const CHOICES = [
  { value: "Once weekly", label: "Once weekly" },
  { value: "Once daily", label: "Once daily" },
  { value: OTHER_SCHEDULE, label: "Other" },
];

export default function ScheduleField({ value, onChange, other, onOtherChange, suggested, error }) {
  return (
    <OptionChips
      label="How often"
      options={CHOICES}
      value={value}
      onChange={onChange}
      required
      soundOnSelect
      helper={suggested ? "Suggested from the label — change it if your prescriber says otherwise." : undefined}
    >
      {value === OTHER_SCHEDULE && (
        <div className="mt-2">
          <label htmlFor="schedule-other" className="text-xs font-medium text-gray-600 dark:text-[#9A9DAE] mb-1.5 block">
            Schedule from your prescription
          </label>
          <input
            id="schedule-other"
            type="text"
            value={other}
            autoComplete="off"
            onChange={(e) => onOtherChange(e.target.value)}
            placeholder="e.g. every 10 days"
            className="w-full min-h-[52px] rounded-xl border border-gray-200 dark:border-white/[0.12] dark:bg-white/[0.05] dark:text-[#E8E9F0] px-3 py-2.5 text-sm outline-none focus:border-indigo-400"
          />
        </div>
      )}

      {error && <p className="text-sm font-medium text-red-600 dark:text-red-400 mt-2">{error}</p>}
    </OptionChips>
  );
}