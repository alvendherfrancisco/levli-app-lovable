import React, { useId } from "react";
import { DROPLET_PATH, DROPLET_RATIO, DROPLET_COLORS, DROPLET_COLORS_DARK } from "@/lib/levliMark";
import useLiveDarkTheme from "@/hooks/useLiveDarkTheme";

/**
 * The Levli droplet mark, drawn as vector shapes — the same mascot the launch
 * splash shows: an indigo gradient with a lighter left side, a soft highlight
 * inside it, and a white face.
 *
 * The viewBox is the artwork's own proportions (64 × 104), so the shape is never
 * cropped or squashed. `size` is its height in px; the width follows from the
 * artwork's ratio, and no container here has a fixed height or hidden overflow.
 *
 * There is no entrance animation: the mark is complete the moment it renders,
 * which is what the sign-in screens want. The splash has its own animated copy
 * of the same artwork (src/components/splash/SplashDroplet.jsx).
 *
 * `lighterOnDark` is for the screens that follow the device's light/dark setting
 * (see src/components/auth/AuthScreen.jsx): on their dark surface the mark is
 * drawn from the lifted palette, so it keeps its shape instead of sinking into
 * the background. Everywhere else the mark is the brand gradient in both modes,
 * exactly as it has always been.
 */
export default function LevliLogo({ size = 80, className = "", lighterOnDark = false }) {
  // One gradient and one clip per instance, so two marks on the same screen
  // never share (or lose) each other's fills.
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const gradientId = `levliDropFill${uid}`;
  const clipId = `levliDropClip${uid}`;
  const dark = useLiveDarkTheme();
  const palette = lighterOnDark && dark ? DROPLET_COLORS_DARK : DROPLET_COLORS;

  return (
    <svg
      viewBox="0 0 64 104"
      width={Math.round(size * DROPLET_RATIO)}
      height={size}
      role="img"
      aria-label="Levli"
      className={className}
      style={{ display: "block", flexShrink: 0 }}
    >
      <defs>
        <linearGradient id={gradientId} x1="10" y1="2" x2="58" y2="96" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={palette.light} />
          <stop offset="52%" stopColor={palette.mid} />
          <stop offset="100%" stopColor={palette.deep} />
        </linearGradient>
        <clipPath id={clipId}>
          <path d={DROPLET_PATH} />
        </clipPath>
      </defs>

      <path d={DROPLET_PATH} fill={`url(#${gradientId})`} />

      {/* The lighter left side, kept inside the droplet's own outline. */}
      <g clipPath={`url(#${clipId})`}>
        <ellipse cx="21" cy="38" rx="8.5" ry="15.5" transform="rotate(-18 21 38)" fill={palette.face} fillOpacity="0.18" />
        <circle cx="18" cy="26" r="2.6" fill={palette.face} fillOpacity="0.45" />
      </g>

      <ellipse cx="23" cy="58" rx="4.2" ry="5.2" fill={palette.face} />
      <ellipse cx="41" cy="58" rx="4.2" ry="5.2" fill={palette.face} />
      <path
        d="M21 67.5 Q32 77.5 43 67.5"
        fill="none"
        stroke={palette.face}
        strokeWidth="3.4"
        strokeLinecap="round"
      />
    </svg>
  );
}