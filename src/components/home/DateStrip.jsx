import React from "react";
import { useAppState } from "@/lib/AppState";
import { parseShotDate, toDayKey } from "@/lib/dateUtils";
import { sound } from "@/lib/sounds";

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

  const dayNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  return (
    <div className="flex items-center justify-center gap-1.5 sm:gap-3 py-3 px-3">
      {days.map((d) => {
        const isSelected = d.getDate() === selected.getDate() && d.getMonth() === selected.getMonth() && d.getFullYear() === selected.getFullYear();
        const hasShot = shotDayKeys.has(toDayKey(d));
        return (
          <button
            key={d.getTime()}
            onClick={() => { sound.tap(); onSelectDate && onSelectDate(d); }}
            className={`flex flex-col items-center gap-0.5 px-2 sm:px-3 py-2 rounded-2xl flex-1 min-w-0 max-w-[64px] transition-all ${
              isSelected
                ? "bg-indigo-600 dark:bg-indigo-500/80 text-white shadow-lg dark:[box-shadow:0_0_18px_4px_rgba(99,102,241,0.35)]"
                : "text-gray-400 dark:text-[#9A9DAE]"
            }`}
          >
            <span className="text-xs font-medium">{dayNames[d.getDay()]}</span>
            <span className={`text-base sm:text-lg font-bold ${isSelected ? "text-white" : "text-gray-600 dark:text-[#E8E9F0]"}`}>{d.getDate()}</span>
            <span className={`text-xs ${isSelected ? "text-indigo-200 dark:text-indigo-200" : "text-gray-500 dark:text-[#9A9DAE]"}`}>{monthNames[d.getMonth()]}</span>
            {hasShot && (
              <div
                className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-0.5"
                style={{ boxShadow: "0 0 6px 2px rgba(45,212,191,0.5)" }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}