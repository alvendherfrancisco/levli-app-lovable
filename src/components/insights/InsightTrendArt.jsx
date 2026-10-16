import React, { useId } from "react";
import useDoseColors from "@/hooks/useDoseColors";

/**
 * The illustration an Insights lock shows: what the screen is about, small — the
 * dashboard itself, in detail.
 *
 * It is drawn in the same language as the onboarding scenes and the Premium
 * screen's four slides (see src/components/onboarding/OnboardingIllustrations.jsx
 * and src/components/paywall/PaywallIllustrations.jsx): one rounded card lifted off
 * the wash behind it by the same soft indigo shadow, the brand's own solid fills —
 * indigo and violet for the trend, teal for what is logged, amber and orange for
 * what it adds up to, the sunset gradient for a photo — the same rounded chips and
 * hairlines, and the same twinkling sparkles. What reads on those screens reads
 * here, and the lock looks like a later step of the flow rather than a picture of
 * its own.
 *
 * The composition, from the back: the panel, with the two chips that name the
 * figures, the fine grid, the axis and its ticks, the trend line with its soft wash
 * under it and a lit point at its end, and a value chip floating over it with the
 * one marker on it; the photo tile over the panel's top corner; the small bar tile
 * over its foot; and the ring badge beside it, part-drawn. Nothing is boxed in: the
 * card is part of the drawing, not a frame around it, and behind the whole thing is
 * the same blurred blob of lavender and violet every other lock illustration
 * carries (indigo and violet on the dark card), faded to nothing on every side so
 * it has no edge to be seen.
 *
 * It is drawn in the lock's own square slot rather than the onboarding's 280 × 200
 * scene, because the lock group seats its artwork at a fixed 150px and the headline
 * under it must not move. `size` is that box: the drawing scales into it and the
 * glow behind it scales with it, so the picture is the same size in the group
 * wherever it is shown.
 *
 * Every surface follows the app's own theme — the card, the tiles, the hairlines and
 * the grid are light on the white card and dark on the dark one — while the brand's
 * fills stay the brand's fills in both, so the picture is read the same way in either
 * mode. Each gradient and filter is named with this instance's own id, so two of
 * these on one screen can never share a fill. Nothing on it is the person's own data:
 * it is a drawing of a dashboard, not a dashboard.
 */
export default function InsightTrendArt({ size = 120 }) {
  const { isDark } = useDoseColors();
  // One id per mounted illustration, so the gradients and the shadow below are its own.
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");

  const card = isDark ? "#242842" : "#FFFFFF";
  const shadow = isDark ? "rgba(0,0,0,0.5)" : "rgba(79,70,229,0.20)";
  const hairline = isDark ? "rgba(255,255,255,0.12)" : "#E8EAF0";
  const grid = isDark ? "rgba(255,255,255,0.10)" : "#EEF2FF";
  const chipIndigo = isDark ? "rgba(129,140,248,0.35)" : "#E0E7FF";
  const chipFaint = isDark ? "rgba(255,255,255,0.12)" : "#EEF2FF";
  const teal = isDark ? "#5EEAD4" : "#14B8A6";
  const arrow = isDark ? "#A5B4FC" : "#4F46E5";
  const halo = isDark ? "rgba(129,140,248,0.35)" : "rgba(79,70,229,0.18)";

  const shadowId = `insArtShadow${uid}`;
  const lineId = `insArtLine${uid}`;
  const areaId = `insArtArea${uid}`;
  const photoId = `insArtPhoto${uid}`;

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }} aria-hidden="true">
      <div
        className="onb-art-glow absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{
          width: Math.round(size * 1.2),
          height: Math.round(size * 1.2),
          background: isDark
            ? "linear-gradient(135deg, #4F46E5, #7C3AED)"
            : "linear-gradient(135deg, #A5B4FC, #C4B5FD)",
        }}
      />

      <svg viewBox="0 0 120 120" className="relative h-full w-full" fill="none">
        <defs>
          <filter id={shadowId} x="-25%" y="-25%" width="150%" height="160%">
            <feDropShadow dx="0" dy="5" stdDeviation="6" floodColor={shadow} />
          </filter>
          <linearGradient id={lineId} x1="18" y1="80" x2="70" y2="50" gradientUnits="userSpaceOnUse">
            <stop stopColor="#6366F1" /><stop offset="1" stopColor="#8B5CF6" />
          </linearGradient>
          <linearGradient id={areaId} x1="0" y1="48" x2="0" y2="90" gradientUnits="userSpaceOnUse">
            <stop stopColor="#8B5CF6" stopOpacity="0.42" /><stop offset="1" stopColor="#8B5CF6" stopOpacity="0.03" />
          </linearGradient>
          <linearGradient id={photoId} x1="80" y1="14" x2="112" y2="36" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F97316" /><stop offset="1" stopColor="#EC4899" />
          </linearGradient>
        </defs>

        {/* The panel, and the two chips that name what it shows. */}
        <rect x="10" y="20" width="72" height="80" rx="15" fill={card} filter={`url(#${shadowId})`} />
        <rect x="18" y="29" width="22" height="7" rx="3.5" fill={chipIndigo} />
        <rect x="44" y="29" width="18" height="7" rx="3.5" fill={teal} />
        <rect x="13.5" y="52" width="3.5" height="1.6" rx="0.8" fill={grid} />
        <rect x="13.5" y="63" width="3.5" height="1.6" rx="0.8" fill={grid} />
        <rect x="13.5" y="74" width="3.5" height="1.6" rx="0.8" fill={grid} />

        {/* The chart's own furniture: the grid, the axis, and a tick under each day. */}
        <path
          d="M20 52 H76 M20 63 H76 M20 74 H76"
          stroke={grid} strokeWidth="1" strokeDasharray="1.5 3"
        />
        <path d="M18 88 H78" stroke={hairline} strokeWidth="1.2" />
        <path
          d="M18 88 V91.5 M31 88 V91.5 M44 88 V91.5 M57 88 V91.5 M70 88 V91.5"
          stroke={grid} strokeWidth="1.2"
        />

        {/* The trend itself, with the wash under the line and the day in hand lit. */}
        <path d="M18 80 L31 70 L44 74 L57 58 L70 50 L70 88 L18 88 Z" fill={`url(#${areaId})`} />
        <path
          d="M18 80 L31 70 L44 74 L57 58 L70 50"
          stroke={`url(#${lineId})`} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
        />
        <circle cx="18" cy="80" r="2.2" fill="#6366F1" />
        <circle cx="31" cy="70" r="2.2" fill="#6366F1" />
        <circle cx="44" cy="74" r="2.2" fill="#6366F1" />
        <circle cx="57" cy="58" r="2.2" fill="#6366F1" />
        <circle cx="70" cy="50" r="6.2" fill="none" stroke={halo} strokeWidth="2" />
        <circle cx="70" cy="50" r="3.6" fill="#4F46E5" />
        <circle cx="70" cy="50" r="1.3" fill="white" />

        {/* What that day read, floating over the line and pointing at it. */}
        <rect x="28" y="39" width="34" height="14" rx="7" fill={card} filter={`url(#${shadowId})`} />
        <rect x="33" y="43.5" width="13" height="3" rx="1.5" fill="#4F46E5" />
        <rect x="33" y="48" width="8" height="2" rx="1" fill={chipFaint} />
        <path
          d="M53 45 L56.5 48.5 L60 45"
          stroke={teal} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
        />
        <path d="M57 53 V56" stroke={hairline} strokeWidth="1" strokeDasharray="1 1.5" />

        {/* The photo that goes with the numbers, over the panel's top corner. */}
        <rect x="76" y="10" width="40" height="30" rx="11" fill={card} filter={`url(#${shadowId})`} />
        <rect x="80" y="14" width="32" height="22" rx="7" fill={`url(#${photoId})`} />
        <circle cx="92" cy="21" r="2.8" fill="white" fillOpacity="0.95" />
        <path d="M82 36 L92 24 L102 36 Z" fill="white" fillOpacity="0.92" />
        <path d="M98 36 L104 29 L110 36 Z" fill="white" fillOpacity="0.55" />

        {/* What the week added up to, over the panel's foot. */}
        <rect x="4" y="78" width="46" height="34" rx="13" fill={card} filter={`url(#${shadowId})`} />
        <rect x="12" y="85" width="16" height="3" rx="1.5" fill={chipFaint} />
        <rect x="12" y="97" width="7" height="9" rx="3.5" fill="#6366F1" />
        <rect x="22" y="92" width="7" height="14" rx="3.5" fill="#8B5CF6" />
        <rect x="32" y="88" width="7" height="18" rx="3.5" fill="#F59E0B" />
        <circle cx="44" cy="100" r="3.2" fill={teal} />

        {/* And how far along it is, part-drawn. */}
        <circle cx="92" cy="94" r="15.5" fill={card} filter={`url(#${shadowId})`} />
        <circle cx="92" cy="94" r="8.5" fill="none" stroke={grid} strokeWidth="3.2" />
        <circle
          cx="92" cy="94" r="8.5" fill="none" stroke={teal} strokeWidth="3.2" strokeLinecap="round"
          strokeDasharray="38.5 53.4" transform="rotate(-90 92 94)"
        />
        <path
          d="M92 89.5 V98 M88.8 94.8 L92 98 L95.2 94.8"
          stroke={arrow} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
        />

        {/* The sparkles, drifting very slowly — and sitting still with reduced
            motion (see .animate-lock-sparkle in src/index.css). */}
        <g className="animate-lock-sparkle">
          <path d="M9 2 L11 8 L17 10 L11 12 L9 18 L7 12 L1 10 L7 8Z" fill="#F59E0B" />
        </g>
        <g className="animate-lock-sparkle" style={{ animationDelay: "3.5s" }}>
          <path d="M108 50 L110 56 L116 58 L110 60 L108 66 L106 60 L100 58 L106 56Z" fill="#6366F1" />
        </g>
        <g className="animate-lock-sparkle" style={{ animationDelay: "1.8s" }}>
          <path d="M68 99 L69.6 103.4 L74 105 L69.6 106.6 L68 111 L66.4 106.6 L62 105 L66.4 103.4Z" fill="#14B8A6" />
        </g>
      </svg>
    </div>
  );
}