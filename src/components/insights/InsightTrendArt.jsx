import React from "react";
import useDoseColors from "@/hooks/useDoseColors";

/**
 * The illustration an Insights lock shows: the trend itself, small — a card with
 * a rising line, its dots and the soft fill under it.
 *
 * It is drawn in the onboarding's own manner, the way every other lock
 * illustration is (see src/components/report/ReportArt.jsx): soft line art, two
 * twinkling sparkles, and one blurred purple blob behind the artwork, pale
 * lavender on a light card and deep indigo on a dark one. Nothing on it is the
 * person's own data — it is a picture of the chart, not a chart.
 *
 * 96px wide, as the locked cards ask for: big enough to be recognised as the
 * chart behind the blur, small enough that a locked card never crowds the page.
 */
export default function InsightTrendArt() {
  const { isDark } = useDoseColors();

  const page = isDark ? "#1E2130" : "#FFFFFF";
  const line = isDark ? "rgba(255,255,255,0.22)" : "#E5E7EB";
  const grid = isDark ? "rgba(255,255,255,0.10)" : "#EEF0F5";
  const wash = isDark
    ? "linear-gradient(135deg, #4F46E5, #7C3AED)"
    : "linear-gradient(135deg, #A5B4FC, #C4B5FD)";

  return (
    <div className="relative mx-auto h-24 w-24" aria-hidden="true">
      <div
        className="onb-art-glow absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{ background: wash }}
      />

      <svg viewBox="0 0 96 96" className="relative h-full w-full" fill="none">
        <defs>
          <linearGradient id="insArtLine" x1="26" y1="66" x2="70" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#8B5CF6" /><stop offset="1" stopColor="#6366F1" />
          </linearGradient>
          <linearGradient id="insArtFill" x1="0" y1="38" x2="0" y2="70" gradientUnits="userSpaceOnUse">
            <stop stopColor="#8B5CF6" stopOpacity="0.24" /><stop offset="1" stopColor="#8B5CF6" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* The card the chart is drawn on. */}
        <rect x="18" y="18" width="60" height="60" rx="13" fill={page} stroke={line} strokeWidth="1.5" />

        {/* Its quiet grid, the fill under the line, and the line itself. */}
        {[36, 50, 64].map((y) => (
          <line key={y} x1="26" y1={y} x2="70" y2={y} stroke={grid} strokeWidth="1.4" strokeLinecap="round" />
        ))}
        <path d="M26 66 L40 56 L52 60 L70 40 L70 70 L26 70 Z" fill="url(#insArtFill)" />
        <path
          d="M26 66 L40 56 L52 60 L70 40"
          stroke="url(#insArtLine)"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* The points it is read by, the last one carrying the eye. */}
        <circle cx="26" cy="66" r="2.4" fill="#8B5CF6" />
        <circle cx="40" cy="56" r="2.4" fill="#8B5CF6" />
        <circle cx="52" cy="60" r="2.4" fill="#8B5CF6" />
        <circle cx="70" cy="40" r="3.2" fill="#6366F1" />

        <g className="animate-onb-sparkle">
          <path d="M18 30 L20 34.5 L24.5 36.5 L20 38.5 L18 43 L16 38.5 L11.5 36.5 L16 34.5Z" fill="#F59E0B" />
        </g>
        <g className="animate-onb-sparkle" style={{ animationDelay: "0.9s" }}>
          <path d="M79 52 L81 56.5 L85.5 58.5 L81 60.5 L79 65 L77 60.5 L72.5 58.5 L77 56.5Z" fill="#6366F1" />
        </g>
      </svg>
    </div>
  );
}