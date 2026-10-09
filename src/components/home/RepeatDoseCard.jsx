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
import {
  CARD, CARD_TITLE, BODY_TEXT, HELPER_TEXT, BTN_PRIMARY_WIDE, BTN_QUIET,
} from "@/lib/uiStyles";

/**
 * Dose-day card for repeat schedules: one tap confirms the dose exactly as set
 * up, with Edit / Skip for anything different. Nothing is logged until the user
 * taps Confirm.
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
        return (
          <div
            key={schedule.id + dayKey}
            className="rounded-2xl border border-indigo-500 bg-indigo-50 p-5 dark:border-indigo-500/40 dark:bg-indigo-500/10"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600">
                <Repeat size={18} className="text-white" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-medium text-indigo-700 dark:text-indigo-300">
                  {isToday ? "Dose day, ready when you are" : `${daysLate} day${daysLate === 1 ? "" : "s"} late`}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <DoseBadge medication={schedule.medication} dose={schedule.dose} unit={schedule.dose_unit || "mg"} />
                  <p className="text-[13px] text-indigo-600/90 dark:text-indigo-300/80">
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
              className={`${BTN_PRIMARY_WIDE} mt-4 disabled:opacity-60`}
            >
              {busy ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} strokeWidth={2.5} />}
              {busy ? "Logging…" : "Confirm dose"}
            </button>

            <div className="mt-2 flex gap-2">
              <button onClick={() => onEdit?.(buildPreset(schedule, dayKey))} className={`${BTN_QUIET} flex-1`}>
                <Pencil size={14} aria-hidden="true" /> Edit details
              </button>
              <button onClick={() => handleSkip(schedule, dayKey)} className={`${BTN_QUIET} flex-1`}>
                <SkipForward size={14} aria-hidden="true" /> Skip
              </button>
            </div>

            <p className={`${HELPER_TEXT} mt-2 text-center`}>
              Nothing is logged until you tap Confirm.
            </p>
          </div>
        );
      })}

      {morePending > 0 && (
        <p className={HELPER_TEXT}>
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
              className={`${CARD} flex items-center justify-between gap-3`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-500/15">
                  <Repeat size={18} className="text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="flex min-w-0 items-center gap-1.5 text-[15px] font-medium text-gray-900 dark:text-white">
                    Repeating
                    <DoseBadge medication={schedule.medication} dose={schedule.dose} unit={schedule.dose_unit || "mg"} />
                    <span className="truncate">{schedule.medication}</span>
                  </p>
                  <p className={`${BODY_TEXT} truncate`}>
                    {describeRepeat(schedule)}
                    {nextKey ? ` · next ${shotDateFromKey(nextKey)}` : ""}
                  </p>
                </div>
              </div>
              <ChevronRight size={16} className="flex-shrink-0 text-gray-300 dark:text-gray-600" aria-hidden="true" />
            </Link>
          );
        })}
    </>
  );
}