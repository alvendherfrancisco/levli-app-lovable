import React, { useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight, Save } from "lucide-react";
import { useAppState } from "@/lib/AppState";
import useModal from "@/hooks/useModal";
import { toast } from "sonner";
import { findMedicationOption, isLabelStrength, labelledSchedule, scheduleText, summariseRegimen,
  validateRegimenForm, OTHER_SCHEDULE, REGIMEN_FOOTER } from "@/lib/medicationRegimen";
import { helperCls, primaryBtnCls, secondaryBtnCls } from "@/components/medications/formStyles";
import MedicationStep from "@/components/medications/steps/MedicationStep";
import DoseStep from "@/components/medications/steps/DoseStep";
import WhenStep from "@/components/medications/steps/WhenStep";
import DoctorStep from "@/components/medications/steps/DoctorStep";
import ReviewStep from "@/components/medications/steps/ReviewStep";
import MedicationSavedPanel from "@/components/medications/MedicationSavedPanel";

const pad = (n) => String(n).padStart(2, "0");
function todayInput() { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }

/** A stored frequency string as the form's schedule choice. */
function scheduleFromStored(stored, name) {
  const text = String(stored || "").trim();
  const labelled = labelledSchedule(name);
  if (!text) return labelled;
  if (labelled && text.toLowerCase() === labelled.toLowerCase()) return labelled;
  return OTHER_SCHEDULE;
}

const STEP_COUNT = 5;
/** Which step owns each validation message, so a fix is always one step away. */
const FIELD_STEP = { name: 1, dose: 2, startDate: 3, plannedEndDate: 3 };

/**
 * Add / Edit Medication as a five-step flow: one question per screen, plain
 * words, large text and controls that respect the phone's font-size setting.
 * Nothing here suggests or adjusts a dose — a dose that is not a label strength
 * is kept, once the user has checked it against their own prescription.
 */
export default function MedicationModal({ open, onClose, editing }) {
  const { addMedication, updateMedication, linkShotsToMedication } = useAppState();

  const [step, setStep] = useState(1);
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
  const [saved, setSaved] = useState(false);
  const [summary, setSummary] = useState("");
  const [linkedCount, setLinkedCount] = useState(0);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setStep(1);
    setSaved(false);
    setSummary("");
    setLinkedCount(0);
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
      setIndication(storedIndication && !["Type 2 diabetes", "Weight management", "Heart health"].includes(storedIndication) ? "Other" : storedIndication);
      setIndicationOther(storedIndication && !["Type 2 diabetes", "Weight management", "Heart health"].includes(storedIndication) ? storedIndication : "");
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
  const clearError = (field) => setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));

  const check = () => {
    const finalName = isCustom ? customName.trim() : selectedName;
    const picked = findMedicationOption(finalName);
    const doseText = String(dose ?? "").trim();
    return {
      picked,
      finalName,
      doseNum: Number(doseText),
      standard: !isCustom && isLabelStrength(finalName, doseText),
      problem: validateRegimenForm({
        selectedName, isCustom, customName, dose, doseConfirmed,
        isStandardDose: !isCustom && isLabelStrength(finalName, doseText),
        startDate, plannedEndDate,
      }),
    };
  };

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
    setUnit(picked?.unit || "mg");
    setSchedule(picked?.schedule || "");
    setScheduleOther("");
  };

  // One question per screen: only this step's own answer is required to move on.
  const goNext = () => {
    const { problem } = check();
    if (problem && FIELD_STEP[problem.field] === step) {
      setErrors({ [problem.field]: problem.message });
      return;
    }
    setErrors({});
    setStep((s) => Math.min(s + 1, STEP_COUNT));
  };

  const goBack = () => {
    setErrors({});
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleSave = async () => {
    const { picked, finalName, doseNum, problem } = check();
    if (problem) {
      setErrors({ [problem.field]: problem.message });
      setStep(FIELD_STEP[problem.field] || 1);
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

    const line = summariseRegimen({ option: picked, isCustom, customName, dose, unit, schedule, scheduleOther, startDate });
    try {
      if (editing) {
        await updateMedication(editing.id, payload);
        await linkShotsToMedication(payload.medication_name, editing.id);
      } else {
        const rec = await addMedication(payload);
        // Every shot log for this medication is linked to the new record.
        setLinkedCount(await linkShotsToMedication(payload.medication_name, rec.id) || 0);
      }
      setSummary(line);
      setSaved(true);
      setSaving(false);
    } catch (err) {
      toast.error("That didn't save. Please check your connection and try again.");
      setSaving(false);
    }
  };

  const stepProps = {
    option,
    errors,
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
        className="relative bg-white dark:bg-[#0f1117] rounded-t-3xl sm:rounded-3xl w-full sm:max-w-[520px] max-h-[92dvh] overflow-y-auto overflow-x-hidden no-scrollbar sheet-lock animate-in slide-in-from-bottom sm:mx-4 dark:shadow-[0_8px_40px_rgba(0,0,0,0.6)] outline-none"
      >
        <div className="sticky top-0 z-10 bg-white dark:bg-[#0f1117]">
          <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 bg-gray-400 dark:bg-white/40 rounded-full" /></div>
          {!saved && (
            <>
              <div className="flex items-center justify-between gap-3 px-5 pb-3">
                <div className="min-w-0">
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {editing ? "Edit medication" : "Add medication"}
                  </p>
                  <p className="text-lg text-gray-700 dark:text-gray-200">Step {step} of {STEP_COUNT}</p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex items-center gap-2 min-h-[48px] min-w-[48px] px-3 rounded-2xl border-2 border-gray-400 dark:border-white/40 text-lg font-semibold text-gray-900 dark:text-white flex-shrink-0"
                >
                  <X size={24} aria-hidden="true" /> Close
                </button>
              </div>
              <div className="px-5 pb-3">
                <div
                  className="h-2.5 w-full rounded-full bg-gray-200 dark:bg-white/25"
                  role="progressbar"
                  aria-label={`Step ${step} of ${STEP_COUNT}`}
                  aria-valuemin={1}
                  aria-valuemax={STEP_COUNT}
                  aria-valuenow={step}
                >
                  <div className="h-2.5 rounded-full bg-indigo-600" style={{ width: `${(step / STEP_COUNT) * 100}%` }} />
                </div>
              </div>
            </>
          )}
        </div>

        <div className="px-5 pb-6">
          {saved ? (
            <MedicationSavedPanel editing={!!editing} summary={summary} linkedCount={linkedCount} />
          ) : (
            <>
              {step === 1 && (
                <MedicationStep
                  selectedName={selectedName}
                  isCustom={isCustom}
                  customName={customName}
                  onSelect={handleSelect}
                  onCustomNameChange={(v) => { setCustomName(v); clearError("name"); }}
                  option={option}
                  error={errors.name}
                />
              )}

              {step === 2 && (
                <DoseStep
                  option={option}
                  value={dose}
                  onChange={(v) => { setDose(v); setDoseConfirmed(false); clearError("dose"); }}
                  confirmed={doseConfirmed}
                  onConfirmedChange={(v) => { setDoseConfirmed(v); clearError("dose"); }}
                  unit={unit}
                  onUnitChange={setUnit}
                  error={errors.dose}
                />
              )}

              {step === 3 && (
                <WhenStep
                  option={option}
                  schedule={schedule}
                  onScheduleChange={setSchedule}
                  scheduleOther={scheduleOther}
                  onScheduleOtherChange={setScheduleOther}
                  startDate={startDate}
                  onStartDateChange={(v) => { setStartDate(v); clearError("startDate"); }}
                  endDate={plannedEndDate}
                  onEndDateChange={(v) => { setPlannedEndDate(v); clearError("plannedEndDate"); }}
                  status={status}
                  onStatusChange={setStatus}
                  errors={errors}
                />
              )}

              {step === 4 && (
                <DoctorStep
                  prescriberName={prescriberName}
                  onPrescriberNameChange={setPrescriberName}
                  prescriberContact={prescriberContact}
                  onPrescriberContactChange={setPrescriberContact}
                  doseStep={doseStep}
                  onDoseStepChange={setDoseStep}
                  notes={notes}
                  onNotesChange={setNotes}
                  indication={indication}
                  onIndicationChange={setIndication}
                  indicationOther={indicationOther}
                  onIndicationOtherChange={setIndicationOther}
                />
              )}

              {step === 5 && (
                <ReviewStep
                  option={option}
                  isCustom={isCustom}
                  customName={customName}
                  dose={dose}
                  unit={unit}
                  schedule={schedule}
                  scheduleOther={scheduleOther}
                  startDate={startDate}
                  endDate={plannedEndDate}
                  status={status}
                  indication={indication}
                  indicationOther={indicationOther}
                  prescriberName={prescriberName}
                  prescriberContact={prescriberContact}
                  doseStep={doseStep}
                  notes={notes}
                />
              )}

              <p className={`${helperCls} mt-8 text-center`}>{REGIMEN_FOOTER}</p>
            </>
          )}
        </div>

        <div
          className="sticky bottom-0 px-5 pt-3 bg-white dark:bg-[#0f1117] border-t border-gray-200 dark:border-white/[0.12] space-y-3"
          style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))" }}
        >
          {saved ? (
            <button type="button" onClick={onClose} className={primaryBtnCls}>Done</button>
          ) : (
            <>
              <button
                type="button"
                onClick={step === STEP_COUNT ? handleSave : goNext}
                disabled={saving}
                className={primaryBtnCls}
              >
                {step === STEP_COUNT
                  ? <Save size={26} aria-hidden="true" />
                  : <ChevronRight size={26} aria-hidden="true" />}
                {step === STEP_COUNT ? (saving ? "Saving…" : "Save medication") : "Next"}
              </button>
              {step > 1 && (
                <button type="button" onClick={goBack} className={secondaryBtnCls}>
                  <ChevronLeft size={26} aria-hidden="true" />
                  {step === STEP_COUNT ? "Go back and change" : "Back"}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}