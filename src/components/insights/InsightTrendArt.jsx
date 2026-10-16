import React from "react";
import useDoseColors from "@/hooks/useDoseColors";

/**
 * The illustration an Insights lock shows: the trend itself, small — a rising
 * line with its dots and the soft wash under it, and two twinkling sparkles.
 *
 * It is drawn in the onboarding's own manner, the way every other lock
 * illustration is (see src/components/report/ReportArt.jsx), but it is fully
 * transparent: there is no card, no panel and no frame behind it, so nothing is
 * cut across the blurred page it floats over. The only thing behind the artwork
 * is a soft purple glow — a radial gradient fading to nothing, so it has no edge
 * and reads as light rather than as a box.
 *
 * 88px wide, as the lock asks for: big enough for the line and its dots to be
 * recognised over the blurred chart, small enough that it never crowds the page.
 * Nothing on it is the person's own data — it is a drawing of a chart, not a chart.
 */
export default function InsightTrendArt() {
  const { isDark } = useDoseColors();

  return (
    <div className="relative mx-auto h-[88px] w-[88px]" aria-hidden="true">
      {/* The glow: light, not a surface — it reaches out past the artwork and fades
          to nothing on every side. */}
      <div
        className="absolute left-1/2 top-1/2 h-[150px] w-[150px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background: isDark
            ? "radial-gradient(closest-side, rgba(99,102,241,0.34), rgba(99,102,241,0))"
            : "radial-gradient(closest-side, rgba(139,92,246,0.20), rgba(139,92,246,0))",
        }}
      />

      <svg viewBox="0 0 88 88" className="relative h-full w-full" fill="none">
        <defs>
          <linearGradient id="insArtLine" x1="10" y1="62" x2="76" y2="30" gradientUnits="userSpaceOnUse">
            <stop stopColor="#8B5CF6" /><stop offset="1" stopColor="#6366F1" />
          </linearGradient>
          <linearGradient id="insArtFill" x1="0" y1="34" x2="0" y2="76" gradientUnits="userSpaceOnUse">
            <stop stopColor="#8B5CF6" stopOpacity="0.3" /><stop offset="1" stopColor="#8B5CF6" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* The line, the wash under it and the days it is read at — nothing else. */}
        <path d="M10 64 L32 48 L52 53 L76 28 L76 76 L10 76 Z" fill="url(#insArtFill)" />
        <path
          d="M10 64 L32 48 L52 53 L76 28"
          stroke="url(#insArtLine)"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="10" cy="64" r="3.1" fill="#8B5CF6" />
        <circle cx="32" cy="48" r="3.1" fill="#8B5CF6" />
        <circle cx="52" cy="53" r="3.1" fill="#8B5CF6" />
        <circle cx="76" cy="28" r="4.1" fill="#6366F1" />

        {/* The two sparkles, drifting very slowly (see .animate-lock-sparkle). */}
        <g className="animate-lock-sparkle">
          <path d="M14 22 L16.2 28 L22 30.2 L16.2 32.4 L14 38.4 L11.8 32.4 L6 30.2 L11.8 28Z" fill="#F59E0B" />
        </g>
        <g className="animate-lock-sparkle" style={{ animationDelay: "3.5s" }}>
          <path d="M74 12 L76 17 L81 19 L76 21 L74 26 L72 21 L67 19 L72 17Z" fill="#6366F1" />
        </g>
      </svg>
    </div>
  );
}