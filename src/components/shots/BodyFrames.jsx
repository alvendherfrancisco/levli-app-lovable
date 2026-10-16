import React from "react";
import useDoseColors from "@/hooks/useDoseColors";

/**
 * The one drawing of the body: the same simple figure twice, once from the front
 * and once from behind, from one piece of geometry — so the shot form's site
 * picker and the rotation card can never drift apart.
 *
 * `renderMarks` draws whatever belongs on top of the outline for one view: the
 * rotation card's usage dots, or the picker's tappable spots. It is handed the
 * view's key and the colours resolved for the theme in use.
 *
 * The viewBox is tight around the two figures (the drawing's own coordinates run
 * about 30 to 170 across), so the pair sits centred with the same space either
 * side however wide the caller draws it.
 */

// One figure, drawn around x = 55. A head, a neck, a torso with rounded
// shoulders, two arms and two legs — plain shapes, so it reads as a diagram
// rather than an illustration.
const PARTS = [
  <circle key="head" cx="55" cy="14" r="9" />,
  <rect key="neck" x="51.5" y="20" width="7" height="7" rx="3" />,
  <path key="torso" d="M41,34 Q41,26 49,26 H61 Q69,26 69,34 V64 Q69,72 61,72 H49 Q41,72 41,64 Z" />,
  <rect key="arm-left" x="34" y="30" width="7" height="38" rx="3.5" />,
  <rect key="arm-right" x="69" y="30" width="7" height="38" rx="3.5" />,
  <rect key="leg-left" x="43" y="68" width="11" height="66" rx="5.5" />,
  <rect key="leg-right" x="56" y="68" width="11" height="66" rx="5.5" />,
];

const VIEWS = [
  { key: "front", label: "Front", offset: 0 },
  { key: "back", label: "Back", offset: 90 },
];

export default function BodyFrames({ renderMarks, ariaLabel, className = "" }) {
  const { isDark } = useDoseColors();

  const colors = {
    line: isDark ? "rgba(255,255,255,0.22)" : "#D1D5DB",
    label: isDark ? "rgba(255,255,255,0.4)" : "#9CA3AF",
    dot: isDark ? "#818CF8" : "#6366F1",
    dotStrong: isDark ? "#C7D2FE" : "#4338CA",
    halo: isDark ? "rgba(199,210,254,0.25)" : "rgba(67,56,202,0.16)",
    idle: isDark ? "rgba(255,255,255,0.3)" : "#C3C8D4",
  };

  return (
    <svg
      viewBox="26 0 148 150"
      className={`overflow-visible ${className}`}
      role="img"
      aria-label={ariaLabel}
    >
      {VIEWS.map((view) => (
        <g key={view.key} transform={`translate(${view.offset},0)`}>
          <g fill="none" stroke={colors.line} strokeWidth="1.5" strokeLinejoin="round">
            {PARTS}
          </g>
          <text x="55" y="147" textAnchor="middle" fontSize="8" fill={colors.label}>
            {view.label}
          </text>
          {renderMarks(view.key, colors)}
        </g>
      ))}
    </svg>
  );
}