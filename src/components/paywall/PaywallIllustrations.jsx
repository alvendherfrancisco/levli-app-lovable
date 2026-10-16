import React from "react";
import { Scene } from "@/components/onboarding/OnboardingIllustrations";

/**
 * The three illustrations the Premium screen shows, one per feature.
 *
 * They are drawn through the onboarding's own scene wrapper — the same 280 × 200
 * slot, the same soft wash behind the artwork (which holds itself back on a dark
 * page), the same white cards with a gradient header, the same dashed lines and
 * the same twinkling sparkles — so the Premium screen reads as the step after the
 * onboarding rather than a screen of its own: a report ready to share, the body
 * figure with the sites already used, and the charts and photo that come with it.
 *
 * Every colour is from the onboarding palette, and each scene's gradient ids are
 * its own, so two of them on one screen can never share a fill.
 */

/** The report that goes to the doctor: a page, a chart, and the way it is sent. */
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

/** Where the doses have gone: the app's own body figure, with its sites marked. */
export function SitesIllustration() {
  return (
    <Scene blobStyle={{ background: "linear-gradient(135deg, #5EEAD4, #93C5FD)" }}>
      <defs>
        <linearGradient id="premSitTint" x1="104" y1="42" x2="176" y2="160" gradientUnits="userSpaceOnUse">
          <stop stopColor="#EEF2FF" /><stop offset="1" stopColor="#E0F2FE" />
        </linearGradient>
      </defs>

      {/* The card the figure sits in */}
      <rect x="98" y="36" width="84" height="130" rx="18" fill="white" stroke="#E5E7EB" strokeWidth="1.5" />
      <rect x="104" y="42" width="72" height="118" rx="14" fill="url(#premSitTint)" />

      {/* The figure — the same geometry the shot form and the rotation card draw */}
      <g transform="translate(93.1 41.7) scale(0.853)" fill="#CBCFF0">
        <circle cx="55" cy="14" r="9" />
        <rect x="51.5" y="20" width="7" height="7" rx="3" />
        <path d="M41,34 Q41,26 49,26 H61 Q69,26 69,34 V64 Q69,72 61,72 H49 Q41,72 41,64 Z" />
        <rect x="34" y="30" width="7" height="38" rx="3.5" />
        <rect x="69" y="30" width="7" height="38" rx="3.5" />
        <rect x="43" y="68" width="11" height="66" rx="5.5" />
        <rect x="56" y="68" width="11" height="66" rx="5.5" />
      </g>

      {/* The sites already used, the latest one lit */}
      <circle cx="140" cy="83" r="10" fill="#6366F1" fillOpacity="0.16" />
      <circle cx="140" cy="83" r="5" fill="#6366F1" />
      <circle cx="155" cy="81" r="4.5" fill="#818CF8" />
      <circle cx="135" cy="123" r="4.5" fill="#818CF8" />

      {/* Round the sites, one after the next */}
      <path
        d="M100 32 Q 140 10 190 40"
        stroke="#818CF8" strokeWidth="2" strokeDasharray="4 6" strokeLinecap="round" fill="none"
      />
      <path
        d="M182 33 L191 41 L183 48"
        stroke="#818CF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"
      />

      <g className="animate-onb-sparkle"><path d="M62 140 L 64 145 L 69 147 L 64 149 L 62 154 L 60 149 L 55 147 L 60 145Z" fill="#EC4899" /></g>
      <g className="animate-onb-sparkle" style={{ animationDelay: "0.7s" }}><path d="M222 108 L 224 113 L 229 115 L 224 117 L 222 122 L 220 117 L 215 115 L 220 113Z" fill="#14B8A6" /></g>
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