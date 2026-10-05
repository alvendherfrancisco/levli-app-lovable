import React from "react";
import { OTHER_SCHEDULE } from "@/lib/medicationRegimen";

const bigChoice = (selected) =>
  `min-h-[60px] rounded-2xl border-2 px-3 text-base font-semibold ${
    selected
      ? "bg-indigo-600 border-indigo-600 text-white"
      : "bg-white dark:bg-white/[0.05] border-gray-200 dark:border-white/[0.12] text-gray-900 dark:text-[#E8E9F0]"
  }`;

/**
 * How often the medication is taken. A known product starts on the schedule its
 * label states; writing your own schedule is a deliberate second choice, and a
 * product with no label list can only be given one by the user.
 */
export default function ScheduleField({ option, value, onChange, other, onOtherChange, error }) {
  const labelled = option?.schedule || "";

  return (
    <div>
      <label htmlFor="schedule-other" className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-2 block">
        How often
      </label>

      {labelled && (
        <div className="grid grid-cols-2 gap-2">
          {[{ v: labelled, t: labelled }, { v: OTHER_SCHEDULE, t: "Other schedule" }].map((o) => (
            <button key={o.v} type="button" onClick={() => onChange(o.v)} aria-pressed={value === o.v} className={bigChoice(value === o.v)}>
              {o.t}
            </button>
          ))}
        </div>
      )}

      {(value === OTHER_SCHEDULE || !labelled) && (
        <div className={labelled ? "mt-2" : ""}>
          <label htmlFor="schedule-other" className="text-sm font-medium text-gray-600 dark:text-[#9A9DAE] mb-1.5 block">
            Schedule from your prescription
          </label>
          <input
            id="schedule-other"
            type="text"
            value={other}
            autoComplete="off"
            onChange={(e) => onOtherChange(e.target.value)}
            placeholder="e.g. every 10 days"
            className="w-full min-h-[60px] rounded-2xl border-2 border-gray-200 dark:border-white/[0.12] dark:bg-white/[0.05] dark:text-[#E8E9F0] px-4 py-3 text-base outline-none focus:border-indigo-400"
          />
        </div>
      )}

      {labelled && (
        <p className="text-sm text-gray-500 dark:text-[#9A9DAE] mt-2 leading-snug">
          {labelled} is what the label states for {option.label}. Only change this if your prescriber told you to.
        </p>
      )}

      {error && <p className="text-base font-medium text-red-600 dark:text-red-400 mt-2">{error}</p>}
    </div>
  );
}