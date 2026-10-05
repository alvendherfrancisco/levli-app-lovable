import React from "react";
import { useReportTokens } from "@/components/report/ReportTheme";

/**
 * The report's headline figures — a muted label above a bold value, set in a
 * light panel so they read at a glance. Only figures that exist are passed in,
 * so an empty value never appears.
 */
export default function SummaryFigures({ figures }) {
  const t = useReportTokens();
  if (!figures.length) return null;

  return (
    <div
      className="rounded-xl px-3 py-3 grid gap-x-4 gap-y-3"
      style={{
        background: t.tableHeadBg,
        gridTemplateColumns: `repeat(${Math.min(figures.length, 4)}, minmax(0, 1fr))`,
      }}
    >
      {figures.map((figure) => (
        <div key={figure.label} className="min-w-0">
          <span className="block text-xs leading-snug break-words" style={{ color: t.muted }}>
            {figure.label}
          </span>
          <span className="block text-lg font-bold leading-tight mt-0.5 break-words" style={{ color: t.ink }}>
            {figure.value}
          </span>
        </div>
      ))}
    </div>
  );
}