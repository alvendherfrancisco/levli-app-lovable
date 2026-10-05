import React, { useState, useEffect } from "react";
import { X, Save, Trash2 } from "lucide-react";
import { useAppState } from "@/lib/AppState";
import { getRecentMedication } from "@/lib/medicationData";
import RedFlagBanner from "@/components/RedFlagBanner";
import UrgentHelpCard from "@/components/sideEffects/UrgentHelpCard";
import { JOURNAL_CATEGORIES, MOOD_SCALE, moodFor } from "@/lib/journalMeta";
import { SEVERITY_LEVELS } from "@/lib/sideEffectSymptoms";
import useModal from "@/hooks/useModal";
import { toast } from "@/lib/toast";

function nowFormatted() {
  const d = new Date();
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const date = `${months[d.getMonth()]} ${String(d.getDate()).padStart(2,"0")}, ${d.getFullYear()}`;
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return { date, time: `${h}:${String(m).padStart(2,"0")} ${ampm}` };
}

/**
 * Category and mood are separate answers: what the entry is about, and how the
 * day felt. The entry is stamped with the real date and time it was written.
 */
export default function JournalEntryModal({ open, onClose, onSave, onDelete, initialEntry }) {
  const [text, setText] = useState("");
  const [mood, setMood] = useState(MOOD_SCALE[2]);
  const [category, setCategory] = useState("General");
  const [severity, setSeverity] = useState("mild");
  const [urgentOpen, setUrgentOpen] = useState(false);
  const { darkMode, shots } = useAppState();

  useEffect(() => {
    if (!open) return;
    if (initialEntry) {
      setText(initialEntry.text || "");
      setMood(moodFor(initialEntry.mood));
      setCategory(initialEntry.category || "General");
    } else {
      setText("");
      setMood(MOOD_SCALE[2]);
      setCategory("General");
    }
    setSeverity("mild");
    setUrgentOpen(false);
  }, [open, initialEntry]);

  const sheetRef = useModal({ open, onDismiss: onClose });

  if (!open) return null;

  const recentMed = getRecentMedication(shots, null);

  const handleSave = async () => {
    if (!text.trim()) return;
    try {
      const { date, time } = initialEntry ? { date: initialEntry.date, time: initialEntry.time } : nowFormatted();
      await onSave({
        text: text.trim(), date, time,
        mood: mood.label, moodColor: "",
        category,
        // Carried through for the structured side-effect record only.
        severity: category === "Side effect" ? severity : undefined,
      });
      toast.success(initialEntry ? "Journal entry updated" : "Journal entry added");
      setTimeout(() => onClose(), 500);
    } catch (err) {
      toast.error("Couldn't save. Please try again.", { actionLabel: "Retry", onAction: handleSave });
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 overlay-lock" onClick={onClose} aria-hidden="true" />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={initialEntry ? "Edit Entry" : "New Journal Entry"}
        tabIndex={-1}
        className="relative bg-white dark:bg-[#0f1117] rounded-t-3xl sm:rounded-3xl w-full sm:max-w-[520px] max-h-[92dvh] overflow-y-auto overflow-x-hidden no-scrollbar sheet-lock animate-in slide-in-from-bottom sm:mx-4 dark:shadow-[0_-8px_40px_rgba(0,0,0,0.5)] outline-none"
      >
        <div className="sticky top-0 z-10 bg-white dark:bg-[#0f1117]">
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-gray-300 dark:bg-white/20 rounded-full" />
          </div>
          <div className="flex items-center justify-between px-5 pb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-[#E8E9F0]">{initialEntry ? "Edit Entry" : "New Journal Entry"}</h2>
            <div className="flex items-center gap-3">
              {onDelete && <button onClick={onDelete}><Trash2 size={20} className="text-gray-400" /></button>}
              <button onClick={onClose}><X size={22} className="text-gray-400" /></button>
            </div>
          </div>
        </div>

        <div className="px-5 pb-4 space-y-4">
          {/* Category — what the entry is about */}
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Category</label>
            <div className="flex flex-wrap gap-2">
              {JOURNAL_CATEGORIES.map((c) => {
                const active = category === c.key;
                return (
                  <button key={c.key} onClick={() => setCategory(c.key)}
                    style={active ? { background: c.bg, borderColor: c.color, color: c.color } : {}}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${
                      active ? "" : "bg-white dark:bg-white/[0.05] text-gray-500 dark:text-[#9A9DAE] border-gray-200 dark:border-white/[0.08]"
                    }`}>
                    {React.cloneElement(c.icon, { style: active ? { color: c.color } : undefined, size: 14 })}
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mood — how the day felt, on its own 5-point scale */}
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Mood</label>
            <div className="flex flex-wrap gap-2">
              {MOOD_SCALE.map((m) => {
                const active = mood.label === m.label;
                return (
                  <button key={m.label} onClick={() => setMood(m)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${
                      active
                        ? "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-500/30"
                        : "bg-white dark:bg-white/[0.05] text-gray-400 dark:text-[#9A9DAE] border-gray-200 dark:border-white/[0.08]"
                    }`}>
                    {m.emoji} {m.short}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Severity, only for a side-effect entry */}
          {category === "Side effect" && (
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">How bad is it?</label>
              <div className="flex gap-2">
                {SEVERITY_LEVELS.map((s) => (
                  <button key={s.value} onClick={() => setSeverity(s.value)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
                      severity === s.value
                        ? "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-500/30"
                        : "bg-white dark:bg-white/[0.05] text-gray-500 dark:text-[#9A9DAE] border-gray-200 dark:border-white/[0.08]"
                    }`}>
                    {s.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                This is saved as a side-effect record too, so it appears in History, Insights and your report.
              </p>
            </div>
          )}

          {/* Text */}
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Your thoughts</label>
            <textarea value={text} onChange={(e) => setText(e.target.value)}
              placeholder="Write your journal entry here..."
              className="w-full border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.05] text-gray-900 dark:text-[#E8E9F0] placeholder-gray-400 dark:placeholder-[#9A9DAE] rounded-xl px-4 py-3 text-sm resize-none h-32 outline-none focus:border-indigo-300 dark:focus:border-indigo-500/50" />
          </div>
        </div>

        {category === "Side effect" && (
          <div className="px-5 pb-3 space-y-2">
            <UrgentHelpCard
              open={urgentOpen || severity === "severe"}
              onToggle={() => setUrgentOpen((v) => !v)}
              highlight={severity === "severe"}
            />
            {text.trim() && <RedFlagBanner text={`${severity} ${text}`} medication={recentMed} />}
          </div>
        )}

        <div className="sticky bottom-0 px-5 pt-3 bg-white dark:bg-[#0f1117] border-t border-gray-100 dark:border-white/[0.08]" style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))" }}>
          <button onClick={handleSave} disabled={!text.trim()}
            className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
            <Save size={16} /> {initialEntry ? "Update Entry" : "Save Entry"}
          </button>
        </div>
      </div>
    </div>
  );
}