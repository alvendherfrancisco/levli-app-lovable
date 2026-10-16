import React from "react";
import BodyFrames from "@/components/shots/BodyFrames";
import { sitePoint } from "@/lib/injectionSites";

/**
 * The body as the rotation card draws it: the shared front and back figures with
 * a dot on every site that was used.
 *
 * A dot's size is how often the site was used, and the site used most recently
 * carries a soft halo and the stronger colour. A site the app cannot place (one
 * typed in by hand) is simply not drawn here; it is still listed under the
 * outline.
 */

// A dot grows with the count and stops growing at five uses, so one busy site
// cannot swamp the figure.
const dotRadius = (count) => 5 + Math.min(count - 1, 4) * 1.4;

export default function BodyOutline({ usage = [], recentSite = null, onSelectSite, className = "" }) {
  const dots = usage.map((u) => ({ ...u, point: sitePoint(u.site) })).filter((d) => d.point);

  return (
    <BodyFrames
      className={className}
      ariaLabel="Body outline showing the injection sites used"
      renderMarks={(viewKey, colors) =>
        dots
          .filter((d) => d.point.view === viewKey)
          .map((d) => {
            const r = dotRadius(d.count);
            const recent = d.site === recentSite;
            return (
              <g
                key={d.site}
                onClick={onSelectSite ? () => onSelectSite(d.site) : undefined}
                className={onSelectSite ? "cursor-pointer" : undefined}
              >
                {/* A wider transparent circle, so the dot is easy to hit. */}
                <circle cx={d.point.x} cy={d.point.y} r={r + 9} fill="transparent" />
                {recent && <circle cx={d.point.x} cy={d.point.y} r={r + 4} fill={colors.halo} />}
                <circle cx={d.point.x} cy={d.point.y} r={r} fill={recent ? colors.dotStrong : colors.dot} />
              </g>
            );
          })
      }
    />
  );
}