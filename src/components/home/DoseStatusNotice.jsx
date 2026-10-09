import React from "react";
import { MISSED_STATE } from "@/lib/missedDose";

/**
 * The two late-dose notices, both driven by the medication config:
 * amber while the label's missed-dose window is still open, rose once it isn't.
 * Neither one tells the user what to do with the dose — the prescriber decides.
 */
export default function DoseStatusNotice({ evaluation, brand, windowDays, quote, source }) {
  const { state, dueDate, daysLate } = evaluation;
  if (state !== MISSED_STATE.WITHIN_WINDOW && state !== MISSED_STATE.OVERDUE) return null;

  if (state === MISSED_STATE.WITHIN_WINDOW) {
    return (
      <div className="mx-4 mb-4 rounded-2xl p-3 border bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20">
        <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Your dose was due {dueDate}</p>
        <p className="text-xs mt-1 text-amber-800/90 dark:text-amber-200/90">
          Your medication label says a missed dose can be taken within {windowDays} day{windowDays === 1 ? "" : "s"}. Check with your pharmacist or prescriber if unsure.
        </p>
        {(quote || source) && (
          <p className="text-[11px] mt-2 leading-snug text-amber-700/80 dark:text-amber-200/70">
            Label: {quote ? `“${quote}” ` : ""}
            {source ? (
              <>
                <a href={source} target="_blank" rel="noreferrer" className="underline">
                  {brand} prescribing information
                </a>
              </>
            ) : null}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="mx-4 mb-4 rounded-2xl p-3 border bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20">
      <p className="text-sm font-semibold text-rose-800 dark:text-rose-300">
        Your dose is overdue by {daysLate} day{daysLate === 1 ? "" : "s"}
      </p>
      <p className="text-xs mt-1 text-rose-800/90 dark:text-rose-200/90">
        Don't double up. Contact your prescriber or pharmacist for how to continue. Whether to continue at this dose is their decision.
      </p>
      {source ? (
        <p className="text-[11px] mt-2 text-rose-700/80 dark:text-rose-200/70">
          Source:{" "}
          <a href={source} target="_blank" rel="noreferrer" className="underline">
            {brand} prescribing information
          </a>
        </p>
      ) : (
        <p className="text-[11px] mt-2 text-rose-700/80 dark:text-rose-200/70">
          Levli has no label to check this product against, so your prescriber or pharmacist decides.
        </p>
      )}
    </div>
  );
}