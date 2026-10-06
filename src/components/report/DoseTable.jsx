import React from "react";
import { useReportTokens } from "@/components/report/ReportTheme";
import ReportTable from "@/components/report/ReportTable";

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

  const columns = [
    { label: "Date", text: (row) => row.dayLabel, lead: true },
    { label: "Time", text: (row) => row.time, lead: true },
    { label: "Dose", text: (row) => row.doseLabel, strong: true },
    { label: "Injection site", text: (row) => row.site },
    ...(showPain ? [{ label: "Pain", text: (row) => (row.pain != null ? `${row.pain}/10` : "") }] : []),
  ];

  return <ReportTable columns={columns} rows={rows} rowKey={(row) => row.id} />;
}