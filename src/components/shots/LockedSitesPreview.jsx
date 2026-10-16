import React from "react";
import BodyOutline from "@/components/shots/BodyOutline";
import { siteLabel } from "@/lib/injectionSites";

/**
 * What the rotation card shows while the feature is locked: the same figure and
 * list as the real panel, drawn from a handful of sample sites rather than the
 * person's own shots — so the card reads as a chart waiting to be opened instead
 * of an empty or broken one.
 *
 * Everything here is invented for the preview: no real site, count or date is
 * ever drawn behind the blur. The figure keeps its real positions and its real
 * dot sizes, and the panel takes no tap and no scroll while it is covered (see
 * SiteRotationLock, which sits over it).
 */
const SAMPLE_DOTS = [
  { id: "stomach_upper_left", count: 3 },
  { id: "thigh_right", count: 2 },
  { id: "upper_arm_left", count: 4 },
  { id: "buttocks_left", count: 2 },
  { id: "back_thigh_right", count: 3 },
];

const SAMPLE_ROWS = [
  { id: "stomach_upper_left", count: 3, last: "Last used 4 days ago" },
  { id: "upper_arm_left", count: 2, last: "Last used 11 days ago" },
  { id: "thigh_right", count: 2, last: "Last used 18 days ago" },
];

export default function LockedSitesPreview() {
  return (
    // Lighter than the app's own blur: the figures are meant to be seen as the
    // shape of what is behind the lock, never to be read.
    <div className="pointer-events-none select-none blur-[2px] opacity-80" aria-hidden="true">
      <div className="mx-auto w-full max-w-[280px]">
        <BodyOutline usage={SAMPLE_DOTS} className="h-auto w-full" />
      </div>

      <div className="mt-4 divide-y divide-gray-100 dark:divide-white/[0.06]">
        {SAMPLE_ROWS.map((row) => (
          <div key={row.id} className="flex min-h-[44px] items-center justify-between gap-3 py-2">
            <span className="min-w-0 truncate text-sm text-gray-700 dark:text-[#E8E9F0]">
              {siteLabel(row.id)}{" "}
              <span className="font-normal text-gray-400 dark:text-[#9A9DAE]">· {row.count}</span>
            </span>
            <span className="flex-shrink-0 whitespace-nowrap text-[11px] text-gray-500 dark:text-[#9A9DAE]">
              {row.last}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}