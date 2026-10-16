import React from "react";
import InsightTrendArt from "@/components/insights/InsightTrendArt";

/**
 * The one lock group the Insights screen shows while Levli Premium is not active:
 * the transparent trend illustration (see InsightTrendArt, 88px wide over its soft
 * purple glow), the headline and its muted line on a frosted pill of their own,
 * and the app's own primary pill under them.
 *
 * The pill is what keeps the two lines readable over the chart behind them — the
 * whole group sits on top of a blurred, lightly faded page — without drawing a hard
 * box: a translucent surface, softened at the edges, with a soft shadow under it,
 * in both modes.
 *
 * The spacing is the group's own: 12px between the illustration, the headline and
 * the line, and 16px above the button, which is full width within the group. The
 * button carries the same indigo pill as every other main action in the app, with
 * a soft purple glow of its own so it is unmistakably the one thing to press, and
 * the tiny line under it is what the plans promise (see src/lib/premiumPlans.js).
 *
 * `onUnlock` missing means the lock is read only — the caregiver's view of a
 * record follows the owner's plan and has nothing to sell — and then the group is
 * the same one, with no button.
 */
export default function InsightsLockGroup({ onUnlock }) {
  return (
    <div className="flex w-full max-w-[320px] flex-col items-center text-center">
      <InsightTrendArt />

      <div className="mt-3 rounded-2xl bg-white/75 px-4 py-1.5 shadow-[0_10px_28px_-12px_rgba(16,24,40,0.28)] backdrop-blur-md dark:bg-gray-950/65 dark:shadow-[0_10px_28px_-12px_rgba(0,0,0,0.7)]">
        <h3 className="text-[20px] font-semibold leading-tight text-gray-900 dark:text-white">
          See your whole journey
        </h3>
        <p className="mt-3 text-[15px] leading-relaxed text-gray-600 dark:text-gray-300">
          Track every trend and photo
        </p>
      </div>

      {onUnlock && (
        <>
          <button
            type="button"
            onClick={onUnlock}
            className="btn-pill btn-primary mt-4 w-full shadow-[0_14px_30px_-12px_rgba(79,70,229,0.85)]"
          >
            Unlock
          </button>
          <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">Cancel anytime</p>
        </>
      )}
    </div>
  );
}