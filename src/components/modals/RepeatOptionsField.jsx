import React from "react";
import { CalendarClock } from "lucide-react";
import {
  addDaysToKey, weekdayName, weekdayOfKey, shotDateFromKey, inputTimeToShotTime,
} from "@/lib/repeatSchedule";
import DoseBadge from "@/components/DoseBadge";
import { sound } from "@/lib/sounds";
import {
  SHEET_CHIP, SHEET_CHIP_OFF, SHEET_CHIP_ON, SHEET_CHIP_SM, SHEET_HINT, SHEET_LABEL,
} from "@/components/modals/shot/sheetUi";

const PRESETS = [4, 8, 12, 26, 52];

/**
 * "Repeat this dose" inside the Add Shot Log sheet: the course length for a
 * weekly repeat of the dose being logged.
 *
 * The row itself is plain — a title, one line saying what it does, and the app's
 * own toggle on the right, with no box around it. Opening the toggle adds the
 * course length below in the same chips as the rest of the sheet.
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
    <div>
      <button
        type="button"
        onClick={() => { sound.tap(); onToggle(!enabled); }}
        role="switch"
        aria-checked={enabled}
        className="w-full flex items-center justify-between gap-4 py-3 text-left"
      >
        <span className="min-w-0">
          <span className="block text-[15px] text-gray-900 dark:text-[#E8E9F0]">Repeat this dose</span>
          <span className="mt-0.5 block text-[13px] leading-snug text-gray-500 dark:text-[#9A9DAE]">
            Log following doses on the same day.
          </span>
        </span>
        <span className={`w-12 h-7 rounded-full relative flex-shrink-0 transition-colors ${enabled ? "bg-indigo-500" : "bg-gray-300 dark:bg-gray-600"}`}>
          <span className={`w-5 h-5 bg-white rounded-full absolute top-1 shadow transition-transform ${enabled ? "translate-x-6" : "translate-x-1"}`} />
        </span>
      </button>

      {enabled && (
        <div className="pb-3 space-y-6">
          <div>
            <label className={SHEET_LABEL}>How long?</label>
            <div className="flex gap-2">
              {[{ v: "weeks", l: "Number of weeks" }, { v: "until_change", l: "Until I change it" }].map((o) => (
                <button
                  key={o.v}
                  type="button"
                  onClick={() => onModeChange(o.v)}
                  aria-pressed={mode === o.v}
                  className={`${SHEET_CHIP} flex-1 min-w-0 text-center ${mode === o.v ? SHEET_CHIP_ON : SHEET_CHIP_OFF}`}
                >
                  {o.l}
                </button>
              ))}
            </div>
          </div>

          {mode === "weeks" && (
            <div className="flex flex-wrap items-center gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => onWeeksChange(String(p))}
                  aria-pressed={weeksNum === p}
                  className={`${SHEET_CHIP_SM} ${weeksNum === p ? SHEET_CHIP_ON : SHEET_CHIP_OFF}`}
                >
                  {p}
                </button>
              ))}
              <div className="flex h-11 min-w-0 items-center gap-1.5 rounded-full border border-gray-200 dark:border-white/[0.12] pl-3.5 pr-3">
                <input
                  type="number" min="1" max="104" value={weeks}
                  onChange={(e) => onWeeksChange(e.target.value)}
                  aria-label="Number of weeks"
                  className="w-12 min-w-0 bg-transparent text-base text-gray-900 dark:text-[#E8E9F0] outline-none"
                />
                <span className={SHEET_HINT}>weeks</span>
              </div>
            </div>
          )}

          <div className="rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 px-3.5 py-3 flex items-start gap-2">
            <CalendarClock size={16} className="text-indigo-500 mt-0.5 flex-shrink-0" />
            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
              {dose ? <DoseBadge medication={medication} dose={Number(dose)} unit={doseUnit} /> : null}
              <p className="text-xs text-indigo-700 dark:text-indigo-300">
                every {weekday} at {inputTimeToShotTime(time)}, starting {shotDateFromKey(startKey)}
                {mode === "weeks"
                  ? `, ${weeksNum} weeks, last dose ${shotDateFromKey(endKey)}`
                  : ", until you change it"}
              </p>
            </div>
          </div>

          <p className={SHEET_HINT}>
            Levli never logs a dose for you. Every repeat dose waits for your confirmation.
          </p>
        </div>
      )}

      {!enabled && schedule && (
        <p className="mb-1 rounded-2xl bg-orange-50 dark:bg-orange-500/10 px-3.5 py-2.5 text-xs text-orange-700 dark:text-orange-300">
          Saving will end your repeat schedule for {medication}. Your logged doses stay in your history.
        </p>
      )}
    </div>
  );
}