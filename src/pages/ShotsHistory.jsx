import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Crown, Filter, Loader2, Plus, Search, Syringe, X } from "lucide-react";
import PageContainer from "@/components/PageContainer";
import EmptyStateCard from "@/components/EmptyStateCard";
import AddShotModal from "@/components/modals/AddShotModal";
import ShotListRow from "@/components/shots/ShotListRow";
import ShotFilterSheet from "@/components/shots/ShotFilterSheet";
import HeaderIconButton from "@/components/longlist/HeaderIconButton";
import MonthSectionList from "@/components/longlist/MonthSectionList";
import MonthJumpButton from "@/components/longlist/MonthJumpButton";
import BackToTop from "@/components/longlist/BackToTop";
import { useAppState } from "@/lib/AppState";
import { useSubscription } from "@/lib/SubscriptionContext";
import useProgressiveList from "@/hooks/useProgressiveList";
import { groupByMonth, monthKeysOf } from "@/lib/monthGroups";
import { logWords } from "@/lib/medicationForm";
import { isActiveMedication } from "@/lib/medicationLink";

// ─────────────────────────────────────────────────────────────────────────────
// The whole dose history, on its own screen.
//
// It is a browsing screen, so nothing on it is asked for until it is needed: the
// count is in the title, the two small icons in the header open the date and the
// filter sheets, and the list itself starts straight away — every entry newest
// first, month by month, 20 at a time as it is scrolled.
//
// A filter writes nothing and shows as a small dot on the filter icon and a
// removable chip, so what is on screen is always answerable at a glance. A dose
// opens the same editor it opens anywhere else, and going back leaves the list
// exactly where it was.
// ─────────────────────────────────────────────────────────────────────────────

const ALL = "all";

export default function ShotsHistory() {
  const navigate = useNavigate();
  const { shots, shotsLoading, medications } = useAppState();
  const { isPremium, openPaywall } = useSubscription();

  // The choices the filter sheet is working on, and what it last applied.
  const [filters, setFilters] = useState({ medication: ALL, dose: ALL, site: ALL });
  const [showFilters, setShowFilters] = useState(false);
  const [jumpMonth, setJumpMonth] = useState(null);
  const [showShot, setShowShot] = useState(false);
  const [editingShot, setEditingShot] = useState(null);

  // The free plan keeps the app's own limit on how far back the list goes.
  const FREE_LIMIT = 10;
  const visibleShots = isPremium ? shots : shots.slice(0, FREE_LIMIT);
  const hiddenCount = isPremium ? 0 : Math.max(0, shots.length - FREE_LIMIT);

  // The screen speaks of doses for a product taken by mouth and of shots for an
  // injected one (src/lib/medicationForm.js).
  const focusMed = medications.find(isActiveMedication) || null;
  const words = logWords(focusMed?.medication_name || shots[0]?.medication || "", {
    route: focusMed?.route || shots[0]?.route || "",
    shots,
  });
  const title = words.one === "dose" ? "Dose history" : "Shot history";

  // What the sheet offers, taken from the whole history so a choice never
  // disappears once another filter is set.
  const options = useMemo(() => {
    const names = [...new Set(visibleShots.map((s) => s.medication).filter(Boolean))].sort();
    const doses = new Map();
    visibleShots.forEach((s) => {
      if (s.dose == null) return;
      const key = `${s.dose}|${s.dose_unit || "mg"}`;
      if (!doses.has(key)) doses.set(key, `${s.dose} ${s.dose_unit || "mg"}`);
    });
    const sites = [...new Set(visibleShots.map((s) => s.site).filter(Boolean))].sort();
    return {
      medication: [{ value: ALL, label: "All" }, ...names.map((n) => ({ value: n, label: n }))],
      dose: [{ value: ALL, label: "All" }, ...[...doses.entries()].map(([value, label]) => ({ value, label }))],
      site: [{ value: ALL, label: "All" }, ...sites.map((s) => ({ value: s, label: s }))],
    };
  }, [visibleShots]);

  const filtered = useMemo(
    () =>
      visibleShots.filter((s) => {
        if (filters.medication !== ALL && s.medication !== filters.medication) return false;
        if (filters.dose !== ALL && `${s.dose}|${s.dose_unit || "mg"}` !== filters.dose) return false;
        if (filters.site !== ALL && s.site !== filters.site) return false;
        return true;
      }),
    [visibleShots, filters],
  );

  const list = useProgressiveList(filtered, {
    resetKey: `${filters.medication}|${filters.dose}|${filters.site}`,
  });
  const groups = useMemo(() => groupByMonth(list.visible, (s) => s.date), [list.visible]);
  const months = useMemo(() => monthKeysOf(filtered, (s) => s.date), [filtered]);

  const { loadMore, hasMore } = list;
  // A jump to a month the first page does not reach yet: keep taking pages in
  // until that month arrives (or the list runs out).
  useEffect(() => {
    if (!jumpMonth || !hasMore) return;
    if (groups.some((g) => g.key === jumpMonth)) return;
    loadMore();
  }, [jumpMonth, hasMore, groups, loadMore]);

  const hasFilters = filters.medication !== ALL || filters.dose !== ALL || filters.site !== ALL;
  const clearFilters = () => setFilters({ medication: ALL, dose: ALL, site: ALL });

  // One chip per choice in hand, each removable on its own.
  const chips = [
    filters.medication !== ALL && { key: "medication", label: filters.medication },
    filters.dose !== ALL && {
      key: "dose",
      label: (options.dose.find((o) => o.value === filters.dose) || {}).label || filters.dose,
    },
    filters.site !== ALL && { key: "site", label: filters.site },
  ].filter(Boolean);

  const openEdit = (shot) => { setEditingShot(shot); setShowShot(true); };
  const openNew = () => { setEditingShot(null); setShowShot(true); };
  const heading = visibleShots.length ? `${title} (${visibleShots.length})` : title;

  return (
    <PageContainer bottomInset="default">
      <div className="sticky top-0 z-30 bg-white dark:bg-gray-950 w-full flex items-center gap-1 px-5 pt-6 pb-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="-my-1.5 -ml-1 w-8 h-11 flex shrink-0 items-center justify-center"
        >
          <ChevronLeft size={24} className="text-gray-600 dark:text-gray-400" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex-1 min-w-0 truncate">{heading}</h1>
        <MonthJumpButton months={months} onJump={setJumpMonth} compact />
        <HeaderIconButton label="Filter" onClick={() => setShowFilters(true)} active={hasFilters}>
          <Filter size={20} aria-hidden="true" />
        </HeaderIconButton>
      </div>

      <div className="w-full max-w-3xl mx-auto px-4 pt-4">
        {/* What is being filtered by, and a tap to take any of it off again. */}
        {chips.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {chips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={() => setFilters((f) => ({ ...f, [chip.key]: ALL }))}
                className="btn-pill btn-pill-sm gap-1.5 border border-gray-200 bg-white text-gray-700 dark:border-white/[0.12] dark:bg-white/[0.05] dark:text-[#E8E9F0]"
              >
                {chip.label}
                <X size={13} aria-hidden="true" className="text-gray-400" />
                <span className="sr-only">Remove this filter</span>
              </button>
            ))}
          </div>
        )}

        {shotsLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={28} className="animate-spin text-indigo-400" />
          </div>
        ) : visibleShots.length === 0 ? (
          <>
            <EmptyStateCard icon={Syringe} title={`No ${words.many} yet`} />
            <button type="button" onClick={openNew} className="btn-pill btn-pill-sm btn-primary mx-auto mt-4 flex">
              <Plus size={16} aria-hidden="true" /> Log {words.one}
            </button>
          </>
        ) : filtered.length === 0 ? (
          <>
            <EmptyStateCard icon={Search} title="No matches" />
            <button type="button" onClick={clearFilters} className="btn-link text-sm mx-auto mt-4 flex">
              Clear filters
            </button>
          </>
        ) : (
          <>
            <MonthSectionList
              groups={groups}
              countSingular={words.one}
              jumpTo={jumpMonth}
              renderItem={(shot) => <ShotListRow shot={shot} onOpen={openEdit} />}
            />

            {hasMore && (
              <div ref={list.sentinelRef} className="pt-1 pb-3 text-center">
                <button type="button" onClick={loadMore} className="btn-link text-sm">Load more</button>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Showing {list.shown} of {list.total}</p>
              </div>
            )}
          </>
        )}

        {hiddenCount > 0 && (
          <button onClick={openPaywall} className="w-full mt-4 bg-white dark:bg-gray-900 rounded-xl p-4 border border-dashed border-indigo-200 dark:border-indigo-500/30 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/15 flex items-center justify-center flex-shrink-0">
              <Crown size={18} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{hiddenCount} more {hiddenCount === 1 ? words.one : words.many} in your history</p>
              <p className="text-xs text-gray-400">Unlock with Levli Premium to view your complete {words.one} history.</p>
            </div>
          </button>
        )}
      </div>

      <ShotFilterSheet
        open={showFilters}
        onClose={() => setShowFilters(false)}
        value={filters}
        options={options}
        onApply={setFilters}
      />

      <BackToTop />
      <AddShotModal
        open={showShot}
        onClose={() => { setShowShot(false); setEditingShot(null); }}
        editingShot={editingShot}
      />
    </PageContainer>
  );
}