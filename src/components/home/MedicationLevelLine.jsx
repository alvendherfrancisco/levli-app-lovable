import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Activity, ChevronRight } from "lucide-react";
import { useAppState } from "@/lib/AppState";
import { buildMedicationLevel, levelSummaryText } from "@/lib/medicationLevel";

/**
 * One line in the Next Dose card, under the dose it belongs to: what the level is
 * today for this medication, and how far it is from the last dose. Tapping it
 * opens the graph on Insights that explains where the figure comes from.
 *
 * It is drawn only for a medication the app has a curve for, and only once a dose
 * has been logged: before that there is no level to report.
 */
export default function MedicationLevelLine({ medication }) {
  const { shots } = useAppState();

  const level = useMemo(
    () => buildMedicationLevel({ shots, medication }),
    [shots, medication],
  );

  if (!level.supported || !level.hasDoses || level.today.level == null) return null;

  return (
    <Link
      to="/insights#medication-level"
      className="mt-3 flex min-h-[44px] items-center gap-2 border-t border-gray-100 pt-2 dark:border-gray-800"
    >
      <Activity size={15} aria-hidden="true" className="shrink-0 text-indigo-500 dark:text-indigo-400" />
      <span className="min-w-0 flex-1 text-[13px] leading-snug text-indigo-600 dark:text-indigo-400">
        {levelSummaryText(level)}
      </span>
      <ChevronRight size={16} aria-hidden="true" className="shrink-0 text-gray-300 dark:text-gray-600" />
    </Link>
  );
}