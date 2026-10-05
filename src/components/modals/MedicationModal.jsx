import React, { useEffect, useState } from "react";
import { X, Save } from "lucide-react";
import { useAppState } from "@/lib/AppState";
import useModal from "@/hooks/useModal";
import { toast } from "sonner";
import { findMedicationOption, labelledSchedule, isLabelStrength, scheduleText, statusOptionsFor, validateRegimenForm,
  DOSE_STEP_HELPER, INDICATION_OPTIONS, OTHER_SCHEDULE } from "@/lib/medicationRegimen";
import { haptic } from "@/lib/haptics";
import MedicationNamePicker from "@/components/medications/MedicationNamePicker";
import DoseStrengthPicker from "@/components/medications/DoseStrengthPicker";
import ScheduleField from "@/components/medications/ScheduleField";
import IndicationField from "@/components/medications/IndicationField";

const pad = (n) => String(n).padStart(2, "0");
function todayInput() { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }

const inputClass = "w-full min-h-[60px] rounded-2xl border-2 border-gray-200 dark:border-white/[0.12] dark:bg-white/[0.05] dark:text-[#E8E9F0] px-4 py-3 text-base outline-none focus:border-indigo-400 dark:[color-scheme:dark]";

/** The single line shown under the save button. */
const FOOTER_NOTE = "This app is a tracker, not medical advice.";

/** A stored frequency string as the form's schedule choice. */
function scheduleFromStored(stored, name) {
  const text = String(stored || "").trim();
  const labelled = labelledSchedule(name);
  if (!text) return labelled;
  if (labelled && text.toLowerCase() === labelled.toLowerCase()) return labelled;
  return OTHER_SCHEDULE;
}

/**
 * Add / Edit Medication — one scrollable form. Plain-language choices, tap
 * targets that respect the phone's font setting and only the strengths the
 * product's own label lists. Nothing here suggests or adjusts a dose: a dose
 * that is not a label strength is kept, once the user has checked it against
 * their prescription.
 */
export default function MedicationModal({ open, onClose, editing }) {
  const { addMedication, updateMedication, linkShotsToMedication } = useAppState();

  const [selectedName, setSelectedName] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [customName, setCustomName] = useState("");
  const [dose, setDose] = useState("");
  const [doseConfirmed, setDoseConfirmed] = useState(false);
  const [unit, setUnit] = useState("mg");
  const [schedule, setSchedule] = useState("");
  const [scheduleOther, setScheduleOther] = useState("");
  const [indication, setIndication] = useState("");
  const [indicationOther, setIndicationOther] = useState("");
  const [startDate, setStartDate] = useState(todayInput());
  const [plannedEndDate, setPlannedEndDate] = useState("");
  const [doseStep, setDoseStep] = useState("");
  const [prescriberName, setPrescriberName] = useState("");
  const [prescriberContact, setPrescriberContact] = useState("");
  const [status, setStatus] = useState("active");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (editing) {
      const stored = editing.medication_name || "";
      const option = findMedicationOption(stored);
      const storedFrequency = String(editing.frequency || "").trim();
      const labelled = labelledSchedule(stored);
      const storedIndication = String(editing.indication || "").trim();
      setSelectedName(option ? option.value : "");
      setIsCustom(!option);
      setCustomName(option ? "" : stored);
      setDose(editing.prescribed_dose != null ? String(editing.prescribed_dose) : "");
      setDoseConfirmed(false);
      setUnit(editing.dose_unit || option?.unit || "mg");
      setSchedule(scheduleFromStored(storedFrequency, stored));
      setScheduleOther(storedFrequency && storedFrequency.toLowerCase() !== labelled.toLowerCase() ? storedFrequency : "");
      setIndication(INDICATION_OPTIONS.includes(storedIndication) ? storedIndication : storedIndication ? "Other" : "");
      setIndicationOther(INDICATION_OPTIONS.includes(storedIndication) ? "" : storedIndication);
      setStartDate(editing.start_date || todayInput());
      setPlannedEndDate(editing.planned_end_date || "");
      setDoseStep(editing.titration_stage || "");
      setPrescriberName(editing.prescriber_name || "");
      setPrescriberContact(editing.prescriber_contact || "");
      setStatus(editing.status || "active");
      setNotes(editing.notes || "");
    } else {
      setSelectedName(""); setIsCustom(false); setCustomName("");
      setDose(""); setDoseConfirmed(false); setUnit("mg");
      setSchedule(""); setScheduleOther("");
      setIndication(""); setIndicationOther("");
      setStartDate(todayInput()); setPlannedEndDate(""); setDoseStep("");
      setPrescriberName(""); setPrescriberContact(""); setStatus("active"); setNotes("");
    }
  }, [open, editing]);

  const sheetRef = useModal({ open, onDismiss: onClose });
  if (!open) return null;

  const option = isCustom ? null : findMedicationOption(selectedName);
  const ready = isCustom || !!option;
  const clearError = (field) => setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));

  const handleSelect = ({ name, isCustom: custom }) => {
    // Choosing what is already selected only closes the list — nothing is reset.
    if (custom ? isCustom : (!isCustom && name === selectedName)) return;
    setErrors({});
    setDose(""); setDoseConfirmed(false);
    if (custom) {
      setIsCustom(true);
      setSelectedName("");
      setCustomName(name);
      setUnit("mg");
      setSchedule("");
      setScheduleOther("");
      return;
    }
    const picked = findMedicationOption(name);
    setIsCustom(false);
    setSelectedName(name);
    setCustomName("");
    // Unit and frequency arrive from the product; both stay editable.
    setUnit(picked?.unit || "mg");
    setSchedule(picked?.schedule || "");
    setScheduleOther("");
  };

  const handleSave = async () => {
    const finalName = isCustom ? customName.trim() : selectedName;
    const picked = findMedicationOption(finalName);
    const doseText = String(dose ?? "").trim();
    const doseNum = Number(doseText);
    const standard = !isCustom && isLabelStrength(finalName, doseText);

    const problem = validateRegimenForm({
      selectedName, isCustom, customName, dose, doseConfirmed, isStandardDose: standard,
      startDate, plannedEndDate,
    });
    if (problem) {
      haptic("warning");
      setErrors({ [problem.field]: problem.message });
      return;
    }

    setSaving(true);
    const payload = {
      medication_name: finalName,
      generic_name: picked?.generic || "",
      route: picked?.route || "",
      prescribed_dose: doseNum,
      dose_unit: isCustom ? unit : (picked?.unit || "mg"),
      frequency: scheduleText(schedule, scheduleOther),
      indication: indication === "Other" ? indicationOther.trim() : indication,
      start_date: startDate,
      planned_end_date: plannedEndDate || null,
      titration_stage: doseStep,
      prescriber_name: prescriberName,
      prescriber_contact: prescriberContact,
      status,
      notes,
      regimen_source: "user-entered",
    };
    // A regimen marked stopped ends today, so reminders pause with it.
    if (status === "discontinued" && !editing?.discontinued_date) payload.discontinued_date = todayInput();

    try {
      if (editing) {
        await updateMedication(editing.id, payload);
        await linkShotsToMedication(payload.medication_name, editing.id);
        toast.success("Medication updated");
      } else {
        const rec = await addMedication(payload);
        // Every shot log for this medication is linked to the new record.
        const linked = await linkShotsToMedication(payload.medication_name, rec.id);
        toast.success(linked ? `Medication added — ${linked} shot log${linked === 1 ? "" : "s"} linked` : "Medication added");
      }
      haptic("success");
      setSaving(false);
      setTimeout(() => onClose(), 300);
    } catch (err) {
      toast.error("Failed to save medication");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 overlay-lock" onClick={onClose} aria-hidden="true" />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={editing ? "Edit Medication" : "Add Medication"}
        tabIndex={-1}
        className="relative bg-white dark:bg-[#0f1117] rounded-t-3xl sm:rounded-3xl w-full sm:max-w-[520px] max-h-[92dvh] overflow-y-auto overflow-x-hidden no-scrollbar sheet-lock animate-in slide-in-from-bottom sm:mx-4 dark:shadow-[0_-8px_40px_rgba(0,0,0,0.5)] outline-none"
      >
        <div className="sticky top-0 z-10 bg-white dark:bg-[#0f1117]">
          <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 bg-gray-300 rounded-full" /></div>
          <div className="flex items-center justify-between px-5 pb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-[#E8E9F0]">{editing ? "Edit Medication" : "Add Medication"}</h2>
            <button onClick={onClose} aria-label="Close" className="w-11 h-11 flex items-center justify-center rounded-full">
              <X size={22} className="text-gray-400" />
            </button>
          </div>
        </div>

        <div className="px-5 pb-5 space-y-5">
          <MedicationNamePicker
            selectedName={selectedName}
            isCustom={isCustom}
            onSelect={handleSelect}
            error={errors.name}
          />

          {isCustom && (
            <div>
              <label htmlFor="custom-med-name" className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-2 block">
                Medication name
              </label>
              <input
                id="custom-med-name"
                type="text"
                value={customName}
                autoComplete="off"
                onChange={(e) => { setCustomName(e.target.value); clearError("name"); }}
                placeholder="Type the name from your prescription"
                className={inputClass}
              />
            </div>
          )}

          {!ready ? (
            <div className="rounded-2xl border border-gray-200 dark:border-white/[0.12] bg-gray-50 dark:bg-white/[0.04] px-4 py-4 text-base text-gray-700 dark:text-[#9A9DAE]">
              Choose your medication above to see the strengths shown on your pen.
            </div>
          ) : (
            <>
              <DoseStrengthPicker
                option={option}
                value={dose}
                onChange={(v) => { setDose(v); setDoseConfirmed(false); clearError("dose"); }}
                confirmed={doseConfirmed}
                onConfirmedChange={(v) => { setDoseConfirmed(v); clearError("dose"); }}
                unit={unit}
                onUnitChange={setUnit}
                error={errors.dose}
              />

              <ScheduleField
                option={option}
                value={schedule}
                onChange={(v) => { setSchedule(v); clearError("schedule"); }}
                other={scheduleOther}
                onOtherChange={setScheduleOther}
                error={errors.schedule}
              />

              <IndicationField
                value={indication}
                onChange={setIndication}
                other={indicationOther}
                onOtherChange={setIndicationOther}
                error={errors.indication}
              />
            </>
          )}

          {/* Date fields stay inside the sheet's padding: stacked on a phone,
              side by side only where there is room, and each one allowed to
              shrink (min-w-0) so a native date input can never spill out. */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 min-w-0">
              <label htmlFor="start-date" className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-2 block">Start date</label>
              <input id="start-date" type="date" value={startDate}
                onChange={(e) => { setStartDate(e.target.value); clearError("startDate"); }}
                className={`${inputClass} box-border w-full min-w-0`} />
              {errors.startDate && <p className="text-base font-medium text-red-600 dark:text-red-400 mt-2">{errors.startDate}</p>}
            </div>
            <div className="flex-1 min-w-0">
              <label htmlFor="end-date" className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-2 block">Planned end (optional)</label>
              <input id="end-date" type="date" value={plannedEndDate}
                onChange={(e) => { setPlannedEndDate(e.target.value); clearError("plannedEndDate"); }}
                className={`${inputClass} box-border w-full min-w-0`} />
              {errors.plannedEndDate && <p className="text-base font-medium text-red-600 dark:text-red-400 mt-2">{errors.plannedEndDate}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="dose-step" className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-2 block">
              Dose step from your doctor (optional)
            </label>
            <input id="dose-step" type="text" value={doseStep} autoComplete="off"
              onChange={(e) => setDoseStep(e.target.value)} placeholder="e.g. starter dose" className={inputClass} />
            <p className="text-sm text-gray-500 dark:text-[#9A9DAE] mt-2">{DOSE_STEP_HELPER}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 min-w-0">
              <label htmlFor="prescriber-name" className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-2 block">Prescriber name</label>
              <input id="prescriber-name" type="text" value={prescriberName} autoComplete="off"
                onChange={(e) => setPrescriberName(e.target.value)} className={inputClass} />
            </div>
            <div className="flex-1 min-w-0">
              <label htmlFor="prescriber-contact" className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-2 block">Prescriber contact</label>
              <input id="prescriber-contact" type="text" value={prescriberContact} autoComplete="off"
                onChange={(e) => setPrescriberContact(e.target.value)} className={inputClass} />
            </div>
          </div>

          <div>
            <span className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-2 block">Status</span>
            <div className="grid grid-cols-3 gap-2">
              {statusOptionsFor(status).map((s) => (
                <button key={s.value} type="button" onClick={() => setStatus(s.value)} aria-pressed={status === s.value}
                  className={`min-h-[60px] rounded-2xl border-2 px-2 text-base font-semibold ${status === s.value
                    ? "bg-indigo-600 border-indigo-600 text-white"
                    : "bg-white dark:bg-white/[0.05] border-gray-200 dark:border-white/[0.12] text-gray-900 dark:text-[#E8E9F0]"}`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="med-notes" className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-2 block">Notes</label>
            <textarea id="med-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
              className="w-full rounded-2xl border-2 border-gray-200 dark:border-white/[0.12] dark:bg-white/[0.05] dark:text-[#E8E9F0] px-4 py-3 text-base outline-none focus:border-indigo-400" />
          </div>
        </div>

        <div className="sticky bottom-0 px-5 pt-3 bg-white dark:bg-[#0f1117] border-t border-gray-100 dark:border-white/[0.08]" style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))" }}>
          <button onClick={handleSave} disabled={saving}
            className="w-full min-h-[56px] bg-indigo-600 text-white rounded-2xl font-semibold text-base flex items-center justify-center gap-2 disabled:opacity-60">
            <Save size={18} /> {saving ? "Saving…" : editing ? "Update" : "Save"}
          </button>
          <p className="text-xs text-gray-500 dark:text-[#9A9DAE] text-center mt-2.5 leading-snug">{FOOTER_NOTE}</p>
        </div>
      </div>
    </div>
  );
}