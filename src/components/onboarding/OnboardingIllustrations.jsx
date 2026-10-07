import React from "react";
import IllustrationSlot from "@/components/onboarding/IllustrationSlot";

/**
 * Custom onboarding illustrations — soft gradient blobs + simple line art.
 * Each illustration is a composed scene, not a screenshot of the app.
 *
 * Every one of them is drawn inside the shared slot (see IllustrationSlot.jsx),
 * so they are all the same size on the same slot, with the same glow and the
 * same gap to the title — no page sizes its own artwork. Each scene is a
 * 280×200 drawing that fills the slot.
 */

// ── 1. Welcome — droplet mascot with heart ─────────────────────────────────
export function WelcomeIllustration() {
  return (
    <IllustrationSlot tone={{ background: "linear-gradient(135deg, #818CF8, #5EEAD4)" }}>
      <defs>
        <linearGradient id="welDrop" x1="80" y1="30" x2="200" y2="170" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366F1" /><stop offset="1" stopColor="#14B8A6" />
        </linearGradient>
        <linearGradient id="welHeart" x1="190" y1="40" x2="230" y2="80" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F97316" /><stop offset="1" stopColor="#EC4899" />
        </linearGradient>
      </defs>
      {/* droplet mascot */}
      <path d="M140 40 C 140 40, 95 95, 95 135 a45 45 0 0 0 90 0 C 185 95, 140 40, 140 40Z" fill="url(#welDrop)" />
      <path d="M140 65 C 140 65, 112 105, 112 132 a28 28 0 0 0 28 28" fill="white" fillOpacity="0.15" />
      {/* eyes */}
      <circle cx="126" cy="125" r="4" fill="white" />
      <circle cx="154" cy="125" r="4" fill="white" />
      {/* smile */}
      <path d="M128 140 Q 140 150 152 140" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" />
      {/* heart */}
      <path d="M210 50 c-4-5-13-2-13 4 c0 6 13 12 13 12 s13-6 13-12 c0-6-9-9-13-4Z" fill="url(#welHeart)" />
      {/* sparkles */}
      <g className="animate-onb-sparkle"><path d="M60 50 L 63 57 L 70 60 L 63 63 L 60 70 L 57 63 L 50 60 L 57 57Z" fill="#F59E0B" /></g>
      <g className="animate-onb-sparkle" style={{ animationDelay: "1.2s" }}><path d="M235 145 L 237 150 L 242 152 L 237 154 L 235 159 L 233 154 L 228 152 L 233 150Z" fill="#6366F1" /></g>
      <g className="animate-onb-sparkle" style={{ animationDelay: "0.6s" }}><path d="M50 140 L 52 145 L 57 147 L 52 149 L 50 154 L 48 149 L 43 147 L 48 145Z" fill="#14B8A6" /></g>
    </IllustrationSlot>
  );
}

// ── 2. Empathy — calendar + heartbeat, warm wash ──────────────────────────
export function EmpathyIllustration() {
  return (
    <IllustrationSlot tone={{ background: "linear-gradient(135deg, #FDBA74, #FCA5A5)" }}>
      <defs>
        <linearGradient id="empCal" x1="70" y1="50" x2="190" y2="150" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F97316" /><stop offset="1" stopColor="#EC4899" />
        </linearGradient>
      </defs>
      {/* calendar card */}
      <rect x="75" y="55" width="130" height="100" rx="14" fill="white" stroke="#E5E7EB" strokeWidth="1.5" />
      <rect x="75" y="55" width="130" height="26" rx="14" fill="url(#empCal)" />
      <rect x="75" y="68" width="130" height="13" fill="url(#empCal)" />
      {/* rings */}
      <line x1="100" y1="44" x2="100" y2="62" stroke="#9CA3AF" strokeWidth="3" strokeLinecap="round" />
      <line x1="180" y1="44" x2="180" y2="62" stroke="#9CA3AF" strokeWidth="3" strokeLinecap="round" />
      {/* grid dots */}
      <circle cx="96" cy="100" r="3" fill="#E5E7EB" />
      <circle cx="116" cy="100" r="3" fill="#E5E7EB" />
      <circle cx="136" cy="100" r="3" fill="#E5E7EB" />
      <circle cx="156" cy="100" r="3" fill="#F97316" />
      <circle cx="176" cy="100" r="3" fill="#E5E7EB" />
      <circle cx="96" cy="120" r="3" fill="#E5E7EB" />
      <circle cx="116" cy="120" r="3" fill="#E5E7EB" />
      <circle cx="136" cy="120" r="3" fill="#E5E7EB" />
      <circle cx="156" cy="120" r="3" fill="#E5E7EB" />
      <circle cx="176" cy="120" r="3" fill="#E5E7EB" />
      {/* heartbeat line */}
      <path d="M85 140 L 115 140 L 123 122 L 132 155 L 140 128 L 148 140 L 195 140" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* sparkles */}
      <g className="animate-onb-sparkle"><path d="M55 60 L 57 65 L 62 67 L 57 69 L 55 74 L 53 69 L 48 67 L 53 65Z" fill="#EC4899" /></g>
    </IllustrationSlot>
  );
}

// ── 3. Medication — pill capsules ─────────────────────────────────────────
export function MedicationIllustration() {
  return (
    <IllustrationSlot tone={{ background: "linear-gradient(135deg, #5EEAD4, #818CF8)" }}>
      <defs>
        <linearGradient id="medP1" x1="60" y1="70" x2="140" y2="110" gradientUnits="userSpaceOnUse">
          <stop stopColor="#14B8A6" /><stop offset="1" stopColor="#6366F1" />
        </linearGradient>
        <linearGradient id="medP2" x1="160" y1="60" x2="200" y2="140" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F97316" /><stop offset="1" stopColor="#EC4899" />
        </linearGradient>
      </defs>
      {/* pill 1 (horizontal) */}
      <g transform="rotate(-18 100 92)">
        <rect x="60" y="78" width="80" height="28" rx="14" fill="url(#medP1)" />
        <line x1="98" y1="78" x2="98" y2="106" stroke="white" strokeWidth="2" strokeOpacity="0.5" />
      </g>
      {/* pill 2 (vertical) */}
      <g transform="rotate(15 175 100)">
        <rect x="162" y="65" width="28" height="70" rx="14" fill="url(#medP2)" />
        <line x1="162" y1="98" x2="190" y2="98" stroke="white" strokeWidth="2" strokeOpacity="0.5" />
      </g>
      {/* pen marker */}
      <g transform="rotate(30 210 155)">
        <rect x="198" y="145" width="30" height="10" rx="5" fill="#14B8A6" />
        <rect x="224" y="146" width="8" height="8" rx="2" fill="#6366F1" />
      </g>
      {/* sparkles */}
      <g className="animate-onb-sparkle"><path d="M50 55 L 52 60 L 57 62 L 52 64 L 50 69 L 48 64 L 43 62 L 48 60Z" fill="#F59E0B" /></g>
      <g className="animate-onb-sparkle" style={{ animationDelay: "1s" }}><path d="M140 45 L 142 50 L 147 52 L 142 54 L 140 59 L 138 54 L 133 52 L 138 50Z" fill="#6366F1" /></g>
    </IllustrationSlot>
  );
}

// ── 4. Schedule — syringe ─────────────────────────────────────────────────
export function ScheduleIllustration() {
  return (
    <IllustrationSlot tone={{ background: "linear-gradient(135deg, #5EEAD4, #93C5FD)" }}>
      <defs>
        <linearGradient id="schSyr" x1="60" y1="50" x2="160" y2="120" gradientUnits="userSpaceOnUse">
          <stop stopColor="#14B8A6" /><stop offset="1" stopColor="#3B82F6" />
        </linearGradient>
      </defs>
      {/* Syringe only — the row of day dots that used to sit under it is gone,
          so the head-up progress bar is the one progress indicator on screen. */}
      <g transform="translate(0 26) rotate(-25 120 90)">
        <rect x="80" y="82" width="56" height="16" rx="4" fill="url(#schSyr)" />
        <rect x="74" y="78" width="8" height="24" rx="2" fill="#14B8A6" />
        <rect x="136" y="84" width="6" height="12" fill="#3B82F6" />
        <rect x="142" y="87" width="18" height="6" fill="#93C5FD" />
        <line x1="92" y1="82" x2="92" y2="98" stroke="white" strokeWidth="1" strokeOpacity="0.6" />
        <line x1="104" y1="82" x2="104" y2="98" stroke="white" strokeWidth="1" strokeOpacity="0.6" />
        <line x1="116" y1="82" x2="116" y2="98" stroke="white" strokeWidth="1" strokeOpacity="0.6" />
      </g>
      {/* sparkle */}
      <g className="animate-onb-sparkle"><path d="M210 45 L 212 50 L 217 52 L 212 54 L 210 59 L 208 54 L 203 52 L 208 50Z" fill="#14B8A6" /></g>
    </IllustrationSlot>
  );
}

// ── 5. Tracking — the cards' own icons, as one tight cluster ──────────────
// The same three shapes the cards use (a symptom line, a scale dial, a heart),
// drawn large and close together with a white ring on each, so this page's
// artwork has the same footprint and the same style as the other pages rather
// than three small icons scattered across the middle.
export function TrackingIllustration() {
  return (
    <IllustrationSlot tone={{ background: "linear-gradient(135deg, #C4B5FD, #FBCFE8)" }}>
      <defs>
        <linearGradient id="trkDial" x1="60" y1="70" x2="135" y2="145" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8B5CF6" /><stop offset="1" stopColor="#6366F1" />
        </linearGradient>
        <linearGradient id="trkMood" x1="100" y1="50" x2="182" y2="132" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F59E0B" /><stop offset="1" stopColor="#F97316" />
        </linearGradient>
        <linearGradient id="trkHeart" x1="148" y1="70" x2="224" y2="145" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F97316" /><stop offset="1" stopColor="#EC4899" />
        </linearGradient>
      </defs>

      {/* The two outer circles first, the higher middle one on top of them. */}
      <circle cx="98" cy="106" r="40" fill="url(#trkDial)" stroke="#FFFFFF" strokeWidth="3" />
      <circle cx="184" cy="106" r="40" fill="url(#trkHeart)" stroke="#FFFFFF" strokeWidth="3" />
      <circle cx="141" cy="90" r="42" fill="url(#trkMood)" stroke="#FFFFFF" strokeWidth="3" />

      {/* scale dial */}
      <circle cx="98" cy="108" r="15" fill="none" stroke="white" strokeWidth="2.5" strokeOpacity="0.7" />
      <line x1="98" y1="108" x2="105" y2="101" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="98" cy="108" r="2.5" fill="white" />

      {/* smile */}
      <circle cx="133" cy="86" r="3" fill="white" />
      <circle cx="149" cy="86" r="3" fill="white" />
      <path d="M132 96 Q 141 104 150 96" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" />

      {/* symptom line */}
      <path d="M166 106 H 174 L 179 95 L 186 117 L 190 106 H 202" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />

      {/* sparkles */}
      <g className="animate-onb-sparkle"><path d="M52 52 L 54 57 L 59 59 L 54 61 L 52 66 L 50 61 L 45 59 L 50 57Z" fill="#6366F1" /></g>
      <g className="animate-onb-sparkle" style={{ animationDelay: "0.8s" }}><path d="M230 60 L 232 65 L 237 67 L 232 69 L 230 74 L 228 69 L 223 67 L 228 65Z" fill="#F59E0B" /></g>
      <g className="animate-onb-sparkle" style={{ animationDelay: "0.4s" }}><path d="M60 152 L 62 157 L 67 159 L 62 161 L 60 166 L 58 161 L 53 159 L 58 157Z" fill="#14B8A6" /></g>
    </IllustrationSlot>
  );
}

// ── 6. Privacy — friendly shield ───────────────────────────────────────────
export function PrivacyIllustration() {
  return (
    <IllustrationSlot tone={{ background: "linear-gradient(135deg, #FED7AA, #FCA5A5)" }}>
      <defs>
        <linearGradient id="privSh" x1="90" y1="35" x2="190" y2="165" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FB923C" /><stop offset="1" stopColor="#EF4444" />
        </linearGradient>
      </defs>
      {/* shield */}
      <path d="M140 38 L 195 58 V 100 C 195 130, 170 150, 140 165 C 110 150, 85 130, 85 100 V 58 Z" fill="url(#privSh)" />
      <path d="M140 48 L 185 64 V 100 C 185 124, 165 140, 140 152 C 115 140, 95 124, 95 100 V 64 Z" fill="white" fillOpacity="0.1" />
      {/* check */}
      <path d="M118 100 L 132 114 L 162 82" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* sparkles */}
      <g className="animate-onb-sparkle"><path d="M60 50 L 63 57 L 70 60 L 63 63 L 60 70 L 57 63 L 50 60 L 57 57Z" fill="#F59E0B" /></g>
      <g className="animate-onb-sparkle" style={{ animationDelay: "1s" }}><path d="M225 80 L 227 85 L 232 87 L 227 89 L 225 94 L 223 89 L 218 87 L 223 85Z" fill="#6366F1" /></g>
      <g className="animate-onb-sparkle" style={{ animationDelay: "0.5s" }}><path d="M220 150 L 222 155 L 227 157 L 222 159 L 220 164 L 218 159 L 213 157 L 218 155Z" fill="#14B8A6" /></g>
    </IllustrationSlot>
  );
}

// ── Sign-Up — profile / ID card being created ───────────────────────────────
export function SignUpIllustration() {
  return (
    <IllustrationSlot tone={{ background: "linear-gradient(135deg, #818CF8, #5EEAD4)" }}>
      <defs>
        <linearGradient id="sigCard" x1="70" y1="50" x2="200" y2="160" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366F1" /><stop offset="1" stopColor="#14B8A6" />
        </linearGradient>
        <linearGradient id="sigAvatar" x1="120" y1="70" x2="160" y2="120" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F97316" /><stop offset="1" stopColor="#EC4899" />
        </linearGradient>
      </defs>
      {/* profile card */}
      <rect x="72" y="52" width="136" height="104" rx="16" fill="white" stroke="#E5E7EB" strokeWidth="1.5" />
      <rect x="72" y="52" width="136" height="30" rx="16" fill="url(#sigCard)" />
      <rect x="72" y="68" width="136" height="14" fill="url(#sigCard)" />
      {/* card header line */}
      <line x1="86" y1="64" x2="118" y2="64" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
      {/* avatar circle + person silhouette */}
      <circle cx="112" cy="108" r="22" fill="url(#sigAvatar)" />
      <circle cx="112" cy="101" r="8" fill="white" />
      <path d="M96 122 a16 16 0 0 1 32 0Z" fill="white" />
      {/* detail lines (name / fields) */}
      <line x1="146" y1="98" x2="192" y2="98" stroke="#E5E7EB" strokeWidth="4" strokeLinecap="round" />
      <line x1="146" y1="112" x2="184" y2="112" stroke="#E5E7EB" strokeWidth="4" strokeLinecap="round" />
      <line x1="146" y1="126" x2="190" y2="126" stroke="#E5E7EB" strokeWidth="4" strokeLinecap="round" />
      {/* small "+" new-account badge */}
      <circle cx="188" cy="150" r="14" fill="#F97316" />
      <path d="M182 150 H 194 M 188 144 V 156" stroke="white" strokeWidth="3" strokeLinecap="round" />
      {/* sparkles */}
      <g className="animate-onb-sparkle"><path d="M55 50 L 57 55 L 62 57 L 57 59 L 55 64 L 53 59 L 48 57 L 53 55Z" fill="#F59E0B" /></g>
      <g className="animate-onb-sparkle" style={{ animationDelay: "1s" }}><path d="M225 60 L 227 65 L 232 67 L 227 69 L 225 74 L 223 69 L 218 67 L 223 65Z" fill="#6366F1" /></g>
      <g className="animate-onb-sparkle" style={{ animationDelay: "0.5s" }}><path d="M50 150 L 52 155 L 57 157 L 52 159 L 50 164 L 48 159 L 43 157 L 48 155Z" fill="#14B8A6" /></g>
    </IllustrationSlot>
  );
}

// ── 7. Completion — mascot celebrating ─────────────────────────────────────
export function CompletionIllustration() {
  return (
    <IllustrationSlot tone={{ background: "linear-gradient(135deg, #818CF8, #5EEAD4)" }}>
      <defs>
        <linearGradient id="compDrop" x1="90" y1="30" x2="190" y2="170" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366F1" /><stop offset="1" stopColor="#14B8A6" />
        </linearGradient>
      </defs>
      {/* droplet mascot */}
      <path d="M140 38 C 140 38, 95 95, 95 135 a45 45 0 0 0 90 0 C 185 95, 140 38, 140 38Z" fill="url(#compDrop)" />
      <path d="M140 63 C 140 63, 112 105, 112 132 a28 28 0 0 0 28 28" fill="white" fillOpacity="0.15" />
      {/* eyes (happy, curved) */}
      <path d="M120 122 Q 126 116 132 122" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M148 122 Q 154 116 160 122" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" />
      {/* big smile */}
      <path d="M122 138 Q 140 152 158 138" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" />
      {/* celebration sparkles / confetti */}
      <g className="animate-onb-sparkle"><circle cx="55" cy="55" r="5" fill="#F59E0B" /></g>
      <g className="animate-onb-sparkle" style={{ animationDelay: "0.4s" }}><circle cx="230" cy="65" r="4" fill="#EC4899" /></g>
      <g className="animate-onb-sparkle" style={{ animationDelay: "0.8s" }}><circle cx="240" cy="135" r="5" fill="#6366F1" /></g>
      <g className="animate-onb-sparkle" style={{ animationDelay: "0.2s" }}><circle cx="50" cy="140" r="4" fill="#14B8A6" /></g>
      <g className="animate-onb-sparkle" style={{ animationDelay: "0.6s" }}><path d="M210 40 L 212 45 L 217 47 L 212 49 L 210 54 L 208 49 L 203 47 L 208 45Z" fill="#F97316" /></g>
      <g className="animate-onb-sparkle" style={{ animationDelay: "1s" }}><path d="M65 120 L 67 125 L 72 127 L 67 129 L 65 134 L 63 129 L 58 127 L 63 125Z" fill="#A78BFA" /></g>
    </IllustrationSlot>
  );
}