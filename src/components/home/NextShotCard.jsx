import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Syringe, PauseCircle } from "lucide-react";
import { toast } from "@/lib/toast";
import { useAppState } from "@/lib/AppState";
import { parseShotDate, toDayKey } from "@/lib/dateUtils";
import {
  effectiveDaysBetween, plainBrandName,
  getMissedDoseWindowDays, getMissedDoseLabelQuote, getMedicationLabelSource,
} from "@/lib/medicationConfig";
import { evaluateDoseSchedule, MISSED_STATE } from "@/lib/missedDose";
import DoseBadge from "@/components/DoseBadge";
import DoseStatusNotice from "@/components/home/DoseStatusNotice";
import LongGapNotice from "@/components/home/LongGapNotice";

const STOPPED_STATUSES = ["discontinued", "switched"];

export default function NextShotCard({ onLogPastShot }) {
  const { shots, profile, medications, stopMedication } = useAppState();
  const [stopping, setStopping] = useState(false);

  if (shots.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 mx-4 mb-4">
        <p className="text-sm text-gray-400 dark:text-[#9A9DAE] mb-2">Next Shot</p>
        <div className="bg-indigo-50 dark:bg-indigo-500/10 rounded-xl p-3 flex items-start gap-2">
          <Syringe size={18} className="text-indigo-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-indigo-700 dark:text-indigo-300">No shots recorded yet. Add your first shot to start tracking your schedule.</p>
        </div>
      </div>
    );
  }

  const last = shots[0];
  const medication = last.medication;
  const brand = plainBrandName(medication);
  // Prescriber override, then the medication's label interval, then the default.
  const intervalDays = effectiveDaysBetween(profile, medication);
  const regimen = medications.find((m) => m.medication_name === medication) || null;
  const stopped = !!regimen && STOPPED_STATUSES.includes(regimen.status);
  const windowDays = getMissedDoseWindowDays(medication);
  const evaluation = evaluateDoseSchedule({ lastShot: last, intervalDays, windowDays });

  const contact = (profile?.prescriber_contact || "").trim();
  const contactHref = contact
    ? (contact.includes("@") ? `mailto:${contact}` : `tel:${contact.replace(/[^\d+]/g, "")}`)
    : "";

  const handleStop = async () => {
    setStopping(true);
    try {
      await stopMedication(medication);
      toast.success(`${brand} marked as stopped. Reminders paused.`);
    } catch (err) {
      toast.error("Could not update your medication");
    }
    setStopping(false);
  };

  // A medication the user has stopped carries no schedule pressure at all.
  if (stopped) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 mx-4 mb-4">
        <p className="text-sm text-gray-400 dark:text-[#9A9DAE] mb-2">Medication stopped</p>
        <div className="bg-gray-50 dark:bg-white/[0.05] rounded-xl p-3 flex items-start gap-2">
          <PauseCircle size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-gray-700 dark:text-[#E8E9F0]">
              You marked {brand} as stopped{regimen.discontinued_date ? ` on ${regimen.discontinued_date}` : ""}. Reminders for it are paused.
            </p>
            <Link to="/medications" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-1 inline-block">
              Change this in Meds
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Long break: no due date and no ring — the schedule isn't the useful thing here.
  if (evaluation.state === MISSED_STATE.LONG_GAP) {
    return (
      <LongGapNotice
        daysSinceLast={evaluation.daysSinceLast}
        onStop={handleStop}
        stopping={stopping}
        contact={contact}
        contactHref={contactHref}
        onLogPastShot={() => onLogPastShot?.({
          medication,
          dose: last.dose,
          dose_unit: last.dose_unit,
          dose_source: last.dose_source,
          route: last.route,
          date: toDayKey(parseShotDate(evaluation.dueDate)),
        })}
      />
    );
  }

  const isLate = evaluation.daysLate > 0;
  const dueToday = !isLate && evaluation.daysLeft === 0;
  const progress = Math.max(0, Math.min(1, (intervalDays - evaluation.daysLeft) / intervalDays));
  const circumference = 2 * Math.PI * 34;
  const ringColor = dueToday ? "#14B8A6" : "#6366F1";
  const ringGlow = dueToday ? "0 0 14px 3px rgba(20,184,166,0.35)" : "0 0 14px 3px rgba(99,102,241,0.35)";

  let daysLabel;
  if (isLate) daysLabel = `Overdue by ${evaluation.daysLate} day${evaluation.daysLate === 1 ? "" : "s"}`;
  else if (dueToday) daysLabel = "Today!";
  else if (evaluation.daysLeft === 1) daysLabel = "Tomorrow";
  else daysLabel = `In ${evaluation.daysLeft}d`;

  return (
    <>
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 mx-4 mb-4">
        {/* A date already gone is never labelled as the upcoming shot. */}
        <p className="text-sm text-gray-400 dark:text-[#9A9DAE] mb-1">{isLate ? "Scheduled dose" : "Next Shot"}</p>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-[#E8E9F0]">{evaluation.dueDate}</h3>
            <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mt-0.5">{daysLabel}</p>
            <div className="mt-2 border-t border-gray-100 dark:border-gray-800 pt-2">
              <p className="text-xs text-gray-400 dark:text-[#9A9DAE]">Last Dose</p>
              <p className="text-sm font-semibold text-gray-700 dark:text-[#E8E9F0] flex items-center gap-1.5 flex-wrap">
                {last.date}
                <DoseBadge medication={last.medication} dose={last.dose} unit={last.dose_unit || "mg"} />
              </p>
            </div>
          </div>
          <div className="relative w-20 h-20 flex-shrink-0">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
              {/* Track ring: subtle dark gray-blue in dark mode */}
              <circle cx="40" cy="40" r="34" fill="none" stroke="#E5E7EB" strokeWidth="5"
                className="dark:hidden" />
              <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5"
                className="hidden dark:block" />
              {/* Progress ring */}
              <circle cx="40" cy="40" r="34" fill="none" stroke={ringColor} strokeWidth="5"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - progress)}
                strokeLinecap="round"
                style={{ filter: `drop-shadow(${ringGlow})` }}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs text-gray-600 dark:text-[#9A9DAE] font-medium text-center leading-tight px-1">
              {dueToday ? "Now!" : isLate ? `${evaluation.daysLate}d late` : `${evaluation.daysLeft}d left`}
            </span>
          </div>
        </div>
      </div>

      <DoseStatusNotice
        evaluation={evaluation}
        brand={brand}
        windowDays={windowDays}
        quote={getMissedDoseLabelQuote(medication)}
        source={getMedicationLabelSource(medication)}
      />
    </>
  );
}