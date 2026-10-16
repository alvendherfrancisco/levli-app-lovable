import React, { useState } from "react";
import { Syringe } from "lucide-react";
import { isLongGapHidden, hideLongGap } from "@/lib/longGapReminder";
import { parseShotDate, toDayKey, todayKey, calendarDaysBetween } from "@/lib/dateUtils";
import {
  getMissedDoseWindowDays, getMissedDoseLabelQuote, getMedicationLabelSource,
} from "@/lib/medicationConfig";
import { logWords } from "@/lib/medicationForm";
import { evaluateDoseSchedule, MISSED_STATE } from "@/lib/missedDose";
import { shotDateFromKey } from "@/lib/repeatSchedule";
import DoseBadge from "@/components/DoseBadge";
import DoseStatusNotice from "@/components/home/DoseStatusNotice";
import LongGapNotice from "@/components/home/LongGapNotice";

/**
 * One medication's own schedule card: its next shot, its last dose and how many
 * doses have been logged for it. Every value is that medication's — its repeat
 * schedule when one is running, otherwise its last dose and its own interval.
 */
export default function MedicationShotCard({ summary, contact, contactHref, archiving, onArchive, onLogPastShot }) {
  const { medication, lastShot, totalShots, intervalDays, nextKey } = summary;
  const name = medication.medication_name;
  // The name exactly as the user selected it, ® and all. The plain name is only
  // for matching, sorting and exports.
  const brand = name;
  // A product taken by mouth has doses, never shots.
  const words = logWords(name, { route: medication.route || lastShot?.route });
  const windowDays = getMissedDoseWindowDays(name);
  const evaluation = evaluateDoseSchedule({ lastShot, intervalDays, windowDays });

  // The long-gap reminder can be put away for the day, or for three days when it
  // is snoozed. It is remembered per medication, so hiding one reminder never
  // silences another.
  const reminderKey = medication.id || name;
  const [reminderHidden, setReminderHidden] = useState(() => isLongGapHidden(reminderKey));

  const putReminderAway = (days) => {
    hideLongGap(reminderKey, days);
    setReminderHidden(true);
  };

  // The repeat schedule knows the next date when one is running; otherwise it
  // follows from the last dose and the medication's interval.
  const scheduleKey = nextKey || null;
  const dueKey = scheduleKey || (evaluation.dueDate ? toDayKey(parseShotDate(evaluation.dueDate)) : null);
  const daysLeft = dueKey ? calendarDaysBetween(todayKey(), dueKey) : 0;
  const isLate = daysLeft < 0;
  const dueToday = daysLeft === 0;

  const contactButton = { contact, contactHref };

  if (!lastShot && !dueKey) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 card-line mx-4 mb-4">
        <p className="text-sm text-gray-400 dark:text-[#9A9DAE] mb-2">Next {words.One} · {brand}</p>
        <div className="bg-indigo-50 dark:bg-indigo-500/10 rounded-xl p-3 flex items-start gap-2">
          <Syringe size={18} className="text-indigo-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-indigo-700 dark:text-indigo-300">
            No {words.many} recorded yet for {brand}.
          </p>
        </div>
      </div>
    );
  }

  // A long break: no due date and no ring — the schedule isn't the useful thing here.
  if (lastShot && evaluation.state === MISSED_STATE.LONG_GAP) {
    // Put away for the day (or for the three a snooze covers), the reminder stays
    // out of the way and comes back tomorrow if no dose has been logged.
    if (reminderHidden) return null;
    return (
      <LongGapNotice
        daysSinceLast={evaluation.daysSinceLast}
        onArchive={onArchive}
        archiving={archiving}
        contact={contactButton.contact}
        contactHref={contactButton.contactHref}
        onDismiss={() => putReminderAway(1)}
        onSnooze={() => putReminderAway(3)}
        onLogPastShot={() => onLogPastShot?.({
          medication: name,
          medication_id: medication.id,
          dose: lastShot.dose,
          dose_unit: lastShot.dose_unit,
          dose_source: lastShot.dose_source,
          route: lastShot.route,
          date: toDayKey(parseShotDate(evaluation.dueDate)),
        })}
      />
    );
  }

  const progress = Math.max(0, Math.min(1, (intervalDays - daysLeft) / intervalDays));
  const circumference = 2 * Math.PI * 34;
  const ringColor = dueToday ? "#14B8A6" : "#6366F1";
  const ringGlow = dueToday ? "0 0 14px 3px rgba(20,184,166,0.35)" : "0 0 14px 3px rgba(99,102,241,0.35)";

  let daysLabel;
  if (isLate) daysLabel = `Overdue by ${-daysLeft} day${-daysLeft === 1 ? "" : "s"}`;
  else if (dueToday) daysLabel = "Today!";
  else if (daysLeft === 1) daysLabel = "Tomorrow";
  else daysLabel = `In ${daysLeft}d`;

  return (
    <>
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 card-line mx-4 mb-4">
        {/* A date already gone is never labelled as the upcoming shot. */}
        <p className="text-sm text-gray-400 dark:text-[#9A9DAE] mb-1">{isLate ? `Scheduled ${words.one}` : `Next ${words.One}`} · {brand}</p>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-[#E8E9F0]">{dueKey ? shotDateFromKey(dueKey) : "—"}</h3>
            <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mt-0.5">{daysLabel}</p>
            <div className="mt-2 border-t border-gray-100 dark:border-gray-800 pt-2 flex items-start gap-5">
              {lastShot && (
                <div>
                  <p className="text-xs text-gray-400 dark:text-[#9A9DAE]">Last Dose</p>
                  <p className="text-sm font-semibold text-gray-700 dark:text-[#E8E9F0] flex items-center gap-1.5 flex-wrap">
                    {lastShot.date}
                    <DoseBadge medication={lastShot.medication} dose={lastShot.dose} unit={lastShot.dose_unit || "mg"} />
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-400 dark:text-[#9A9DAE]">Total {words.many}</p>
                <p className="text-sm font-semibold text-gray-700 dark:text-[#E8E9F0]">{totalShots}</p>
              </div>
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
              {dueToday ? "Now!" : isLate ? `${-daysLeft}d late` : `${daysLeft}d left`}
            </span>
          </div>
        </div>
      </div>

      {lastShot && (
        <DoseStatusNotice
          evaluation={evaluation}
          brand={brand}
          windowDays={windowDays}
          quote={getMissedDoseLabelQuote(name)}
          source={getMedicationLabelSource(name)}
        />
      )}
    </>
  );
}