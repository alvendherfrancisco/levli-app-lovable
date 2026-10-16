import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Crown, Loader2, Search, Syringe } from "lucide-react";
import PageContainer from "@/components/PageContainer";
import EmptyStateCard from "@/components/EmptyStateCard";
import AddShotModal from "@/components/modals/AddShotModal";
import ShotListRow from "@/components/shots/ShotListRow";
import FilterSelect from "@/components/longlist/FilterSelect";
import MonthSectionList from "@/components/longlist/MonthSectionList";
import MonthJumpButton from "@/components/longlist/MonthJumpButton";
import BackToTop from "@/components/longlist/BackToTop";
import { useAppState } from "@/lib/AppState";
import { useSubscription } from "@/lib/SubscriptionContext";
import useProgressiveList from "@/hooks/useProgressiveList";
import { groupByMonth, monthKeysOf } from "@/lib/monthGroups";
import { formatDayKeyShort } from "@/lib/dateUtils";
import { logWords } from "@/lib/medicationForm";
import { isActiveMedication } from "@/lib/medicationLink";

// ─────────────────────────────────────────────────────────────────────────────
// The whole dose history, on its own screen.
//
// It opens from the Shots page's "View all" link and gives the list the room a
// long one needs: the total and the dates it covers at the top, the three
// filters that matter (medication, dose, site), then every entry newest first,
// month by month, 20 at a time as the list is scrolled. A dose opens the same
// editor it opens anywhere else, so nothing about a logged entry changes here.
//
// The list only ever narrows what is on screen: a filter writes nothing, and
// "Clear filters" brings the whole history straight back.
// ─────────────────────────────────────────────────────────────────────────────

const ALL = "all";

export default function ShotsHistory() {
  const navigate = useNavigate();
  const { shots, shotsLoading, medications } = useAppState();
  const { isPremium, openPaywall } = useSubscription();

  const [medFilter, setMedFilter] = useState(ALL);
  const [doseFilter, setDoseFilter] = useState(ALL);
  const [siteFilter, setSiteFilter] = useState(ALL);
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

  // The three filters, offered from the whole history so a choice never
  // disappears once another filter is set.
  const medOptions = useMemo(() => {
    const names = [...new Set(visibleShots.map((s) => s.medication).filter(Boolean))].sort();
    return [{ value: ALL, label: "All medications" }, ...names.map((n) => ({ value: n, label: n }))];
  }, [visibleShots]);

  const doseOptions = useMemo(() => {
    const seen = new Map();
    visibleShots.forEach((s) => {
      if (s.dose == null) return;
      const key = `${s.dose}|${s.dose_unit || "mg"}`;
      if (!seen.has(key)) seen.set(key, `${s.dose} ${s.dose_unit || "mg"}`);
    });
    return [{ value: ALL, label: "All doses" }, ...[...seen.entries()].map(([value, label]) => ({ value, label }))];
  }, [visibleShots]);

  const siteOptions = useMemo(() => {
    const sites = [...new Set(visibleShots.map((s) => s.site).filter(Boolean))].sort();
    return [{ value: ALL, label: "All sites" }, ...sites.map((s) => ({ value: s, label: s }))];
  }, [visibleShots]);

  const filtered = useMemo(
    () =>
      visibleShots.filter((s) => {
        if (medFilter !== ALL && s.medication !== medFilter) return false;
        if (doseFilter !== ALL && `${s.dose}|${s.dose_unit || "mg"}` !== doseFilter) return false;
        if (siteFilter !== ALL && s.site !== siteFilter) return false;
        return true;
      }),
    [visibleShots, medFilter, doseFilter, siteFilter],
  );

  const list = useProgressiveList(filtered, { resetKey: `${medFilter}|${doseFilter}|${siteFilter}` });
  const groups = useMemo(() => groupByMonth(list.visible, (s) => s.date, { singular: "dose" }), [list.visible]);
  const months = useMemo(() => monthKeysOf(filtered, (s) => s.date), [filtered]);

  const { loadMore, hasMore } = list;
  // A jump to a month the first page does not reach yet: keep taking pages in
  // until that month arrives (or the list runs out).
  useEffect(() => {
    if (!jumpMonth || !hasMore) return;
    if (groups.some((g) => g.key === jumpMonth)) return;
    loadMore();
  }, [jumpMonth, hasMore, groups, loadMore]);

  const hasFilters = medFilter !== ALL || doseFilter !== ALL || siteFilter !== ALL;
  const clearFilters = () => { setMedFilter(ALL); setDoseFilter(ALL); setSiteFilter(ALL); };

  const firstDate = visibleShots.length ? visibleShots[visibleShots.length - 1]?.date : "";
  const lastDate = visibleShots.length ? visibleShots[0]?.date : "";
  const rangeText = firstDate && lastDate && firstDate !== lastDate
    ? `${formatDayKeyShort(firstDate)} – ${formatDayKeyShort(lastDate)}`
    : "";

  const openEdit = (shot) => { setEditingShot(shot); setShowShot(true); };

  return (
    <PageContainer bottomInset="default">
      <div className="sticky top-0 z-30 bg-white dark:bg-gray-950 w-full flex items-center gap-3 px-5 pt-6 pb-4">
        <button onClick={() => navigate(-1)} aria-label="Go back">
          <ChevronLeft size={24} className="text-gray-600 dark:text-gray-400" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex-1 min-w-0 truncate">{title}</h1>
        <MonthJumpButton months={months} onJump={setJumpMonth} />
      </div>

      <div className="w-full max-w-3xl mx-auto px-4 pt-4">
        {/* How many, and how far back they go. */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 mb-4">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {visibleShots.length} {words.many} logged
          </p>
          {rangeText && (
            <p className="text-xs text-gray-500 dark:text-[#9A9DAE] mt-0.5">Your history covers {rangeText}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <FilterSelect label="Medication" value={medFilter} onChange={setMedFilter} options={medOptions} className="col-span-2" />
          <FilterSelect label="Dose" value={doseFilter} onChange={setDoseFilter} options={doseOptions} />
          <FilterSelect label="Site" value={siteFilter} onChange={setSiteFilter} options={siteOptions} />
        </div>

        {hasFilters && (
          <div className="flex items-center justify-between gap-3 mb-3">
            <p className="text-xs text-gray-500 dark:text-[#9A9DAE]">
              Showing {filtered.length} of {visibleShots.length}
            </p>
            <button type="button" onClick={clearFilters} className="btn-link text-sm">Clear filters</button>
          </div>
        )}

        {shotsLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={28} className="animate-spin text-indigo-400" />
          </div>
        ) : visibleShots.length === 0 ? (
          <EmptyStateCard
            icon={Syringe}
            title={`No ${words.Many} Logged`}
            description={`Log your first ${words.one} to start your history.`}
          />
        ) : filtered.length === 0 ? (
          <>
            <EmptyStateCard
              icon={Search}
              title={`No ${words.many} match`}
              description="Try another medication, dose or site, or clear the filters to see everything."
            />
            <button type="button" onClick={clearFilters} className="btn-pill btn-secondary w-full mt-3">
              Clear filters
            </button>
          </>
        ) : (
          <>
            <MonthSectionList
              groups={groups}
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
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{hiddenCount} more {words.many} in your history</p>
              <p className="text-xs text-gray-400">Unlock with Levli Premium to view your complete {words.one} history.</p>
            </div>
          </button>
        )}
      </div>

      <BackToTop />
      <AddShotModal
        open={showShot}
        onClose={() => { setShowShot(false); setEditingShot(null); }}
        editingShot={editingShot}
      />
    </PageContainer>
  );
}