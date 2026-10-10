import React from "react";
import { Check, ChevronDown, Clock } from "lucide-react";
import { DEFAULT_REMINDER_TIME } from "@/lib/medicationSchedule";
import { sound } from "@/lib/sounds";
import {
  CHECK_CIRCLE, CHECK_CIRCLE_OFF, CHECK_CIRCLE_ON, FIELD, FIELD_MARK,
  HELP_IN_CARD, LABEL_TEXT,
} from "@/lib/uiStyles";

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
      <Clock className={FIELD_MARK} aria-hidden="true" />
      <span aria-hidden="true" className={`${FIELD} flex items-center pr-9`}>
        {formatTime(value)}
      </span>
      <ChevronDown
        className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-auth-faint"
        aria-hidden="true"
      />
      <input
        id={id}
        type="time"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="absolute inset-0 h-full w-full min-w-0 box-border cursor-pointer opacity-0 dark:[color-scheme:dark]"
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
 * The switch is the app's own checkbox: 22pt, a hairline border, filled indigo
 * with a white tick once it is on.
 */
export default function ReminderTimeField({ value, onChange, optional = false }) {
  if (optional) {
    const on = !!value;
    return (
      <div>
        <label className="flex min-h-[44px] cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={on}
            onChange={(e) => { sound.tap(); onChange(e.target.checked ? DEFAULT_REMINDER_TIME : ""); }}
            className="sr-only"
          />
          <span
            aria-hidden="true"
            className={`mt-0.5 ${CHECK_CIRCLE} ${on ? CHECK_CIRCLE_ON : CHECK_CIRCLE_OFF}`}
          >
            {on && <Check size={13} strokeWidth={2.5} />}
          </span>
          <span className={`${LABEL_TEXT} leading-snug`}>
            Remind me at a time I choose
          </span>
        </label>
        {on && (
          <div className="mt-3">
            <label htmlFor="reminder-time" className={`${LABEL_TEXT} mb-2 block`}>
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
      <label htmlFor="reminder-time" className={`${LABEL_TEXT} mb-2 block`}>
        Reminder time
      </label>
      <TimeField id="reminder-time" value={value} onChange={onChange} label="Reminder time" />
      {!value && <p className={`${HELP_IN_CARD} mt-2`}>No time set, so no reminder.</p>}
    </div>
  );
}