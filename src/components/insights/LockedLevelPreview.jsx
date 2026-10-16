import React from "react";
import { Syringe } from "lucide-react";

/**
 * What the Medication Level card's locked block draws instead of the figure: the
 * "Today" row with a sample level and a sample phase badge, the range tabs, the
 * graph's frame with a made-up level curve, its dose markers and its forecast, the
 * legend, the note and the caveat.
 *
 * The layout, the sizes and the colours are the real card's (see
 * MedicationLevelChart and MedicationLevelCard) and they are drawn at full
 * strength, because the blur over them is light: the curve, the syringes and the
 * badge are the things the card is read for. The figure, the phase and the days
 * after a dose are all made up for the picture.
 */
const SAMPLE_MARKERS = [[92, 78], [162, 140], [234, 80]];

/** One key in the legend: the mark the graph draws it with, and its word. */
function LegendKey({ children }) {
  return (
    <span className="flex items-center gap-1.5">
      {children}
      <span className="h-2.5 w-12 rounded-full bg-gray-200 dark:bg-white/10" />
    </span>
  );
}

export default function LockedLevelPreview() {
  return (
    <div>
      {/* Today: the label, the phase badge beside it, the figure and its line. */}
      <div className="mb-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs text-gray-400 dark:text-[#9A9DAE]">Today</p>
          <span className="shrink-0 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
            Peak window
          </span>
        </div>
        <p className="text-3xl font-bold leading-tight text-gray-900 dark:text-white">72%</p>
        <p className="mt-0.5 text-[13px] text-gray-500 dark:text-[#9A9DAE]">of single-dose peak · day 3 after dose</p>
      </div>

      {/* The range tabs, as the real row: the range in hand is the indigo pill. */}
      <div className="mb-5 flex items-center gap-1">
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className={`flex min-h-[38px] flex-1 items-center justify-center rounded-full text-[11px] font-medium sm:text-xs ${
              index === 0 ? "bg-indigo-600 text-white" : "text-gray-500 dark:text-[#9A9DAE]"
            }`}
          >
            {index === 0 ? "30 Days" : index === 1 ? "90 Days" : "1 Year"}
          </span>
        ))}
      </div>

      {/* The graph: the level lived, the forecast, a syringe on each dose day. */}
      <div className="h-56" aria-hidden="true">
        <svg viewBox="0 0 320 200" className="h-full w-full" fill="none" preserveAspectRatio="none">
          {[40, 80, 120, 160].map((y) => (
            <line key={y} x1="8" y1={y} x2="312" y2={y} strokeDasharray="4 5"
              className="stroke-gray-300 dark:stroke-white/15" strokeWidth="1" />
          ))}

          {/* What the figure is a share of: the peak of a single dose. */}
          <line x1="8" y1="100" x2="312" y2="100" stroke="#94A3B8" strokeWidth="1.2" strokeDasharray="4 4" />

          <path d="M12 168 C46 148 66 84 96 78 C126 72 138 134 168 142 C198 150 210 86 240 80"
            stroke="#6366F1" strokeWidth="2.6" strokeLinecap="round" />
          <path d="M240 80 C266 74 288 122 308 134" stroke="#818CF8" strokeWidth="2.4"
            strokeDasharray="5 4" strokeLinecap="round" />

          {/* A dose's own day, drawn as the syringe standing on the curve. */}
          {SAMPLE_MARKERS.map(([cx, cy]) => (
            <g key={cx} transform={`translate(${cx},${cy})`}>
              <rect x="-3.4" y="-14" width="6.8" height="9" rx="1.5" fill="#4F46E5" />
              <rect x="-2" y="-17" width="4" height="3.2" rx="0.9" fill="#4F46E5" />
              <line x1="0" y1="-5" x2="0" y2="0" stroke="#4F46E5" strokeWidth="1.3" strokeLinecap="round" />
            </g>
          ))}
        </svg>
      </div>

      {/* The marks the graph is drawn with. */}
      <div className="mt-3 flex items-center justify-center gap-4">
        <LegendKey>
          <Syringe size={14} style={{ color: "#4F46E5" }} aria-hidden="true" />
        </LegendKey>
        <LegendKey>
          <span className="h-0.5 w-4 rounded" style={{ background: "#6366F1" }} />
        </LegendKey>
        <LegendKey>
          <svg width="16" height="2" aria-hidden="true">
            <line x1="0" y1="1" x2="16" y2="1" stroke="#818CF8" strokeWidth="2" strokeDasharray="4 3" strokeLinecap="round" />
          </svg>
        </LegendKey>
      </div>

      {/* The note the figure is read with, and the caveat under it. */}
      <div className="mt-3 rounded-xl bg-indigo-50 px-3.5 py-2.5 dark:bg-indigo-500/10">
        <span className="mb-1.5 block h-3 w-full max-w-[220px] rounded-full bg-indigo-200 dark:bg-indigo-400/20" />
        <span className="block h-3 w-2/3 rounded-full bg-indigo-200 dark:bg-indigo-400/20" />
      </div>
      <div className="mt-3 flex justify-center">
        <span className="h-2.5 w-56 max-w-full rounded-full bg-gray-200 dark:bg-white/10" />
      </div>
    </div>
  );
}