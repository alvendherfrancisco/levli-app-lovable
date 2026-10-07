import React, { useEffect, useState } from "react";
import { X, Save, ChevronDown } from "lucide-react";
import { useAppState } from "@/lib/AppState";
import useModal from "@/hooks/useModal";
import { toast } from "@/lib/toast";
import {
  findMedicationOption, isLabelStrength, scheduleText, statusOptionsFor, validateRegimenForm,
  DOSE_STEP_HELPER, OTHER_SCHEDULE,
} from "@/lib/medicationRegimen";
import { sound } from "@/lib/sounds";
import MedicationNamePicker from "@/components/medications/MedicationNamePicker";
import DoseStrengthPicker from "@/components/medications/DoseStrengthPicker";
import ScheduleField from "@/components/medications/ScheduleField";
import StartDateField from "@/components/medications/StartDateField";
import IndicationField from "@/components/medications/IndicationField";
import ClearFieldButton from "@/components/ClearFieldButton";
import OptionChips from "@/components/OptionChips";

const pad = (n) => String(n).padStart(2, "0");
function todayInput() { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }

const inputClass = "w-full min-h-[52px] rounded-xl border border-gray-200 dark:border-white/[0.12] dark:bg-white/[0.05] dark:text-[#E8E9F0] px-3 py-2.5 text-sm outline-none focus:border-indigo-400 dark:[color-scheme:dark]";

/** The single line shown under the save button. */
const FOOTER_NOTE = "This app is a tracker, not medical advice.";

/** A stored frequency string as the form's schedule choice. */
function scheduleFromStored(stored) {
  const text = String(stored || "").trim();
  if (!text) return "";
  if (text.toLowerCase() === "once weekly") return "Once weekly";
  if (text.toLowerCase() === "once daily") return "Once daily";
  return OTHER_SCHEDULE;
}

/** The status chips inside "More details". */
const STATUS_CHIP_CLASS = "inline-flex items-center gap-1.5 min-h-[44px] rounded-xl border-2 px-3 text-sm font-semibold";
const STATUS_SELECTED_CLASS = "bg-indigo-600 border-indigo-600 text-white";
const STATUS_UNSELECTED_CLASS = "bg-white dark:bg-white/[0.05] border-gray-200 dark:border-white/[0.12] text-gray-900 dark:text-[#E8E9F0]";

/**
 * Add / Edit Medication — one screen. The four things logged most often (which
 * medication, what dose, how often, when it started) are answered by tapping a
 * chip, with the label's own values pre-filled and clearly editable. Everything
 * else lives in "More details (optional)", closed until it is needed. Nothing
 * here suggests or adjusts a dose: every strength shown is one the product's
 * label lists, and anything else is only ever typed from the prescription.
 */
export default function MedicationModal({ open, onClose, editing }) {
  const { addMedication, updateMedication, linkShotsToMedication, medications, shots } = useAppState();

  const [selectedName, setSelectedName] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [customName, setCustomName] = useState("");
  const [dose, setDose] = useState("");
  const [doseSuggested, setDoseSuggested] = useState(false);
  const [doseConfirmed, setDoseConfirmed] = useState(false);
  const [unit, setUnit] = useState("mg");
  const [schedule, setSchedule] = useState("");
  const [scheduleOther, setScheduleOther] = useState("");
  const [startDate, setStartDate] = useState(todayInput());
  const [showDetails, setShowDetails] = useState(false);
  const [indication, setIndication] = useState("");
  const [indicationOther, setIndicationOther] = useState("");
  const [plannedEndDate, setPlannedEndDate] = useState("");
  const [doseStep, setDoseStep] = useState("");
  const [prescriberName, setPrescriberName] = useState("");
  const [prescriberContact, setPrescriberContact] = useState("");
  const [status, setStatus] = useState("active");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  /** The dose last saved for this medication, if the user has one. */
  const lastSavedDose = (name) => {
    const regimen = medications.find((m) => m.medication_name === name && m.prescribed_dose != null);
    if (regimen) return Number(regimen.prescribed_dose);
    const shot = shots.find((s) => s.medication === name && s.dose != null);
    return shot ? Number(shot.dose) : null;
  };

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setDoseSuggested(false);
    setDoseConfirmed(false);
    setShowDetails(false);
    if (editing) {
      const stored = editing.medication_name || "";
      const option = findMedicationOption(stored);
      const storedFrequency = String(editing.frequency || "").trim();
      const storedIndication = String(editing.indication || "").trim();
      setSelectedName(option ? option.value : "");
      setIsCustom(!option);
      setCustomName(option ? "" : stored);
      setDose(editing.prescribed_dose != null ? String(editing.prescribed_dose) : "");
      setUnit(editing.dose_unit || option?.unit || "mg");
      setSchedule(scheduleFromStored(storedFrequency));
      setScheduleOther(
        storedFrequency && !["once weekly", "once daily"].includes(storedFrequency.toLowerCase())
          ? storedFrequency : "");
      setIndication(["Type 2 diabetes", "Weight management", "Heart health"].includes(storedIndication)
        ? storedIndication : storedIndication ? "Other" : "");
      setIndicationOther(
        ["Type 2 diabetes", "Weight management", "Heart health"].includes(storedIndication)
          ? "" : storedIndication);
      setStartDate(editing.start_date || todayInput());
      setPlannedEndDate(editing.planned_end_date || "");
      setDoseStep(editing.titration_stage || "");
      setPrescriberName(editing.prescriber_name || "");
      setPrescriberContact(editing.prescriber_contact || "");
      setStatus(editing.status || "active");
      setNotes(editing.notes || "");
      // A regimen that already carries details opens with them visible.
      setShowDetails(!!(editing.indication || editing.planned_end_date || editing.titration_stage
        || editing.prescriber_name || editing.prescriber_contact || editing.notes));
    } else {
      setSelectedName(""); setIsCustom(false); setCustomName("");
      setDose(""); setUnit("mg"); setSchedule(""); setScheduleOther("");
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

  const filledDetails = [indication, indicationOther, plannedEndDate, doseStep,
    prescriberName, prescriberContact, notes].filter(Boolean).length;

  const handleSelect = ({ name, isCustom: custom }) => {
    // Choosing what is already selected only keeps it — nothing is reset.
    if (custom ? isCustom : (!isCustom && name === selectedName)) return;
    setErrors({});
    setDoseConfirmed(false);
    // Changing the medication always resets dose, unit and frequency to the new
    // product's own options.
    if (custom) {
      setIsCustom(true);
      setSelectedName("");
      setCustomName(name);
      setDose(""); setDoseSuggested(false);
      setUnit("");
      setSchedule("");
      setScheduleOther("");
      return;
    }
    const picked = findMedicationOption(name);
    setIsCustom(false);
    setSelectedName(name);
    setCustomName("");
    setScheduleOther("");
    // The label's lowest strength is only pre-filled when nothing was saved for
    // this medication before — an existing dose is never silently changed.
    const lowest = picked?.strengths?.[0]?.value;
    if (lastSavedDose(name) == null && lowest != null) {
      setDose(String(lowest));
      setDoseSuggested(true);
    } else {
      setDose("");
      setDoseSuggested(false);
    }
    setUnit(picked?.unit || "mg");
    setSchedule(picked?.schedule || "");
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
      sound.warning();
      setErrors({ [problem.field]: problem.message });
      if (["plannedEndDate"].includes(problem.field)) setShowDetails(true);
      return;
    }

    setSaving(true);
    const payload = {
      medication_name: finalName,
      generic_name: picked?.generic || "",
      route: picked?.route || "",
      prescribed_dose: doseNum,
      dose_unit: unit || "mg",
      frequency: scheduleText(schedule, scheduleOther),
      // A cleared indication is saved empty, never as the word "undefined".
      indication: (indication === "Other" ? indicationOther.trim() : indication) || "",
      start_date: startDate,
      planned_end_date: plannedEndDate || null,
      titration_stage: doseStep,
      prescriber_name: prescriberName,
      prescriber_contact: prescriberContact,
      status,
      notes,
      regimen_source: "user-entered",
      // Filling in the form is what completes a regimen that was created from a
      // shot log, so its "needs details" mark is cleared here.
      needs_details: false,
    };
    // A regimen marked stopped ends today, so its schedule pauses with it.
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
      sound.success();
      setSaving(false);
      setTimeout(() => onClose(), 300);
    } catch (err) {
      toast.error("Couldn't save. Please try again.", { actionLabel: "Retry", onAction: handleSave });
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
            <h2 className="text-lg font-bold text-gray-900 dark:text-[#E8E9F0]">{editing ? "Edit Medication" : "Add Medication"}</h2>
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
              <label htmlFor="custom-med-name" className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
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
            <div className="rounded-xl border border-gray-200 dark:border-white/[0.12] bg-gray-50 dark:bg-white/[0.04] px-3 py-3 text-sm text-gray-600 dark:text-[#9A9DAE]">
              Tap your medication above to see the strengths and schedule on its label.
            </div>
          ) : (
            <>
              <DoseStrengthPicker
                option={option}
                value={dose}
                onChange={(v) => { setDose(v); setDoseSuggested(false); setDoseConfirmed(false); clearError("dose"); }}
                confirmed={doseConfirmed}
                onConfirmedChange={(v) => { setDoseConfirmed(v); clearError("dose"); }}
                unit={unit}
                onUnitChange={setUnit}
                suggested={doseSuggested}
                error={errors.dose}
              />

              <ScheduleField
                value={schedule}
                onChange={(v) => { setSchedule(v); clearError("schedule"); }}
                other={scheduleOther}
                onOtherChange={setScheduleOther}
                suggested={!!option?.schedule && schedule === option.schedule}
                error={errors.schedule}
              />
            </>
          )}

          <StartDateField
            value={startDate}
            onChange={(v) => { setStartDate(v); clearError("startDate"); }}
            error={errors.startDate}
          />

          {/* Everything else, closed until it is needed. */}
          <div className="border-t border-gray-100 dark:border-white/[0.08] pt-3">
            <button
              type="button"
              onClick={() => { if (showDetails) sound.close(); else sound.open(); setShowDetails((v) => !v); }}
              aria-expanded={showDetails}
              className="w-full min-h-[44px] flex items-center justify-between gap-2"
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                More details (optional)
                {!showDetails && filledDetails > 0 && (
                  <span className="text-[11px] font-medium text-indigo-500 dark:text-indigo-400">· {filledDetails} filled in</span>
                )}
              </span>
              <ChevronDown size={18} className={`text-gray-400 transition-transform ${showDetails ? "rotate-180" : ""}`} />
            </button>

            {showDetails && (
              <div className="mt-3 space-y-4">
                <IndicationField
                  value={indication}
                  onChange={setIndication}
                  other={indicationOther}
                  onOtherChange={setIndicationOther}
                  error={errors.indication}
                />

                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <label htmlFor="end-date" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Planned end (optional)
                    </label>
                    <ClearFieldButton show={!!plannedEndDate} onClear={() => { setPlannedEndDate(""); clearError("plannedEndDate"); }} />
                  </div>
                  <input
                    id="end-date"
                    type="date"
                    value={plannedEndDate}
                    onChange={(e) => { setPlannedEndDate(e.target.value); clearError("plannedEndDate"); }}
                    className={`${inputClass} box-border w-full min-w-0`}
                  />
                  {errors.plannedEndDate && <p className="text-sm font-medium text-red-600 dark:text-red-400 mt-2">{errors.plannedEndDate}</p>}
                </div>

                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <label htmlFor="dose-step" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Dose step from your doctor (optional)
                    </label>
                    <ClearFieldButton show={!!doseStep} onClear={() => setDoseStep("")} />
                  </div>
                  <input
                    id="dose-step"
                    type="text"
                    value={doseStep}
                    autoComplete="off"
                    onChange={(e) => setDoseStep(e.target.value)}
                    placeholder="e.g. starter dose"
                    className={inputClass}
                  />
                  <p className="text-xs text-gray-500 dark:text-[#9A9DAE] mt-1.5">{DOSE_STEP_HELPER}</p>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <label htmlFor="prescriber-name" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Prescriber name
                    </label>
                    <ClearFieldButton show={!!prescriberName} onClear={() => setPrescriberName("")} />
                  </div>
                  <input
                    id="prescriber-name"
                    type="text"
                    value={prescriberName}
                    autoComplete="off"
                    onChange={(e) => setPrescriberName(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <label htmlFor="prescriber-contact" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Prescriber contact
                    </label>
                    <ClearFieldButton show={!!prescriberContact} onClear={() => setPrescriberContact("")} />
                  </div>
                  <input
                    id="prescriber-contact"
                    type="text"
                    value={prescriberContact}
                    autoComplete="off"
                    onChange={(e) => setPrescriberContact(e.target.value)}
                    className={inputClass}
                  />
                </div>

                {/* Required: one of these is always the status, so tapping the
                    chosen one again leaves it as it is. */}
                <OptionChips
                  label="Status"
                  options={statusOptionsFor(status)}
                  value={status}
                  onChange={setStatus}
                  required
                  soundOnSelect
                  chipClass={STATUS_CHIP_CLASS}
                  selectedClass={STATUS_SELECTED_CLASS}
                  unselectedClass={STATUS_UNSELECTED_CLASS}
                />

                <div>
                  <label htmlFor="med-notes" className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Notes</label>
                  <textarea
                    id="med-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-gray-200 dark:border-white/[0.12] dark:bg-white/[0.05] dark:text-[#E8E9F0] px-3 py-2.5 text-sm outline-none focus:border-indigo-400"
                  />
                </div>
              </div>
            )}
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