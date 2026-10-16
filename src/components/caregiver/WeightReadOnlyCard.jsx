import React from "react";
import ReadOnlySection from "@/components/caregiver/ReadOnlySection";
import WeightSparkline from "@/components/home/WeightSparkline";
import { dayLabel } from "@/lib/caregiverShare";
import { fromKg, weightUnitLabel } from "@/lib/measure";

const shown = (kg, unit) => (kg == null ? "—" : `${fromKg(kg, unit).toFixed(1)} ${weightUnitLabel(unit)}`);

/**
 * The weight section of a shared record: the weight now, what has changed since
 * the first one logged, how far the goal still is, the recent trend as it is
 * drawn on Home, and the last few weigh-ins. Read only — there is nothing here
 * to tap.
 */
export default function WeightReadOnlyCard({ entries = [], unit = "lb", goalKg = null }) {
  const first = entries[0]?.kg ?? null;
  const current = entries.length ? entries[entries.length - 1].kg : null;
  const change = entries.length >= 2 && first != null && current != null ? first - current : null;
  const toGo = goalKg != null && current != null ? current - goalKg : null;
  const recent = [...entries].slice(-5).reverse();

  return (
    <ReadOnlySection title="Weight" meta={entries.length ? `${entries.length} entries` : null}>
      {entries.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500">No weight logged yet.</p>
      ) : (
        <>
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{shown(current, unit)}</p>
              <p className="text-xs text-gray-500 dark:text-[#9A9DAE]">
                {change == null
                  ? "Only one weight logged"
                  : change >= 0
                    ? `${Math.abs(change).toFixed(1)} kg down since the first entry`
                    : `${Math.abs(change).toFixed(1)} kg up since the first entry`}
              </p>
            </div>
            <div className="w-28 flex-shrink-0">
              <WeightSparkline points={entries.map((e) => e.kg)} ariaLabel="Recent weight trend" />
            </div>
          </div>

          {toGo != null && (
            <p className="mt-3 text-xs text-gray-500 dark:text-[#9A9DAE]">
              Goal {shown(goalKg, unit)} · {toGo <= 0 ? "goal reached" : `${toGo.toFixed(1)} kg to go`}
            </p>
          )}

          <div className="mt-3 space-y-2">
            {recent.map((entry) => (
              <div key={entry.day || entry.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-[#9A9DAE]">{dayLabel(entry.day)}</span>
                <span className="text-gray-700 dark:text-gray-300">{shown(entry.kg, unit)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </ReadOnlySection>
  );
}