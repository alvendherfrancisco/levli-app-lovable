import React from "react";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fromDayKey, toDayKey } from "@/lib/dateUtils";
import { formatDay, formatDayShort, NO_WEIGHT_LINE } from "@/lib/reportData";
import { getDoseColor, getDoseLegend } from "@/lib/doseColors";
import DoseLegend from "@/components/insights/DoseLegend";
import { useReportTokens } from "@/components/report/ReportTheme";

/**
 * Weight entries with their 7-day rolling average and a colour-coded dose
 * timeline on the same date axis. Only real entries are plotted — gaps stay
 * gaps, nothing is filled in.
 *
 * Every colour comes from the report tokens, so the chart follows the light or
 * dark theme on screen and is redrawn from the light PDF tokens in "PDF look".
 * Dose ticks are thin and semi-transparent, and always carry their dose text in
 * the legend, so colour is never the only signal.
 */
export default function WeightDoseChart({ series = [], rows = [], unit, range }) {
  const t = useReportTokens();

  const points = (Array.isArray(series) ? series : [])
    .filter((p) => p && Number.isFinite(p.ts) && Number.isFinite(p.value));

  if (points.length < 2) {
    return (
      <p className="text-sm" style={{ color: t.muted }}>
        {points.length === 0
          ? NO_WEIGHT_LINE
          : "One weight entry in this period, so there is no trend line."}
      </p>
    );
  }

  // The axis spans the selected range, falling back to the entries themselves
  // when the range is missing or unreadable.
  const rangeFrom = range?.from ? fromDayKey(range.from).getTime() : NaN;
  const rangeTo = range?.to ? fromDayKey(range.to).getTime() : NaN;
  const fromTs = Number.isFinite(rangeFrom) ? rangeFrom : points[0].ts;
  const toTs = Number.isFinite(rangeTo) && rangeTo > fromTs
    ? rangeTo
    : Math.max(points[points.length - 1].ts, fromTs + 86400000);

  const markers = (Array.isArray(rows) ? rows : [])
    .map((row) => ({
      key: row.id,
      ts: row.day ? fromDayKey(row.day).getTime() : NaN,
      color: getDoseColor(row.medication, row.dose),
    }))
    .filter((marker) => Number.isFinite(marker.ts));

  const legend = getDoseLegend((Array.isArray(rows) ? rows : []).map((row) => ({
    medication: row.medication, dose: row.dose, dose_unit: row.unit,
  })));

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
                stroke={marker.color}
                strokeWidth={t.doseBarWidth}
                strokeOpacity={t.doseBarOpacity}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <DoseLegend
        items={legend}
        title="Dose dates"
        align="start"
        labelClassName="text-sm"
        titleClassName="text-sm font-medium"
        titleStyle={{ color: t.muted }}
        labelStyle={{ color: t.muted }}
      />
      <p className="text-sm mt-2" style={{ color: t.muted }}>
        Solid line: logged weight entries (one point per entry, no values filled in) · Dashed: 7-day rolling average · Coloured ticks: dose dates, matching the dose colours in the app.
      </p>
    </div>
  );
}