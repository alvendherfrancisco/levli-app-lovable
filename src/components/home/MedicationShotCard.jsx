import React from "react";
import { Syringe } from "lucide-react";
import { parseShotDate, toDayKey, todayKey, calendarDaysBetween } from "@/lib/dateUtils";
import {
  getMissedDoseWindowDays, getMissedDoseLabelQuote, getMedicationLabelSource,
} from "@/lib/medicationConfig";
import { evaluateDoseSchedule, MISSED_STATE } from "@/lib/missedDose";
import { shotDateFromKey } from "@/lib/repeatSchedule";
import { INJECTABLE_ROUTES } from "@/lib/shotDefaults";
import DoseBadge from "@/components/DoseBadge";
import DoseStatusNotice from "@/components/home/DoseStatusNotice";
import LongGapNotice from "@/components/home/LongGapNotice";
import { CARD, CARD_TITLE, HELPER_TEXT, INFO_BOX } from "@/lib/uiStyles";

/**
 * One medication's own schedule card: its next dose, its last dose and how many
 * doses have been logged for it. Every value is that medication's — its repeat
 * schedule when one is running, otherwise its last dose and its own interval.
 *
 * The words follow the route: an injection is a shot, a tablet or a capsule is
 * never called one.
 */
export default function MedicationShotCard({ summary, contact, contactHref, stopping, onStop, onLogPastShot }) {
  const { medication, lastShot, totalShots, intervalDays, nextKey } = summary;
  const name = medication.medication_name;
  // The name exactly as the user selected it, ® and all. The plain name is only
  // for matching, sorting and exports.
  const brand = name;
  const injected = INJECTABLE_ROUTES.includes(medication.route);
  const title = injected ? "Next shot" : "Next dose";
  const windowDays = getMissedDoseWindowDays(name);
  const evaluation = evaluateDoseSchedule({ lastShot, intervalDays, windowDays });

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
      <div className={CARD}>
        <h3 className={CARD_TITLE}>{title}</h3>
        <p className={`${HELPER_TEXT} mt-0.5`}>{brand}</p>
        <div className={`${INFO_BOX} mt-3 flex items-center gap-2`}>
          <Syringe size={16} className="flex-shrink-0" aria-hidden="true" />
          <p>No doses logged yet.</p>
        </div>
      </div>
    );
  }

  // A long break: no due date and no ring, because the schedule is not the
  // useful thing here.
  if (lastShot && evaluation.state === MISSED_STATE.LONG_GAP) {
    return (
      <LongGapNotice
        daysSinceLast={evaluation.daysSinceLast}
        onStop={onStop}
        stopping={stopping}
        contact={contactButton.contact}
        contactHref={contactButton.contactHref}
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
      <div className={CARD}>
        {/* A date already gone is never labelled as the upcoming dose. */}
        <h3 className={CARD_TITLE}>{isLate ? "Scheduled dose" : title}</h3>
        <p className={`${HELPER_TEXT} mt-0.5`}>{brand}</p>
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xl font-medium text-gray-900 dark:text-[#E8E9F0]">
              {dueKey ? shotDateFromKey(dueKey) : "Not set"}
            </p>
            <p className="mt-0.5 text-[15px] font-medium text-indigo-600 dark:text-indigo-400">{daysLabel}</p>
            <div className="mt-3 flex items-start gap-5 border-t border-gray-100 pt-3 dark:border-gray-800">
              {lastShot && (
                <div>
                  <p className={HELPER_TEXT}>Last dose</p>
                  <p className="flex flex-wrap items-center gap-1.5 text-[15px] font-medium text-gray-700 dark:text-[#E8E9F0]">
                    {lastShot.date}
                    <DoseBadge medication={lastShot.medication} dose={lastShot.dose} unit={lastShot.dose_unit || "mg"} />
                  </p>
                </div>
              )}
              <div>
                <p className={HELPER_TEXT}>{injected ? "Total shots" : "Total doses"}</p>
                <p className="text-[15px] font-medium text-gray-700 dark:text-[#E8E9F0]">{totalShots}</p>
              </div>
            </div>
          </div>
          <div className="relative h-20 w-20 flex-shrink-0">
            <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
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
            <span className="absolute inset-0 flex items-center justify-center px-1 text-center text-[13px] font-medium leading-tight text-gray-600 dark:text-[#9A9DAE]">
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