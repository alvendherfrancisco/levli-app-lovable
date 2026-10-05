import React from "react";
import { useReportTokens } from "@/components/report/ReportTheme";

/**
 * The report's summary tiles: the figures a clinician reads first. One tile per
 * value, each with the label, the value and one supporting line ("for 6 weeks ·
 * since 12 Aug"). The tiles come from the report engine, so the screen and the
 * PDF show exactly the same set with the same wording — a value that does not
 * exist has no tile at all.
 */
export default function SummaryTiles({ tiles }) {
  const t = useReportTokens();
  if (!tiles.length) return null;

  return (
    <div className="grid grid-cols-2 gap-2">
      {tiles.map((tile) => (
        <div
          key={tile.id}
          className="min-w-0 rounded-xl border p-3"
          style={{ background: t.tileBg, borderColor: t.cardBorder }}
        >
          <p className="text-sm leading-snug break-words" style={{ color: t.muted }}>{tile.label}</p>
          <p className="text-lg font-bold leading-tight mt-0.5 break-words [overflow-wrap:anywhere]" style={{ color: t.ink }}>
            {tile.value}
          </p>
          {tile.sub && (
            <p className="text-sm leading-snug mt-0.5 break-words" style={{ color: t.muted }}>{tile.sub}</p>
          )}
        </div>
      ))}
    </div>
  );
}