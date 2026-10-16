import React from "react";
import ReportArt from "@/components/report/ReportArt";

/**
 * The one lock group the Report screen shows while Levli Premium is not active:
 * the report illustration in the onboarding's own manner (see ReportArt, 96px
 * wide over its soft purple glow), one headline, one muted line, and the app's
 * own primary pill under them — the same pill, at the same width, as the paywall's
 * own subscribe button (see src/components/paywall/PaywallBar.jsx) — with the
 * terms of the plan in one small line below it.
 *
 * The words carry no box: there is no card, no panel and no frosted pill behind
 * them. They are kept readable over the blurred sample report in two quiet ways —
 * a faint radial glow behind the block, fading to nothing on every side, and a soft
 * shadow on the letters themselves.
 *
 * The spacing is the group's own: 12px between the illustration, the headline and
 * the line, 16px above the button, which is full width within the group's own 16px
 * margins, and 8px under it for the terms.
 *
 * It sits over the blurred sample page (see ReportLockView), so it is the only
 * thing on the screen that can be pressed. There is no way to put it away: the
 * blur stays, and the one action is the way into the plans.
 */
export default function ReportLock({ onUnlock }) {
  return (
    <div className="relative flex w-full max-w-[400px] flex-col items-center text-center">
      <ReportArt size={96} />

      {/* The words, over the glow that keeps them readable and leaves no edge. */}
      <div className="relative mt-3">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 h-[220%] w-[130%] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.92),rgba(255,255,255,0)_70%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(3,7,18,0.9),rgba(3,7,18,0)_70%)]"
        />
        <h3 className="lock-text-shadow relative text-[20px] font-semibold leading-tight text-gray-900 dark:text-white">
          Reports for your doctor
        </h3>
        <p className="lock-text-shadow relative mt-3 text-[15px] leading-relaxed text-gray-600 dark:text-gray-300">
          Share your progress in one tap
        </p>
      </div>

      <button
        type="button"
        onClick={onUnlock}
        className="btn-pill btn-primary mt-4 w-full shadow-[0_14px_30px_-12px_rgba(79,70,229,0.85)]"
      >
        Unlock
      </button>
      <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">Cancel anytime</p>
    </div>
  );
}