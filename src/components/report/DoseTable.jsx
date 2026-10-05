import React from "react";
import DoseBadge from "@/components/DoseBadge";
import { useReportTokens } from "@/components/report/ReportTheme";

/**
 * Doses taken — newest first.
 *
 * Medication and route are never repeated per row: the medication is named in
 * the report header and the route / concentration in the footnote under the
 * table. Injection site and pain only appear when the "Injection sites and pain"
 * section is part of the report. The dose keeps its colour badge plus the dose
 * text, so it matches the same dose everywhere else in the app and in the PDF.
 */
export default function DoseTable({ rows, showSiteAndPain }) {
  const t = useReportTokens();

  if (!rows.length) return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: t.tableHeadBg, color: t.muted }}>
            <th className="text-left p-2 font-medium whitespace-nowrap">Date</th>
            <th className="text-left p-2 font-medium whitespace-nowrap">Time</th>
            <th className="text-left p-2 font-medium">Dose</th>
            {showSiteAndPain && <th className="text-left p-2 font-medium">Injection site</th>}
            {showSiteAndPain && <th className="text-left p-2 font-medium">Pain</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t" style={{ borderColor: t.divider, color: t.ink }}>
              <td className="p-2 whitespace-nowrap">{row.dayLabel}</td>
              <td className="p-2 whitespace-nowrap">{row.time}</td>
              <td className="p-2"><DoseBadge medication={row.medication} dose={row.dose} unit={row.unit} /></td>
              {showSiteAndPain && <td className="p-2">{row.site}</td>}
              {showSiteAndPain && <td className="p-2 whitespace-nowrap">{row.pain != null ? `${row.pain}/10` : "—"}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}