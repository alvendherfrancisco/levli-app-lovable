import React from "react";
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from "recharts";
import { fullDateLabel, weekAxisLabel } from "@/lib/expectedProgress";

// The one place the graph's colours are set: the user's own weights, their
// average, the expected curve and the goal line.
const ACTUAL = "#6366F1";
const AVERAGE = "#8B5CF6";
const EXPECTED = "#10B981";
const GOAL = "#94A3B8";

/** One entry in the legend under the graph. */
function LegendItem({ color, label, dotted = false }) {
  return (
    <div className="flex items-center gap-1.5">
      {dotted
        ? <span className="h-2 w-2 rounded-full" style={{ background: color }} />
        : <span className="h-0.5 w-4 rounded" style={{ background: color }} />}
      <span className="text-xs text-gray-500 dark:text-[#9A9DAE]">{label}</span>
    </div>
  );
}

/** The date and the two weights for the day in hand. */
function ChartTooltip({ active, payload, unitLabel }) {
  const row = active && payload?.length ? payload[0]?.payload : null;
  if (!row) return null;
  const lines = [];
  if (row.weight != null) lines.push(["Your weight", row.weight]);
  if (row.expected != null) lines.push(["Expected", row.expected]);
  if (!lines.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-[rgba(20,22,32,0.95)] px-3 py-2 text-xs text-[#E8E9F0]">
      <p className="font-semibold">{fullDateLabel(row.isoDate)}</p>
      {lines.map(([label, value]) => (
        <p key={label} className="mt-1">
          <span className="text-[#9A9DAE]">{label} </span>
          <span className="font-medium">{value.toFixed(1)} {unitLabel}</span>
        </p>
      ))}
    </div>
  );
}

/**
 * The card's one graph: the user's logged weights as dots, the dashed 7-day
 * average, the expected curve as a soft green line and fill behind them, and the
 * goal as a dashed line.
 *
 * The series are drawn back to front — the expected curve first, the user's own
 * weights last — so nothing they logged is ever hidden behind the curve, and
 * each dot carries a light ring so it stays legible where the two lines cross.
 *
 * The x axis is weeks since the first logged weight, which is where the curve
 * starts; every tick is labelled with the date it lands on, in the form its range
 * calls for — dates on a month, months on a longer one.
 */
export default function WeightProgressChart({
  rows, startKey, windowStart, windowEnd, goal, showCurve, unitLabel, tickFill, ariaLabel,
}) {
  // How many days the range on screen covers, which is what the tick labels are
  // written for.
  const spanDays = Math.round((windowEnd - windowStart) * 7);

  // The y scale is set from everything drawn, the goal included, so the goal is
  // always on screen and the axis does not jump as the range changes.
  const values = [];
  rows.forEach((row) => {
    if (row.weight != null) values.push(row.weight);
    if (row.rollingAvg != null) values.push(row.rollingAvg);
    if (showCurve && row.expected != null) values.push(row.expected);
  });
  if (goal != null) values.push(goal);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = Math.max(2, (max - min) * 0.12);
  const domain = [Math.floor(min - pad), Math.ceil(max + pad)];

  return (
    <div>
      <div className="h-56" role="img" aria-label={ariaLabel}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{ top: 8, right: 22, bottom: 4, left: 0 }}>
            <defs>
              <linearGradient id="expected-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={EXPECTED} stopOpacity={0.26} />
                <stop offset="100%" stopColor={EXPECTED} stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(150,150,150,0.15)" />
            {/* The right margin is what keeps the last date label — "Oct 15" —
                from being cut off at the edge of the chart. */}
            <XAxis
              dataKey="week"
              type="number"
              domain={[windowStart, windowEnd]}
              tickCount={5}
              tickFormatter={(week) => weekAxisLabel(startKey, week, spanDays)}
              tick={{ fontSize: 12, fill: tickFill }}
              stroke={tickFill}
              tickMargin={6}
            />
            <YAxis tick={{ fontSize: 12, fill: tickFill }} stroke={tickFill} domain={domain} width={40} />
            <Tooltip content={<ChartTooltip unitLabel={unitLabel} />} cursor={{ stroke: "#BDBDBD", strokeWidth: 1.5 }} />
            {showCurve && (
              <Area
                type="monotone"
                dataKey="expected"
                stroke={EXPECTED}
                strokeWidth={2}
                fill="url(#expected-fill)"
                fillOpacity={1}
                dot={false}
                activeDot={false}
              />
            )}
            {goal != null && (
              <ReferenceLine
                y={goal}
                stroke={GOAL}
                strokeDasharray="6 4"
                label={{ value: "Goal", position: "insideTopRight", fill: GOAL, fontSize: 11 }}
              />
            )}
            <Line type="monotone" dataKey="rollingAvg" stroke={AVERAGE} strokeWidth={2}
              strokeDasharray="4 4" dot={false} activeDot={false} connectNulls />
            <Line type="monotone" dataKey="weight" stroke="none" connectNulls={false}
              dot={{ r: 3.5, fill: ACTUAL, stroke: "#ffffff", strokeWidth: 1.5 }}
              activeDot={{ r: 6, fill: ACTUAL, stroke: "#ffffff", strokeWidth: 2 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-4">
        <LegendItem color={ACTUAL} label="Your weight" dotted />
        {showCurve && <LegendItem color={EXPECTED} label="Expected" />}
        {goal != null && <LegendItem color={GOAL} label="Goal" />}
      </div>
    </div>
  );
}