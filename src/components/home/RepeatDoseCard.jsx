import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Loader2, Repeat, Pencil, SkipForward, ChevronRight } from "lucide-react";
import { toast } from "@/lib/toast";
import { useAppState } from "@/lib/AppState";
import DoseBadge from "@/components/DoseBadge";
import { todayKey } from "@/lib/dateUtils";
import {
  shotDateFromKey, inputTimeToShotTime, shotTimeToInput, describeRepeat, getNextOccurrence,
} from "@/lib/repeatSchedule";

/**
 * Shot-day card for repeat schedules: one tap confirms the dose exactly as
 * set up, with Edit / Skip for anything different. Nothing is logged until
 * the user taps Confirm.
 */
export default function RepeatDoseCard({ onEdit }) {
  const { pendingRepeatDoses, repeatSchedules, confirmRepeatDose, skipRepeatDose } = useAppState();
  const [busyKey, setBusyKey] = useState(null);
  const today = todayKey();

  const activeSchedules = repeatSchedules.filter((s) => s.status === "active");
  const pending = pendingRepeatDoses.slice(0, 3);
  const morePending = pendingRepeatDoses.length - pending.length;

  if (pending.length === 0 && activeSchedules.length === 0) return null;

  const handleConfirm = async (schedule, dayKey) => {
    setBusyKey(schedule.id + dayKey);
    try {
      await confirmRepeatDose(schedule, dayKey);
      toast.success("Dose confirmed and logged");
    } catch (e) {
      toast.error("Could not log that dose");
    }
    setBusyKey(null);
  };

  const handleSkip = async (schedule, dayKey) => {
    try {
      await skipRepeatDose(schedule, dayKey);
      toast.success("Dose skipped — nothing logged");
    } catch (e) {
      toast.error("Could not skip that dose");
    }
  };

  const buildPreset = (schedule, dayKey) => ({
    medication: schedule.medication,
    medication_id: schedule.medication_id || "",
    dose: schedule.dose,
    dose_unit: schedule.dose_unit || "mg",
    concentration: schedule.concentration || "",
    route: schedule.route,
    device_type: schedule.device_type || "",
    notes: schedule.notes || "",
    date: dayKey,
    time: shotTimeToInput(schedule.time),
  });

  return (
    <>
      {pending.map(({ schedule, dayKey, daysLate }) => {
        const isToday = dayKey === today;
        const busy = busyKey === schedule.id + dayKey;
        return (
          <div
            key={schedule.id + dayKey}
            className="mx-4 mb-4 rounded-2xl border border-indigo-200 dark:border-indigo-500/25 bg-indigo-50 dark:bg-indigo-500/10 p-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0">
                <Repeat size={18} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-indigo-900 dark:text-indigo-200">
                  {isToday ? "Shot day — ready when you are" : `${daysLate} day${daysLate === 1 ? "" : "s"} late`}
                </p>
                <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                  <DoseBadge medication={schedule.medication} dose={schedule.dose} unit={schedule.dose_unit || "mg"} />
                  <p className="text-xs text-indigo-700/80 dark:text-indigo-300/80">
                    {schedule.medication} ·{" "}
                    {isToday
                      ? `due today at ${inputTimeToShotTime(schedule.time)}`
                      : `was due ${shotDateFromKey(dayKey)}`}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleConfirm(schedule, dayKey)}
              disabled={busy}
              className="mt-3 w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.99] transition-transform"
            >
              {busy ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} strokeWidth={3} />}
              {busy ? "Logging…" : "Confirm dose"}
            </button>

            <div className="flex gap-2 mt-2">
              <button
                onClick={() => onEdit?.(buildPreset(schedule, dayKey))}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white dark:bg-white/[0.06] border border-indigo-200 dark:border-indigo-500/25 text-indigo-700 dark:text-indigo-300 text-sm font-semibold"
              >
                <Pencil size={14} /> Edit details
              </button>
              <button
                onClick={() => handleSkip(schedule, dayKey)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.1] text-gray-500 dark:text-[#9A9DAE] text-sm font-semibold"
              >
                <SkipForward size={14} /> Skip
              </button>
            </div>

            <p className="text-[11px] text-indigo-600/70 dark:text-indigo-300/60 mt-2 text-center">
              Nothing is logged until you tap Confirm.
            </p>
          </div>
        );
      })}

      {morePending > 0 && (
        <p className="mx-4 -mt-2 mb-4 text-xs text-gray-400 dark:text-gray-500">
          {morePending} more repeat dose{morePending === 1 ? "" : "s"} waiting — confirm or skip these first.
        </p>
      )}

      {pending.length === 0 &&
        activeSchedules.map((schedule) => {
          const nextKey = getNextOccurrence(schedule);
          return (
            <Link
              key={schedule.id}
              to="/medications"
              className="mx-4 mb-4 flex items-center justify-between gap-3 bg-white dark:bg-gray-900 rounded-2xl p-3.5 shadow-sm border border-gray-100 dark:border-gray-800"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/15 flex items-center justify-center flex-shrink-0">
                  <Repeat size={18} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1.5 min-w-0">
                    Repeating
                    <DoseBadge medication={schedule.medication} dose={schedule.dose} unit={schedule.dose_unit || "mg"} />
                    <span className="truncate">{schedule.medication}</span>
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                    {describeRepeat(schedule)}
                    {nextKey ? ` · next ${shotDateFromKey(nextKey)}` : ""}
                  </p>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />
            </Link>
          );
        })}
    </>
  );
}