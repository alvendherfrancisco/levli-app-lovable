import React from "react";
import { useIsDarkTheme } from "@/components/report/ReportTheme";

/**
 * The illustration the report's lock shows: the report itself, small, with the
 * way it is sent on (the page with a gradient header, a chart line, and an upload
 * arrow beside it).
 *
 * It is drawn in the onboarding's own manner — a card, soft line art, two
 * twinkling sparkles — over the same wash the other lock illustrations carry
 * (see src/components/shots/SiteRotationArt.jsx): one blurred purple blob behind
 * the artwork, pale lavender on a light card and deep indigo on a dark one. The
 * page and its lines follow the app's own theme, so the picture reads on the
 * white card in light mode and on the dark one.
 */
export default function ReportArt({ size = 120 }) {
  const isDark = useIsDarkTheme();

  const page = isDark ? "#1E2130" : "#FFFFFF";
  const line = isDark ? "rgba(255,255,255,0.22)" : "#E5E7EB";
  const wash = isDark
    ? "linear-gradient(135deg, #4F46E5, #7C3AED)"
    : "linear-gradient(135deg, #A5B4FC, #C4B5FD)";

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }} aria-hidden="true">
      <div
        className="onb-art-glow absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{ background: wash, width: Math.round(size * 1.2), height: Math.round(size * 1.2) }}
      />

      <svg viewBox="0 0 120 120" className="relative h-full w-full" fill="none">
        <defs>
          <linearGradient id="repArtHead" x1="24" y1="22" x2="90" y2="46" gradientUnits="userSpaceOnUse">
            <stop stopColor="#6366F1" /><stop offset="1" stopColor="#8B5CF6" />
          </linearGradient>
          <linearGradient id="repArtChart" x1="32" y1="74" x2="76" y2="56" gradientUnits="userSpaceOnUse">
            <stop stopColor="#8B5CF6" /><stop offset="1" stopColor="#6366F1" />
          </linearGradient>
          <linearGradient id="repArtSend" x1="72" y1="70" x2="104" y2="102" gradientUnits="userSpaceOnUse">
            <stop stopColor="#8B5CF6" /><stop offset="1" stopColor="#6366F1" />
          </linearGradient>
        </defs>

        {/* The page, with the header band it goes out under. */}
        <rect x="24" y="22" width="66" height="70" rx="11" fill={page} stroke={line} strokeWidth="1.5" />
        <rect x="24" y="22" width="66" height="19" rx="11" fill="url(#repArtHead)" />
        <rect x="24" y="32" width="66" height="9" fill="url(#repArtHead)" />
        <line x1="32" y1="33" x2="52" y2="33" stroke="white" strokeWidth="2.6" strokeLinecap="round" opacity="0.75" />

        {/* What it says, and the one chart it carries. */}
        <line x1="32" y1="50" x2="66" y2="50" stroke={line} strokeWidth="3" strokeLinecap="round" />
        <line x1="32" y1="58" x2="54" y2="58" stroke={line} strokeWidth="3" strokeLinecap="round" />
        <line x1="32" y1="82" x2="82" y2="82" stroke={line} strokeWidth="1.2" />
        <path
          d="M32 73 L46 66 L60 70 L76 58"
          stroke="url(#repArtChart)"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="32" cy="73" r="2.2" fill="#8B5CF6" />
        <circle cx="46" cy="66" r="2.2" fill="#8B5CF6" />
        <circle cx="60" cy="70" r="2.2" fill="#8B5CF6" />
        <circle cx="76" cy="58" r="2.8" fill="#6366F1" />

        {/* On its way, over the corner. */}
        <circle cx="88" cy="86" r="16" fill="url(#repArtSend)" />
        <path
          d="M88 79 V94 M81 86 L88 79 L95 86"
          stroke="white"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <g className="animate-lock-sparkle">
          <path d="M22 46 L 24 51 L 29 53 L 24 55 L 22 60 L 20 55 L 15 53 L 20 51Z" fill="#F59E0B" />
        </g>
        <g className="animate-lock-sparkle" style={{ animationDelay: "0.9s" }}>
          <path d="M100 42 L 102 47 L 107 49 L 102 51 L 100 56 L 98 51 L 93 49 L 98 47Z" fill="#6366F1" />
        </g>
      </svg>
    </div>
  );
}