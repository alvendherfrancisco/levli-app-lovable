import React from "react";

/**
 * What the weight chart's locked block draws instead of the graph: the Expected
 * toggle as the card opens it, the graph's own frame — its grid, the goal, the
 * soft green expected curve, the dashed average and the person's own line with its
 * dots — the legend and the caveat, all in sample form.
 *
 * It draws the same layout at the same sizes and in the same colours as the real
 * chart (see WeightProgressChart), and it draws them at full strength: the blur
 * over it is light, so the lines are meant to be recognised. Nothing on it is the
 * person's data — the line, the dots, the goal and the curve are made up for the
 * picture.
 */
const SAMPLE_POINTS = [[44, 150], [92, 138], [140, 116], [196, 98], [250, 74], [300, 56]];

/** One key in the legend: the mark the chart draws it with, and its word. */
function LegendItem({ color, dotted = false }) {
  return (
    <span className="flex items-center gap-1.5">
      {dotted
        ? <span className="h-2 w-2 rounded-full" style={{ background: color }} />
        : <span className="h-0.5 w-4 rounded" style={{ background: color }} />}
      <span className="h-2.5 w-12 rounded-full bg-gray-200 dark:bg-white/10" />
    </span>
  );
}

export default function LockedWeightChartPreview() {
  return (
    <div>
      {/* The Expected toggle, on — the card's own default — with nothing to press. */}
      <div className="mb-2 flex justify-end">
        <span className="inline-flex h-[44px] items-center gap-2.5 rounded-full border border-cardline pl-4 pr-3 text-[13px] font-medium text-gray-600 dark:text-gray-300">
          Expected
          <span className="relative h-5 w-9 flex-shrink-0 rounded-full bg-indigo-600">
            <span className="absolute left-[18px] top-0.5 h-4 w-4 rounded-full bg-white" />
          </span>
        </span>
      </div>

      {/* The graph itself: the same frame, the same four things drawn in it. */}
      <div className="h-56" aria-hidden="true">
        <svg viewBox="0 0 320 200" className="h-full w-full" fill="none" preserveAspectRatio="none">
          <defs>
            <linearGradient id="lockedWeightFill" x1="0" y1="40" x2="0" y2="190" gradientUnits="userSpaceOnUse">
              <stop stopColor="#10B981" stopOpacity="0.22" />
              <stop offset="1" stopColor="#10B981" stopOpacity="0.03" />
            </linearGradient>
          </defs>

          {[36, 76, 116, 156].map((y) => (
            <line key={y} x1="8" y1={y} x2="312" y2={y} strokeDasharray="4 5"
              className="stroke-gray-300 dark:stroke-white/15" strokeWidth="1" />
          ))}

          {/* The goal, dashed across the chart. */}
          <line x1="8" y1="44" x2="312" y2="44" stroke="#94A3B8" strokeWidth="1.4" strokeDasharray="6 4" />

          {/* Expected, as the real chart draws it: a soft green curve with its fill. */}
          <path d="M40 168 C90 150 120 118 170 100 S250 66 300 46 L300 190 L40 190 Z" fill="url(#lockedWeightFill)" />
          <path d="M40 168 C90 150 120 118 170 100 S250 66 300 46" stroke="#10B981" strokeWidth="2.2" />

          {/* The 7-day average, dashed, and the line itself with its dots. */}
          <path d="M44 156 C100 146 150 128 200 112 S270 84 300 72" stroke="#8B5CF6" strokeWidth="2" strokeDasharray="4 4" />
          <path d="M44 150 L92 138 L140 116 L196 98 L250 74 L300 56" stroke="#6366F1" strokeWidth="2.6"
            strokeLinejoin="round" strokeLinecap="round" />
          {SAMPLE_POINTS.map(([cx, cy]) => (
            <circle key={cx} cx={cx} cy={cy} r="4.2" fill="#6366F1" stroke="#ffffff" strokeWidth="1.6" />
          ))}
        </svg>
      </div>

      {/* The legend, and the caveat under it. */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-4">
        <LegendItem color="#6366F1" dotted />
        <LegendItem color="#10B981" />
        <LegendItem color="#94A3B8" />
      </div>
      <div className="mt-3 flex justify-center">
        <span className="h-2.5 w-52 max-w-full rounded-full bg-gray-200 dark:bg-white/10" />
      </div>
    </div>
  );
}