import React, { useState, useEffect } from "react";
import { X, Save } from "lucide-react";
import { useAppState } from "@/lib/AppState";
import { describeAllowedDoses, getMedicationPickerNames, plainBrandName } from "@/lib/medicationConfig";
import { toast } from "sonner";

const pad = (n) => String(n).padStart(2, "0");
function todayInput() { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }

export default function MedicationModal({ open, onClose, editing }) {
  const { addMedication, updateMedication, linkShotsToMedication } = useAppState();
  const [medicationName, setMedicationName] = useState("");
  const [prescribedDose, setPrescribedDose] = useState("");
  const [doseUnit, setDoseUnit] = useState("mg");
  const [frequency, setFrequency] = useState("");
  const [indication, setIndication] = useState("");
  const [startDate, setStartDate] = useState(todayInput());
  const [plannedEndDate, setPlannedEndDate] = useState("");
  const [titrationStage, setTitrationStage] = useState("");
  const [prescriberName, setPrescriberName] = useState("");
  const [prescriberContact, setPrescriberContact] = useState("");
  const [status, setStatus] = useState("active");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (editing) {
        setMedicationName(editing.medication_name || "");
        setPrescribedDose(editing.prescribed_dose != null ? String(editing.prescribed_dose) : "");
        setDoseUnit(editing.dose_unit || "mg");
        setFrequency(editing.frequency || "");
        setIndication(editing.indication || "");
        setStartDate(editing.start_date || todayInput());
        setPlannedEndDate(editing.planned_end_date || "");
        setTitrationStage(editing.titration_stage || "");
        setPrescriberName(editing.prescriber_name || "");
        setPrescriberContact(editing.prescriber_contact || "");
        setStatus(editing.status || "active");
        setNotes(editing.notes || "");
      } else {
        setMedicationName(""); setPrescribedDose(""); setDoseUnit("mg"); setFrequency("");
        setIndication(""); setStartDate(todayInput()); setPlannedEndDate(""); setTitrationStage("");
        setPrescriberName(""); setPrescriberContact(""); setStatus("active"); setNotes("");
      }
    }
  }, [open, editing]);

  if (!open) return null;

  // The label's own strengths for the chosen product, so the dose entered here
  // matches what the user's pen or pen label actually offers.
  const labelDoses = describeAllowedDoses(medicationName);

  const handleSave = async () => {
    if (!medicationName.trim()) { toast.error("Medication name is required"); return; }
    setSaving(true);
    const payload = {
      medication_name: medicationName,
      prescribed_dose: parseFloat(prescribedDose) || null,
      dose_unit: doseUnit,
      frequency,
      indication,
      start_date: startDate || null,
      planned_end_date: plannedEndDate || null,
      titration_stage: titrationStage,
      prescriber_name: prescriberName,
      prescriber_contact: prescriberContact,
      status,
      notes,
      regimen_source: "user-entered",
    };
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
      setSaving(false);
      setTimeout(() => onClose(), 300);
    } catch (err) {
      toast.error("Failed to save medication");
      setSaving(false);
    }
  };

  const Field = ({ label, children }) => (
    <div>
      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">{label}</label>
      {children}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white dark:bg-[#0f1117] rounded-t-3xl sm:rounded-3xl w-full sm:max-w-[520px] max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom sm:mx-4 dark:shadow-[0_-8px_40px_rgba(0,0,0,0.5)]">
        <div className="sticky top-0 z-10 bg-white dark:bg-[#0f1117]">
          <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 bg-gray-300 rounded-full" /></div>
          <div className="flex items-center justify-between px-5 pb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-[#E8E9F0]">{editing ? "Edit Medication" : "Add Medication"}</h2>
            <button onClick={onClose}><X size={22} className="text-gray-400" /></button>
          </div>
        </div>
        <div className="px-5 pb-4 space-y-4">
          <Field label="Medication name">
            <input type="text" list="med-list" value={medicationName} onChange={(e) => setMedicationName(e.target.value)} placeholder="e.g. Ozempic®"
              className="w-full border border-gray-200 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-[#E8E9F0] rounded-xl px-4 py-3 text-base outline-none focus:border-indigo-300" />
            <datalist id="med-list">{getMedicationPickerNames().map((m) => <option key={m} value={m} />)}</datalist>
            {labelDoses && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                US label strengths for {plainBrandName(medicationName)}: {labelDoses}
              </p>
            )}
          </Field>
          <div className="flex flex-col sm:flex-row gap-3">
            <Field label="Prescribed dose">
              <input type="number" min="0" step="0.25" value={prescribedDose} onChange={(e) => setPrescribedDose(e.target.value)}
                className="w-full border border-gray-200 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-[#E8E9F0] rounded-xl px-4 py-3 text-base outline-none focus:border-indigo-300" />
            </Field>
            <Field label="Unit">
              <select value={doseUnit} onChange={(e) => setDoseUnit(e.target.value)}
                className="w-full border border-gray-200 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-[#E8E9F0] rounded-xl px-4 py-3 text-base outline-none focus:border-indigo-300">
                {["mg", "mcg", "units", "IU", "mL"].map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Frequency">
            <input type="text" value={frequency} onChange={(e) => setFrequency(e.target.value)} placeholder="e.g. once weekly"
              className="w-full border border-gray-200 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-[#E8E9F0] rounded-xl px-4 py-3 text-base outline-none focus:border-indigo-300" />
          </Field>
          <Field label="Indication (as prescribed)">
            <input type="text" value={indication} onChange={(e) => setIndication(e.target.value)} placeholder="e.g. Type 2 diabetes"
              className="w-full border border-gray-200 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-[#E8E9F0] rounded-xl px-4 py-3 text-base outline-none focus:border-indigo-300" />
          </Field>
          <div className="flex flex-col sm:flex-row gap-3">
            <Field label="Start date">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-gray-200 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-[#E8E9F0] dark:[color-scheme:dark] rounded-xl px-4 py-3 text-base outline-none focus:border-indigo-300" />
            </Field>
            <Field label="Planned end (optional)">
              <input type="date" value={plannedEndDate} onChange={(e) => setPlannedEndDate(e.target.value)}
                className="w-full border border-gray-200 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-[#E8E9F0] dark:[color-scheme:dark] rounded-xl px-4 py-3 text-base outline-none focus:border-indigo-300" />
            </Field>
          </div>
          <Field label="Titration stage (as directed by prescriber)">
            <input type="text" value={titrationStage} onChange={(e) => setTitrationStage(e.target.value)} placeholder="e.g. 1.0 mg maintenance"
              className="w-full border border-gray-200 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-[#E8E9F0] rounded-xl px-4 py-3 text-base outline-none focus:border-indigo-300" />
            <p className="text-xs text-gray-400 mt-1">Enter only what your prescriber told you. Levli does not generate titration schedules.</p>
          </Field>
          <div className="flex flex-col sm:flex-row gap-3">
            <Field label="Prescriber name">
              <input type="text" value={prescriberName} onChange={(e) => setPrescriberName(e.target.value)}
                className="w-full border border-gray-200 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-[#E8E9F0] rounded-xl px-4 py-3 text-base outline-none focus:border-indigo-300" />
            </Field>
            <Field label="Prescriber contact">
              <input type="text" value={prescriberContact} onChange={(e) => setPrescriberContact(e.target.value)}
                className="w-full border border-gray-200 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-[#E8E9F0] rounded-xl px-4 py-3 text-base outline-none focus:border-indigo-300" />
            </Field>
          </div>
          <Field label="Status">
            <select value={status} onChange={(e) => setStatus(e.target.value)}
              className="w-full border border-gray-200 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-[#E8E9F0] rounded-xl px-4 py-3 text-base outline-none focus:border-indigo-300">
              {["active", "paused", "discontinued", "switched"].map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
            </select>
          </Field>
          <Field label="Notes">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              className="w-full border border-gray-200 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-[#E8E9F0] rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-300" />
          </Field>
        </div>
        <div className="h-24" />
        <div className="sticky bottom-0 px-5 pb-8 pt-2 bg-white dark:bg-[#0f1117] border-t border-gray-100 dark:border-white/[0.08]">
          <button onClick={handleSave} disabled={saving}
            className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
            <Save size={16} /> {saving ? "Saving…" : editing ? "Update" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}