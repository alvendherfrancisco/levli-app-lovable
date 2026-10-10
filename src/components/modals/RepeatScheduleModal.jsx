import React, { useState, useEffect } from "react";
import { X, Save, Pause, Play, Trash2, CalendarX } from "lucide-react";
import { toast } from "@/lib/toast";
import useModal from "@/hooks/useModal";
import { useAppState } from "@/lib/AppState";
import DoseChips from "@/components/modals/DoseChips";
import ConfirmDialog from "@/components/ConfirmDialog";
import OptionChips from "@/components/OptionChips";
import TimeInput from "@/components/TimeInput";
import { chipsForMedication, withCustomDose } from "@/lib/doseOptions";
import { addDaysToKey, shiftWeekday, shotDateFromKey } from "@/lib/repeatSchedule";
import { sound } from "@/lib/sounds";

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 0]; // Mon → Sun
const WEEKDAY_LABELS = { 0: "S", 1: "M", 2: "T", 3: "W", 4: "T", 5: "F", 6: "S" };

/**
 * Edit / pause / cancel an active repeat schedule.
 */
export default function RepeatScheduleModal({ open, onClose, schedule }) {
  const { updateRepeatSchedule, profile, setProfile, medications } = useAppState();
  const [dose, setDose] = useState("");
  const [unit, setUnit] = useState("mg");
  const [time, setTime] = useState("08:00");
  const [mode, setMode] = useState("weeks");
  const [weeks, setWeeks] = useState("12");
  const [startDate, setStartDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [askingCancel, setAskingCancel] = useState(false);

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

  const sheetRef = useModal({ open: open && !!schedule, onDismiss: onClose });

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
      sound.success();
      toast.success("Repeat schedule updated");
      onClose();
    } catch (e) {
      toast.error("Couldn't save. Please try again.", { actionLabel: "Retry", onAction: handleSave });
    }
    setSaving(false);
  };

  const togglePause = async () => {
    sound.tap();
    if (active) {
      await updateRepeatSchedule(schedule.id, { status: "paused" });
      toast.success("Repeat paused until you resume");
    } else {
      await updateRepeatSchedule(schedule.id, { status: "active", start_date: shiftWeekday(startDate || schedule.start_date, new Date().getDay()) });
      toast.success("Repeat resumed");
    }
    onClose();
  };

  // Cancelling asks first, in the app's own dialog; this is the work it does
  // once the answer is yes.
  const handleCancel = async () => {
    await updateRepeatSchedule(schedule.id, { status: "cancelled" });
    toast.deleted("Repeat cancelled");
    onClose();
  };

  return (
    <>
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 overlay-lock" onClick={onClose} aria-hidden="true" />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label="Repeat schedule"
        tabIndex={-1}
        className="relative bg-white dark:bg-[#0f1117] rounded-t-3xl sm:rounded-3xl w-full sm:max-w-[520px] max-h-[92dvh] overflow-y-auto overflow-x-hidden no-scrollbar sheet-lock animate-in slide-in-from-bottom sm:mx-4 dark:shadow-[0_-8px_40px_rgba(0,0,0,0.5)] outline-none"
      >
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
              medication={schedule.medication}
              options={chipsForMedication(
                medications.find((m) => (schedule.medication_id && m.id === schedule.medication_id)
                  || m.medication_name === schedule.medication) || { medication_name: schedule.medication },
                profile?.custom_doses || [],
              )}
              value={parseFloat(dose)}
              unit={unit}
              onSelect={(v) => setDose(String(v))}
              onAddCustom={addCustomDose}
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Titrating up? Changing this updates every remaining repeat dose.</p>
          </div>

          {/* Day of week — a required choice: the day can be moved to another
              one, but the last selected day cannot be removed. */}
          <div>
            <OptionChips
              label="Repeat day"
              options={WEEKDAYS.map((dow) => ({ value: dow, label: WEEKDAY_LABELS[dow] }))}
              value={startDate ? new Date(startDate + "T00:00").getDay() : null}
              onChange={(dow) => { if (dow != null) setStartDate(shiftWeekday(startDate, dow)); }}
              required
              showCheck={false}
              soundOnSelect
              blockedMessage="Pick at least one day."
              chipClass="w-10 h-10 rounded-full text-sm font-medium transition-all active:scale-95 inline-flex items-center justify-center"
              selectedClass="bg-indigo-600 text-white"
              unselectedClass="bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-[#9A9DAE]"
              wrapClass="flex gap-1.5 justify-between"
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              Next dose {startDate ? shotDateFromKey(startDate) : "—"}
            </p>
          </div>

          {/* Time */}
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Time of day</label>
            <TimeInput value={time} onChange={setTime} ariaLabel="Time of day" />
          </div>

          {/* Course length */}
          <div>
            <OptionChips
              label="How long?"
              options={[{ value: "weeks", label: "Number of weeks" }, { value: "until_change", label: "Until I change it" }]}
              value={mode}
              onChange={setMode}
              required
              soundOnSelect
              chipClass="flex-1 min-w-0 py-2.5 rounded-xl text-sm font-medium border text-center inline-flex items-center justify-center gap-1.5"
              selectedClass="bg-indigo-600 text-white border-indigo-600"
              unselectedClass="bg-white dark:bg-white/[0.05] text-gray-500 dark:text-[#9A9DAE] border-gray-200 dark:border-white/[0.1]"
              wrapClass="flex gap-2"
            />
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

        <div className="sticky bottom-0 px-5 pt-3 bg-white dark:bg-[#0f1117] border-t border-gray-100 dark:border-white/[0.08] space-y-2" style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))" }}>
          <button
            onClick={handleSave} disabled={saving}
            className="w-full py-3.5 btn-pill btn-primary font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <Save size={16} /> {saving ? "Saving…" : "Save changes"}
          </button>
          <div className="flex gap-2">
            <button
              onClick={togglePause}
              className="btn-pill btn-secondary flex-1"
            >
              {active ? <Pause size={16} /> : <Play size={16} />} {active ? "Pause repeat" : "Resume repeat"}
            </button>
            <button
              onClick={() => setAskingCancel(true)}
              className="btn-pill btn-danger flex-1"
            >
              <Trash2 size={16} /> Cancel repeat
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* Its own dialog sits outside the sheet, so it dims the sheet as well. */}
    <ConfirmDialog
      open={askingCancel}
      tone="destructive"
      icon={CalendarX}
      title="Cancel repeat?"
      message={<><strong className="font-semibold text-gray-900 dark:text-white">{schedule.medication}</strong> will stop repeating. Your logged doses stay in your history.</>}
      confirmLabel="Cancel repeat"
      cancelLabel="Keep repeat"
      onConfirm={handleCancel}
      onCancel={() => setAskingCancel(false)}
    />
    </>
  );
}