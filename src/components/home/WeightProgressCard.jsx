import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowUp, ChevronRight } from "lucide-react";
import AddMetricModal from "@/components/modals/AddMetricModal";
import IonIcon from "@/components/IonIcon";
import WeightSparkline from "@/components/home/WeightSparkline";
import { useAppState } from "@/lib/AppState";
import { todayKey } from "@/lib/dateUtils";
import { fromKg, weightUnitLabel } from "@/lib/measure";
import { goalKgOf, goalPercent, motivationLine, trendSeries } from "@/lib/weightProgress";
import { weightEntry } from "@/lib/weightEntry";

/** A weight in the unit chosen on the profile, to one decimal. */
const shown = (kg, unit) => (kg == null ? null : `${fromKg(kg, unit).toFixed(1)} ${weightUnitLabel(unit)}`);

const SHELL = "mx-3 mb-4 bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800";
const ICON_TILE = "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-indigo-50 dark:bg-indigo-500/10";

/**
 * Weight Progress — the weight now beside its recent trend, what has changed
 * since the first weight logged, and how far the goal on Profile still is.
 *
 * The icon is the downward trend line the Insights Weight Change card uses, in
 * the same indigo, so the card reads as the way into that page: the whole card is
 * tappable and opens Insights on the weight section. It reads the same weight
 * history the Insights page reads (src/lib/AppState.jsx), so a weight added,
 * changed or deleted on any screen moves both at the same moment.
 */
export default function WeightProgressCard({ dayKey }) {
  const { weightHistory, profile, shots, getWeight, saveWeight } = useAppState();
  const [showEntry, setShowEntry] = useState(false);
  const unit = profile?.weight_unit || "lb";
  // The weight entry sheet, the app's one definition of it (src/lib/weightEntry.js),
  // for the day in hand on Home — the same sheet the Weight tracker tile opens.
  const entry = weightEntry({ dayKey, weight: getWeight(dayKey), unit, saveWeight });

  // The history is in date order, so the first entry is the first weight ever
  // logged and the last entry is the weight now.
  const firstKg = weightHistory[0]?.kg ?? null;
  const currentKg = weightHistory.length ? weightHistory[weightHistory.length - 1].kg : null;
  const goalKg = goalKgOf(profile);
  // Weight lost since the first logged weight: positive is down, negative is up.
  // One weight on record says nothing about progress, so there is no figure yet.
  const lostKg = weightHistory.length >= 2 && firstKg != null && currentKg != null ? firstKg - currentKg : null;
  const toGoKg = goalKg != null && currentKg != null ? currentKg - goalKg : null;
  const goalPct = goalPercent(firstKg, currentKg, goalKg);
  const { points, expected } = trendSeries(weightHistory, { unit, profile, shots });
  const weighInsThisMonth = weightHistory.filter((e) => e.date.startsWith(todayKey().slice(0, 7))).length;
  const motivation = motivationLine({
    reachedGoal: toGoKg != null && toGoKg <= 0,
    weighInsThisMonth,
    goalPct,
  });

  const icon = (
    <div className={ICON_TILE}>
      <IonIcon name="trending-down" size={17} className="text-indigo-600 dark:text-indigo-400" />
    </div>
  );
  const title = <span className="font-semibold text-gray-700 dark:text-gray-300">Weight Progress</span>;

  // Nothing logged yet: the one thing this card can offer is the way to log it.
  if (currentKg == null) {
    return (
      <div className={SHELL}>
        <div className="flex items-center gap-2">{icon}{title}</div>
        <p className="mt-2 text-sm text-gray-500 dark:text-[#9A9DAE]">Log your first weight to start tracking progress</p>
        <button onClick={() => setShowEntry(true)} className="btn-pill btn-pill-sm btn-primary mt-3">Log weight</button>
        {showEntry && (
          <AddMetricModal
            open
            onClose={() => setShowEntry(false)}
            dayKey={dayKey}
            label={entry.label}
            unit={entry.unit}
            value={entry.current}
            placeholder={entry.placeholder}
            validate={entry.validate}
            onSave={entry.onSave}
            onDelete={entry.onDelete}
          />
        )}
      </div>
    );
  }

  return (
    <Link
      to="/insights#weight-change"
      aria-label="Weight Progress, view insights"
      className={`block transition-[transform,opacity] duration-100 ease-out active:scale-[0.99] active:opacity-95 ${SHELL}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">{icon}{title}</div>
        <span className="flex items-center gap-0.5 text-xs font-medium text-indigo-600 dark:text-indigo-400">
          View insights <ChevronRight size={14} aria-hidden="true" />
        </span>
      </div>

      {/* The weight now, beside the trend it sits on. */}
      <div className="mt-3 flex items-end gap-3">
        <div className="flex-shrink-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">Current</p>
          <p className="text-2xl font-bold leading-tight text-gray-900 dark:text-white">{shown(currentKg, unit)}</p>
        </div>
        <div className="min-w-0 flex-1">
          <WeightSparkline
            points={points}
            expected={expected}
            ariaLabel={
              points.length >= 2
                ? `Weight trend over your last ${points.length} weigh-ins`
                : "Log another weight to see your trend"
            }
          />
        </div>
      </div>

      {/* What has changed since the first weight logged. Losing weight is the one
          change worth colouring; gaining it is stated plainly, and one weight on
          record is simply not enough to say anything. The figure never appears
          without its label. */}
      {lostKg != null && (
        <span
          className={`mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
            lostKg > 0
              ? "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400"
              : "bg-gray-100 text-gray-600 dark:bg-white/[0.06] dark:text-[#9A9DAE]"
          }`}
        >
          {lostKg > 0 && <ArrowDown size={13} aria-hidden="true" />}
          {lostKg < 0 && <ArrowUp size={13} aria-hidden="true" />}
          {lostKg === 0
            ? "Just getting started"
            : `${shown(Math.abs(lostKg), unit)} since you started`}
        </span>
      )}

      {/* The goal the user set on Profile: the distance covered from the first
          weight to it, and how far it still is. Nothing is said at all when no
          goal has been set. */}
      {goalKg != null && (
        <div className="mt-3">
          {goalPct != null && (
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/[0.08]">
              <div className="h-full rounded-full bg-indigo-500 dark:bg-indigo-400" style={{ width: `${goalPct}%` }} />
            </div>
          )}
          <p className="mt-1.5 text-xs text-gray-500 dark:text-[#9A9DAE]">
            Goal {shown(goalKg, unit)} · {toGoKg > 0 ? `${shown(toGoKg, unit)} to go` : "Goal reached"}
          </p>
        </div>
      )}

      {/* One short line, chosen from what is actually true. A single weight has no
          trend to read yet, so it is asked for plainly instead. */}
      <p className="mt-2 text-xs text-gray-500 dark:text-[#9A9DAE]">
        {lostKg == null ? "Log another weight to see your trend" : motivation}
      </p>
    </Link>
  );
}