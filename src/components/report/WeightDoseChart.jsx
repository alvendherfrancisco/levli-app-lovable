import React from "react";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fromDayKey, toDayKey } from "@/lib/dateUtils";
import { formatDay, formatDayShort } from "@/lib/reportData";
import { useReportTokens } from "@/components/report/ReportTheme";

/**
 * Weight entries with their 7-day rolling average and the dose dates on the same
 * axis. Only real entries are plotted — gaps stay gaps, nothing is filled in.
 *
 * Every colour comes from the report tokens: one accent for the weight line, the
 * dashed average in muted grey, and light ticks for the dose dates — so the chart
 * matches the exported PDF and stays legible in grayscale.
 */
export default function WeightDoseChart({ series = [], rows = [], unit, range }) {
  const t = useReportTokens();

  const points = (Array.isArray(series) ? series : [])
    .filter((p) => p && Number.isFinite(p.ts) && Number.isFinite(p.value));

  // A trend needs two entries; the report says so in words instead of drawing it.
  if (points.length < 2) return null;

  // The axis spans the selected range, falling back to the entries themselves
  // when the range is missing or unreadable.
  const rangeFrom = range?.from ? fromDayKey(range.from).getTime() : NaN;
  const rangeTo = range?.to ? fromDayKey(range.to).getTime() : NaN;
  const fromTs = Number.isFinite(rangeFrom) ? rangeFrom : points[0].ts;
  const toTs = Number.isFinite(rangeTo) && rangeTo > fromTs
    ? rangeTo
    : Math.max(points[points.length - 1].ts, fromTs + 86400000);

  const markers = (Array.isArray(rows) ? rows : [])
    .map((row) => ({ key: row.id, ts: row.day ? fromDayKey(row.day).getTime() : NaN }))
    .filter((marker) => Number.isFinite(marker.ts));

  return (
    <div>
      <div className="h-[220px] min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={t.grid} />
            <XAxis
              dataKey="ts" type="number" domain={[fromTs, toTs]}
              tick={{ fontSize: 12, fill: t.axis }} stroke={t.axis}
              tickFormatter={(ts) => (Number.isFinite(ts) ? formatDayShort(toDayKey(new Date(ts))) : "")}
            />
            <YAxis tick={{ fontSize: 12, fill: t.axis }} stroke={t.axis} domain={["auto", "auto"]} width={44} />
            <Tooltip
              labelFormatter={(ts) => (Number.isFinite(ts) ? formatDay(toDayKey(new Date(ts))) : "")}
              formatter={(value, name) => [`${value} ${unit}`, name === "rollingAvg" ? "7-day average" : "Weight"]}
              contentStyle={{
                background: t.tooltipBg,
                border: `1px solid ${t.tooltipBorder}`,
                borderRadius: 8,
                color: t.tooltipText,
                fontSize: 14,
              }}
              itemStyle={{ color: t.tooltipText }}
              labelStyle={{ color: t.tooltipText, fontWeight: 600 }}
            />
            <Line type="monotone" dataKey="value" stroke={t.weightLine} strokeWidth={2} dot={{ r: 3, fill: t.weightLine }} />
            <Line type="monotone" dataKey="rollingAvg" stroke={t.avgLine} strokeWidth={2} strokeDasharray="4 4" dot={false} />
            {markers.map((marker) => (
              <ReferenceLine
                key={marker.key}
                x={marker.ts}
                stroke={t.doseTick}
                strokeWidth={t.doseBarWidth}
                strokeOpacity={t.doseBarOpacity}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-sm mt-2" style={{ color: t.muted }}>
        Solid line: weight entries · Dashed line: 7-day rolling average · Ticks: dose dates.
      </p>
    </div>
  );
}