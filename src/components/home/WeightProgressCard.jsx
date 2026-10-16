import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowUp, ChevronRight } from "lucide-react";
import { WeightFilledIcon } from "@/components/FilledIcons";
import AddMetricModal from "@/components/modals/AddMetricModal";
import { useAppState } from "@/lib/AppState";
import { fromKg, weightUnitLabel } from "@/lib/measure";
import { weightEntry } from "@/lib/weightEntry";

/** A weight in the unit chosen on the profile, to one decimal. */
const shown = (kg, unit) => (kg == null ? null : `${fromKg(kg, unit).toFixed(1)} ${weightUnitLabel(unit)}`);

/**
 * Weight Progress — the weight now, what has been lost since the first weight
 * logged, and how far the goal on Profile still is.
 *
 * It reads the same weight the Insights page reads (the weight history in
 * src/lib/AppState.jsx), so a weight added, changed or deleted on Home, History
 * or Insights moves both at the same moment. The card opens Insights, where the
 * full Weight Change chart and its summary tiles live.
 */
export default function WeightProgressCard({ dayKey }) {
  const { weightHistory, profile, getWeight, saveWeight } = useAppState();
  const [showEntry, setShowEntry] = useState(false);
  const unit = profile?.weight_unit || "lb";
  // The weight entry sheet, the app's one definition of it (src/lib/weightEntry.js),
  // for the day in hand on Home — the same sheet the Weight tracker tile opens.
  const entry = weightEntry({ dayKey, weight: getWeight(dayKey), unit, saveWeight });

  // The history is in date order, so the first entry is the first weight ever
  // logged and the last entry is the weight now.
  const firstKg = weightHistory[0]?.kg ?? null;
  const currentKg = weightHistory.length ? weightHistory[weightHistory.length - 1].kg : null;
  const goalKg = parseFloat(profile?.goal_weight_kg) || null;
  // Weight lost since the first logged weight: positive is down, negative is up.
  // One weight on record says nothing about progress, so there is no figure yet.
  const lostKg = weightHistory.length >= 2 && firstKg != null && currentKg != null ? firstKg - currentKg : null;
  const toGoKg = goalKg != null && currentKg != null ? currentKg - goalKg : null;

  const head = (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(251,191,36,0.14)" }}>
        <WeightFilledIcon size={16} className="text-amber-500 dark:text-amber-400" />
      </div>
      <span className="font-semibold text-gray-700 dark:text-gray-300">Weight Progress</span>
    </div>
  );

  const shell = "mx-3 mb-4 bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800";

  // Nothing logged yet: the one thing this card can offer is the way to log it.
  if (currentKg == null) {
    return (
      <div className={shell}>
        {head}
        <p className="mt-2 text-sm text-gray-500 dark:text-[#9A9DAE]">No weight logged yet</p>
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
    <Link to="/insights" aria-label="Weight Progress, open Insights" className={`block active:opacity-90 ${shell}`}>
      <div className="flex items-start justify-between gap-2">
        {head}
        <ChevronRight size={18} className="mt-1 flex-shrink-0 text-gray-300 dark:text-gray-600" />
      </div>

      <p className="mt-2 text-2xl font-bold leading-tight text-gray-900 dark:text-white">{shown(currentKg, unit)}</p>

      {/* What has changed since the first weight logged. Losing weight is the one
          change worth colouring; gaining it is stated plainly, and one weight on
          record is simply not enough to say anything. */}
      {lostKg == null ? (
        <p className="mt-0.5 text-xs text-gray-500 dark:text-[#9A9DAE]">Log another weight to see your progress</p>
      ) : lostKg > 0 ? (
        <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
          <ArrowDown size={13} aria-hidden="true" />{shown(lostKg, unit)}
        </p>
      ) : lostKg < 0 ? (
        <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-[#9A9DAE]">
          <ArrowUp size={13} aria-hidden="true" />{shown(-lostKg, unit)}
        </p>
      ) : (
        <p className="mt-0.5 text-xs text-gray-500 dark:text-[#9A9DAE]">{shown(0, unit)}</p>
      )}

      {/* The goal the user set on Profile, and how far it still is. Nothing is
          said at all when no goal has been set. */}
      {toGoKg != null && (
        <p className="mt-0.5 text-xs text-gray-500 dark:text-[#9A9DAE]">
          Goal: {shown(goalKg, unit)} · {toGoKg > 0 ? `${shown(toGoKg, unit)} to go` : "Goal reached"}
        </p>
      )}
    </Link>
  );
}