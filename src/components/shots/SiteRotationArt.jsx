import React from "react";
import useDoseColors from "@/hooks/useDoseColors";

/**
 * The illustration the rotation lock shows: the app's own figure, drawn small,
 * with one site glowing on it.
 *
 * It is the same figure the rotation chart itself draws (see BodyFrames) — the
 * same seven shapes, the same line weight, the same colours for the light and dark
 * card — so the picture over the blurred preview is recognisably the chart behind
 * it, and not a different diagram. The site glows: a soft indigo halo that breathes
 * gently, the way the live figure marks the site used most recently.
 *
 * Behind it sits the same wash the onboarding artwork carries — one blurred
 * gradient blob — in the brand's purple: pale lavender on a light card, deep
 * indigo on a dark one (the class that holds it back in dark mode is the
 * onboarding's own, see src/index.css).
 */
const PARTS = [
  <circle key="head" cx="55" cy="14" r="9" />,
  <rect key="neck" x="51.5" y="20" width="7" height="7" rx="3" />,
  <path key="torso" d="M41,34 Q41,26 49,26 H61 Q69,26 69,34 V64 Q69,72 61,72 H49 Q41,72 41,64 Z" />,
  <rect key="arm-left" x="34" y="30" width="7" height="38" rx="3.5" />,
  <rect key="arm-right" x="69" y="30" width="7" height="38" rx="3.5" />,
  <rect key="leg-left" x="43" y="68" width="11" height="66" rx="5.5" />,
  <rect key="leg-right" x="56" y="68" width="11" height="66" rx="5.5" />,
];

/** The site the figure wears, in the drawing's own coordinates. */
const SITE = { x: 55, y: 48 };

export default function SiteRotationArt() {
  const { isDark } = useDoseColors();

  const line = isDark ? "rgba(255,255,255,0.28)" : "#D1D5DB";
  const dot = isDark ? "#818CF8" : "#6366F1";
  const halo = isDark ? "rgba(199,210,254,0.22)" : "rgba(67,56,202,0.16)";
  const wash = isDark
    ? "linear-gradient(135deg, #4F46E5, #7C3AED)"
    : "linear-gradient(135deg, #A5B4FC, #C4B5FD)";

  return (
    <div className="relative mx-auto h-[120px] w-[120px]" aria-hidden="true">
      <div
        className="onb-art-glow absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{ background: wash }}
      />

      <svg viewBox="0 0 120 120" className="relative h-full w-full" fill="none">
        <defs>
          <radialGradient id="rotSiteGlow">
            <stop offset="0%" stopColor={dot} stopOpacity="0.5" />
            <stop offset="100%" stopColor={dot} stopOpacity="0" />
          </radialGradient>
        </defs>

        <g transform="translate(16 4) scale(0.8)">
          <g fill="none" stroke={line} strokeWidth="1.8" strokeLinejoin="round">
            {PARTS}
          </g>

          {/* The site: a soft glow that breathes, its halo, and the dot itself. */}
          <circle cx={SITE.x} cy={SITE.y} r="22" fill="url(#rotSiteGlow)" className="animate-pulse" />
          <circle cx={SITE.x} cy={SITE.y} r="11" fill={halo} />
          <circle cx={SITE.x} cy={SITE.y} r="6.5" fill={dot} />
        </g>
      </svg>
    </div>
  );
}