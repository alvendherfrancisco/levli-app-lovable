import React from "react";
import useDoseColors from "@/hooks/useDoseColors";

/**
 * The illustration an Insights lock shows: what the screen is about, small — a
 * rounded chart card with the purple wash under its rising line, a stat tile and
 * two bold bars beside it, and two twinkling sparkles.
 *
 * It is drawn the way the app's other lock illustrations are (see
 * src/components/report/ReportArt.jsx), in the brand's own solid colours: the
 * indigo and violet of the charts, the teal and amber of the home screen's stat
 * tiles. Solid fills and real weight, so it is clearly read over the blurred
 * charts behind it.
 *
 * Nothing is boxed: there is no background, no panel and no outline around the
 * artwork, and the only thing behind it is a soft purple glow — a radial gradient
 * fading to nothing on every side, so it has no edge to be seen. The card in the
 * middle of it is part of the drawing, not a frame for it.
 *
 * `size` is the box the drawing is scaled into — 150px, the size every lock
 * illustration is drawn at (see PremiumLockGroup) — and the glow behind it scales
 * with it, so the artwork is the same size in the group wherever it is shown.
 * Nothing on it is the person's own data — it is a drawing of a dashboard, not a
 * dashboard.
 */
const CARD_LIGHT = "#FFFFFF";
const CARD_DARK = "#242842";

export default function InsightTrendArt({ size = 120 }) {
  const { isDark } = useDoseColors();

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }} aria-hidden="true">
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: Math.round(size * 1.7),
          height: Math.round(size * 1.7),
          background: isDark
            ? "radial-gradient(closest-side, rgba(99,102,241,0.38), rgba(99,102,241,0))"
            : "radial-gradient(closest-side, rgba(139,92,246,0.22), rgba(139,92,246,0))",
        }}
      />

      <svg viewBox="0 0 112 112" className="relative h-full w-full" fill="none">
        <defs>
          <linearGradient id="insArtArea" x1="0" y1="40" x2="0" y2="92" gradientUnits="userSpaceOnUse">
            <stop stopColor="#8B5CF6" stopOpacity="0.5" />
            <stop offset="1" stopColor="#8B5CF6" stopOpacity="0.06" />
          </linearGradient>
        </defs>

        {/* The chart card, lifted a step off the glow by its own soft shadow. */}
        <rect x="15" y="35" width="66" height="62" rx="13" fill="rgba(79,70,229,0.16)" />
        <rect x="12" y="30" width="66" height="62" rx="13" fill={isDark ? CARD_DARK : CARD_LIGHT} />

        {/* The wash under the line, the line itself, and the day in hand. */}
        <path d="M18 82 L34 66 L50 72 L68 46 L68 88 L18 88 Z" fill="url(#insArtArea)" />
        <path
          d="M18 82 L34 66 L50 72 L68 46"
          stroke="#6366F1"
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="68" cy="46" r="3.8" fill="#4F46E5" />

        {/* The stat tile and the two bars beside it. */}
        <rect x="82" y="20" width="26" height="22" rx="8" fill="#8B5CF6" />
        <rect x="82" y="76" width="12" height="16" rx="6" fill="#14B8A6" />
        <rect x="96" y="56" width="12" height="36" rx="6" fill="#F59E0B" />

        {/* The sparkles, drifting very slowly — and sitting still with reduced
            motion (see .animate-lock-sparkle in src/index.css). */}
        <g className="animate-lock-sparkle">
          <path d="M14 10 L16 15 L21 17 L16 19 L14 24 L12 19 L7 17 L12 15Z" fill="#F59E0B" />
        </g>
        <g className="animate-lock-sparkle" style={{ animationDelay: "3.5s" }}>
          <path d="M102 6 L103.8 10 L108 11.8 L103.8 13.6 L102 18 L100.2 13.6 L96 11.8 L100.2 10Z" fill="#6366F1" />
        </g>
      </svg>
    </div>
  );
}