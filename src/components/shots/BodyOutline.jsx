import React from "react";
import BodyFrames from "@/components/shots/BodyFrames";
import { sitePoint } from "@/lib/injectionSites";

/**
 * The body as the rotation card draws it: the shared front and back figures with
 * a dot on every site that was used in the range the card is showing — a dot for
 * every row in the list below it, placed by the site's own figure and position
 * (see src/lib/injectionSites.js).
 *
 * A dot's size is how often the site was used, the site used most recently
 * carries a soft halo and the stronger colour, and the site in hand — the one
 * whose row in the list was tapped — is ringed.
 *
 * A site the app cannot place (one typed in by hand) is simply not drawn here; it
 * is still listed under the outline, with the note that says so.
 */

// A dot grows with the count and stops growing at five uses, so one busy site
// cannot swamp the figure.
const dotRadius = (count) => 5 + Math.min(count - 1, 4) * 1.4;

export default function BodyOutline({
  usage = [], recentSite = null, selectedSite = null, onSelectSite, className = "",
}) {
  const dots = usage.map((u) => ({ ...u, point: sitePoint(u.id) })).filter((d) => d.point);

  return (
    <BodyFrames
      className={className}
      ariaLabel="Body outline showing the injection sites used"
      renderMarks={(viewKey, colors) =>
        dots
          .filter((d) => d.point.view === viewKey)
          .map((d) => {
            const r = dotRadius(d.count);
            const recent = d.id === recentSite;
            const selected = d.id === selectedSite;
            return (
              <g
                key={d.id}
                onClick={onSelectSite ? () => onSelectSite(d.id) : undefined}
                className={onSelectSite ? "cursor-pointer" : undefined}
              >
                {/* A wider transparent circle, so the dot is easy to hit. */}
                <circle cx={d.point.x} cy={d.point.y} r={r + 9} fill="transparent" />
                {recent && <circle cx={d.point.x} cy={d.point.y} r={r + 4} fill={colors.halo} />}
                {/* The site in hand wears a ring, so it and its row in the list
                    read as the same thing. */}
                {selected && (
                  <circle
                    cx={d.point.x}
                    cy={d.point.y}
                    r={r + 6}
                    fill="none"
                    stroke={colors.dotStrong}
                    strokeWidth="2"
                  />
                )}
                <circle
                  cx={d.point.x}
                  cy={d.point.y}
                  r={r}
                  fill={recent || selected ? colors.dotStrong : colors.dot}
                />
              </g>
            );
          })
      }
    />
  );
}