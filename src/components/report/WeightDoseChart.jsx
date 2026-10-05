import React from "react";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fromDayKey, toDayKey } from "@/lib/dateUtils";
import { formatDay, formatDayShort } from "@/lib/reportData";
import { getDoseColor, getDoseLegend } from "@/lib/doseColors";
import DoseLegend from "@/components/insights/DoseLegend";

/**
 * Weight entries with their 7-day rolling average and a colour-coded dose
 * timeline on the same date axis. Only real entries are plotted — gaps stay
 * gaps, nothing is filled in.
 */
export default function WeightDoseChart({ series = [], rows = [], unit, range }) {
  const points = (Array.isArray(series) ? series : [])
    .filter((p) => p && Number.isFinite(p.ts) && Number.isFinite(p.value));

  if (points.length < 2) {
    return (
      <p className="text-sm text-gray-500">
        {points.length === 0
          ? "No weight entries in this range."
          : "Not enough entries in this range."}
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
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(140,145,160,0.25)" />
            <XAxis
              dataKey="ts" type="number" domain={[fromTs, toTs]}
              tick={{ fontSize: 10 }} stroke="#8A8F9E"
              tickFormatter={(ts) => (Number.isFinite(ts) ? formatDayShort(toDayKey(new Date(ts))) : "")}
            />
            <YAxis tick={{ fontSize: 10 }} stroke="#8A8F9E" domain={["auto", "auto"]} width={40} />
            <Tooltip
              labelFormatter={(ts) => (Number.isFinite(ts) ? formatDay(toDayKey(new Date(ts))) : "")}
              formatter={(value, name) => [`${value} ${unit}`, name === "rollingAvg" ? "7-day average" : "Weight"]}
              contentStyle={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 8, color: "#1F2937", fontSize: 12 }}
            />
            <Line type="monotone" dataKey="value" stroke="#6366F1" strokeWidth={2} dot={{ r: 3, fill: "#6366F1" }} />
            <Line type="monotone" dataKey="rollingAvg" stroke="#8B5CF6" strokeWidth={2} strokeDasharray="4 4" dot={false} />
            {markers.map((marker) => (
              <ReferenceLine key={marker.key} x={marker.ts} stroke={marker.color} strokeWidth={1.5} strokeOpacity={0.6} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <DoseLegend items={legend} title="Coloured ticks" labelClassName="text-xs text-gray-600" align="start" />
      <p className="text-[11px] text-gray-500 mt-2">
        Solid line: logged weight entries (one point per entry, no values filled in) · Dashed: 7-day rolling average · Coloured ticks: dose dates, matching the dose colours in the app.
      </p>
    </div>
  );
}