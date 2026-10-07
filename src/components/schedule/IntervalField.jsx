import React from "react";

const INPUT =
  "w-full min-h-[52px] rounded-xl border border-gray-200 dark:border-white/[0.12] dark:bg-white/[0.05] dark:text-[#E8E9F0] px-3 py-2.5 text-sm outline-none focus:border-indigo-400 dark:[color-scheme:dark]";

/**
 * A schedule that runs every so many days. There is no weekday to pick at all —
 * the interval and the first dose date are what decide the dates.
 *
 * The first dose date is only asked for where the screen has no start date of
 * its own to use (the Add Medication form already records one).
 */
export default function IntervalField({
  intervalDays, onIntervalChange, startDate, onStartDateChange, showStartDate = false,
}) {
  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="interval-days" className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
          How many days between doses?
        </label>
        <input
          id="interval-days"
          type="number"
          min="1"
          max="90"
          inputMode="numeric"
          value={intervalDays}
          onChange={(e) => onIntervalChange(e.target.value)}
          placeholder="e.g. 5"
          className={INPUT}
        />
        <p className="text-xs text-gray-500 dark:text-[#9A9DAE] mt-1.5 leading-snug">
          Levli counts from that many days after each dose.
        </p>
      </div>

      {showStartDate && (
        <div>
          <label htmlFor="schedule-start" className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
            First dose date
          </label>
          <input
            id="schedule-start"
            type="date"
            value={startDate || ""}
            onChange={(e) => onStartDateChange(e.target.value)}
            className={INPUT}
          />
        </div>
      )}
    </div>
  );
}