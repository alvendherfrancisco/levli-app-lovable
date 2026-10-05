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
export default function WeightDoseChart({ series, rows, unit, range }) {
  if (series.length < 2) {
    return (
      <p className="text-sm text-gray-500">
        {series.length === 0
          ? "No weight entries in this range."
          : "Only one weight entry in this range, so no trend line is drawn."}
      </p>
    );
  }

  const fromTs = fromDayKey(range.from).getTime();
  const toTs = fromDayKey(range.to).getTime();
  const markers = rows.map((row) => ({
    key: row.id,
    ts: fromDayKey(row.day).getTime(),
    color: getDoseColor(row.medication, row.dose),
  }));
  const legend = getDoseLegend(rows.map((row) => ({ medication: row.medication, dose: row.dose, dose_unit: row.unit })));

  return (
    <div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(140,145,160,0.25)" />
            <XAxis
              dataKey="ts" type="number" domain={[fromTs, toTs]}
              tick={{ fontSize: 10 }} stroke="#8A8F9E"
              tickFormatter={(ts) => formatDayShort(toDayKey(new Date(ts)))}
            />
            <YAxis tick={{ fontSize: 10 }} stroke="#8A8F9E" domain={["auto", "auto"]} width={40} />
            <Tooltip
              labelFormatter={(ts) => formatDay(toDayKey(new Date(ts)))}
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
      <DoseLegend items={legend} labelClassName="text-xs text-gray-600" align="start" />
      <p className="text-[11px] text-gray-500 mt-2">
        Solid line: logged weight entries (one point per entry, no values filled in) · Dashed: 7-day rolling average · Coloured bars: dose dates
      </p>
    </div>
  );
}