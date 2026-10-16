import React, { useEffect, useState, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { Settings, BookOpen, Clock, Heart, X } from "lucide-react";
import PageContainer from "@/components/PageContainer";
import Fab from "@/components/Fab";
import JournalEntryModal from "@/components/modals/JournalEntryModal";
import SideEffectsCard from "@/components/journal/SideEffectsCard";
import { useAppState } from "@/lib/AppState";
import { JOURNAL_CATEGORIES, categoryMeta, normaliseCategory, sortJournalNewestFirst } from "@/lib/journalMeta";
import { parseShotDate, toDayKey, formatLocaleDate } from "@/lib/dateUtils";
import { classifyRedFlag } from "@/lib/redFlags";
import { getRecentMedication } from "@/lib/medicationData";
import { toast } from "@/lib/toast";

export default function Journal() {
  const {
    journalEntries, addJournalEntry, updateJournalEntry, deleteJournalEntry,
    adverseEvents, addAdverseEvent, updateAdverseEvent, deleteAdverseEvent, shots,
  } = useAppState();
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [filterCat, setFilterCat] = useState("All");
  // A symptom tapped on History's side-effect card arrives as ?symptom=…, and
  // shows that symptom's own entries.
  const location = useLocation();
  const [symptomFilter, setSymptomFilter] = useState(
    () => new URLSearchParams(window.location.search).get("symptom") || ""
  );

  useEffect(() => {
    const symptom = new URLSearchParams(location.search).get("symptom") || "";
    setSymptomFilter(symptom);
    if (symptom) setFilterCat("Side effect");
  }, [location.search]);

  // Newest first, by the date and time each entry was written.
  const entries = useMemo(() => sortJournalNewestFirst(journalEntries), [journalEntries]);

  // The records behind the tapped symptom, so an entry linked to one of them
  // matches even when its own wording differs.
  const symptomEntryIds = useMemo(() => {
    if (!symptomFilter) return null;
    const target = symptomFilter.trim().toLowerCase();
    return new Set(
      adverseEvents
        .filter((e) => String(e.symptom || "").trim().toLowerCase() === target)
        .map((e) => e.journal_entry_id)
        .filter(Boolean)
    );
  }, [adverseEvents, symptomFilter]);

  const filtered = (filterCat === "All" ? entries : entries.filter((e) => normaliseCategory(e.category) === filterCat))
    .filter((e) => {
      if (!symptomFilter) return true;
      return String(e.text || "").toLowerCase().includes(symptomFilter.trim().toLowerCase())
        || symptomEntryIds.has(e.id);
    });

  // Choosing a category clears the symptom a card tapped on History set.
  const selectCategory = (category) => {
    setFilterCat(category);
    setSymptomFilter("");
  };

  /**
   * The one structured record behind a side-effect entry, kept in step with it:
   * written with the entry, rewritten when the entry changes, and removed when
   * the entry is no longer a side effect or is deleted. The summary card below,
   * this page's entries and the day's own list on Home and History therefore all
   * read the same records and can never disagree.
   */
  const syncSideEffectRecord = async (entryId, entry) => {
    const linked = adverseEvents.filter((e) => e.journal_entry_id === entryId);
    if (normaliseCategory(entry.category) !== "Side effect") {
      for (const rec of linked) await deleteAdverseEvent(rec.id);
      return;
    }
    const day = toDayKey(parseShotDate(entry.date) || new Date());
    const recentMed = getRecentMedication(shots, day) || "";
    const { tier } = classifyRedFlag(`${entry.severity || ""} ${entry.text}`.trim(), recentMed);
    const fields = {
      medication_name: recentMed,
      symptom: entry.text,
      severity: entry.severity || "",
      onset_date: day,
      day_key: day,
      notes: entry.text,
      red_flag_tier: tier || "none",
    };
    if (linked.length) {
      await updateAdverseEvent(linked[0].id, fields);
    } else {
      await addAdverseEvent({
        ...fields,
        symptom_category: "other",
        resolved: false,
        user_attribution: true,
        journal_entry_id: entryId,
      });
    }
  };

  const handleSave = async (entry) => {
    if (editingEntry) {
      await updateJournalEntry(editingEntry.id, entry);
      try {
        await syncSideEffectRecord(editingEntry.id, entry);
      } catch (err) {
        // The entry itself is already saved; the record can be corrected by hand.
        toast.error("Saved the entry, but its side-effect record could not be updated");
      }
      toast.success("Journal entry updated");
    } else {
      const rec = await addJournalEntry(entry);
      // A side-effect entry always has a structured record to match it.
      if (normaliseCategory(entry.category) === "Side effect" && rec?.id) {
        try {
          await syncSideEffectRecord(rec.id, entry);
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
      // The entry's own side-effect records go with it, so nothing is left
      // counting a symptom the journal no longer holds.
      const linked = adverseEvents.filter((e) => e.journal_entry_id === id);
      await deleteJournalEntry(id);
      for (const rec of linked) await deleteAdverseEvent(rec.id);
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

      {/* A symptom tapped on the side-effect card below shows here as its own
          filter, above the category chips. */}
      {symptomFilter && (
        <div className="w-full max-w-3xl mx-auto px-4 pt-4">
          <button onClick={() => setSymptomFilter("")}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#E11D48]/30 bg-[#E11D48]/10 px-3 py-1 text-xs font-medium text-[#E11D48] dark:text-[#FB7185]">
            Showing: {symptomFilter}
            <X size={12} aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Category filter chips — icon, colour and text label for each. The
          summary of everything logged sits at the foot of the page, below the
          entries it summarises. */}
      <div className={`w-full max-w-3xl mx-auto px-4 mb-3 flex flex-wrap gap-2${symptomFilter ? "" : " pt-4"}`}>
        <button onClick={() => selectCategory("All")}
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
            <button key={c.key} onClick={() => selectCategory(c.key)}
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
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                {symptomFilter ? `No entries for “${symptomFilter}”` : "No Journal Entries"}
              </h3>
              <p className="text-sm">
                {symptomFilter
                  ? "Entries you write about this symptom will show here."
                  : "Record your thoughts, symptoms, and medication experiences."}
              </p>
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

      {/* What keeps coming back over the last 30 or 90 days, summarised below the
          entries it summarises — and below the empty card when there are none. */}
      <div className="w-full max-w-3xl mx-auto">
        <SideEffectsCard />
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