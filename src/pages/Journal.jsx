import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Settings, BookOpen, Search } from "lucide-react";
import moment from "moment";
import PageContainer from "@/components/PageContainer";
import Fab from "@/components/Fab";
import EmptyStateCard from "@/components/EmptyStateCard";
import JournalEntryModal from "@/components/modals/JournalEntryModal";
import JournalFilters from "@/components/journal/JournalFilters";
import JournalEntryCard from "@/components/journal/JournalEntryCard";
import MonthSectionList from "@/components/longlist/MonthSectionList";
import MonthJumpButton from "@/components/longlist/MonthJumpButton";
import BackToTop from "@/components/longlist/BackToTop";
import useProgressiveList from "@/hooks/useProgressiveList";
import { groupByMonth, monthCountText, monthKeysOf } from "@/lib/monthGroups";
import { useAppState } from "@/lib/AppState";
import { SIDE_EFFECT_CATEGORY, categoryMeta, normaliseCategory, sortJournalNewestFirst } from "@/lib/journalMeta";
import { toast } from "@/lib/toast";

/**
 * The Journal: what the person wrote about their day — mood, energy, food,
 * exercise, milestones and general entries.
 *
 * It is a long list, so it behaves like one: the entries newest first, split
 * into months, 20 drawn at a time as the list is scrolled, and a month picker in
 * the header to go straight to a month further back. A word can be searched for
 * and the dates narrowed to this week, this month or a range — that only ever
 * narrows what is on screen, and "Clear filters" brings the whole journal back.
 *
 * Side effects have a form of their own (Home and History) and a summary of their
 * own (the card on Insights), so they are neither written, filtered nor listed
 * here. An entry saved as a side effect before that change is kept rather than
 * deleted: it still counts in History, Insights and the report, it is simply not
 * shown in this list.
 */

// The dates the chosen period covers, as day keys (YYYY-MM-DD).
function dateWindow(period, from, to) {
  if (period === "week") {
    return {
      start: moment().startOf("isoWeek").format("YYYY-MM-DD"),
      end: moment().endOf("isoWeek").format("YYYY-MM-DD"),
    };
  }
  if (period === "month") {
    return {
      start: moment().startOf("month").format("YYYY-MM-DD"),
      end: moment().endOf("month").format("YYYY-MM-DD"),
    };
  }
  if (period === "custom") return { start: from || "", end: to || "" };
  return { start: "", end: "" };
}

export default function Journal() {
  const { journalEntries, addJournalEntry, updateJournalEntry, deleteJournalEntry } = useAppState();
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [jumpMonth, setJumpMonth] = useState(null);

  // Newest first, by the date and time each entry was written, and never the
  // side-effect entries: this list is the Journal's own categories.
  const entries = useMemo(
    () =>
      sortJournalNewestFirst(journalEntries).filter(
        (e) => normaliseCategory(e.category) !== SIDE_EFFECT_CATEGORY
      ),
    [journalEntries]
  );

  // What the filters ask for: the category, the word and the dates.
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const window = dateWindow(period, from, to);
    return entries.filter((e) => {
      if (category !== "All" && normaliseCategory(e.category) !== category) return false;
      const day = e.date || "";
      if (window.start && day < window.start) return false;
      if (window.end && day > window.end) return false;
      if (!term) return true;
      return [e.text, categoryMeta(normaliseCategory(e.category)).label, e.mood]
        .some((value) => (value || "").toLowerCase().includes(term));
    });
  }, [entries, category, search, period, from, to]);

  // 20 entries at a time; a new word, category or period starts the list again
  // from the first page.
  const list = useProgressiveList(filtered, {
    resetKey: `${category}|${search}|${period}|${from}|${to}`,
  });
  const groups = useMemo(() => groupByMonth(list.visible, (e) => e.date), [list.visible]);
  const months = useMemo(() => monthKeysOf(filtered, (e) => e.date), [filtered]);

  const { loadMore, hasMore } = list;
  // A jump to a month the first page does not reach: keep taking pages in until
  // that month arrives, or the list runs out.
  useEffect(() => {
    if (!jumpMonth || !hasMore) return;
    if (groups.some((g) => g.key === jumpMonth)) return;
    loadMore();
  }, [jumpMonth, hasMore, groups, loadMore]);

  const hasFilters = category !== "All" || !!search.trim() || period !== "all";
  const clearFilters = () => {
    setCategory("All");
    setSearch("");
    setPeriod("all");
    setFrom("");
    setTo("");
  };

  // One line saying what is on screen: the entries this month, or the entries the
  // chosen period covers.
  const summary = useMemo(() => {
    const count = filtered.length;
    if (period === "week") return `${monthCountText(count, "entry")} this week`;
    if (period === "month") return `${monthCountText(count, "entry")} this month`;
    if (period === "custom") return `${monthCountText(count, "entry")} in the dates you chose`;
    const monthStart = moment().startOf("month").format("YYYY-MM-DD");
    const thisMonth = filtered.filter((e) => (e.date || "") >= monthStart).length;
    return thisMonth > 0 ? `${monthCountText(thisMonth, "entry")} this month` : monthCountText(count, "entry");
  }, [filtered, period]);

  const handleSave = async (entry) => {
    if (editingEntry) {
      await updateJournalEntry(editingEntry.id, entry);
      toast.success("Journal entry updated");
    } else {
      await addJournalEntry(entry);
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

  return (
    <PageContainer bottomInset="fab" disclaimer>
      <div className="sticky top-0 z-30 bg-white dark:bg-gray-950 w-full flex items-center justify-between px-5 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Journal</h1>
        <div className="flex items-center gap-2">
          <MonthJumpButton months={months} onJump={setJumpMonth} />
          <Link to="/settings" aria-label="Settings" className="w-11 h-11 -m-2.5 flex items-center justify-center rounded-full"><Settings size={22} className="text-gray-600 dark:text-gray-400" aria-hidden="true" /></Link>
        </div>
      </div>

      <div className="w-full max-w-3xl mx-auto">
        <JournalFilters
          category={category} onCategory={setCategory}
          search={search} onSearch={setSearch}
          period={period} onPeriod={setPeriod}
          from={from} to={to} onFrom={setFrom} onTo={setTo}
        />

        {entries.length === 0 ? (
          <div className="px-4 pt-4">
            <EmptyStateCard
              icon={BookOpen}
              title="No Journal Entries"
              description="Record your mood, energy, meals, exercise and milestones."
            />
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-4 pt-4">
            <EmptyStateCard
              icon={Search}
              title="No entries match"
              description="Try another word or another period, or clear the filters to see every entry again."
            />
            {hasFilters && (
              <button type="button" onClick={clearFilters} className="btn-pill btn-secondary w-full mt-3">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="px-4 pt-4">
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{summary}</p>

            <MonthSectionList
              groups={groups}
              jumpTo={jumpMonth}
              renderItem={(entry) => (
                <JournalEntryCard entry={normaliseEntry(entry)} onEdit={openEdit} />
              )}
            />

            {hasMore && (
              <div ref={list.sentinelRef} className="pt-1 pb-3 text-center">
                <button type="button" onClick={loadMore} className="btn-link text-sm">Load more</button>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Showing {list.shown} of {list.total}</p>
              </div>
            )}
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
      <BackToTop />
      <Fab onClick={openNew} label="Add entry" icon={null} />
    </PageContainer>
  );
}