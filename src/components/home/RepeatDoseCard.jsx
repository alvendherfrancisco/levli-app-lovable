import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Repeat, Pencil, SkipForward, ChevronRight } from "lucide-react";
import { toast } from "@/lib/toast";
import { useAppState } from "@/lib/AppState";
import DoseBadge from "@/components/DoseBadge";
import { CARD } from "@/lib/cardStyles";
import { todayKey } from "@/lib/dateUtils";
import { logWords } from "@/lib/medicationForm";
import {
  shotDateFromKey, inputTimeToShotTime, shotTimeToInput, describeRepeat, getNextOccurrence,
} from "@/lib/repeatSchedule";

/**
 * Repeat-day card: one tap confirms the dose exactly as it was set up, with
 * Edit / Skip for anything different. Nothing is logged until the user taps
 * Confirm.
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
      toast.success("Dose skipped, nothing logged");
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
        // A repeat for a tablet is a dose day; for an injection, a shot day.
        const words = logWords(schedule.medication, { route: schedule.route });
        return (
          <div
            key={schedule.id + dayKey}
            className="mx-4 mb-4 rounded-2xl border border-indigo-200 dark:border-indigo-500/25 bg-indigo-50 dark:bg-indigo-500/10 p-4"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
                <Repeat size={16} className="text-white" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-indigo-900 dark:text-indigo-200">
                  {isToday ? `${words.One} day, ready when you are` : `${daysLate} day${daysLate === 1 ? "" : "s"} late`}
                </p>
                <div className="flex items-center gap-1.5 flex-wrap mt-3">
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
              className="btn-pill btn-primary mt-3 active:scale-[0.99]"
            >
              {busy && <Loader2 size={18} className="animate-spin" />}
              {busy ? "Logging…" : "Confirm dose"}
            </button>

            <div className="flex gap-2 mt-3">
              <button
                onClick={() => onEdit?.(buildPreset(schedule, dayKey))}
                className="btn-pill btn-pill-sm btn-secondary flex-1"
              >
                <Pencil size={14} /> Edit details
              </button>
              <button
                onClick={() => handleSkip(schedule, dayKey)}
                className="btn-pill btn-pill-sm btn-secondary flex-1"
              >
                <SkipForward size={14} /> Skip
              </button>
            </div>

            <p className="text-[11px] text-indigo-600/70 dark:text-indigo-300/60 mt-3 text-center">
              Nothing is logged until you tap Confirm.
            </p>
          </div>
        );
      })}

      {morePending > 0 && (
        <p className="mx-4 mb-4 text-xs text-gray-400 dark:text-gray-500">
          {morePending} more repeat dose{morePending === 1 ? "" : "s"} waiting. Confirm or skip these first.
        </p>
      )}

      {pending.length === 0 &&
        activeSchedules.map((schedule) => {
          const nextKey = getNextOccurrence(schedule);
          return (
            <Link
              key={schedule.id}
              to="/medications"
              className={`${CARD} mx-4 mb-4 flex items-center justify-between gap-3 p-4`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                  <Repeat size={16} className="text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
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