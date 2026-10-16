import React from "react";
import useDoseColors from "@/hooks/useDoseColors";
import { sitePoint } from "@/lib/injectionSites";

/**
 * The body the rotation card draws on: the same simple figure twice, once from
 * the front and once from behind, in one muted line — with a dot on every site
 * that was used.
 *
 * A dot's size is how often the site was used, and the site used most recently
 * carries a soft halo and the stronger colour. A site the app cannot place (a
 * site typed in by hand) is simply not drawn here; it is still listed under the
 * outline.
 *
 * The whole drawing is one 200 × 150 piece of geometry: the figure's parts are
 * written once and placed twice, 90 to the right for the back view, so the two
 * can never drift apart.
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

// A dot grows with the count and stops growing at five uses, so one busy site
// cannot swamp the figure.
const dotRadius = (count) => 4 + Math.min(count - 1, 4) * 1.1;

export default function BodyOutline({ usage = [], recentSite = null, onSelectSite }) {
  const { isDark } = useDoseColors();

  const line = isDark ? "rgba(255,255,255,0.22)" : "#D1D5DB";
  const labelFill = isDark ? "rgba(255,255,255,0.4)" : "#9CA3AF";
  const dotFill = isDark ? "#818CF8" : "#6366F1";
  const recentFill = isDark ? "#C7D2FE" : "#4338CA";
  const haloFill = isDark ? "rgba(199,210,254,0.25)" : "rgba(67,56,202,0.16)";

  const dots = usage.map((u) => ({ ...u, point: sitePoint(u.site) })).filter((d) => d.point);

  return (
    <svg
      viewBox="0 0 200 150"
      className="h-full w-auto"
      role="img"
      aria-label="Body outline showing the injection sites used"
    >
      {VIEWS.map((view) => (
        <g key={view.key} transform={`translate(${view.offset},0)`}>
          <g fill="none" stroke={line} strokeWidth="1.5" strokeLinejoin="round">
            {PARTS}
          </g>
          <text x="55" y="147" textAnchor="middle" fontSize="8" fill={labelFill}>
            {view.label}
          </text>

          {dots
            .filter((d) => d.point.view === view.key)
            .map((d) => {
              const r = dotRadius(d.count);
              const recent = d.site === recentSite;
              return (
                <g key={d.site} onClick={onSelectSite ? () => onSelectSite(d.site) : undefined} className="cursor-pointer">
                  {/* A wider transparent circle, so the dot is easy to hit. */}
                  <circle cx={d.point.x} cy={d.point.y} r={r + 6} fill="transparent" />
                  {recent && <circle cx={d.point.x} cy={d.point.y} r={r + 3.5} fill={haloFill} />}
                  <circle cx={d.point.x} cy={d.point.y} r={r} fill={recent ? recentFill : dotFill} />
                </g>
              );
            })}
        </g>
      ))}
    </svg>
  );
}