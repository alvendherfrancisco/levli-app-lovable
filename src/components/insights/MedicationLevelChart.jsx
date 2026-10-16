import React from "react";
import {
  CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Syringe } from "lucide-react";
import { formatDayKeyShort, formatLocaleDate, fromDayKey } from "@/lib/dateUtils";

// The one place the graph's colours are set: the level already lived, the same
// line forecast, the dose markers, and the quiet lines the figure is read against.
const LIVED = "#6366F1";
const FORECAST = "#818CF8";
const DOSE = "#4F46E5";
const GUIDE = "#94A3B8";

/**
 * A dose, as a small syringe standing on the curve with its needle on the day's
 * level: the barrel above, the plunger above that. Drawn at the size a marker can
 * carry, so a dose day is recognisable in one look.
 */
function DoseMarker({ cx, cy }) {
  if (cx == null || cy == null) return null;
  return (
    <g transform={`translate(${cx},${cy})`} aria-hidden="true">
      <rect x="-3.4" y="-14" width="6.8" height="9" rx="1.5" fill={DOSE} />
      <rect x="-2" y="-17" width="4" height="3.2" rx="0.9" fill={DOSE} />
      <line x1="0" y1="-5" x2="0" y2="0" stroke={DOSE} strokeWidth="1.3" strokeLinecap="round" />
    </g>
  );
}

/**
 * A tablet, for the products taken by mouth: the same mark for the same job as
 * the syringe above — a dose's own day, standing on the curve — drawn as the
 * tablet that was taken rather than a needle.
 */
function TabletMarker({ cx, cy }) {
  if (cx == null || cy == null) return null;
  return (
    <g transform={`translate(${cx},${cy})`} aria-hidden="true">
      <rect x="-4.6" y="-10" width="9.2" height="6.6" rx="3.3" fill={DOSE} />
      <line x1="-3" y1="-6.7" x2="3" y2="-6.7" stroke="#ffffff" strokeOpacity="0.75" strokeWidth="0.9" />
      <line x1="0" y1="-3.4" x2="0" y2="0" stroke={DOSE} strokeWidth="1.3" strokeLinecap="round" />
    </g>
  );
}

/** The date in hand, the level, and how far it is from the dose that set it. */
function LevelTooltip({ active, payload }) {
  const row = active && payload?.length ? payload[0]?.payload : null;
  if (!row) return null;
  const value = row.level != null ? row.level : row.forecast;
  return (
    <div className="rounded-lg border border-white/10 bg-[rgba(20,22,32,0.95)] px-3 py-2 text-xs text-[#E8E9F0]">
      <p className="font-semibold">{formatLocaleDate(fromDayKey(row.key))}</p>
      <p className="mt-1">
        <span className="text-[#9A9DAE]">Level </span>
        <span className="font-medium">{Math.round(value)}%</span>
        <span className="text-[#9A9DAE]"> of peak</span>
      </p>
      <p className="mt-0.5 text-[#9A9DAE]">
        {row.sinceDose == null ? "No dose logged yet" : row.sinceDose === 0 ? "Dose taken" : `Day ${row.sinceDose} after dose`}
      </p>
      {row.level == null && <p className="mt-0.5 text-[#9A9DAE]">Forecast</p>}
      {row.assumedHere && <p className="mt-0.5 text-[#9A9DAE]">Next dose, on schedule</p>}
    </div>
  );
}

/** One key in the legend under the graph: whatever draws the mark, and its word.
 *  The same size and the same colour as the weight chart's own legend. */
function LegendKey({ label, children }) {
  return (
    <div className="flex items-center gap-1.5">
      {children}
      <span className="text-xs text-gray-500 dark:text-[#9A9DAE]">{label}</span>
    </div>
  );
}

/**
 * The card's one graph: the level already lived as a solid line, the next days as
 * a dashed forecast, a syringe on every day a dose was taken, and today marked so
 * the two halves are told apart at a glance.
 *
 * Tapping or dragging the graph reads out the day under the finger — its date, its
 * level and how many days after a dose it is. `example` draws the same shape when
 * nothing has been logged yet, held back so it reads as an illustration.
 *
 * `estimated` is the one mark the graph itself carries: a small asterisk in its
 * top-right corner, for the products whose shape is the app's own estimate (see
 * src/lib/medicationLevelCurves.js). It is a signpost, not a label — the line it
 * points at sits under the graph, in the card's own words, opened by the same
 * asterisk.
 */
export default function MedicationLevelChart({
  points, tickFill, example = false, estimated = false, tablet = false, ariaLabel,
}) {
  const peak = Math.max(
    100,
    ...points.map((point) => Math.max(point.level || 0, point.forecast || 0)),
  );
  const domain = [0, Math.ceil((peak * 1.12) / 25) * 25];
  const todayKey = points.find((point) => point.isToday)?.key || null;
  // About five date labels, whatever the range covers.
  const interval = Math.max(0, Math.ceil(points.length / 5) - 1);

  return (
    <div>
      {/* Only the drawing is held back for the example; the legend under it stays
          at full strength, so it can be read on a card with nothing logged yet. */}
      <div className={`relative h-56 ${example ? "opacity-40" : ""}`} role="img" aria-label={ariaLabel}>
        {estimated && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-1 top-0 text-sm font-semibold leading-none text-gray-400 dark:text-[#9A9DAE]"
          >
            *
          </span>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={points} margin={{ top: 22, right: 14, bottom: 4, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(150,150,150,0.15)" />
            <XAxis
              dataKey="key"
              interval={interval}
              tickFormatter={formatDayKeyShort}
              tick={{ fontSize: 11, fill: tickFill }}
              stroke={tickFill}
              tickMargin={6}
            />
            <YAxis
              domain={domain}
              tickFormatter={(value) => `${value}%`}
              tick={{ fontSize: 11, fill: tickFill }}
              stroke={tickFill}
              width={42}
            />
            <Tooltip content={<LevelTooltip />} cursor={{ stroke: "#9CA3AF", strokeWidth: 1.2 }} />

            {/* What the figure is a share of: the peak of a single dose. */}
            <ReferenceLine
              y={100}
              stroke={GUIDE}
              strokeDasharray="4 4"
              label={{ value: "1 dose", position: "insideTopLeft", fill: tickFill, fontSize: 10 }}
            />
            {todayKey && (
              <ReferenceLine
                x={todayKey}
                stroke={GUIDE}
                label={{ value: "Today", position: "insideTopRight", fill: tickFill, fontSize: 10 }}
              />
            )}

            <Line
              type="monotone"
              dataKey="level"
              stroke={LIVED}
              strokeWidth={2.4}
              dot={false}
              activeDot={{ r: 4.5, fill: LIVED, stroke: "#ffffff", strokeWidth: 1.5 }}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="forecast"
              stroke={FORECAST}
              strokeWidth={2.2}
              strokeDasharray="5 4"
              dot={false}
              activeDot={{ r: 4.5, fill: FORECAST, stroke: "#ffffff", strokeWidth: 1.5 }}
              connectNulls={false}
            />
            {/* A dose's own day, drawn as the syringe standing on the curve. */}
            <Line
              type="monotone"
              dataKey="doseLevel"
              stroke="none"
              dot={tablet ? <TabletMarker /> : <DoseMarker />}
              activeDot={false}
              connectNulls={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* The marks the graph is drawn with, in three words — a syringe for a dose,
          a solid line for the level already lived, a dashed one for the forecast.
          One row, evenly spaced, never wrapping. */}
      <div className="mt-3 flex items-center justify-center gap-4">
        <LegendKey label="Dose">
          {tablet ? (
            <svg width="14" height="10" aria-hidden="true">
              <rect x="0.5" y="1" width="13" height="8" rx="4" fill={DOSE} />
              <line x1="4.5" y1="5" x2="9.5" y2="5" stroke="#ffffff" strokeOpacity="0.75" strokeWidth="1" />
            </svg>
          ) : (
            <Syringe size={14} style={{ color: DOSE }} aria-hidden="true" />
          )}
        </LegendKey>
        <LegendKey label="Your level">
          <span className="h-0.5 w-4 rounded" style={{ background: LIVED }} />
        </LegendKey>
        <LegendKey label="Forecast">
          <svg width="16" height="2" aria-hidden="true">
            <line x1="0" y1="1" x2="16" y2="1" stroke={FORECAST} strokeWidth="2" strokeDasharray="4 3" strokeLinecap="round" />
          </svg>
        </LegendKey>
      </div>
    </div>
  );
}