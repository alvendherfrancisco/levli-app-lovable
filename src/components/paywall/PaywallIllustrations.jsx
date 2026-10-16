import React from "react";
import { Scene } from "@/components/onboarding/OnboardingIllustrations";

/**
 * The five illustrations the Premium screen shows, one per benefit.
 *
 * They are drawn through the onboarding's own scene wrapper — the same 280 × 200
 * slot, the same soft wash behind the artwork (which holds itself back on a dark
 * page), the same white cards with a gradient header, the same line weight, the
 * same dashed lines and the same twinkling sparkles — so the Premium screen reads
 * as the step after the onboarding rather than a screen of its own.
 *
 * Every colour is from the onboarding palette, and each scene's gradient ids are
 * its own, so two of them on one screen can never share a fill.
 */

/** Nothing capped: the syringe, on the card the flow's own steps draw. */
export function ShotLimitIllustration() {
  return (
    <Scene blobStyle={{ background: "linear-gradient(135deg, #818CF8, #A5B4FC)" }}>
      <defs>
        <linearGradient id="premShotSyr" x1="80" y1="82" x2="136" y2="98" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8B5CF6" /><stop offset="1" stopColor="#6366F1" />
        </linearGradient>
      </defs>

      {/* The card */}
      <rect x="64" y="50" width="152" height="100" rx="16" fill="white" stroke="#E5E7EB" strokeWidth="1.5" />

      {/* A full syringe, lying across it */}
      <g transform="translate(23 10) rotate(-14 117 90)">
        <rect x="80" y="82" width="56" height="16" rx="4" fill="url(#premShotSyr)" />
        <rect x="74" y="78" width="8" height="24" rx="2" fill="#8B5CF6" />
        <rect x="136" y="84" width="6" height="12" fill="#6366F1" />
        <rect x="142" y="87" width="18" height="6" fill="#C4B5FD" />
        <line x1="92" y1="82" x2="92" y2="98" stroke="white" strokeWidth="1" strokeOpacity="0.6" />
        <line x1="104" y1="82" x2="104" y2="98" stroke="white" strokeWidth="1" strokeOpacity="0.6" />
        <line x1="116" y1="82" x2="116" y2="98" stroke="white" strokeWidth="1" strokeOpacity="0.6" />
      </g>

      <g className="animate-onb-sparkle"><path d="M50 72 L 52 77 L 57 79 L 52 81 L 50 86 L 48 81 L 43 79 L 48 77Z" fill="#6366F1" /></g>
      <g className="animate-onb-sparkle" style={{ animationDelay: "0.9s" }}><path d="M232 124 L 234 129 L 239 131 L 234 133 L 232 138 L 230 133 L 225 131 L 230 129Z" fill="#8B5CF6" /></g>
    </Scene>
  );
}

/** What the trends look like: the chart, and the photo beside it. */
export function InsightsIllustration() {
  return (
    <Scene blobStyle={{ background: "linear-gradient(135deg, #C4B5FD, #FBCFE8)" }}>
      <defs>
        <linearGradient id="premInsLine" x1="76" y1="88" x2="196" y2="132" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8B5CF6" /><stop offset="1" stopColor="#6366F1" />
        </linearGradient>
        <linearGradient id="premInsArea" x1="76" y1="88" x2="196" y2="138" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8B5CF6" /><stop offset="1" stopColor="#C4B5FD" />
        </linearGradient>
        <linearGradient id="premInsPhoto" x1="194" y1="40" x2="240" y2="76" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F97316" /><stop offset="1" stopColor="#EC4899" />
        </linearGradient>
      </defs>

      {/* The chart */}
      <rect x="60" y="50" width="158" height="102" rx="16" fill="white" stroke="#E5E7EB" strokeWidth="1.5" />
      <line x1="76" y1="72" x2="112" y2="72" stroke="#E5E7EB" strokeWidth="4" strokeLinecap="round" />
      <path d="M76 130 L104 116 L132 122 L160 100 L196 88 L196 138 L76 138 Z" fill="url(#premInsArea)" fillOpacity="0.2" />
      <line x1="76" y1="138" x2="196" y2="138" stroke="#E5E7EB" strokeWidth="1.5" />
      <path d="M76 130 L104 116 L132 122 L160 100 L196 88" stroke="url(#premInsLine)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="76" cy="130" r="3" fill="#8B5CF6" />
      <circle cx="104" cy="116" r="3" fill="#8B5CF6" />
      <circle cx="132" cy="122" r="3" fill="#8B5CF6" />
      <circle cx="160" cy="100" r="3" fill="#8B5CF6" />
      <circle cx="196" cy="88" r="4" fill="#6366F1" />

      {/* The photo that goes with the numbers */}
      <rect x="188" y="34" width="58" height="48" rx="12" fill="white" stroke="#E5E7EB" strokeWidth="1.5" />
      <rect x="194" y="40" width="46" height="36" rx="9" fill="url(#premInsPhoto)" />
      <circle cx="210" cy="53" r="4" fill="white" fillOpacity="0.9" />
      <path d="M198 76 L211 61 L224 76 Z" fill="white" fillOpacity="0.85" />

      <g className="animate-onb-sparkle"><path d="M44 96 L 46 101 L 51 103 L 46 105 L 44 110 L 42 105 L 37 103 L 42 101Z" fill="#F59E0B" /></g>
      <g className="animate-onb-sparkle" style={{ animationDelay: "1.1s" }}><path d="M240 132 L 242 137 L 247 139 L 242 141 L 240 146 L 238 141 L 233 139 L 238 137Z" fill="#6366F1" /></g>
    </Scene>
  );
}

/** Everything kept: a timeline of entries, and the clock beside it. */
export function HistoryIllustration() {
  return (
    <Scene blobStyle={{ background: "linear-gradient(135deg, #818CF8, #93C5FD)" }}>
      <defs>
        <linearGradient id="premHisRail" x1="104" y1="72" x2="104" y2="132" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366F1" /><stop offset="1" stopColor="#C4B5FD" />
        </linearGradient>
        <linearGradient id="premHisDot" x1="99" y1="71" x2="109" y2="81" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366F1" /><stop offset="1" stopColor="#8B5CF6" />
        </linearGradient>
        <linearGradient id="premHisClock" x1="182" y1="136" x2="212" y2="166" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366F1" /><stop offset="1" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>

      {/* The card */}
      <rect x="72" y="44" width="136" height="112" rx="16" fill="white" stroke="#E5E7EB" strokeWidth="1.5" />

      {/* The timeline */}
      <line x1="104" y1="72" x2="104" y2="132" stroke="url(#premHisRail)" strokeWidth="2" />
      {[76, 102, 128].map((y) => (
        <g key={y}>
          <circle cx="104" cy={y} r="7" fill="white" />
          <circle cx="104" cy={y} r="5" fill="url(#premHisDot)" />
        </g>
      ))}
      {[76, 102, 128].map((y) => (
        <g key={y}>
          <line x1="122" y1={y - 2} x2="182" y2={y - 2} stroke="#E5E7EB" strokeWidth="5" strokeLinecap="round" />
          <line x1="122" y1={y + 10} x2="150" y2={y + 10} stroke="#E5E7EB" strokeWidth="4" strokeLinecap="round" />
        </g>
      ))}

      {/* The clock, over the corner */}
      <circle cx="196" cy="150" r="15" fill="url(#premHisClock)" />
      <circle cx="196" cy="150" r="8" fill="none" stroke="white" strokeWidth="2" />
      <path d="M196 145.5 V150 L199.5 152.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />

      <g className="animate-onb-sparkle"><path d="M52 110 L 54 115 L 59 117 L 54 119 L 52 124 L 50 119 L 45 117 L 50 115Z" fill="#14B8A6" /></g>
      <g className="animate-onb-sparkle" style={{ animationDelay: "0.8s" }}><path d="M228 70 L 230 75 L 235 77 L 230 79 L 228 84 L 226 79 L 221 77 L 226 75Z" fill="#F59E0B" /></g>
    </Scene>
  );
}

/** The page that goes to the doctor: a report, and the way it is sent. */
export function ReportsIllustration() {
  return (
    <Scene blobStyle={{ background: "linear-gradient(135deg, #818CF8, #5EEAD4)" }}>
      <defs>
        <linearGradient id="premRepHead" x1="70" y1="46" x2="210" y2="90" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366F1" /><stop offset="1" stopColor="#14B8A6" />
        </linearGradient>
        <linearGradient id="premRepLine" x1="88" y1="98" x2="186" y2="132" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366F1" /><stop offset="1" stopColor="#14B8A6" />
        </linearGradient>
        <linearGradient id="premRepShare" x1="182" y1="136" x2="212" y2="166" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F97316" /><stop offset="1" stopColor="#EC4899" />
        </linearGradient>
      </defs>

      {/* The page */}
      <rect x="68" y="46" width="144" height="110" rx="16" fill="white" stroke="#E5E7EB" strokeWidth="1.5" />
      <rect x="68" y="46" width="144" height="28" rx="16" fill="url(#premRepHead)" />
      <rect x="68" y="60" width="144" height="14" fill="url(#premRepHead)" />
      <line x1="84" y1="60" x2="126" y2="60" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.7" />

      {/* What the report says, in two quiet lines and a chart */}
      <line x1="84" y1="88" x2="142" y2="88" stroke="#E5E7EB" strokeWidth="4" strokeLinecap="round" />
      <line x1="84" y1="138" x2="196" y2="138" stroke="#E5E7EB" strokeWidth="1.5" />
      <path d="M88 98 L120 106 L152 114 L184 130" stroke="url(#premRepLine)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="88" cy="98" r="3.5" fill="#6366F1" />
      <circle cx="120" cy="106" r="3.5" fill="#6366F1" />
      <circle cx="152" cy="114" r="3.5" fill="#818CF8" />
      <circle cx="184" cy="130" r="8" fill="#14B8A6" fillOpacity="0.18" />
      <circle cx="184" cy="130" r="4" fill="#14B8A6" />

      {/* Sent on its way */}
      <circle cx="196" cy="150" r="15" fill="url(#premRepShare)" />
      <path
        d="M196 143 V157 M190 149 L196 143 L202 149"
        stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"
      />

      <g className="animate-onb-sparkle"><path d="M50 62 L 52 67 L 57 69 L 52 71 L 50 76 L 48 71 L 43 69 L 48 67Z" fill="#F59E0B" /></g>
      <g className="animate-onb-sparkle" style={{ animationDelay: "0.9s" }}><path d="M232 96 L 234 101 L 239 103 L 234 105 L 232 110 L 230 105 L 225 103 L 230 101Z" fill="#6366F1" /></g>
    </Scene>
  );
}

/** A clean screen: the app's own droplet on a card with nothing else on it. */
export function CleanIllustration() {
  return (
    <Scene blobStyle={{ background: "linear-gradient(135deg, #93C5FD, #C4B5FD)" }}>
      <defs>
        <linearGradient id="premCleanDrop" x1="95" y1="40" x2="185" y2="180" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366F1" /><stop offset="1" stopColor="#14B8A6" />
        </linearGradient>
      </defs>

      {/* The card */}
      <rect x="76" y="46" width="128" height="108" rx="16" fill="white" stroke="#E5E7EB" strokeWidth="1.5" />

      {/* The droplet, and nothing around it */}
      <g transform="translate(54 32.5) scale(0.614)">
        <path d="M140 40 C 140 40, 95 95, 95 135 a45 45 0 0 0 90 0 C 185 95, 140 40, 140 40Z" fill="url(#premCleanDrop)" />
        <path d="M140 65 C 140 65, 112 105, 112 132 a28 28 0 0 0 28 28" fill="white" fillOpacity="0.15" />
        <circle cx="126" cy="125" r="4" fill="white" />
        <circle cx="154" cy="125" r="4" fill="white" />
        <path d="M128 140 Q 140 150 152 140" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" />
      </g>

      <g className="animate-onb-sparkle"><path d="M58 64 L 60 69 L 65 71 L 60 73 L 58 78 L 56 73 L 51 71 L 56 69Z" fill="#F59E0B" /></g>
      <g className="animate-onb-sparkle" style={{ animationDelay: "0.7s" }}><path d="M224 60 L 226 65 L 231 67 L 226 69 L 224 74 L 222 69 L 217 67 L 222 65Z" fill="#6366F1" /></g>
      <g className="animate-onb-sparkle" style={{ animationDelay: "1.3s" }}><path d="M214 136 L 216 141 L 221 143 L 216 145 L 214 150 L 212 145 L 207 143 L 212 141Z" fill="#EC4899" /></g>
    </Scene>
  );
}