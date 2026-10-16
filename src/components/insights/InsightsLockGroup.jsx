import React from "react";
import InsightTrendArt from "@/components/insights/InsightTrendArt";

/**
 * The one lock group the Insights screen shows while Levli Premium is not active:
 * the trend illustration in the onboarding's own manner (see InsightTrendArt,
 * 96px wide over its soft purple glow), one headline, one muted line, and the
 * app's own primary pill under them.
 *
 * The spacing is the group's own: 12px between the illustration, the headline and
 * the line, and 16px above the button, which is full width within the group.
 *
 * `onUnlock` missing means the lock is read only — the caregiver's view of a
 * record follows the owner's plan and has nothing to sell — and then the group is
 * the same one, with no button.
 */
export default function InsightsLockGroup({ onUnlock }) {
  return (
    <div className="flex w-full max-w-[320px] flex-col items-center text-center">
      <InsightTrendArt />
      <h3 className="mt-3 text-[20px] font-semibold leading-tight text-gray-900 dark:text-white">
        See your whole journey
      </h3>
      <p className="mt-3 text-[15px] leading-relaxed text-gray-500 dark:text-gray-400">
        Track every trend and photo
      </p>
      {onUnlock && (
        <button type="button" onClick={onUnlock} className="btn-pill btn-primary mt-4 w-full">
          Unlock
        </button>
      )}
    </div>
  );
}