import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Settings, BookOpen, Clock, Heart } from "lucide-react";
import PageContainer from "@/components/PageContainer";
import Fab from "@/components/Fab";
import JournalEntryModal from "@/components/modals/JournalEntryModal";
import SideEffectsPanel from "@/components/insights/SideEffectsPanel";
import { useAppState } from "@/lib/AppState";
import { JOURNAL_CATEGORIES, categoryMeta, normaliseCategory, sortJournalNewestFirst } from "@/lib/journalMeta";
import { parseShotDate, toDayKey, formatLocaleDate } from "@/lib/dateUtils";
import { classifyRedFlag } from "@/lib/redFlags";
import { getRecentMedication } from "@/lib/medicationData";
import { toast } from "@/lib/toast";

export default function Journal() {
  const {
    journalEntries, addJournalEntry, updateJournalEntry, deleteJournalEntry,
    adverseEvents, addAdverseEvent, shots,
  } = useAppState();
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [filterCat, setFilterCat] = useState("All");

  // Newest first, by the date and time each entry was written.
  const entries = useMemo(() => sortJournalNewestFirst(journalEntries), [journalEntries]);
  const filtered = filterCat === "All"
    ? entries
    : entries.filter((e) => normaliseCategory(e.category) === filterCat);

  const handleSave = async (entry) => {
    if (editingEntry) {
      await updateJournalEntry(editingEntry.id, entry);
      toast.success("Journal entry updated");
    } else {
      const rec = await addJournalEntry(entry);
      // A side-effect entry always has a structured record to match it.
      if (normaliseCategory(entry.category) === "Side effect" && rec?.id) {
        const day = toDayKey(parseShotDate(entry.date) || new Date());
        const recentMed = getRecentMedication(shots, day) || "";
        const { tier } = classifyRedFlag(`${entry.severity || ""} ${entry.text}`.trim(), recentMed);
        try {
          await addAdverseEvent({
            medication_name: recentMed,
            symptom: entry.text,
            symptom_category: "other",
            severity: entry.severity || "",
            onset_date: day,
            day_key: day,
            resolved: false,
            user_attribution: true,
            red_flag_tier: tier || "none",
            notes: entry.text,
            journal_entry_id: rec.id,
          });
        } catch (err) {
          // The journal entry itself is already saved; the log can be re-added by hand.
          toast.error("Saved the entry, but the side-effect record could not be added");
        }
      }
    }
    setEditingEntry(null);
  };

  const handleDelete = async (id) => {
    try {
      await deleteJournalEntry(id);
      toast.deleted("Journal entry deleted");
      setEditingEntry(null);
      setShowModal(false);
    } catch (err) {
      toast.error("Failed to delete journal entry");
    }
  };

  const openEdit = (entry) => { setEditingEntry(entry); setShowModal(true); };
  const openNew = () => { setEditingEntry(null); setShowModal(true); };

  const normaliseEntry = (e) => ({ ...e, category: normaliseCategory(e.category) });

  const linkedCount = (entryId) => adverseEvents.filter((e) => e.journal_entry_id === entryId).length;

  return (
    <PageContainer bottomInset="fab" disclaimer>
      <div className="sticky top-0 z-30 bg-white dark:bg-gray-950 w-full flex items-center justify-between px-5 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Journal</h1>
        <div className="flex items-center gap-3">
          <Link to="/settings" aria-label="Settings" className="w-11 h-11 -m-2.5 flex items-center justify-center rounded-full"><Settings size={22} className="text-gray-600 dark:text-gray-400" aria-hidden="true" /></Link>
        </div>
      </div>

      {/* What was logged over the last 90 days, summarised at the top of the
          page (moved here from Insights). */}
      <div className="w-full max-w-3xl mx-auto pt-4">
        <SideEffectsPanel />
      </div>

      {/* Category filter chips — icon, colour and text label for each */}
      <div className="w-full max-w-3xl mx-auto px-4 mb-3 flex flex-wrap gap-2">
        <button onClick={() => setFilterCat("All")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            filterCat === "All"
              ? "bg-indigo-600 text-white border-indigo-600"
              : "bg-white dark:bg-gray-900 text-gray-500 dark:text-[#9A9DAE] border-gray-200 dark:border-gray-700"
          }`}>
          All
        </button>
        {JOURNAL_CATEGORIES.map((c) => {
          const active = filterCat === c.key;
          return (
            <button key={c.key} onClick={() => setFilterCat(c.key)}
              style={active ? { background: c.color, borderColor: c.color } : {}}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                active ? "text-white" : "bg-white dark:bg-gray-900 text-gray-500 dark:text-[#9A9DAE] border-gray-200 dark:border-gray-700"
              }`}>
              {React.cloneElement(c.icon, { size: 13, style: active ? { color: "#fff" } : { color: c.color } })}
              {c.label}
            </button>
          );
        })}
      </div>

      <div className="w-full max-w-3xl mx-auto">
        {filtered.length === 0 ? (
          <div className="px-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 text-center text-gray-400 dark:text-[#9A9DAE] border border-gray-100 dark:border-gray-800">
              <div className="w-14 h-14 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mx-auto mb-3">
                <BookOpen size={32} className="opacity-30" aria-hidden="true" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">No Journal Entries</h3>
              <p className="text-sm">Record your thoughts, symptoms, and medication experiences.</p>
            </div>
          </div>
        ) : (
          <div className="px-4 space-y-3">
            {filtered.map((raw) => {
              const e = normaliseEntry(raw);
              const meta = categoryMeta(e.category);
              const mood = e.mood || "";
              const severityRecorded = e.category === "Side effect" ? linkedCount(e.id) : 0;
              return (
                <button key={e.id} onClick={() => openEdit(e)} className="w-full text-left bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden box-border">
                  <div className="flex items-start gap-3 w-full min-w-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: meta.bg }}>
                      {React.cloneElement(meta.icon, { size: 20, style: { color: meta.color } })}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <p className="text-sm text-gray-700 dark:text-gray-300 overflow-hidden text-ellipsis whitespace-nowrap flex-1 min-w-0">{e.text}</p>
                        <span className="text-xs text-gray-500 dark:text-[#9A9DAE] flex-shrink-0 whitespace-nowrap">
                          {formatLocaleDate(parseShotDate(e.date)) || e.date}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                        <Clock size={11} className="flex-shrink-0" /><span>{e.time}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {mood && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap flex items-center gap-1 bg-white/10 dark:bg-white/[0.08] text-gray-600 dark:text-[#C0C3D4] border border-gray-200 dark:border-white/[0.1]">
                            <Heart size={10} /> {mood}
                          </span>
                        )}
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap flex items-center gap-1"
                          style={{ background: meta.bg, color: meta.color }}>
                          {React.cloneElement(meta.icon, { size: 11 })}
                          {meta.label}
                        </span>
                        {severityRecorded > 0 && (
                          <span className="text-xs text-gray-400 whitespace-nowrap">• side-effect record added</span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <JournalEntryModal
        open={showModal}
        onClose={() => { setShowModal(false); setEditingEntry(null); }}
        onSave={handleSave}
        onDelete={editingEntry ? () => handleDelete(editingEntry.id) : null}
        initialEntry={editingEntry}
      />
      <Fab onClick={openNew} label="Add entry" icon={null} />
    </PageContainer>
  );
}