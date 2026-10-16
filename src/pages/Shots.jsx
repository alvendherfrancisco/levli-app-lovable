import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Settings, FileText, Syringe, Loader2, Crown } from "lucide-react";
import PageContainer from "@/components/PageContainer";
import Fab from "@/components/Fab";
import ShotCard from "@/components/shots/ShotCard";
import ShotSummaryCards from "@/components/shots/ShotSummaryCards";
import InjectionSiteCard from "@/components/shots/InjectionSiteCard";
import AddShotModal from "@/components/modals/AddShotModal";
import { useAppState } from "@/lib/AppState";
import { addDaysToShotDate, daysUntilShotDate, formatDayKeyShort } from "@/lib/dateUtils";
import { useSubscription } from "@/lib/SubscriptionContext";
import { effectiveDaysBetween } from "@/lib/medicationConfig";
import { logWords } from "@/lib/medicationForm";
import { isActiveMedication } from "@/lib/medicationLink";
import { calcAdherence } from "@/lib/adherence";

export default function Shots() {
  const [showShot, setShowShot] = useState(false);
  const [editingShot, setEditingShot] = useState(null);
  const { shots, shotsLoading, profile, medications } = useAppState();
  const { isPremium, openPaywall } = useSubscription();
  const navigate = useNavigate();

  const FREE_LIMIT = 10;
  const visibleShots = isPremium ? shots : shots.slice(0, FREE_LIMIT);
  const hiddenCount = isPremium ? 0 : Math.max(0, shots.length - FREE_LIMIT);

  const last = shots[0] || null;
  const daysBetween = effectiveDaysBetween(profile, last?.medication);
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
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/report")}><FileText size={22} className="text-gray-500" /></button>
          <Link to="/settings" aria-label="Settings"><Settings size={22} className="text-gray-600" /></Link>
        </div>
      </div>

      <div className="w-full max-w-3xl mx-auto pt-4">
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

        <div className="px-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">History</h2>
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
              <p className="text-sm">Log your first {words.one} to track your doses, injection sites, and how you feel over time.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {visibleShots.map((shot) => (
                <button key={shot.id} onClick={() => openEdit(shot)} className="w-full text-left">
                  <ShotCard {...shot} drugClass={shot.drug_class} />
                </button>
              ))}
              {hiddenCount > 0 && (
                <button onClick={openPaywall} className="w-full bg-white dark:bg-gray-900 rounded-xl p-4 border border-dashed border-indigo-200 dark:border-indigo-500/30 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <Crown size={18} className="text-indigo-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{hiddenCount} more {words.many} in your history</p>
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
      <div className="w-full max-w-3xl mx-auto mt-4">
        <InjectionSiteCard />
      </div>

      <Fab onClick={openNew} label={addLabel} icon={null} />

      <AddShotModal open={showShot} onClose={() => { setShowShot(false); setEditingShot(null); }} editingShot={editingShot} />
    </PageContainer>
  );
}