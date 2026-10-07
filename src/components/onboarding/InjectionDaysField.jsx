import React from "react";
import { DAY_LETTERS, DAY_NAMES, daysHint, FREQUENCY } from "@/lib/medicationSchedule";

/**
 * The day, or the two days, the dose is taken on.
 *
 * Each button carries its full weekday name for screen readers: the single
 * letters are ambiguous (two days start with T, two with S). A twice-weekly
 * schedule takes two days and says so when they sit too close together.
 */
export default function InjectionDaysField({ medication, schedule, onChange }) {
  const two = schedule.frequency === FREQUENCY.TWICE_WEEKLY;
  const max = two ? 2 : 1;
  const days = schedule.days || [];
  const hint = daysHint(medication, days);

  const toggle = (index) => {
    const has = days.includes(index);
    const next = has
      ? days.filter((d) => d !== index)
      : [...days, index].slice(-max);
    onChange({ ...schedule, days: next.sort((a, b) => a - b) });
  };

  return (
    <div>
      <p className="text-[14px] font-semibold text-gray-600 mb-2">
        {two ? "Injection days" : "Injection day"}
        <span className="font-normal text-gray-400"> · {two ? "choose two" : "choose one"}</span>
      </p>
      <div
        className="flex gap-1 justify-between"
        role="group"
        aria-label={two ? "Injection days" : "Injection day"}
      >
        {DAY_LETTERS.map((letter, index) => {
          const selected = days.includes(index);
          return (
            <button
              key={DAY_NAMES[index]}
              type="button"
              onClick={() => toggle(index)}
              aria-pressed={selected}
              aria-label={DAY_NAMES[index]}
              className={`w-10 h-10 rounded-full text-[14px] font-medium transition-all active:scale-95 ${
                selected
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {letter}
            </button>
          );
        })}
      </div>
      {hint && <p className="text-[12.5px] text-orange-700 leading-snug mt-2">{hint}</p>}
    </div>
  );
}