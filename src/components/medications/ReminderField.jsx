import React, { useRef } from "react";
import { Clock } from "lucide-react";
import { SHEET_FIELD, SHEET_HINT, SHEET_LABEL_TEXT } from "@/components/modals/shot/sheetUi";
import { DEFAULT_REMINDER_TIME } from "@/lib/medicationSchedule";
import { sound } from "@/lib/sounds";

/** "08:00" → "8:00 AM"; anything that is not a time shows nothing. */
function formatTime(value) {
  const match = /^(\d{2}):(\d{2})$/.exec(String(value || ""));
  if (!match) return "";
  const hours = Number(match[1]);
  const suffix = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${match[2]} ${suffix}`;
}

/**
 * The reminder for a dose day: the app's own on/off switch, the time it is due,
 * and one line saying what it does.
 *
 * It starts on, so a reminder is set up without being asked for, and one tap turns
 * it off for anyone who does not want one — the time is cleared with it, which is
 * what the app reads as "no reminder".
 *
 * The time is the device's own picker — hours, minutes and AM/PM — opened from
 * anywhere on the field, exactly as the Log shot sheet asks for its time.
 */
export default function ReminderField({ value, onChange }) {
  // Held while the switch is off, so turning it back on never loses the hour the
  // user chose.
  const lastTime = useRef(DEFAULT_REMINDER_TIME);
  const on = !!value;

  const toggle = () => {
    sound.tap();
    if (on) {
      lastTime.current = value;
      onChange("");
      return;
    }
    onChange(lastTime.current || DEFAULT_REMINDER_TIME);
  };

  return (
    <div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={toggle}
        className="flex min-h-[44px] w-full items-center justify-between gap-4 text-left"
      >
        <span className={SHEET_LABEL_TEXT}>Reminder</span>
        <span
          aria-hidden="true"
          className={`relative h-7 w-12 flex-shrink-0 rounded-full transition-colors ${
            on ? "bg-indigo-500" : "bg-gray-300 dark:bg-gray-600"
          }`}
        >
          <span
            className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${
              on ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </span>
      </button>

      {on && (
        <>
          <div className="relative mt-2">
            <Clock
              size={17}
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <span aria-hidden="true" className={`${SHEET_FIELD} flex items-center pl-10`}>
              {formatTime(value)}
            </span>
            <input
              id="reminder-time"
              type="time"
              value={value || ""}
              onChange={(e) => onChange(e.target.value)}
              aria-label="Reminder time"
              className="absolute inset-0 h-full w-full min-w-0 box-border cursor-pointer text-[16px] opacity-0 dark:[color-scheme:dark]"
            />
          </div>
          <p className={`${SHEET_HINT} mt-1.5`}>We'll remind you at this time on dose days.</p>
        </>
      )}
    </div>
  );
}