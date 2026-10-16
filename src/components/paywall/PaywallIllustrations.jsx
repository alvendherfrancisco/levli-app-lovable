import React from "react";
import { Scene } from "@/components/onboarding/OnboardingIllustrations";

/**
 * The four illustrations the Premium screen shows, one per benefit.
 *
 * They are drawn through the onboarding's own scene wrapper — the same 280 × 200
 * slot and the same soft wash behind the artwork, which holds itself back on a dark
 * page — so the Premium screen reads as the step after the onboarding rather than a
 * screen of its own.
 *
 * One card, one size, one light: all four are the same white card in the same place
 * (56,40 – 224,160), lifted off the wash by the same soft indigo shadow, so the
 * picture sits identically on every slide and the plans under the track never move
 * as the slides change. On the card is the benefit itself, in the brand's own solid
 * fills — indigo and violet for the trend, teal for what has been logged, amber and
 * orange for what it adds up to — so each slide is read at a glance rather than
 * worked out.
 *
 * The sparkles are the flow's own, and like every glow in the app they hold still
 * with "Reduce Motion" (see src/index.css). Each scene's gradient and filter ids are
 * its own, so two of them on one screen can never share a fill.
 */

/** The card every scene is drawn on, with the one shadow they all cast. */
function Card({ shadowId }) {
  return (
    <rect x="56" y="40" width="168" height="120" rx="20" fill="white" filter={`url(#${shadowId})`} />
  );
}

/** Nothing capped: what is already logged, the dose itself, and room for one more. */
export function ShotLimitIllustration() {
  return (
    <Scene blobStyle={{ background: "linear-gradient(135deg, #818CF8, #C4B5FD)" }}>
      <defs>
        <filter id="premShotShadow" x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="7" stdDeviation="8" floodColor="#4F46E5" floodOpacity="0.2" />
        </filter>
        <linearGradient id="premShotSyr" x1="0" y1="0" x2="112" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366F1" /><stop offset="1" stopColor="#8B5CF6" />
        </linearGradient>
        <linearGradient id="premShotAdd" x1="186" y1="126" x2="214" y2="154" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8B5CF6" /><stop offset="1" stopColor="#6366F1" />
        </linearGradient>
      </defs>

      <Card shadowId="premShotShadow" />

      {/* What is already in the log: one dose, and the one before it. */}
      <rect x="72" y="57" width="54" height="13" rx="6.5" fill="#14B8A6" />
      <rect x="132" y="57" width="34" height="13" rx="6.5" fill="#A5B4FC" />

      {/* The dose itself, full, across the card. */}
      <g transform="translate(72 92) rotate(-20 66 11)">
        <rect x="-10" y="-5" width="10" height="34" rx="3" fill="#8B5CF6" />
        <rect x="0" y="0" width="112" height="24" rx="7" fill="url(#premShotSyr)" />
        <rect x="112" y="3" width="9" height="18" fill="#6366F1" />
        <rect x="121" y="9" width="26" height="6" rx="3" fill="#C4B5FD" />
        <line x1="24" y1="0" x2="24" y2="24" stroke="white" strokeWidth="1.2" strokeOpacity="0.6" />
        <line x1="48" y1="0" x2="48" y2="24" stroke="white" strokeWidth="1.2" strokeOpacity="0.6" />
        <line x1="72" y1="0" x2="72" y2="24" stroke="white" strokeWidth="1.2" strokeOpacity="0.6" />
        <line x1="96" y1="0" x2="96" y2="24" stroke="white" strokeWidth="1.2" strokeOpacity="0.6" />
      </g>

      {/* One more, whenever it is due. */}
      <circle cx="198" cy="138" r="16" fill="url(#premShotAdd)" />
      <path d="M198 131 V145 M191 138 H205" stroke="white" strokeWidth="3" strokeLinecap="round" />

      <g className="animate-onb-sparkle"><path d="M44 70 L 46 75 L 51 77 L 46 79 L 44 84 L 42 79 L 37 77 L 42 75Z" fill="#F59E0B" /></g>
      <g className="animate-onb-sparkle" style={{ animationDelay: "0.9s" }}><path d="M240 112 L 242 117 L 247 119 L 242 121 L 240 126 L 238 121 L 233 119 L 238 117Z" fill="#6366F1" /></g>
    </Scene>
  );
}

/** What the trends look like: the figures, the trend, and the photo beside them. */
export function InsightsIllustration() {
  return (
    <Scene blobStyle={{ background: "linear-gradient(135deg, #818CF8, #A78BFA)" }}>
      <defs>
        <filter id="premInsShadow" x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="7" stdDeviation="8" floodColor="#4F46E5" floodOpacity="0.2" />
        </filter>
        <linearGradient id="premInsLine" x1="72" y1="118" x2="200" y2="76" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366F1" /><stop offset="1" stopColor="#8B5CF6" />
        </linearGradient>
        <linearGradient id="premInsArea" x1="72" y1="72" x2="72" y2="136" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8B5CF6" stopOpacity="0.55" /><stop offset="1" stopColor="#8B5CF6" stopOpacity="0.06" />
        </linearGradient>
        <linearGradient id="premInsPhoto" x1="200" y1="30" x2="246" y2="64" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F97316" /><stop offset="1" stopColor="#EC4899" />
        </linearGradient>
      </defs>

      <Card shadowId="premInsShadow" />

      {/* The figures the screen is about. */}
      <rect x="72" y="57" width="42" height="13" rx="6.5" fill="#E0E7FF" />
      <rect x="122" y="57" width="30" height="13" rx="6.5" fill="#14B8A6" />
      <rect x="160" y="57" width="24" height="13" rx="6.5" fill="#F59E0B" />

      {/* The trend itself, filled under the line. */}
      <line x1="72" y1="136" x2="200" y2="136" stroke="#E0E7FF" strokeWidth="1.5" />
      <path d="M72 118 L104 104 L136 110 L168 88 L200 76 L200 136 L72 136 Z" fill="url(#premInsArea)" />
      <path
        d="M72 118 L104 104 L136 110 L168 88 L200 76"
        stroke="url(#premInsLine)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" fill="none"
      />
      <circle cx="72" cy="118" r="3.4" fill="#6366F1" />
      <circle cx="104" cy="104" r="3.4" fill="#6366F1" />
      <circle cx="136" cy="110" r="3.4" fill="#6366F1" />
      <circle cx="168" cy="88" r="3.4" fill="#6366F1" />
      <circle cx="200" cy="76" r="5" fill="#4F46E5" />

      {/* The photo that goes with the numbers, over the card's corner. */}
      <rect x="194" y="24" width="58" height="46" rx="14" fill="white" filter="url(#premInsShadow)" />
      <rect x="200" y="30" width="46" height="34" rx="10" fill="url(#premInsPhoto)" />
      <circle cx="216" cy="42" r="4" fill="white" fillOpacity="0.92" />
      <path d="M204 64 L218 48 L232 64 Z" fill="white" fillOpacity="0.9" />

      <g className="animate-onb-sparkle"><path d="M44 104 L 46 109 L 51 111 L 46 113 L 44 118 L 42 113 L 37 111 L 42 109Z" fill="#F59E0B" /></g>
      <g className="animate-onb-sparkle" style={{ animationDelay: "1.1s" }}><path d="M244 140 L 246 145 L 251 147 L 246 149 L 244 154 L 242 149 L 237 147 L 242 145Z" fill="#6366F1" /></g>
    </Scene>
  );
}

/** Everything kept: the timeline of entries, newest at the foot. */
export function HistoryIllustration() {
  return (
    <Scene blobStyle={{ background: "linear-gradient(135deg, #818CF8, #93C5FD)" }}>
      <defs>
        <filter id="premHisShadow" x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="7" stdDeviation="8" floodColor="#4F46E5" floodOpacity="0.2" />
        </filter>
        <linearGradient id="premHisDot" x1="82" y1="62" x2="94" y2="74" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366F1" /><stop offset="1" stopColor="#8B5CF6" />
        </linearGradient>
        <linearGradient id="premHisClock" x1="182" y1="122" x2="214" y2="154" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5EEAD4" /><stop offset="1" stopColor="#14B8A6" />
        </linearGradient>
      </defs>

      <Card shadowId="premHisShadow" />

      {/* The timeline, with an entry on every day it happened. */}
      <line x1="88" y1="66" x2="88" y2="130" stroke="#E0E7FF" strokeWidth="3" strokeLinecap="round" />
      {[68, 98, 128].map((y) => (
        <g key={y}>
          <circle cx="88" cy={y} r="8" fill="white" />
          <circle cx="88" cy={y} r="6" fill="url(#premHisDot)" />
        </g>
      ))}
      {[68, 98, 128].map((y, i) => (
        <g key={y}>
          <rect x="106" y={y - 8} width="72" height="7" rx="3.5" fill={i === 2 ? "#818CF8" : "#E0E7FF"} />
          <rect x="106" y={y + 3} width="52" height="6" rx="3" fill="#EEF2FF" />
        </g>
      ))}

      {/* Kept for good. */}
      <circle cx="198" cy="138" r="16" fill="url(#premHisClock)" />
      <circle cx="198" cy="138" r="8.5" fill="none" stroke="white" strokeWidth="2.2" />
      <path d="M198 133 V138 L201.6 140.6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />

      <g className="animate-onb-sparkle"><path d="M46 110 L 48 115 L 53 117 L 48 119 L 46 124 L 44 119 L 39 117 L 44 115Z" fill="#14B8A6" /></g>
      <g className="animate-onb-sparkle" style={{ animationDelay: "0.8s" }}><path d="M240 76 L 242 81 L 247 83 L 242 85 L 240 90 L 238 85 L 233 83 L 238 81Z" fill="#F59E0B" /></g>
    </Scene>
  );
}

/** The page that goes to the doctor: the report, and the way it is sent. */
export function ReportsIllustration() {
  return (
    <Scene blobStyle={{ background: "linear-gradient(135deg, #818CF8, #5EEAD4)" }}>
      <defs>
        <filter id="premRepShadow" x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="7" stdDeviation="8" floodColor="#4F46E5" floodOpacity="0.2" />
        </filter>
        <linearGradient id="premRepHead" x1="56" y1="40" x2="224" y2="76" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366F1" /><stop offset="1" stopColor="#8B5CF6" />
        </linearGradient>
        <linearGradient id="premRepLine" x1="74" y1="92" x2="190" y2="126" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366F1" /><stop offset="1" stopColor="#14B8A6" />
        </linearGradient>
        <linearGradient id="premRepShare" x1="182" y1="122" x2="210" y2="156" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F97316" /><stop offset="1" stopColor="#EC4899" />
        </linearGradient>
      </defs>

      {/* The page, under the band it goes out with. */}
      <Card shadowId="premRepShadow" />
      <rect x="56" y="40" width="168" height="34" rx="20" fill="url(#premRepHead)" />
      <rect x="56" y="58" width="168" height="16" fill="url(#premRepHead)" />
      <rect x="74" y="54" width="56" height="7" rx="3.5" fill="white" fillOpacity="0.8" />

      {/* What it says, and the one chart it carries. */}
      <rect x="74" y="92" width="62" height="6" rx="3" fill="#E0E7FF" />
      <line x1="74" y1="138" x2="176" y2="138" stroke="#E0E7FF" strokeWidth="1.5" />
      <path
        d="M74 122 L104 116 L134 126 L164 106 L190 98"
        stroke="url(#premRepLine)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" fill="none"
      />
      <circle cx="74" cy="122" r="3.4" fill="#6366F1" />
      <circle cx="104" cy="116" r="3.4" fill="#6366F1" />
      <circle cx="134" cy="126" r="3.4" fill="#6366F1" />
      <circle cx="164" cy="106" r="3.4" fill="#14B8A6" />
      <circle cx="190" cy="98" r="5" fill="#14B8A6" />

      {/* Sent on its way. */}
      <circle cx="196" cy="140" r="16" fill="url(#premRepShare)" />
      <path
        d="M196 132 V148 M189 139 L196 132 L203 139"
        stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"
      />

      <g className="animate-onb-sparkle"><path d="M46 66 L 48 71 L 53 73 L 48 75 L 46 80 L 44 75 L 39 73 L 44 71Z" fill="#F59E0B" /></g>
      <g className="animate-onb-sparkle" style={{ animationDelay: "0.9s" }}><path d="M242 120 L 244 125 L 249 127 L 244 129 L 242 134 L 240 129 L 235 127 L 240 125Z" fill="#6366F1" /></g>
    </Scene>
  );
}