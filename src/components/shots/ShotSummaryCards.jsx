import React from "react";
import { Syringe, Clock, CalendarCheck, ClipboardCheck } from "lucide-react";
import DoseBadge from "@/components/DoseBadge";
import { useAppState } from "@/lib/AppState";
import {
  addDaysToShotDate, daysAgoLabel, daysUntilShotDate, formatDayKeyShort,
} from "@/lib/dateUtils";
import { effectiveDaysBetween } from "@/lib/medicationConfig";
import { logWords } from "@/lib/medicationForm";
import { isActiveMedication } from "@/lib/medicationLink";
import { calcAdherence } from "@/lib/adherence";

// One card and one icon circle, so every card in the row is the same card.
const CARD = "bg-white dark:bg-gray-900 rounded-xl p-3 shadow-sm border border-gray-100 dark:border-gray-800";
const CIRCLE = "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0";

/**
 * The row of summary cards: total shots, the last dose, the next shot and —
 * once there is a regimen to measure — adherence. Home and Shots both draw it
 * from here, so the two screens can never drift apart.
 */
export default function ShotSummaryCards() {
  const { shots, medications, profile } = useAppState();

  const last = shots[0] || null;
  const daysBetween = effectiveDaysBetween(profile, last?.medication);
  const nextDate = last ? addDaysToShotDate(last.date, daysBetween) : null;

  // Adherence for the most recent medication: doses logged over doses scheduled
  // inside the window, which ends on the day the medication was marked stopped.
  const lastMed = last?.medication;
  const lastRegimen = medications.find((m) => m.medication_name === lastMed) || null;
  // The row speaks of doses for a product taken by mouth and of shots for an
  // injected one, following the medication in hand (src/lib/medicationForm.js).
  const focusMed = medications.find(isActiveMedication) || lastRegimen;
  const words = logWords(focusMed?.medication_name || lastMed, {
    route: focusMed?.route || last?.route || "",
    shots,
  });
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

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-4 mb-5">
      <div className={CARD}>
        <div className="flex items-center gap-1.5 mb-1">
          <div className={`${CIRCLE} bg-indigo-100 dark:bg-indigo-900`}>
            <Syringe size={20} strokeWidth={2} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-500">Total {words.many}</span>
        </div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{shots.length}</p>
      </div>

      <div className={CARD}>
        <div className="flex items-center gap-1.5 mb-1">
          <div className={`${CIRCLE} bg-amber-100 dark:bg-amber-900`}>
            <Clock size={20} strokeWidth={2} className="text-amber-500 dark:text-amber-400" />
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-500">Last Dose</span>
        </div>
        {last ? (
          <>
            <DoseBadge medication={last.medication} dose={last.dose} unit={last.dose_unit || "mg"} className="text-base px-2 py-0.5" />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{daysAgoLabel(last.date)}</p>
          </>
        ) : <p className="text-sm text-gray-400 dark:text-gray-500">No {words.many} yet</p>}
      </div>

      <div className={CARD}>
        <div className="flex items-center gap-1.5 mb-1">
          <div className={`${CIRCLE} bg-teal-100 dark:bg-teal-900`}>
            <CalendarCheck size={20} strokeWidth={2} className="text-teal-600 dark:text-teal-400" />
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-500">{nextOverdue ? `${words.One} was due` : `Next ${words.One}`}</span>
        </div>
        {nextDate ? (
          <>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{nextDate}</p>
            {nextOverdue && <p className="text-xs text-gray-400 dark:text-gray-500">{Math.abs(nextDaysLeft)} days ago</p>}
          </>
        ) : <p className="text-sm text-gray-400 dark:text-gray-500">—</p>}
      </div>

      {adherence.adherencePct != null && (
        <div className={CARD}>
          <div className="flex items-center gap-1.5 mb-1">
            <div className={`${CIRCLE} bg-indigo-100 dark:bg-indigo-900`}>
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
  );
}