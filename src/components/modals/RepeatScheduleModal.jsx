import React, { useState, useEffect } from "react";
import { X, Save, Pause, Play, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAppState } from "@/lib/AppState";
import DoseChips from "@/components/modals/DoseChips";
import { getDoseChips, withCustomDose } from "@/lib/doseOptions";
import { addDaysToKey, shiftWeekday, shotDateFromKey } from "@/lib/repeatSchedule";

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 0]; // Mon → Sun
const WEEKDAY_LABELS = { 0: "S", 1: "M", 2: "T", 3: "W", 4: "T", 5: "F", 6: "S" };

/**
 * Edit / pause / cancel an active repeat schedule.
 */
export default function RepeatScheduleModal({ open, onClose, schedule }) {
  const { updateRepeatSchedule, profile, setProfile } = useAppState();
  const [dose, setDose] = useState("");
  const [unit, setUnit] = useState("mg");
  const [time, setTime] = useState("08:00");
  const [mode, setMode] = useState("weeks");
  const [weeks, setWeeks] = useState("12");
  const [startDate, setStartDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !schedule) return;
    setDose(schedule.dose != null ? String(schedule.dose) : "");
    setUnit(schedule.dose_unit || "mg");
    setTime(schedule.time || "08:00");
    setMode(schedule.repeat_mode || "weeks");
    setWeeks(schedule.repeat_weeks ? String(schedule.repeat_weeks) : "12");
    setStartDate(schedule.start_date || "");
    setNotes(schedule.notes || "");
  }, [open, schedule]);

  if (!open || !schedule) return null;

  const active = schedule.status === "active";
  const weeksNum = Math.max(1, parseInt(weeks, 10) || 12);

  // Saves a custom dose on the profile so it becomes a chip next time.
  const addCustomDose = async (value) => {
    await setProfile({ ...profile, custom_doses: withCustomDose(profile?.custom_doses || [], schedule.medication, value) });
    setDose(String(value));
  };

  const handleSave = async () => {
    const doseNum = parseFloat(dose);
    if (isNaN(doseNum) || doseNum <= 0) { toast.error("Enter a valid dose"); return; }
    setSaving(true);
    try {
      await updateRepeatSchedule(schedule.id, {
        dose: doseNum,
        dose_unit: unit,
        time,
        start_date: startDate,
        repeat_mode: mode,
        repeat_weeks: mode === "weeks" ? weeksNum : 0,
        end_date: mode === "weeks" ? addDaysToKey(startDate, (weeksNum - 1) * 7) : "",
        notes: notes || "",
      });
      toast.success("Repeat schedule updated");
      onClose();
    } catch (e) {
      toast.error("Could not update the schedule");
    }
    setSaving(false);
  };

  const togglePause = async () => {
    if (active) {
      await updateRepeatSchedule(schedule.id, { status: "paused" });
      toast("Repeat paused — no reminders until you resume");
    } else {
      await updateRepeatSchedule(schedule.id, { status: "active", start_date: shiftWeekday(startDate || schedule.start_date, new Date().getDay()) });
      toast.success("Repeat resumed");
    }
    onClose();
  };

  const handleCancel = async () => {
    if (!confirm(`Cancel the repeat for ${schedule.medication}? Your logged doses stay in your history.`)) return;
    await updateRepeatSchedule(schedule.id, { status: "cancelled" });
    toast("Repeat cancelled");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white dark:bg-[#0f1117] rounded-t-3xl sm:rounded-3xl w-full sm:max-w-[520px] max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom sm:mx-4 dark:shadow-[0_-8px_40px_rgba(0,0,0,0.5)]">
        <div className="sticky top-0 z-10 bg-white dark:bg-[#0f1117]">
          <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 bg-gray-300 rounded-full" /></div>
          <div className="flex items-center justify-between px-5 pb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-[#E8E9F0]">Repeat schedule</h2>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{schedule.medication}</p>
            </div>
            <button onClick={onClose}><X size={22} className="text-gray-400" /></button>
          </div>
        </div>

        <div className="px-5 pb-4 space-y-5">
          {/* Dose */}
          <div>
            <DoseChips
              key={schedule.medication}
              options={getDoseChips(schedule.medication, profile?.custom_doses || [])}
              value={parseFloat(dose)}
              unit={unit}
              onSelect={(v) => setDose(String(v))}
              onAddCustom={addCustomDose}
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Titrating up? Changing this updates every remaining repeat dose.</p>
          </div>

          {/* Day of week */}
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Repeat day</label>
            <div className="flex gap-1.5 justify-between">
              {WEEKDAYS.map((dow) => {
                const selected = startDate && new Date(startDate + "T00:00").getDay() === dow;
                return (
                  <button
                    key={dow}
                    onClick={() => setStartDate(shiftWeekday(startDate, dow))}
                    className={`w-10 h-10 rounded-full text-sm font-medium transition-all active:scale-95 ${selected
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-[#9A9DAE]"}`}
                  >
                    {WEEKDAY_LABELS[dow]}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              Next dose {startDate ? shotDateFromKey(startDate) : "—"}
            </p>
          </div>

          {/* Time */}
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Time of day</label>
            <input
              type="time" value={time} onChange={(e) => setTime(e.target.value)}
              className="w-full border border-gray-200 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-[#E8E9F0] rounded-xl px-4 py-3 text-base outline-none focus:border-indigo-300"
            />
          </div>

          {/* Course length */}
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">How long?</label>
            <div className="flex gap-2">
              {[{ v: "weeks", l: "Number of weeks" }, { v: "until_change", l: "Until I change it" }].map((o) => (
                <button
                  key={o.v}
                  onClick={() => setMode(o.v)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border ${mode === o.v
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white dark:bg-white/[0.05] text-gray-500 dark:text-[#9A9DAE] border-gray-200 dark:border-white/[0.1]"}`}
                >
                  {o.l}
                </button>
              ))}
            </div>
            {mode === "weeks" && (
              <div className="flex items-center gap-2 mt-3">
                <input
                  type="number" min="1" max="104" value={weeks} onChange={(e) => setWeeks(e.target.value)}
                  className="w-24 border border-gray-200 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-[#E8E9F0] rounded-xl px-4 py-2.5 text-base outline-none focus:border-indigo-300"
                />
                <span className="text-sm text-gray-500 dark:text-[#9A9DAE]">weeks</span>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Notes (Optional)</label>
            <textarea
              value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              className="w-full border border-gray-200 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-[#E8E9F0] rounded-xl px-4 py-3 text-sm resize-none outline-none focus:border-indigo-300"
            />
          </div>

          {!active && (
            <p className="text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 rounded-xl px-3 py-2">
              This repeat is {schedule.status}. Resuming schedules the next dose on your chosen day.
            </p>
          )}
        </div>

        <div className="h-24" />
        <div className="sticky bottom-0 px-5 pb-modal-footer pt-2 bg-white dark:bg-[#0f1117] border-t border-gray-100 dark:border-white/[0.08] space-y-2">
          <button
            onClick={handleSave} disabled={saving}
            className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <Save size={16} /> {saving ? "Saving…" : "Save changes"}
          </button>
          <div className="flex gap-2">
            <button
              onClick={togglePause}
              className="flex-1 py-3 rounded-xl bg-gray-50 dark:bg-white/[0.06] text-gray-600 dark:text-[#9A9DAE] font-semibold text-sm flex items-center justify-center gap-2 border border-gray-100 dark:border-white/[0.08]"
            >
              {active ? <Pause size={16} /> : <Play size={16} />} {active ? "Pause repeat" : "Resume repeat"}
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 py-3 rounded-xl bg-gray-50 dark:bg-white/[0.06] text-red-500 font-semibold text-sm flex items-center justify-center gap-2 border border-gray-100 dark:border-white/[0.08]"
            >
              <Trash2 size={16} /> Cancel repeat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}