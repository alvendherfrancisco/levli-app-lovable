import React, { useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import { useAppState } from "@/lib/AppState";
import { todayKey, toDayKey, fromDayKey } from "@/lib/dateUtils";
import { ICON_SIZE_ROW } from "@/lib/iconConstants";

const WINDOW_DAYS = 90;

/** Side effects logged in the last 90 days, by symptom. */
export default function SideEffectsPanel() {
  const { adverseEvents } = useAppState();

  const summary = useMemo(() => {
    const today = fromDayKey(todayKey());
    const cutoff = new Date(today);
    cutoff.setDate(cutoff.getDate() - WINDOW_DAYS);
    const from = toDayKey(cutoff);

    const inRange = (adverseEvents || []).filter((e) => {
      const day = e.day_key || (e.onset_date ? String(e.onset_date).slice(0, 10) : "");
      return day && day >= from && day <= todayKey();
    });

    const counts = new Map();
    inRange.forEach((e) => {
      const name = (e.symptom || "").trim();
      if (!name) return;
      counts.set(name, (counts.get(name) || 0) + 1);
    });

    const top = [...counts.entries()]
      .map(([symptom, count]) => ({ symptom, count }))
      .sort((a, b) => b.count - a.count || a.symptom.localeCompare(b.symptom))
      .slice(0, 6);

    const severeCount = inRange.filter((e) => e.severity === "severe" || e.severity === "emergency").length;
    const latestDay = inRange
      .map((e) => e.day_key || String(e.onset_date || "").slice(0, 10))
      .filter(Boolean)
      .sort()
      .slice(-1)[0];

    return { total: inRange.length, top, severeCount, latestDay: latestDay || "" };
  }, [adverseEvents]);

  return (
    <div className="mx-4 mb-4 bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
          <AlertTriangle size={ICON_SIZE_ROW} className="text-indigo-600 dark:text-indigo-400" />
        </div>
        <h3 className="font-bold text-gray-900 dark:text-white text-lg">Side Effects</h3>
      </div>
      <div className="border-b-2 border-indigo-500 w-12 mb-3" />

      {summary.total === 0 ? (
        <p className="text-sm text-gray-400 dark:text-[#9A9DAE]">No side effects logged in the last {WINDOW_DAYS} days.</p>
      ) : (
        <>
          <p className="text-xs text-gray-400 dark:text-[#9A9DAE] mb-3">
            {summary.total} logged in the last {WINDOW_DAYS} days
            {summary.severeCount > 0 && <> · {summary.severeCount} logged as severe</>}
          </p>
          <div className="space-y-2">
            {summary.top.map((row) => (
              <div key={row.symptom} className="flex items-center gap-3">
                <span className="flex-1 text-sm text-gray-700 dark:text-[#E8E9F0] truncate">{row.symptom}</span>
                <span className="text-xs text-gray-400 dark:text-[#9A9DAE] flex-shrink-0">{row.count}×</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-gray-400 dark:text-[#9A9DAE] mt-3">
            Most recent {summary.latestDay}. Everything logged from Home, History or the Journal appears here.
          </p>
        </>
      )}
    </div>
  );
}