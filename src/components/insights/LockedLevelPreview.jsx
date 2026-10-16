import React from "react";

/**
 * What the Medication Level card's locked block draws instead of the figure: the
 * "Today" line, the range tabs, the graph's box with a sample curve and dose
 * markers on it, the legend, the note and the caveat — every one of them a shape
 * rather than the person's own level.
 *
 * The layout and the sizes are the real card's, so the locked card is the height
 * the unlocked one is and the "How this works" row under it never moves when the
 * lock comes off.
 */
export default function LockedLevelPreview() {
  return (
    <div>
      {/* Today: the label, the badge beside it, the figure and its line. */}
      <div className="mb-4">
        <div className="flex items-start justify-between gap-3">
          <span className="h-3 w-10 rounded-full bg-gray-200 dark:bg-white/10" />
          <span className="h-6 w-16 rounded-full bg-gray-200 dark:bg-white/10" />
        </div>
        <span className="mt-2 block h-8 w-28 rounded-lg bg-gray-200 dark:bg-white/10" />
        <span className="mt-2 block h-3 w-44 max-w-full rounded-full bg-gray-200 dark:bg-white/10" />
      </div>

      {/* The range tabs, as pills. */}
      <div className="mb-5 flex gap-1">
        {[0, 1, 2].map((i) => (
          <span key={i} className="h-[38px] flex-1 rounded-full bg-gray-100 dark:bg-white/[0.06]" />
        ))}
      </div>

      {/* The graph's box, with a made-up curve and made-up dose markers. */}
      <div className="h-56 rounded-xl bg-gray-50 p-2 dark:bg-white/[0.03]">
        <svg viewBox="0 0 320 200" className="h-full w-full" fill="none" preserveAspectRatio="none">
          {[40, 80, 120, 160].map((y) => (
            <line key={y} x1="8" y1={y} x2="312" y2={y} strokeDasharray="4 5"
              className="stroke-gray-300 dark:stroke-white/15" strokeWidth="1" />
          ))}
          <path d="M16 170 C50 150 70 80 100 76 C130 72 140 130 170 138 C200 146 210 84 240 78 C268 72 288 118 304 132"
            stroke="#6366F1" strokeWidth="2.6" opacity="0.55" />
          <path d="M240 78 C268 72 288 118 304 132" stroke="#818CF8" strokeWidth="2.4" strokeDasharray="5 5" opacity="0.5" />
          {[[100, 76], [170, 138], [240, 78]].map(([cx, cy]) => (
            <g key={cx} transform={`translate(${cx},${cy})`}>
              <rect x="-3.4" y="-14" width="6.8" height="9" rx="1.5" fill="#4F46E5" opacity="0.5" />
              <rect x="-2" y="-17" width="4" height="3.2" rx="0.9" fill="#4F46E5" opacity="0.5" />
              <line x1="0" y1="-5" x2="0" y2="0" stroke="#4F46E5" strokeWidth="1.3" opacity="0.5" />
            </g>
          ))}
        </svg>
      </div>

      {/* The legend, the note the figure is read with, and the caveat. */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-4">
        {[0, 1].map((i) => (
          <span key={i} className="h-3 w-20 rounded-full bg-gray-200 dark:bg-white/10" />
        ))}
      </div>
      <div className="mt-3 rounded-xl bg-gray-50 px-3.5 py-2.5 dark:bg-white/[0.04]">
        <span className="mb-1.5 block h-3 w-full max-w-[220px] rounded-full bg-gray-200 dark:bg-white/10" />
        <span className="block h-3 w-2/3 rounded-full bg-gray-200 dark:bg-white/10" />
      </div>
      <div className="mt-3 flex justify-center">
        <span className="h-2.5 w-56 max-w-full rounded-full bg-gray-200 dark:bg-white/10" />
      </div>
    </div>
  );
}