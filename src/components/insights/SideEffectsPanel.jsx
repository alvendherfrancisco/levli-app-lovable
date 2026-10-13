import React, { useMemo } from "react";
import IonIcon from "@/components/IonIcon";
import InsightCard from "@/components/insights/InsightCard";
import SectionHeader from "@/components/insights/SectionHeader";
import InsightEmptyState from "@/components/insights/InsightEmptyState";
import { FOOTNOTE } from "@/components/insights/insightUi";
import { useAppState } from "@/lib/AppState";
import { todayKey, toDayKey, fromDayKey } from "@/lib/dateUtils";

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
    <InsightCard>
      <SectionHeader
        icon={<IonIcon name="warning" size={20} className="text-indigo-600 dark:text-indigo-400" />}
        title="Side Effects"
      />

      {summary.total === 0 ? (
        <InsightEmptyState
          icon="warning"
          title="No side effects logged"
          description="Side effects you log in the Journal will show up here."
        />
      ) : (
        <>
          <p className="text-xs text-gray-500 dark:text-[#9A9DAE] mb-4">
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
          <p className={`mt-4 ${FOOTNOTE}`}>
            Most recent {summary.latestDay}. Everything logged from Home, History or the Journal appears here.
          </p>
        </>
      )}
    </InsightCard>
  );
}