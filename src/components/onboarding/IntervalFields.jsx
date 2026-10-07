import React from "react";
import { intervalHint } from "@/lib/medicationSchedule";

const INPUT_CLASS =
  "w-full border-2 border-gray-200 bg-white rounded-xl px-3.5 py-3 text-[16px] text-gray-700 outline-none focus:border-indigo-500 transition-colors";

/**
 * Every N days: how many days apart, and the date that starts it.
 *
 * There is deliberately no weekday picker here — a fixed day of the week cannot
 * describe an every-N-days schedule, and a control that does not affect the
 * schedule is never shown. The interval is what the next dose is worked out
 * from, and it is checked against the label's own minimum where the label
 * states one.
 */
export default function IntervalFields({ medication, schedule, onChange }) {
  const hint = intervalHint(medication, schedule.interval_days);

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="sched-interval" className="text-[14px] font-semibold text-gray-600 mb-2 block">
          Days between doses
        </label>
        <input
          id="sched-interval"
          type="text"
          inputMode="numeric"
          value={schedule.interval_days ?? ""}
          placeholder="e.g. 10"
          onChange={(e) => {
            const digits = e.target.value.replace(/[^\d]/g, "").slice(0, 2);
            onChange({ ...schedule, interval_days: digits === "" ? null : Number(digits) });
          }}
          className={INPUT_CLASS}
        />
        {hint && <p className="text-[12.5px] text-orange-700 leading-snug mt-2">{hint}</p>}
      </div>
      <div>
        <label htmlFor="sched-start" className="text-[14px] font-semibold text-gray-600 mb-2 block">
          Start date
        </label>
        <input
          id="sched-start"
          type="date"
          value={schedule.start_date || ""}
          onChange={(e) => onChange({ ...schedule, start_date: e.target.value })}
          className={INPUT_CLASS}
        />
      </div>
    </div>
  );
}