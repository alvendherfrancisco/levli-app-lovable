import React from "react";

const INPUT_CLASS =
  "w-full border-2 border-gray-200 bg-white rounded-xl px-3.5 py-3 text-[16px] text-gray-700 outline-none focus:border-indigo-500 transition-colors";

/**
 * When to be reminded.
 *
 * A once-daily schedule is asked for a time straight away (there is no day to
 * pick). A schedule with no fixed day is only asked when the person turns a
 * reminder on — and turning it off clears the time, so nothing is stored behind
 * a control that is no longer shown.
 */
export default function ReminderTimeField({ schedule, onChange, optional = false }) {
  const time = schedule.reminder_time || "";

  const field = (
    <input
      id="sched-time"
      type="time"
      value={time}
      onChange={(e) => onChange({ ...schedule, reminder_time: e.target.value })}
      className={INPUT_CLASS}
    />
  );

  if (!optional) {
    return (
      <div>
        <label htmlFor="sched-time" className="text-[14px] font-semibold text-gray-600 mb-2 block">
          Reminder time <span className="font-normal text-gray-400">· optional</span>
        </label>
        {field}
      </div>
    );
  }

  return (
    <div>
      <label className="flex items-start gap-3 cursor-pointer bg-gray-50 rounded-2xl p-3.5 border border-gray-100">
        <input
          type="checkbox"
          checked={!!time}
          onChange={(e) => onChange({ ...schedule, reminder_time: e.target.checked ? "09:00" : "" })}
          className="w-5 h-5 mt-0.5 accent-indigo-600 flex-shrink-0"
        />
        <span className="text-[14px] text-gray-600 leading-relaxed">
          Remind me at a set time anyway
        </span>
      </label>
      {time && <div className="mt-3">{field}</div>}
    </div>
  );
}