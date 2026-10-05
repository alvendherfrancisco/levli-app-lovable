import React from "react";
import { DROPLET_PATH as DROPLET } from "@/lib/levliMark";

/**
 * The droplet outline: a soft point at the top, a round base — the widest part
 * sits just above the base, where the face goes. The path comes from
 * src/lib/levliMark.js, the one description of the artwork, so the animated
 * splash mascot and the static sign-in mark can never drift apart.
 */

/**
 * The Levli mascot as vector shapes: a smiling indigo droplet with a lighter
 * highlight down its left side. Its parts carry the class names the splash
 * stylesheet animates (--sp-*) — the drop, its base ring, the eyes and smile.
 */
export default function SplashDroplet() {
  return (
    <svg className="splash__svg" viewBox="0 0 64 104" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="splashDropFill" x1="10" y1="2" x2="58" y2="96" gradientUnits="userSpaceOnUse">
          <stop className="sp-stop-light" offset="0%" />
          <stop className="sp-stop-mid" offset="52%" />
          <stop className="sp-stop-deep" offset="100%" />
        </linearGradient>
        <clipPath id="splashDropClip">
          <path d={DROPLET} />
        </clipPath>
      </defs>

      {/* The ring that expands from under the droplet, behind it. */}
      <ellipse className="sp-ripple" cx="32" cy="92" rx="29" ry="5" />

      <g className="sp-drop">
        <g className="sp-bob">
          <path d={DROPLET} fill="url(#splashDropFill)" />
          <g clipPath="url(#splashDropClip)">
            <ellipse className="sp-gloss" cx="21" cy="38" rx="8.5" ry="15.5" transform="rotate(-18 21 38)" />
            <circle className="sp-glint" cx="18" cy="26" r="2.6" />
          </g>
          <g className="sp-face">
            <ellipse className="sp-eye" cx="23" cy="58" rx="4.2" ry="5.2" />
            <ellipse className="sp-eye" cx="41" cy="58" rx="4.2" ry="5.2" />
            <path className="sp-smile" d="M21 67.5 Q32 77.5 43 67.5" />
          </g>
        </g>
      </g>
    </svg>
  );
}