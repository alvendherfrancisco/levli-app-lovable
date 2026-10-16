import React from "react";
import { useReportTokens } from "@/components/report/ReportTheme";

/**
 * The report's headline figures — a muted label above a bold value, set in a
 * light panel so they read at a glance. Only figures that exist are passed in,
 * so an empty value never appears.
 *
 * A figure marked `wide` takes a row of its own: the goal reads as one line
 * ("Goal" then "40 kg · 10 kg to go"), which is what keeps it from wrapping
 * awkwardly on a narrow screen.
 */
export default function SummaryFigures({ figures }) {
  const t = useReportTokens();
  if (!figures.length) return null;

  // Two figures per row on a phone, and as many per row as there are figures
  // from 640px up (any beyond four wrap onto the next row).
  const columns = figures.length <= 2 ? "sm:grid-cols-2" : figures.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-4";

  return (
    <div className={`rounded-xl px-3 py-3 grid gap-x-4 gap-y-3 grid-cols-2 ${columns}`} style={{ background: t.tableHeadBg }}>
      {figures.map((figure) => (
        <div key={figure.label} className={`min-w-0 ${figure.wide ? "col-span-2 sm:col-span-full" : ""}`}>
          <span className="block text-xs leading-snug break-words" style={{ color: t.muted }}>
            {figure.label}
          </span>
          <span className="block text-base sm:text-lg font-bold leading-tight mt-0.5 break-words" style={{ color: t.ink }}>
            {figure.value}
          </span>
        </div>
      ))}
    </div>
  );
}