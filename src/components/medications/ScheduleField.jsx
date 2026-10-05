import React from "react";
import { Check } from "lucide-react";
import { OTHER_SCHEDULE } from "@/lib/medicationRegimen";
import { haptic } from "@/lib/haptics";

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

const chipClass = (selected) =>
  `inline-flex min-h-[44px] items-center gap-1 rounded-xl border-2 px-3 text-sm font-semibold ${
    selected
      ? "bg-indigo-600 border-indigo-600 text-white"
      : "bg-white dark:bg-white/[0.05] border-gray-200 dark:border-white/[0.12] text-gray-900 dark:text-[#E8E9F0]"
  }`;

export default function ScheduleField({ value, onChange, other, onOtherChange, suggested, error }) {
  return (
    <div>
      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">How often</span>

      <div className="flex flex-wrap gap-2">
        {CHOICES.map((o) => {
          const selected = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => { haptic("light"); onChange(o.value); }}
              aria-pressed={selected}
              className={chipClass(selected)}
            >
              {selected && <Check size={14} strokeWidth={3} />}
              {o.label}
            </button>
          );
        })}
      </div>

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

      {suggested && (
        <p className="text-xs text-gray-500 dark:text-[#9A9DAE] mt-2 leading-snug">
          Suggested from the label — change it if your prescriber says otherwise.
        </p>
      )}

      {error && <p className="text-sm font-medium text-red-600 dark:text-red-400 mt-2">{error}</p>}
    </div>
  );
}