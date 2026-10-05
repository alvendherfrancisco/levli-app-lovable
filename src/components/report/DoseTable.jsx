import React from "react";
import DoseBadge from "@/components/DoseBadge";
import { useReportTokens } from "@/components/report/ReportTheme";

/**
 * Doses taken — newest first. The dose keeps its colour badge plus the dose
 * text, so it matches the same dose everywhere else in the app and in the PDF.
 */
export default function DoseTable({ rows, showPain, showDetail }) {
  const t = useReportTokens();

  if (!rows.length) {
    return <p className="text-sm" style={{ color: t.muted }}>No doses logged in this range.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: t.tableHeadBg, color: t.muted }}>
            <th className="text-left p-2 font-medium whitespace-nowrap">Date</th>
            <th className="text-left p-2 font-medium whitespace-nowrap">Time</th>
            <th className="text-left p-2 font-medium">Medication</th>
            <th className="text-left p-2 font-medium">Dose</th>
            <th className="text-left p-2 font-medium">Injection site</th>
            {showDetail && <th className="text-left p-2 font-medium">Route / concentration</th>}
            {showPain && <th className="text-left p-2 font-medium">Pain</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t" style={{ borderColor: t.divider, color: t.ink }}>
              <td className="p-2 whitespace-nowrap">{row.dayLabel}</td>
              <td className="p-2 whitespace-nowrap">{row.time}</td>
              <td className="p-2">{row.medication}</td>
              <td className="p-2"><DoseBadge medication={row.medication} dose={row.dose} unit={row.unit} /></td>
              <td className="p-2">{row.site}</td>
              {showDetail && <td className="p-2">{row.detail || "—"}</td>}
              {showPain && <td className="p-2 whitespace-nowrap">{row.pain != null ? `${row.pain}/10` : "—"}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}