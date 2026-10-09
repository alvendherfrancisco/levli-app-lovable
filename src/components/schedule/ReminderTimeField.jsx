import React from "react";
import { ChevronDown, Clock } from "lucide-react";
import { DEFAULT_REMINDER_TIME } from "@/lib/medicationSchedule";
import { FIELD } from "@/lib/authFormStyles";
import { sound } from "@/lib/sounds";

/** "08:00" → "8:00 AM"; anything else is not a time and shows as nothing. */
function formatTime(value) {
  const match = /^(\d{2}):(\d{2})$/.exec(String(value || ""));
  if (!match) return "";
  const hours = Number(match[1]);
  const suffix = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${match[2]} ${suffix}`;
}

/**
 * The time, drawn as the app's own field: the clock in the left slot, the time
 * in the field's usual text colour, and a chevron in the right one.
 *
 * The device's own time input sits over the whole field, invisible, so a tap
 * anywhere on it opens exactly the picker the phone or the browser provides —
 * which is also what keeps the value a real 24-hour time underneath.
 */
function TimeField({ id, value, onChange, label }) {
  return (
    <div className="relative">
      <Clock
        className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-[#9A9DAE]"
        aria-hidden="true"
      />
      <span
        aria-hidden="true"
        className={`${FIELD} flex items-center pr-9 dark:border-white/[0.12] dark:bg-white/[0.05] dark:text-[#E8E9F0]`}
      >
        {formatTime(value)}
      </span>
      <ChevronDown
        className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-[#9A9DAE]"
        aria-hidden="true"
      />
      <input
        id={id}
        type="time"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
    </div>
  );
}

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
          <div className="mt-3">
            <label htmlFor="reminder-time" className="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-300">
              Reminder time
            </label>
            <TimeField id="reminder-time" value={value} onChange={onChange} label="Reminder time" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <label htmlFor="reminder-time" className="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-300">
        Reminder time
      </label>
      <TimeField id="reminder-time" value={value} onChange={onChange} label="Reminder time" />
      {!value && <p className="text-xs text-gray-500 dark:text-[#9A9DAE] mt-1.5">No time set, so no reminder.</p>}
    </div>
  );
}