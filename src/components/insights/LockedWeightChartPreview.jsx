import React from "react";

/**
 * What the weight chart's locked block draws instead of the graph: the Expected
 * toggle, the graph's own box with a sample line and dots in it, the legend and
 * the caveat, all in sample form.
 *
 * It draws the same layout at the same sizes as the real chart, so a locked card
 * is the height an unlocked one is and nothing moves when the lock comes off.
 * Nothing on it is the person's data: the line, the dots and the goal are made up
 * for the picture.
 */
const SAMPLE_POINTS = [[44, 128], [92, 118], [140, 100], [196, 88], [250, 70], [300, 54]];

export default function LockedWeightChartPreview() {
  return (
    <div>
      {/* The Expected toggle, in sample form: the same pill, nothing to press. */}
      <div className="mb-2 flex justify-end">
        <span className="inline-flex h-[44px] items-center gap-2.5 rounded-full border border-cardline pl-4 pr-3 text-[13px] font-medium text-gray-400 dark:text-gray-500">
          Expected
          <span className="relative h-5 w-9 flex-shrink-0 rounded-full bg-gray-200 dark:bg-white/15">
            <span className="absolute left-[18px] top-0.5 h-4 w-4 rounded-full bg-white" />
          </span>
        </span>
      </div>

      {/* The graph's box, with a made-up line and made-up dots in it. */}
      <div className="h-56 rounded-xl bg-gray-50 p-2 dark:bg-white/[0.03]">
        <svg viewBox="0 0 320 200" className="h-full w-full" fill="none" preserveAspectRatio="none">
          {[36, 76, 116, 156].map((y) => (
            <line key={y} x1="8" y1={y} x2="312" y2={y} strokeDasharray="4 5"
              className="stroke-gray-300 dark:stroke-white/15" strokeWidth="1" />
          ))}
          <path d="M44 150 C90 140 120 122 160 114 S240 88 300 62" stroke="#10B981" strokeWidth="2" strokeDasharray="6 5" opacity="0.45" />
          <path d="M44 162 C100 154 150 138 200 124 S270 96 300 84" stroke="#8B5CF6" strokeWidth="2" strokeDasharray="4 4" opacity="0.5" />
          <path d="M44 128 C92 118 140 100 196 88 S260 68 300 54" stroke="#6366F1" strokeWidth="2.5" opacity="0.6" />
          {SAMPLE_POINTS.map(([cx, cy]) => (
            <circle key={cx} cx={cx} cy={cy} r="4" fill="#6366F1" opacity="0.5" />
          ))}
        </svg>
      </div>

      {/* The legend, and the caveat under it. */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-4">
        {[0, 1, 2].map((i) => (
          <span key={i} className="h-3 w-16 rounded-full bg-gray-200 dark:bg-white/10" />
        ))}
      </div>
      <div className="mt-3 flex justify-center">
        <span className="h-2.5 w-52 max-w-full rounded-full bg-gray-200 dark:bg-white/10" />
      </div>
    </div>
  );
}