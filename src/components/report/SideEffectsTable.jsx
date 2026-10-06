import React from "react";
import { useReportTokens } from "@/components/report/ReportTheme";
import ReportTable from "@/components/report/ReportTable";

/** "mild" → "Mild", for the severity column and its phone row. */
const capitalise = (text) => (text ? text.charAt(0).toUpperCase() + text.slice(1) : "");

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

  const columns = [
    { label: "Date", text: (row) => row.dayLabel, lead: true },
    { label: "Severity", text: (row) => capitalise(row.severity), strong: true },
    { label: "Side effect", text: (row) => row.symptom },
    { label: "Duration / notes", text: (row) => row.detail },
    { label: "Previous dose", text: (row) => (row.prior ? `${row.prior.label} on ${row.prior.dayLabel}` : "None logged") },
  ];

  return <ReportTable columns={columns} rows={rows} rowKey={(row) => row.id} />;
}