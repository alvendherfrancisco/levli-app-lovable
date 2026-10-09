import React from "react";
import { useAppState } from "@/lib/AppState";
import { parseShotDate, toDayKey } from "@/lib/dateUtils";
import { sound } from "@/lib/sounds";
import { HELPER_TEXT } from "@/lib/uiStyles";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * The five-day strip: the two days either side of today, one compact pill each.
 * The month is said once above the strip rather than under every day. The chosen
 * day is a light indigo fill with a thin indigo border and indigo text; every
 * other day is plain grey. A small teal dot marks a day a dose was logged on.
 */
export default function DateStrip({ selectedDate, onSelectDate }) {
  const { shots } = useAppState();
  const today = new Date();
  const selected = selectedDate || today;

  const shotDayKeys = new Set(shots.map((s) => {
    const d = parseShotDate(s.date);
    return d ? toDayKey(d) : null;
  }).filter(Boolean));

  const days = [];
  for (let i = -2; i <= 2; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }

  return (
    <div className="pb-1">
      <p className={`${HELPER_TEXT} mb-2`}>
        {MONTH_NAMES[selected.getMonth()]} {selected.getFullYear()}
      </p>
      <div className="flex items-center gap-2">
        {days.map((d) => {
          const isSelected = d.getDate() === selected.getDate()
            && d.getMonth() === selected.getMonth()
            && d.getFullYear() === selected.getFullYear();
          const hasShot = shotDayKeys.has(toDayKey(d));
          return (
            <button
              key={d.getTime()}
              onClick={() => { sound.tap(); onSelectDate && onSelectDate(d); }}
              aria-pressed={isSelected}
              className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-full border py-1.5 transition-colors ${
                isSelected
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-500/40 dark:bg-indigo-500/10 dark:text-indigo-300"
                  : "border-transparent text-gray-400 dark:text-[#9A9DAE]"
              }`}
            >
              <span className="text-[11px] leading-none">{DAY_NAMES[d.getDay()]}</span>
              <span className="text-[16px] font-medium leading-tight">{d.getDate()}</span>
              <span
                aria-hidden="true"
                className={`h-1.5 w-1.5 rounded-full ${hasShot ? "bg-teal-400" : "bg-transparent"}`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}