import React from "react";
import { useReportTokens } from "@/components/report/ReportTheme";

/**
 * How often each side effect was logged, as simple horizontal bars.
 * Labels wrap rather than truncate, so a symptom name is never lost.
 */
export default function SideEffectBars({ rows }) {
  const t = useReportTokens();

  if (!rows.length) return null;
  const max = Math.max(...rows.map((r) => r.count), 1);

  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center gap-2">
          <span className="text-sm w-28 flex-shrink-0 break-words leading-snug" style={{ color: t.muted }}>
            {row.label}
          </span>
          <div className="flex-1 min-w-0 h-3 rounded" style={{ background: t.barTrack }}>
            <div className="h-3 rounded" style={{ width: `${(row.count / max) * 100}%`, background: t.barFill }} />
          </div>
          <span className="text-sm w-7 text-right flex-shrink-0" style={{ color: t.muted }}>{row.count}</span>
        </div>
      ))}
    </div>
  );
}