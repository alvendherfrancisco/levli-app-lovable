import React from "react";
import {
  Area, CartesianGrid, ComposedChart, Line, ReferenceLine,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { fromKg, weightUnitLabel } from "@/lib/measure";
import { fullDateLabel, weekAxisLabel } from "@/lib/expectedProgress";

/**
 * The chart inside the Expected Progress card: the expected GLP-1 curve as a
 * green filled area, the user's own logged weights plotted over it, the goal
 * from Profile as a dashed line, and — on tap or drag — a vertical line with the
 * date and the weight at that point.
 *
 * Time is in weeks from the first logged weight (see src/lib/expectedProgress.js).
 * The expected curve stops where its own series stops, so it is never drawn past
 * the data behind it, while the user's line continues for as long as they log.
 */
const ACTUAL_COLOR = "#6366F1";
const EXPECTED_COLOR = "#10B981";
const GOAL_COLOR = "#94A3B8";

/** The date and the weight at the point being touched or dragged over. */
function PointTooltip({ active, payload, unitLabel }) {
  if (!active || !payload?.length) return null;
  const at = payload[0]?.payload;
  if (!at) return null;
  const actual = payload.find((entry) => entry.dataKey === "actual")?.value;
  const expected = payload.find((entry) => entry.dataKey === "expected")?.value;
  if (actual == null && expected == null) return null;

  return (
    <div className="rounded-xl border border-gray-100 bg-white px-3 py-2 shadow-lg dark:border-white/10 dark:bg-gray-800">
      <p className="text-[11px] font-semibold text-gray-900 dark:text-white">{fullDateLabel(at.isoDate)}</p>
      {actual != null && (
        <p className="mt-0.5 text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
          Your weight {actual} {unitLabel}
        </p>
      )}
      {expected != null && (
        <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
          Expected {expected} {unitLabel}
        </p>
      )}
    </div>
  );
}

export default function ExpectedProgressChart({ data, tickFill, isDark }) {
  const { points, horizon, startKey, unit } = data;
  const unitLabel = weightUnitLabel(unit);
  const goal = data.goalKg != null ? fromKg(data.goalKg, unit) : null;

  // The goal is framed with the curves, so the target is always in view.
  const values = [];
  points.forEach((p) => {
    if (p.expected != null) values.push(p.expected);
    if (p.actual != null) values.push(p.actual);
  });
  const lowest = Math.min(...values, goal ?? Infinity);
  const highest = Math.max(...values, goal ?? -Infinity);
  const pad = Math.max(1, (highest - lowest) * 0.08);
  const domain = [Math.floor(lowest - pad), Math.ceil(highest + pad)];

  return (
    <div className="h-56" role="img" aria-label="Your logged weight against the expected GLP-1 curve">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="expectedProgressFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={EXPECTED_COLOR} stopOpacity={isDark ? 0.42 : 0.34} />
              <stop offset="100%" stopColor={EXPECTED_COLOR} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(150,150,150,0.15)" />
          <XAxis
            dataKey="week"
            type="number"
            domain={[0, horizon]}
            allowDecimals={false}
            tickCount={5}
            minTickGap={20}
            tickFormatter={(week) => weekAxisLabel(startKey, week)}
            tick={{ fontSize: 11, fill: tickFill }}
            stroke={tickFill}
          />
          <YAxis
            domain={domain}
            width={40}
            tick={{ fontSize: 12, fill: tickFill }}
            stroke={tickFill}
            tickFormatter={(value) => Math.round(value)}
          />
          <Tooltip
            content={<PointTooltip unitLabel={unitLabel} />}
            cursor={{ stroke: "#BDBDBD", strokeWidth: 1.5 }}
          />
          <Area
            type="monotone"
            dataKey="expected"
            stroke={EXPECTED_COLOR}
            strokeWidth={2}
            fill="url(#expectedProgressFill)"
            dot={false}
            activeDot={{ r: 5, fill: "#ffffff", stroke: EXPECTED_COLOR, strokeWidth: 2 }}
          />
          <Line
            type="monotone"
            dataKey="actual"
            stroke={ACTUAL_COLOR}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, fill: ACTUAL_COLOR, stroke: "#ffffff", strokeWidth: 1.5 }}
            connectNulls
          />
          {goal != null && (
            <ReferenceLine
              y={goal}
              stroke={GOAL_COLOR}
              strokeDasharray="6 4"
              strokeWidth={1.5}
              label={{ value: "Goal", position: "insideTopRight", fontSize: 10, fill: tickFill }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}