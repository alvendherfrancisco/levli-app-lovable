import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowUp } from "lucide-react";
import IonIcon from "@/components/IonIcon";
import InsightCard from "@/components/insights/InsightCard";
import SectionHeader from "@/components/insights/SectionHeader";
import InsightEmptyState from "@/components/insights/InsightEmptyState";
import ExpectedProgressChart from "@/components/insights/ExpectedProgressChart";
import { FOOTNOTE } from "@/components/insights/insightUi";
import { buildExpectedProgress } from "@/lib/expectedProgress";
import { fromKg, weightUnitLabel } from "@/lib/measure";
import useDoseColors from "@/hooks/useDoseColors";

/**
 * The Expected Progress card on the Insights page: the weight the user is at
 * now, what they have lost since their first log, and their own line drawn over
 * the expected GLP-1 curve so the two can be compared.
 *
 * It reads the WHOLE weight history rather than the Weight Change card's chosen
 * range: the expected curve starts at the first weight ever logged, and the
 * comparison only means something from that point.
 *
 * The legend is written here rather than by the chart, so the chart draws only
 * the graph and the words that describe it sit with the card's other text.
 */
function LegendItem({ color, label }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-0.5 w-4 rounded" style={{ background: color }} />
      <span className="text-xs text-gray-500 dark:text-[#9A9DAE]">{label}</span>
    </div>
  );
}

export default function ExpectedProgressCard({ weightHistory, profile, shots }) {
  const unit = profile?.weight_unit || "lb";
  const unitLabel = weightUnitLabel(unit);
  const { isDark } = useDoseColors();
  const tickFill = isDark ? "#B4B8C7" : "#767676";

  const data = useMemo(
    () => buildExpectedProgress({ weightHistory, profile, shots, unit }),
    [weightHistory, profile, shots, unit]
  );

  const header = (
    <SectionHeader
      icon={<IonIcon name="trending-up" size={20} className="text-indigo-600 dark:text-indigo-400" />}
      title="Expected Progress"
      subtitle="Your logged weight against a typical GLP-1 curve."
    />
  );

  // Nothing logged at all: there is no starting weight to draw a curve from.
  if (!data) {
    return (
      <InsightCard>
        {header}
        <InsightEmptyState
          icon="trending-up"
          title="No weight logged yet"
          description="Log your weight and Levli will show it against a typical GLP-1 curve."
          action={<Link to="/" className="btn-pill btn-primary">Log your weight</Link>}
        />
      </InsightCard>
    );
  }

  const current = fromKg(data.currentKg, unit);
  const lost = fromKg(data.lostKg, unit);
  const losing = lost >= 0;

  return (
    <InsightCard>
      {header}

      <div className="mb-4">
        <p className={FOOTNOTE}>Your weight</p>
        <p className="mt-0.5 text-3xl font-bold leading-tight text-gray-900 dark:text-white">
          {current != null ? current.toFixed(1) : "—"}
          <span className="ml-1 text-base font-semibold text-gray-500 dark:text-[#9A9DAE]">{unitLabel}</span>
        </p>
        {Math.abs(lost) >= 0.1 && (
          <p className={`mt-1 flex items-center gap-1 text-sm font-semibold ${
            losing ? "text-emerald-600 dark:text-emerald-400" : "text-orange-600 dark:text-orange-400"}`}>
            {losing ? <ArrowDown size={16} /> : <ArrowUp size={16} />}
            {Math.abs(lost).toFixed(1)} {unitLabel} {losing ? "lost" : "gained"} since your first log
          </p>
        )}
      </div>

      <ExpectedProgressChart data={data} tickFill={tickFill} isDark={isDark} />

      <div className="mt-3 flex flex-wrap items-center justify-center gap-4">
        <LegendItem color="#6366F1" label="Your weight" />
        <LegendItem color="#10B981" label="Expected" />
        {data.goalKg != null && <LegendItem color="#94A3B8" label="Goal" />}
      </div>

      <p className={`mt-3 text-center ${FOOTNOTE}`}>
        Illustrative only. Everyone responds differently. Not medical advice.
      </p>

      {data.loggedCount < 2 && (
        <Link to="/" className="btn-pill btn-primary mt-4 w-full">
          Log your weight
        </Link>
      )}
    </InsightCard>
  );
}