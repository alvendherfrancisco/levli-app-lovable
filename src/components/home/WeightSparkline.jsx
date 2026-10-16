import React from "react";

const W = 100;
const H = 40;
const PAD = 3;
const ACTUAL = "#6366F1";   // indigo-500 — the same indigo the Insights chart draws weights in
const EXPECTED = "#10B981"; // the chart's own expected-curve green, held faint here

/**
 * The mini trend on the Weight Progress card: the recent weights as a line, with
 * the typical GLP-1 curve faintly behind them.
 *
 * Drawn as plain SVG on purpose — the Insights chart's library is deliberately
 * kept off Home — so the card costs nothing to show. The shape is stretched to
 * fill its column (the strokes are drawn non-scaling, so they keep their weight),
 * and the dot on the latest weight is a small round element rather than an SVG
 * circle, so it stays a circle whatever the column's width.
 *
 * With fewer than two weights there is no line to draw and no trend to read, so a
 * faint placeholder stands in its place.
 */
export default function WeightSparkline({ points = [], expected = [], ariaLabel }) {
  const enough = points.length >= 2;
  const values = enough ? points.concat(expected.filter((v) => v != null)) : [];
  const min = enough ? Math.min(...values) : 0;
  const max = enough ? Math.max(...values) : 1;
  const span = max - min || 1;
  const n = points.length;
  const px = (i) => PAD + (i * (W - PAD * 2)) / Math.max(1, n - 1);
  const py = (v) => H - PAD - ((v - min) / span) * (H - PAD * 2);
  const path = (arr) =>
    arr
      .map((v, i) => `${i ? "L" : "M"}${px(i).toFixed(2)},${py(v).toFixed(2)}`)
      .join(" ");

  return (
    <div className="relative h-14 w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        role="img"
        aria-label={ariaLabel}
      >
        {enough ? (
          <>
            <path
              d={path(expected)}
              fill="none"
              stroke={EXPECTED}
              strokeOpacity="0.4"
              strokeWidth="1.5"
              strokeDasharray="3 3"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d={path(points)}
              fill="none"
              stroke={ACTUAL}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </>
        ) : (
          <path
            d={`M${PAD},${H - 9} L${W - PAD},${H - 21}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="3 3"
            vectorEffect="non-scaling-stroke"
            className="text-gray-300 dark:text-gray-600"
          />
        )}
      </svg>
      {enough && (
        <span
          aria-hidden="true"
          className="absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500"
          style={{ left: `${(px(n - 1) / W) * 100}%`, top: `${(py(points[n - 1]) / H) * 100}%` }}
        />
      )}
    </div>
  );
}