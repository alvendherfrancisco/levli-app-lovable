import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Settings, FileText, Search, Syringe, Loader2, Crown } from "lucide-react";
import PageContainer from "@/components/PageContainer";
import Fab from "@/components/Fab";
import EmptyStateCard from "@/components/EmptyStateCard";
import ShotListRow from "@/components/shots/ShotListRow";
import ShotSummaryCards from "@/components/shots/ShotSummaryCards";
import InjectionSiteCard from "@/components/shots/InjectionSiteCard";
import AddShotModal from "@/components/modals/AddShotModal";
import HeaderIconButton, { HEADER_ICON, HEADER_GLYPH } from "@/components/longlist/HeaderIconButton";
import ListSearchBar from "@/components/longlist/ListSearchBar";
import MonthJumpButton from "@/components/longlist/MonthJumpButton";
import { DATE_PERIODS, inDatePeriod } from "@/lib/datePeriod";
import { monthKeyOf, monthKeysOf } from "@/lib/monthGroups";
import { useAppState } from "@/lib/AppState";
import { addDaysToShotDate, daysUntilShotDate, formatDayKeyShort } from "@/lib/dateUtils";
import { useSubscription } from "@/lib/SubscriptionContext";
import { effectiveDaysBetween } from "@/lib/medicationConfig";
import { logWords } from "@/lib/medicationForm";
import { isActiveMedication } from "@/lib/medicationLink";
import { calcAdherence } from "@/lib/adherence";
import SupplyAlertBanner from "@/components/SupplyAlertBanner";

// The History block on this screen is a look at the most recent doses; the whole
// history opens on its own screen (see src/pages/ShotsHistory.jsx) so this page
// stays a short one. Three is what it shows.
const PREVIEW_COUNT = 3;

export default function Shots() {
  const [showShot, setShowShot] = useState(false);
  const [editingShot, setEditingShot] = useState(null);
  // What the History block is narrowed by: one word, and a date.
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("all");
  const [jumpMonth, setJumpMonth] = useState(null);
  const [dateSheetOpen, setDateSheetOpen] = useState(false);
  const { shots, shotsLoading, profile, medications } = useAppState();
  const { isPremium, openPaywall } = useSubscription();
  const navigate = useNavigate();

  const FREE_LIMIT = 10;
  const visibleShots = isPremium ? shots : shots.slice(0, FREE_LIMIT);
  const hiddenCount = isPremium ? 0 : Math.max(0, shots.length - FREE_LIMIT);
  // The history block is narrowed the same way the Journal is, from the row above
  // it: one word, and a date — this week, this month, or a month of its own. Only
  // the three most recent that match are shown, as before.
  const history = useMemo(() => {
    const term = search.trim().toLowerCase();
    return visibleShots.filter((s) => {
      if (jumpMonth) {
        if (monthKeyOf(s.date) !== jumpMonth) return false;
      } else if (!inDatePeriod(s.date, period)) return false;
      if (!term) return true;
      return [s.medication, s.site, s.notes].some((v) => (v || "").toLowerCase().includes(term));
    });
  }, [visibleShots, search, period, jumpMonth]);
  const historyShots = history.slice(0, PREVIEW_COUNT);
  const months = useMemo(() => monthKeysOf(visibleShots, (s) => s.date), [visibleShots]);
  const hasHistoryFilters = !!search.trim() || period !== "all" || !!jumpMonth;
  const clearHistoryFilters = () => { setSearch(""); setPeriod("all"); setJumpMonth(null); };

  const last = shots[0] || null;
  const daysBetween = effectiveDaysBetween(
    profile,
    last?.medication,
    medications.find((m) => m.medication_name === last?.medication) || null,
  );
  const nextDate = last ? addDaysToShotDate(last.date, daysBetween) : null;

  // Adherence for the most recent medication: doses logged over doses scheduled
  // inside the window, which ends on the day the medication was marked stopped.
  const lastMed = last?.medication;
  const lastRegimen = medications.find((m) => m.medication_name === lastMed) || null;
  // The screen speaks of doses for a product taken by mouth and of shots for an
  // injected one, following the medication in hand (src/lib/medicationForm.js).
  const focusMed = medications.find(isActiveMedication) || lastRegimen;
  const words = logWords(focusMed?.medication_name || lastMed, {
    route: focusMed?.route || last?.route || "",
    shots,
  });
  const addLabel = words.one === "dose" ? "Log dose" : "Add shot";
  const adherence = lastMed
    ? calcAdherence(shots, lastMed, 90, {
        startDate: lastRegimen?.start_date || "",
        stoppedDate: lastRegimen?.discontinued_date || "",
      })
    : { logged: 0, scheduled: 0, adherencePct: null, startDate: null, endDate: null };
  const adherenceRange = adherence.startDate && adherence.endDate
    ? `${formatDayKeyShort(adherence.startDate)} – ${formatDayKeyShort(adherence.endDate)}`
    : "";

  // A due date that has already gone is never shown as the upcoming shot.
  const nextDaysLeft = nextDate ? daysUntilShotDate(nextDate) : null;
  const nextOverdue = nextDaysLeft != null && nextDaysLeft < 0;

  const openEdit = (shot) => { setEditingShot(shot); setShowShot(true); };
  const openNew = () => { setEditingShot(null); setShowShot(true); };

  return (
    <PageContainer bottomInset="fab" disclaimer>
      <div className="sticky top-0 z-30 bg-white dark:bg-gray-950 w-full flex items-center justify-between px-5 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{words.Many}</h1>
        <div className="flex items-center gap-1">
          <HeaderIconButton label="Report" onClick={() => navigate("/report")}>
            <FileText size={HEADER_GLYPH} aria-hidden="true" />
          </HeaderIconButton>
          <Link to="/settings" aria-label="Settings" className={HEADER_ICON}>
            <Settings size={HEADER_GLYPH} aria-hidden="true" />
          </Link>
        </div>
      </div>

      <div className="w-full max-w-3xl mx-auto pt-4">
        {/* The same supply reminder Home shows, in the same words. */}
        <SupplyAlertBanner className="mx-4 mb-4" />
        <ShotSummaryCards
          totalShots={shots.length}
          last={last}
          nextDate={nextDate}
          nextDaysLeft={nextDaysLeft}
          nextOverdue={nextOverdue}
          adherence={adherence}
          adherenceRange={adherenceRange}
          words={words}
        />

        {/* The same row the Journal carries, above the list it narrows: the word
            to look for, with the dates beside it. It appears once there is a
            history to narrow. */}
        {shots.length > 0 && (
          <div className="px-4 pb-4 flex items-center gap-2">
            <ListSearchBar
              value={search}
              onChange={setSearch}
              placeholder={`Search your ${words.many}`}
              ariaLabel={`Search your ${words.many}`}
            />
            <MonthJumpButton
              months={months}
              onJump={(key) => { setJumpMonth(key); setPeriod("all"); }}
              compact
              title="Dates"
              quickOptions={DATE_PERIODS}
              quickValue={period}
              onQuick={(key) => { setPeriod(key); setJumpMonth(null); }}
              onOpenChange={setDateSheetOpen}
            />
          </div>
        )}

        <div className="px-4">
          <div className="flex items-center justify-between gap-2 mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">History</h2>
            {/* The one way into the whole history, and only once there is more of
                it than the three this screen shows. */}
            {shots.length > PREVIEW_COUNT && (
              <Link to="/shots/history" className="btn-link text-sm">View all</Link>
            )}
          </div>

          {shotsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={28} className="animate-spin text-indigo-400" />
            </div>
          ) : shots.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 text-center text-gray-400 dark:text-[#9A9DAE] border border-gray-100 dark:border-gray-800">
              <div className="w-14 h-14 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mx-auto mb-3">
                <Syringe size={32} className="opacity-30" aria-hidden="true" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">No {words.Many} Logged</h3>
              <p className="text-sm">Log your first {words.one} to track your {words.many}{words.one === "shot" ? ", injection sites," : ""} and how you feel over time.</p>
            </div>
          ) : historyShots.length === 0 && hasHistoryFilters ? (
            <>
              <EmptyStateCard icon={Search} title="No matches" />
              <button type="button" onClick={clearHistoryFilters} className="btn-link text-sm mx-auto mt-4 flex">
                Clear filters
              </button>
            </>
          ) : (
            <div className="space-y-2">
              {/* The three most recent that match, each the same compact row the
                  whole history draws. */}
              {historyShots.map((shot) => (
                <div key={shot.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                  <ShotListRow shot={shot} onOpen={openEdit} />
                </div>
              ))}

              {hiddenCount > 0 && (
                <button onClick={openPaywall} className="w-full bg-white dark:bg-gray-900 rounded-xl p-4 border border-dashed border-indigo-200 dark:border-indigo-500/30 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <Crown size={18} className="text-indigo-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{hiddenCount} more {hiddenCount === 1 ? words.one : words.many} in your history</p>
                    <p className="text-xs text-gray-400">Unlock with Levli Premium to view your complete {words.one} history.</p>
                  </div>
                </button>
              )}

            </div>
          )}
        </div>
      </div>

      {/* Where the shots were given, below the history it describes (moved here
          from Insights), with the page's own 16px gap above it rather than
          sitting against the last card. */}
      <div className="w-full max-w-3xl mx-auto mt-4 pb-8">
        <InjectionSiteCard />
      </div>

      {/* Out of the way while the date sheet is up. */}
      {!dateSheetOpen && <Fab onClick={openNew} label={addLabel} icon={null} />}

      <AddShotModal open={showShot} onClose={() => { setShowShot(false); setEditingShot(null); }} editingShot={editingShot} />
    </PageContainer>
  );
}