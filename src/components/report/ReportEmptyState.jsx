import React from "react";
import { CalendarRange } from "lucide-react";

/** Shown when the selected range holds no entries at all. */
export default function ReportEmptyState({ rangeLabel, onAllTime }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 text-center">
      <div className="w-14 h-14 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mx-auto mb-3">
        <CalendarRange size={26} className="text-indigo-500" />
      </div>
      <p className="font-semibold text-gray-900 dark:text-white">Nothing logged in {rangeLabel}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
        There are no doses, weight entries or side effects in this date range. Try a wider range to include your earlier entries.
      </p>
      <button onClick={onAllTime} className="btn-pill btn-pill-sm btn-primary mt-5">
        Use all time
      </button>
    </div>
  );
}