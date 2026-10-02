import React from "react";
import { Repeat, CalendarClock } from "lucide-react";
import {
  addDaysToKey, weekdayName, weekdayOfKey, shotDateFromKey, inputTimeToShotTime,
} from "@/lib/repeatSchedule";

const PRESETS = [4, 8, 12, 26, 52];

/**
 * "Repeat this dose" control inside the Add Shot modal. Collects the course
 * length for a weekly repeat of the dose being logged.
 */
export default function RepeatOptionsField({
  enabled, onToggle, mode, onModeChange, weeks, onWeeksChange,
  schedule, dayKey, time, medication, dose, doseUnit,
}) {
  const startKey = addDaysToKey(dayKey, 7);
  const weeksNum = Math.max(1, parseInt(weeks, 10) || 12);
  const endKey = addDaysToKey(startKey, (weeksNum - 1) * 7);
  const weekday = weekdayName(weekdayOfKey(dayKey));

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/[0.1] overflow-hidden">
      <button type="button" onClick={() => onToggle(!enabled)} className="w-full flex items-start justify-between gap-3 p-3.5 text-left">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/15 flex items-center justify-center flex-shrink-0">
            <Repeat size={18} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-[#E8E9F0]">Repeat this dose</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {schedule
                ? `Updates your current repeat for ${medication}.`
                : "Log each following dose with one tap on your shot day."}
            </p>
          </div>
        </div>
        <div className={`w-12 h-7 rounded-full relative flex-shrink-0 transition-colors ${enabled ? "bg-indigo-500" : "bg-gray-300 dark:bg-gray-600"}`}>
          <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-shadow shadow ${enabled ? "translate-x-6" : "translate-x-1"}`} style={{ transitionProperty: "transform" }} />
        </div>
      </button>

      {enabled && (
        <div className="px-3.5 pb-3.5 pt-3 space-y-3 border-t border-gray-100 dark:border-white/[0.08]">
          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 block">How long?</label>
            <div className="flex gap-2">
              {[{ v: "weeks", l: "Number of weeks" }, { v: "until_change", l: "Until I change it" }].map((o) => (
                <button
                  key={o.v}
                  type="button"
                  onClick={() => onModeChange(o.v)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all active:scale-[0.98] ${mode === o.v
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white dark:bg-white/[0.05] text-gray-500 dark:text-[#9A9DAE] border-gray-200 dark:border-white/[0.1]"}`}
                >
                  {o.l}
                </button>
              ))}
            </div>
          </div>

          {mode === "weeks" && (
            <div className="flex flex-wrap gap-2 items-center">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => onWeeksChange(String(p))}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${weeksNum === p
                    ? "bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-500/30"
                    : "bg-white dark:bg-white/[0.05] text-gray-500 dark:text-[#9A9DAE] border-gray-200 dark:border-white/[0.1]"}`}
                >
                  {p}
                </button>
              ))}
              <div className="flex items-center gap-1.5 border border-gray-200 dark:border-white/[0.1] rounded-lg px-2.5 py-1.5">
                <input
                  type="number" min="1" max="104" value={weeks}
                  onChange={(e) => onWeeksChange(e.target.value)}
                  className="w-14 text-sm outline-none bg-transparent dark:text-[#E8E9F0]"
                />
                <span className="text-xs text-gray-400">weeks</span>
              </div>
            </div>
          )}

          <div className="bg-indigo-50 dark:bg-indigo-500/10 rounded-xl p-3 flex items-start gap-2">
            <CalendarClock size={16} className="text-indigo-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-indigo-700 dark:text-indigo-300">
              {dose || "—"} {doseUnit} every {weekday} at {inputTimeToShotTime(time)}, starting {shotDateFromKey(startKey)}
              {mode === "weeks"
                ? ` · ${weeksNum} weeks, last dose ${shotDateFromKey(endKey)}`
                : " · until you change it"}
            </p>
          </div>

          <p className="text-[11px] text-gray-400 dark:text-gray-500">
            Levli never logs a dose for you — every repeat dose waits for your confirmation.
          </p>
        </div>
      )}

      {!enabled && schedule && (
        <div className="px-3.5 pb-3.5">
          <p className="text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 rounded-xl px-3 py-2">
            Saving will end your repeat schedule for {medication}. Your logged doses stay in your history.
          </p>
        </div>
      )}
    </div>
  );
}