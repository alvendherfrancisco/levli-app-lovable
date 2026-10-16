import React from "react";
import InsightTrendArt from "@/components/insights/InsightTrendArt";

/**
 * The one lock group the Insights screen shows while Levli Premium is not active:
 * the filled trend illustration (see InsightTrendArt, 112px wide over its soft
 * purple glow), the headline and its muted line, and the app's own primary pill
 * under them with the terms of the plan in one small line below it.
 *
 * The words carry no box: there is no card, no panel and no frosted pill behind
 * them. They are kept legible over the blurred charts in two quiet ways — a faint
 * radial glow behind the block, fading to nothing on every side, and a soft shadow
 * on the letters themselves — so the group reads as placed on the page rather than
 * laid on a card.
 *
 * The spacing is the group's own: 12px between the illustration, the headline and
 * the line, and 16px above the button, which is full width within the group. The
 * terms sit 8px under the button.
 *
 * `onUnlock` missing means the lock is read only — the caregiver's view of a
 * record follows the owner's plan and has nothing to sell — and then the group is
 * the same one, with no button.
 */
export default function InsightsLockGroup({ onUnlock }) {
  return (
    <div className="flex w-full max-w-[320px] flex-col items-center text-center">
      <InsightTrendArt />

      {/* The words, over the glow that keeps them readable and leaves no edge. */}
      <div className="relative mt-3">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 h-[220%] w-[130%] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.92),rgba(255,255,255,0)_70%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(3,7,18,0.9),rgba(3,7,18,0)_70%)]"
        />
        <h3 className="lock-text-shadow relative text-[20px] font-semibold leading-tight text-gray-900 dark:text-white">
          See your whole journey
        </h3>
        <p className="lock-text-shadow relative mt-3 text-[15px] leading-relaxed text-gray-600 dark:text-gray-300">
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