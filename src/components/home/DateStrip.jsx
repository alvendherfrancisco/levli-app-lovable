import React from "react";
import { useAppState } from "@/lib/AppState";
import { parseShotDate, toDayKey } from "@/lib/dateUtils";
import { sound } from "@/lib/sounds";

/**
 * The day strip on Home: five days, the day in hand in the middle.
 *
 * The strip is a five-column grid sized by the screen (the same 12px side
 * margin the cards below use) and nothing else, so each day takes an equal
 * fifth of that width whatever its text is: no tile has a width of its own, and
 * nothing here scrolls sideways. Picking another day re-centres the strip on
 * it, so the day in hand is always the middle tile with two days either side.
 *
 * Each day stays the soft tile the highlighted day has always been — gently
 * rounded corners, the one shape in the app that is not a pill (see .date-chip
 * in src/index.css) — with the weekday, the date and the month stacked inside
 * it, a teal dot pinned to the tile's foot on a day with something logged, and
 * the indigo fill on the day in hand.
 */
const EACH_SIDE = 2;

export default function DateStrip({ selectedDate, onSelectDate }) {
  const { shots } = useAppState();
  const today = new Date();
  const selected = selectedDate || today;

  const shotDayKeys = new Set(shots.map((s) => {
    const d = parseShotDate(s.date);
    return d ? toDayKey(d) : null;
  }).filter(Boolean));

  const days = [];
  for (let i = -EACH_SIDE; i <= EACH_SIDE; i++) {
    const d = new Date(selected);
    d.setDate(selected.getDate() + i);
    days.push(d);
  }

  const dayNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  return (
    // 12px side margin, to line the first and last tile up with the cards
    // below; 24px below the strip, so the day in hand sits clear of the card
    // that follows.
    <div className="grid grid-cols-5 gap-1.5 px-3 pt-3 pb-6">
      {days.map((d) => {
        const isSelected = d.getDate() === selected.getDate() && d.getMonth() === selected.getMonth() && d.getFullYear() === selected.getFullYear();
        const hasShot = shotDayKeys.has(toDayKey(d));
        return (
          <button
            key={d.getTime()}
            onClick={() => { sound.tap(); onSelectDate && onSelectDate(d); }}
            aria-current={isSelected ? "date" : undefined}
            className={`date-chip relative flex min-w-0 w-full h-[72px] flex-col items-center justify-center gap-0.5 transition-all ${
              isSelected
                ? "bg-indigo-600 dark:bg-indigo-500/80 text-white shadow-lg dark:[box-shadow:0_0_18px_4px_rgba(99,102,241,0.35)]"
                : "text-gray-400 dark:text-[#9A9DAE]"
            }`}
          >
            <span className="text-[10px] font-medium leading-none">{dayNames[d.getDay()]}</span>
            <span className={`text-[15px] font-bold leading-none ${isSelected ? "text-white" : "text-gray-600 dark:text-[#E8E9F0]"}`}>{d.getDate()}</span>
            <span className={`text-[10px] leading-none ${isSelected ? "text-indigo-200" : "text-gray-500 dark:text-[#9A9DAE]"}`}>{monthNames[d.getMonth()]}</span>
            {hasShot && (
              <div
                className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-teal-400"
                style={{ boxShadow: "0 0 6px 2px rgba(45,212,191,0.5)" }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}