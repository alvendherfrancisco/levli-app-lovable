import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Settings, FileText, Syringe, Clock, CalendarCheck, ClipboardCheck, Loader2, Crown } from "lucide-react";
import PageContainer from "@/components/PageContainer";
import Fab from "@/components/Fab";
import ShotCard from "@/components/shots/ShotCard";
import DoseBadge from "@/components/DoseBadge";
import AddShotModal from "@/components/modals/AddShotModal";
import { useAppState } from "@/lib/AppState";
import { addDaysToShotDate, daysAgoLabel, daysUntilShotDate, formatDayKeyShort } from "@/lib/dateUtils";
import { useSubscription } from "@/lib/SubscriptionContext";
import { effectiveDaysBetween } from "@/lib/medicationConfig";
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
    <PageContainer bottomInset="fab">
      <div className="sticky top-0 z-30 bg-white dark:bg-gray-950 w-full flex items-center justify-between px-5 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Shots</h1>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/report")}><FileText size={22} className="text-gray-500" /></button>
          <Link to="/settings"><Settings size={22} className="text-gray-600" /></Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto pt-4">
        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-4 mb-5">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-3 shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center flex-shrink-0">
                <Syringe size={20} strokeWidth={2} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-500">Total Shots</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{shots.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl p-3 shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center flex-shrink-0">
                <Clock size={20} strokeWidth={2} className="text-amber-500 dark:text-amber-400" />
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-500">Last Dose</span>
            </div>
            {last ? (
              <>
                <DoseBadge medication={last.medication} dose={last.dose} unit={last.dose_unit || "mg"} className="text-base px-2 py-0.5" />
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{daysAgoLabel(last.date)}</p>
              </>
            ) : <p className="text-sm text-gray-400 dark:text-gray-500">No shots yet</p>}
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl p-3 shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900 flex items-center justify-center flex-shrink-0">
                <CalendarCheck size={20} strokeWidth={2} className="text-teal-600 dark:text-teal-400" />
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-500">{nextOverdue ? "Dose was due" : "Next Shot"}</span>
            </div>
            {nextDate ? (
              <>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{nextDate}</p>
                {nextOverdue && <p className="text-xs text-gray-400 dark:text-gray-500">{Math.abs(nextDaysLeft)} days ago</p>}
              </>
            ) : <p className="text-sm text-gray-400 dark:text-gray-500">—</p>}
          </div>
          {adherence.adherencePct != null && (
            <div className="bg-white dark:bg-gray-900 rounded-xl p-3 shadow-sm border border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center flex-shrink-0">
                  <ClipboardCheck size={20} strokeWidth={2} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500">Adherence</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{adherence.adherencePct}%</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{adherence.logged} of {adherence.scheduled} doses</p>
              {adherenceRange && <p className="text-[11px] text-gray-400 dark:text-gray-500">{adherenceRange}</p>}
            </div>
          )}
        </div>

        <div className="px-4 pb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">History</h2>
          {shotsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={28} className="animate-spin text-indigo-400" />
            </div>
          ) : shots.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 text-center text-gray-400 dark:text-[#9A9DAE] border border-gray-100 dark:border-gray-800">
              <Syringe size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No shots logged yet. Tap Add Shot to get started.</p>
            </div>
          ) : (
            <div className="space-y-2">
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
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{hiddenCount} more shots in your history</p>
                    <p className="text-xs text-gray-400">Unlock with Levli Premium to view your complete shot history.</p>
                  </div>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center px-4">
        Levli is a personal logbook, not medical advice. Consult your prescriber for dosing decisions.
      </p>

      <Fab onClick={openNew} label="Add Shot" />

      <AddShotModal open={showShot} onClose={() => { setShowShot(false); setEditingShot(null); }} editingShot={editingShot} />
    </PageContainer>
  );
}