import React, { useState } from "react";
import { Repeat, Pause, Play, Pencil, X, CalendarX } from "lucide-react";
import { toast } from "@/lib/toast";
import { useAppState } from "@/lib/AppState";
import DoseBadge from "@/components/DoseBadge";
import ConfirmDialog from "@/components/ConfirmDialog";
import {
  describeRepeat, shotDateFromKey, getNextOccurrence, summarizeSchedule, nextOnOrAfter,
} from "@/lib/repeatSchedule";

/**
 * One repeat schedule with its view / edit / pause / cancel actions.
 */
export default function RepeatScheduleCard({ schedule, onEdit }) {
  const { updateRepeatSchedule, shots } = useAppState();
  const [askingCancel, setAskingCancel] = useState(false);
  const active = schedule.status === "active";
  const { total, confirmed, remaining } = summarizeSchedule(schedule, shots);
  const nextKey = getNextOccurrence(schedule);

  const detail = schedule.repeat_mode === "until_change"
    ? `Until you change it · ${confirmed} confirmed`
    : `${total}-week course · ${confirmed} confirmed · ${remaining} left`;

  const togglePause = async () => {
    if (active) {
      await updateRepeatSchedule(schedule.id, { status: "paused" });
      toast.success("Repeat paused");
    } else {
      await updateRepeatSchedule(schedule.id, {
        status: "active",
        start_date: nextOnOrAfter(schedule.start_date),
      });
      toast.success("Repeat resumed");
    }
  };

  // Cancelling asks first, in the app's own dialog — the ask is what the button
  // does, and this is the work it does once the answer is yes.
  const cancel = async () => {
    await updateRepeatSchedule(schedule.id, { status: "cancelled" });
    toast.deleted("Repeat cancelled");
    setAskingCancel(false);
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/15 flex items-center justify-center flex-shrink-0">
            <Repeat size={18} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-gray-900 dark:text-white text-sm break-words flex items-center gap-1.5 flex-wrap">
              <DoseBadge medication={schedule.medication} dose={schedule.dose} unit={schedule.dose_unit || "mg"} className="text-sm" />
              {schedule.medication}
            </p>
            <p className="text-xs text-gray-500 dark:text-[#9A9DAE] mt-0.5">{describeRepeat(schedule)}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{detail}</p>
            <p className="text-xs text-indigo-500 dark:text-indigo-400 mt-0.5">
              {active && nextKey ? `Next dose ${shotDateFromKey(nextKey)}` : "Paused"}
            </p>
          </div>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap flex-shrink-0 ${active
          ? "bg-teal-100 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400"
          : "bg-orange-100 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400"}`}
        >
          {schedule.status}
        </span>
      </div>

      <div className="flex gap-2 mt-3">
        <button
          onClick={() => onEdit(schedule)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 text-sm font-semibold"
        >
          <Pencil size={14} /> Edit
        </button>
        <button
          onClick={togglePause}
          className="btn-pill btn-pill-sm btn-secondary flex-1"
        >
          {active ? <Pause size={14} /> : <Play size={14} />} {active ? "Pause" : "Resume"}
        </button>
        <button
          onClick={() => setAskingCancel(true)}
          className="btn-pill btn-pill-sm btn-danger flex-1"
        >
          <X size={14} /> Cancel
        </button>
      </div>

      <ConfirmDialog
        open={askingCancel}
        tone="destructive"
        icon={CalendarX}
        title="Cancel repeat?"
        message={<><strong className="font-semibold text-gray-900 dark:text-white">{schedule.medication}</strong> will stop repeating. Your logged doses stay in your history.</>}
        confirmLabel="Cancel repeat"
        cancelLabel="Keep repeat"
        onConfirm={cancel}
        onCancel={() => setAskingCancel(false)}
      />
    </div>
  );
}