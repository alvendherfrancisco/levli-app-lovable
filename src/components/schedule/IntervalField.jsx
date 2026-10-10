import React from "react";
import { FIELD_PLAIN, HELP_IN_CARD, LABEL_TEXT } from "@/lib/uiStyles";

// The shared field, so a date input and a number input are the same pill on every
// screen. A native date picker is asked for the mode its surface is in, so it
// opens dark on a dark step and light on a light one.
const INPUT = `${FIELD_PLAIN} dark:[color-scheme:dark]`;

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
        <label htmlFor="interval-days" className={`${LABEL_TEXT} mb-2 block`}>
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
        <p className={`${HELP_IN_CARD} mt-2`}>
          Levli counts from that many days after each dose.
        </p>
      </div>

      {showStartDate && (
        <div>
          <label htmlFor="schedule-start" className={`${LABEL_TEXT} mb-2 block`}>
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