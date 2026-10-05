import React from "react";
import { useReportTokens } from "@/components/report/ReportTheme";

/**
 * Label/value pairs on the report paper.
 *
 * Phones: two pairs per row, each stacked (label above, bold value below) so a
 * label is never truncated with "…". From 640px up: label on the left, value on
 * the right of one row. Long values wrap instead of pushing the card wider.
 */
export default function PaperPairs({ pairs }) {
  const t = useReportTokens();

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
      {pairs.map(([label, value]) => (
        <div key={label} className="min-w-0 sm:flex sm:items-baseline sm:justify-between sm:gap-2">
          <span className="block text-sm leading-snug break-words" style={{ color: t.muted }}>
            {label}
          </span>
          <span
            className="block text-sm font-bold leading-snug mt-0.5 sm:mt-0 break-words [overflow-wrap:anywhere]"
            style={{ color: t.ink }}
          >
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}