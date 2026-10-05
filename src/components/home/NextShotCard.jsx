import React from "react";
import { Syringe } from "lucide-react";
import { useAppState } from "@/lib/AppState";
import { addDaysToShotDate, daysUntilShotDate } from "@/lib/dateUtils";
import { getMissedDoseRule } from "@/lib/medicationData";
import { effectiveDaysBetween } from "@/lib/medicationConfig";
import DoseBadge from "@/components/DoseBadge";

export default function NextShotCard() {
  const { shots, profile } = useAppState();
  const lastMed = shots[0]?.medication;
  // Prescriber override, then the medication's label interval, then the default.
  const daysBetween = effectiveDaysBetween(profile, lastMed);
  const missedRule = lastMed ? getMissedDoseRule(lastMed) : null;

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
  const nextDate = addDaysToShotDate(last.date, daysBetween);
  const daysLeft = daysUntilShotDate(nextDate);
  const progress = Math.max(0, Math.min(1, (daysBetween - daysLeft) / daysBetween));
  const circumference = 2 * Math.PI * 34;

  // "Today!" and the ring belong to the due date only. A date already past is
  // reported as overdue, never as due today.
  const dueToday = daysLeft === 0;
  const daysLate = Math.max(0, -daysLeft);
  const isLate = daysLeft < 0;
  const isRetitration = missedRule && missedRule.retitrationDays && daysLate > missedRule.retitrationDays;
  const ringColor = dueToday ? "#14B8A6" : "#6366F1";
  const ringGlow = dueToday ? "0 0 14px 3px rgba(20,184,166,0.35)" : "0 0 14px 3px rgba(99,102,241,0.35)";

  let daysLabel;
  if (isLate) daysLabel = `Overdue by ${daysLate} day${daysLate === 1 ? "" : "s"}`;
  else if (dueToday) daysLabel = "Today!";
  else if (daysLeft === 1) daysLabel = "Tomorrow";
  else daysLabel = `In ${daysLeft}d`;

  return (
    <>
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 mx-4 mb-4">
      <p className="text-sm text-gray-400 dark:text-[#9A9DAE] mb-1">Next Shot</p>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-[#E8E9F0]">{nextDate}</h3>
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
          <span className="absolute inset-0 flex items-center justify-center text-[10px] text-gray-500 dark:text-[#9A9DAE] font-medium text-center leading-tight px-1">
            {dueToday ? "Now!" : isLate ? `${daysLate}d late` : `${daysLeft}d left`}
          </span>
        </div>
      </div>
    </div>
    {isLate && missedRule && (
      <div className={`mx-4 mb-4 rounded-2xl p-3 border ${isRetitration ? "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20" : "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20"}`}>
        <p className={`text-sm font-semibold ${isRetitration ? "text-red-700 dark:text-red-300" : "text-amber-700 dark:text-amber-300"}`}>
          {isRetitration ? "Late dose — contact your prescriber" : `Scheduled dose is ${daysLate} day${daysLate === 1 ? "" : "s"} late`}
        </p>
        <p className="text-xs mt-1 text-gray-600 dark:text-[#9A9DAE]">{missedRule.advice}</p>
      </div>
    )}
    </>
  );
}