import React from "react";
import { DEFAULT_REMINDER_TIME } from "@/lib/medicationSchedule";
import { sound } from "@/lib/sounds";

const TIME_INPUT =
  "w-full min-h-[52px] rounded-xl border border-gray-200 dark:border-white/[0.12] dark:bg-white/[0.05] dark:text-[#E8E9F0] px-3 py-2.5 text-sm outline-none focus:border-indigo-400 dark:[color-scheme:dark]";

/**
 * The time of day the dose is due. It is the dose's own time, not a
 * recommendation: whatever the prescriber set is what goes in here.
 *
 * A schedule with no fixed day still allows a reminder, so for that one the
 * time is offered as an optional switch rather than a field that is always on.
 */
export default function ReminderTimeField({ value, onChange, optional = false }) {
  if (optional) {
    const on = !!value;
    return (
      <div>
        <label className="flex items-start gap-3 min-h-[44px] cursor-pointer">
          <input
            type="checkbox"
            checked={on}
            onChange={(e) => { sound.tap(); onChange(e.target.checked ? DEFAULT_REMINDER_TIME : ""); }}
            className="w-5 h-5 mt-0.5 accent-indigo-600 flex-shrink-0"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300 leading-snug">
            Remind me at a time I choose
          </span>
        </label>
        {on && (
          <div className="mt-2">
            <label htmlFor="reminder-time" className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
              Reminder time
            </label>
            <input
              id="reminder-time"
              type="time"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className={TIME_INPUT}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <label htmlFor="reminder-time" className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
        Reminder time
      </label>
      <input
        id="reminder-time"
        type="time"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className={TIME_INPUT}
      />
      {!value && <p className="text-xs text-gray-500 dark:text-[#9A9DAE] mt-1.5">No time set, so no reminder.</p>}
    </div>
  );
}