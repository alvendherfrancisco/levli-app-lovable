import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, ExternalLink } from "lucide-react";
import { useAppState } from "@/lib/AppState";
import { todayKey } from "@/lib/dateUtils";
import { getRecentMedication } from "@/lib/medicationData";
import { classifyRedFlag } from "@/lib/redFlags";
import { SIDE_EFFECT_SYMPTOMS, SEVERITY_LEVELS, symptomByKey } from "@/lib/sideEffectSymptoms";
import OptionChips from "@/components/OptionChips";
import SideEffectChecklist from "@/components/sideEffects/SideEffectChecklist";
import UrgentHelpCard from "@/components/sideEffects/UrgentHelpCard";
import useModal from "@/hooks/useModal";
import { toast } from "@/lib/toast";
import { sound } from "@/lib/sounds";

const PHARMACOVIGILANCE_LINKS = [
  { label: "UK — MHRA Yellow Card", url: "https://yellowcard.mhra.gov.uk/" },
  { label: "US — FDA MedWatch", url: "https://www.fda.gov/safety/medwatch-fda-safety-information-and-adverse-event-reporting-program" },
];

const severityLabel = (value) => SEVERITY_LEVELS.find((s) => s.value === value)?.label || value || "";

/**
 * The structured side-effect log: a checklist of symptoms, one severity, one
 * date and an optional note. Every ticked symptom becomes its own record, so the
 * same entry shows up in History, Insights and the Report.
 */
export default function SideEffectsModal({ open, onClose, dayKey }) {
  const { shots, getSideEffects, adverseEvents, addAdverseEvent, deleteAdverseEvent } = useAppState();
  const [selected, setSelected] = useState([]);
  const [severity, setSeverity] = useState("mild");
  const [date, setDate] = useState(dayKey || todayKey());
  const [note, setNote] = useState("");
  const [urgentOpen, setUrgentOpen] = useState(false);
  const [severeLogged, setSevereLogged] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelected([]);
    setSeverity("mild");
    setDate(dayKey || todayKey());
    setNote("");
    setUrgentOpen(false);
    setSevereLogged(false);
  }, [open, dayKey]);

  const sheetRef = useModal({ open, onDismiss: onClose });

  if (!open) return null;

  const dayEvents = adverseEvents.filter((e) => (e.day_key || "") === date);
  const legacyText = getSideEffects(date);
  const recentMed = getRecentMedication(shots, date);

  const toggle = (key) =>
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const selectedLabels = selected.map((k) => symptomByKey(k)?.label).filter(Boolean);

  const handleAdd = async () => {
    if (!selected.length) return;
    setSaving(true);
    try {
      for (const key of selected) {
        const symptom = symptomByKey(key);
        const { tier } = classifyRedFlag(`${severity} ${symptom.label}`, recentMed);
        await addAdverseEvent({
          medication_name: recentMed || "",
          symptom: symptom.label,
          symptom_key: symptom.key,
          symptom_category: symptom.category,
          // Cleared severity is left off the record rather than sent as empty.
          severity: severity || undefined,
          onset_date: date,
          day_key: date,
          resolved: false,
          user_attribution: true,
          red_flag_tier: tier || "none",
          notes: note.trim(),
        });
      }
      // A severe symptom opens the urgent-help list straight away.
      if (severity === "severe") {
        setUrgentOpen(true);
        setSevereLogged(true);
      }
      toast.success(selected.length === 1 ? "Side effect logged" : `${selected.length} side effects logged`);
      setSelected([]);
      setNote("");
    } catch (err) {
      toast.error("Couldn't save. Please try again.", { actionLabel: "Retry", onAction: handleAdd });
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    sound.delete();
    try {
      await deleteAdverseEvent(id);
      toast.deleted("Side effect removed");
    } catch (err) {
      toast.error("Failed to remove");
    }
  };

  const flagText = [...selectedLabels, severity].join(" ");

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 overlay-lock" onClick={onClose} aria-hidden="true" />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label="Side Effects"
        tabIndex={-1}
        className="relative bg-white dark:bg-[#0f1117] rounded-t-3xl sm:rounded-3xl w-full sm:max-w-[520px] max-h-[92dvh] overflow-y-auto overflow-x-hidden no-scrollbar sheet-lock animate-in slide-in-from-bottom sm:mx-4 dark:shadow-[0_-8px_40px_rgba(0,0,0,0.5)] outline-none"
      >
        <div className="sticky top-0 z-10 bg-white dark:bg-[#0f1117]">
          <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 bg-gray-300 rounded-full" /></div>
          <div className="flex items-center justify-between px-5 pb-4">
            <h2 className="text-xl font-bold dark:text-[#E8E9F0]">Side Effects</h2>
            <button onClick={onClose}><X size={22} className="text-gray-400" /></button>
          </div>
        </div>

        {/* Always present, and opened straight away after a severe entry. */}
        <div className="px-5 pb-3">
          <UrgentHelpCard
            open={urgentOpen}
            onToggle={() => setUrgentOpen((v) => !v)}
            highlight={severeLogged}
          />
        </div>

        <div className="px-5 pb-4 space-y-4">
          {/* Checklist */}
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">What are you feeling?</label>
            <SideEffectChecklist selected={selected} onToggle={toggle} />
          </div>

          {/* Severity — optional: tapping the chosen one again clears it. */}
          <OptionChips
            label="Severity"
            options={SEVERITY_LEVELS.map((s) => ({ value: s.value, label: s.label }))}
            value={severity}
            onChange={setSeverity}
            chipClass="flex-1 min-w-0 py-2 rounded-xl text-sm font-medium border transition-colors inline-flex items-center justify-center gap-1.5"
            selectedClass="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-500/30"
            unselectedClass="bg-white dark:bg-white/[0.05] text-gray-500 dark:text-[#9A9DAE] border-gray-200 dark:border-white/[0.1]"
            wrapClass="flex gap-2"
          />

          {/* Date */}
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-200 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-[#E8E9F0] dark:[color-scheme:dark] rounded-xl px-4 py-3 text-base outline-none focus:border-indigo-300" />
          </div>

          {/* Note */}
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Note (optional)</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2}
              placeholder="Anything you want to remember about it..."
              className="w-full border border-gray-200 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-[#E8E9F0] rounded-xl px-4 py-3 text-sm resize-none outline-none focus:border-indigo-300" />
          </div>

          <button onClick={handleAdd} disabled={!selected.length || saving}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
            <Plus size={16} /> {saving ? "Saving…" : "Log side effect"}
          </button>

          {/* Entries already logged for this date */}
          {dayEvents.length > 0 && (
            <div>
              <label className="text-xs text-gray-400 dark:text-gray-500 mb-1.5 block">Logged for this date</label>
              <div className="space-y-2">
                {dayEvents.map((e) => (
                  <div key={e.id} className="flex items-center justify-between gap-2 bg-gray-50 dark:bg-white/[0.05] rounded-xl px-3 py-2 border border-gray-100 dark:border-white/[0.08]">
                    <span className="text-sm text-gray-700 dark:text-[#E8E9F0]">
                      {e.symptom}
                      <span className="text-xs text-gray-400 dark:text-gray-500"> · {severityLabel(e.severity)}</span>
                      {e.notes && <span className="block text-xs text-gray-400 dark:text-gray-500">{e.notes}</span>}
                    </span>
                    <button onClick={() => handleDelete(e.id)}><Trash2 size={16} className="text-gray-400" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Free-text entries logged before structured tracking */}
          {legacyText && (
            <div>
              <label className="text-xs text-gray-400 dark:text-gray-500 mb-1 block">Previously logged (read-only)</label>
              <p className="text-sm text-gray-700 dark:text-[#E8E9F0] bg-gray-50 dark:bg-white/[0.05] rounded-xl p-3 border border-gray-100 dark:border-white/[0.08]">{legacyText}</p>
            </div>
          )}

          {flagText.trim() && (
            <div className="space-y-2">
              {(selectedLabels.length > 0 || severity === "severe") && recentMed && flagText && (
                (() => {
                  const { tier } = classifyRedFlag(flagText, recentMed);
                  if (tier === "none") return null;
                  const isEmergency = tier === "emergency";
                  return (
                    <div className={`rounded-xl p-3 border ${isEmergency ? "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20" : "bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20"}`}>
                      <p className={`text-sm font-semibold ${isEmergency ? "text-red-700 dark:text-red-300" : "text-orange-700 dark:text-orange-300"}`}>
                        {isEmergency ? "This may need urgent attention" : "Consider contacting your clinician"}
                      </p>
                      <p className="text-xs mt-1 text-gray-700 dark:text-[#E8E9F0]">
                        {isEmergency
                          ? "These symptoms can be serious. If severe or worsening, contact emergency services or your healthcare provider now."
                          : "Contact your clinician promptly if this persists or worsens."}
                      </p>
                      <p className="text-[11px] mt-1 text-gray-500 dark:text-[#9A9DAE]">Based on the warnings in your medication's prescribing information. This is information, not a diagnosis.</p>
                    </div>
                  );
                })()
              )}
            </div>
          )}
        </div>

        {/* Pharmacovigilance resource links — public government pages only */}
        <div className="px-5 pb-3">
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">You can report adverse events to official reporting systems:</p>
          <div className="flex flex-wrap gap-2">
            {PHARMACOVIGILANCE_LINKS.map((link) => (
              <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 rounded-lg px-3 py-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-500/10">
                {link.label} <ExternalLink size={12} />
              </a>
            ))}
          </div>
        </div>

        <div className="sticky bottom-0 px-5 pt-3 bg-white dark:bg-[#0f1117] border-t border-gray-100 dark:border-white/[0.08]" style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))" }}>
          <button onClick={onClose} className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-semibold">Done</button>
        </div>
      </div>
    </div>
  );
}