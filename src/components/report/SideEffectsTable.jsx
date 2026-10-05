import React from "react";
import { useReportTokens } from "@/components/report/ReportTheme";

/**
 * Side effects — newest first, with the most recent dose logged before each
 * entry. Timing data only; nothing is concluded from it. A value that was never
 * recorded is left blank rather than shown as a dash.
 */
export default function SideEffectsTable({ rows }) {
  const t = useReportTokens();

  if (!rows.length) {
    return <p className="text-sm" style={{ color: t.muted }}>No side effects logged in this period.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: t.tableHeadBg, color: t.muted }}>
            <th className="text-left p-2 font-medium whitespace-nowrap">Date</th>
            <th className="text-left p-2 font-medium">Side effect</th>
            <th className="text-left p-2 font-medium">Severity</th>
            <th className="text-left p-2 font-medium">Duration / notes</th>
            <th className="text-left p-2 font-medium">Previous dose</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t" style={{ borderColor: t.divider, color: t.ink }}>
              <td className="p-2 whitespace-nowrap">{row.dayLabel}</td>
              <td className="p-2">{row.symptom}</td>
              <td className="p-2 capitalize">{row.severity}</td>
              <td className="p-2">{row.detail}</td>
              <td className="p-2 whitespace-nowrap">
                {row.prior ? `${row.prior.label} on ${row.prior.dayLabel}` : "None logged"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}