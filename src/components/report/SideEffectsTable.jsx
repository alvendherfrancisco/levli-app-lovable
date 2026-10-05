import React from "react";
import { NO_SIDE_EFFECTS_LINE } from "@/lib/reportData";
import { useReportTokens } from "@/components/report/ReportTheme";

/**
 * Side effects — newest first: what was logged, when, and how bad. Nothing was
 * logged in the period is one muted line, never an empty table.
 */
export default function SideEffectsTable({ rows }) {
  const t = useReportTokens();

  if (!rows.length) {
    return <p className="text-sm" style={{ color: t.muted }}>{NO_SIDE_EFFECTS_LINE}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: t.tableHeadBg, color: t.muted }}>
            <th className="text-left p-2 font-medium whitespace-nowrap">Date</th>
            <th className="text-left p-2 font-medium">Side effect</th>
            <th className="text-left p-2 font-medium">Severity</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t" style={{ borderColor: t.divider, color: t.ink }}>
              <td className="p-2 whitespace-nowrap">{row.dayLabel}</td>
              <td className="p-2">{row.symptom}</td>
              <td className="p-2 capitalize">{row.severity || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}