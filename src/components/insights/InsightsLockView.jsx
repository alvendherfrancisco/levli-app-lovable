import React from "react";
import InsightsSamplePage from "@/components/insights/InsightsSamplePage";
import InsightsLockGroup from "@/components/insights/InsightsLockGroup";

/**
 * The whole locked Insights page, in one layer: the sample page (see
 * InsightsSamplePage) held under a single continuous blur, one soft scrim fading
 * it into the page's own surface towards the foot, and the one lock group centred
 * over it.
 *
 * It is a layer, not a route: the box it is given decides where it sits and how
 * tall it is, so the same thing serves the screen-sized area behind the Insights
 * header and the rounded card a caregiver reads. Nothing inside it scrolls, and
 * the sample page is clipped by the box's own edge — with the scrim reaching the
 * page's surface exactly there, a long preview simply fades out rather than
 * leaving empty space under the group.
 *
 * The blocked content takes no tap and no focus: the blurred layer is inert and
 * the group carries the only control on the page. `onUnlock` missing means the
 * lock is read only and the group shows no button (see InsightsLockGroup).
 */
export default function InsightsLockView({ onUnlock, className = "" }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div aria-hidden="true" className="pointer-events-none select-none blur-[5px]">
        <InsightsSamplePage />
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-b from-transparent via-white/80 to-white dark:via-gray-950/80 dark:to-gray-950"
      />

      <div className="absolute inset-0 flex items-center justify-center px-4">
        <InsightsLockGroup onUnlock={onUnlock} />
      </div>
    </div>
  );
}