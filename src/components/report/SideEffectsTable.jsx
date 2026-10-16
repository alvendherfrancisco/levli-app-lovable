import React from "react";
import { useReportTokens } from "@/components/report/ReportTheme";
import ReportTable from "@/components/report/ReportTable";

/**
 * Side effects — newest first. The symptom leads, its severity is coloured, and
 * the timing to the most recent dose is stated in words ("0 days after the
 * 7.5 mg dose"). Timing data only; nothing is concluded from it, and a value
 * that was never recorded is left blank rather than shown as a dash.
 */
export default function SideEffectsTable({ rows, severityColour }) {
  const t = useReportTokens();

  if (!rows.length) {
    return <p className="text-sm" style={{ color: t.muted }}>No side effects logged in this period.</p>;
  }

  const columns = [
    { label: "Symptom", text: (row) => row.symptom, lead: true },
    { label: "Date", text: (row) => row.dayLabel },
    {
      label: "Severity",
      text: (row) => row.severityLabel,
      strong: true,
      colour: (row) => severityColour(row.severityKey),
    },
    { label: "Days after dose", text: (row) => row.afterDose },
  ];

  return <ReportTable columns={columns} rows={rows} rowKey={(row) => row.id} />;
}