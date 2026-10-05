import React from "react";
import { useReportTokens } from "@/components/report/ReportTheme";

/**
 * Doses taken — newest first: date, time, dose, injection site, and the pain
 * level when that section is selected. The medication, its route and its
 * concentration are named once in the report summary, so the table itself
 * carries only the per-dose facts. Nothing is truncated, and a value that was
 * never recorded is left blank rather than shown as a dash.
 */
export default function DoseTable({ rows, showPain }) {
  const t = useReportTokens();

  if (!rows.length) {
    return <p className="text-sm" style={{ color: t.muted }}>No doses logged in this period.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: t.tableHeadBg, color: t.ink }}>
            <th className="text-left p-2 font-semibold whitespace-nowrap">Date</th>
            <th className="text-left p-2 font-semibold whitespace-nowrap">Time</th>
            <th className="text-left p-2 font-semibold whitespace-nowrap">Dose</th>
            <th className="text-left p-2 font-semibold">Injection site</th>
            {showPain && <th className="text-left p-2 font-semibold whitespace-nowrap">Pain</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t" style={{ borderColor: t.divider, color: t.ink }}>
              <td className="p-2 whitespace-nowrap">{row.dayLabel}</td>
              <td className="p-2 whitespace-nowrap">{row.time}</td>
              <td className="p-2 font-semibold whitespace-nowrap">{row.doseLabel}</td>
              <td className="p-2">{row.site}</td>
              {showPain && <td className="p-2 whitespace-nowrap">{row.pain != null ? `${row.pain}/10` : ""}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}