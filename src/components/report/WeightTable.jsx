import React from "react";
import { useReportTokens } from "@/components/report/ReportTheme";

/**
 * The compact weight table under the chart: date, weight and the change from the
 * entry logged before it. Newest first, so the current reading is the first row.
 * An entry with nothing before it leaves its change cell empty rather than
 * showing a placeholder.
 */
export default function WeightTable({ rows }) {
  const t = useReportTokens();

  if (!rows.length) return null;

  return (
    <div className="mt-4">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: t.tableHeadBg, color: t.muted }}>
            <th className="text-left p-2 font-medium">Date</th>
            <th className="text-left p-2 font-medium">Weight</th>
            <th className="text-left p-2 font-medium">Change</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t" style={{ borderColor: t.divider, color: t.ink }}>
              <td className="p-2 whitespace-nowrap">{row.dayLabel}</td>
              <td className="p-2 whitespace-nowrap">{row.valueLabel}</td>
              <td className="p-2 whitespace-nowrap">{row.changeLabel}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-sm mt-2" style={{ color: t.muted }}>
        Newest entry first. Change is measured against the entry logged before it.
      </p>
    </div>
  );
}