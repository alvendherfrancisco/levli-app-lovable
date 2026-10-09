import React from "react";
import { FIELD_PLAIN, HELP_IN_CARD, LABEL_TEXT } from "@/lib/uiStyles";

// The shared field, with this surface's dark overrides, so a date input and a
// number input are the same pill on every screen.
const INPUT = `${FIELD_PLAIN} dark:border-white/[0.12] dark:bg-white/[0.05] dark:text-[#E8E9F0] dark:[color-scheme:dark]`;

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
        <label htmlFor="interval-days" className={`${LABEL_TEXT} mb-2 block dark:text-gray-300`}>
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
        <p className={`${HELP_IN_CARD} mt-2 dark:text-[#9A9DAE]`}>
          Levli counts from that many days after each dose.
        </p>
      </div>

      {showStartDate && (
        <div>
          <label htmlFor="schedule-start" className={`${LABEL_TEXT} mb-2 block dark:text-gray-300`}>
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