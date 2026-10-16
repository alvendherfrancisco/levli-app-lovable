import React from "react";
import { HELP_ON_SCREEN, PRIMARY_BTN, PRIMARY_BTN_ON } from "@/lib/uiStyles";

/**
 * The one lock group every Premium overlay shows.
 *
 * The Report screen, the Insights screen and the rotation card on Shots each put
 * a lock over what Premium opens, and they are all this: one illustration in the
 * same 120px slot, one headline, one muted line, the flow's own main button (the
 * same pill, at the same width, as the paywall's own subscribe button — see
 * src/components/paywall/PaywallBar.jsx), and the terms of the plan in one small
 * line under it. The spacing is one scale — 16px under the artwork, 8px under the
 * headline, 24px above the button, 8px under it — so the group is the same block
 * on every screen and the three can never drift apart.
 *
 * The slot is what keeps the rhythm: whatever artwork is handed in is centred in
 * the same 120px box, so the headline always begins at the same height whether
 * the picture is a wide card, a square or a figure.
 *
 * The words carry no box: there is no card, no panel and no frosted pill behind
 * them. Over the blurred sample pages the button is what separates them, and the
 * two quiet things that keep them legible are a faint radial glow behind the
 * block, fading to nothing on every side, and a soft shadow on the letters
 * themselves (see .lock-text-shadow in src/index.css).
 *
 * Missing `onUnlock` means the lock is read only — the caregiver's view of a
 * shared record follows the owner's plan and has nothing to sell — and then the
 * group is this same one, with no button.
 */
export default function PremiumLockGroup({ art, title, subtitle, onUnlock }) {
  return (
    <div className="lock-group-in mx-auto flex w-full max-w-[400px] flex-col items-center text-center">
      <div className="flex h-[120px] w-full items-center justify-center">{art}</div>

      <div className="relative mt-4">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 h-[220%] w-[130%] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.92),rgba(255,255,255,0)_70%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(3,7,18,0.9),rgba(3,7,18,0)_70%)]"
        />
        <h3 className="lock-text-shadow relative text-[20px] font-semibold leading-tight text-gray-900 dark:text-white">
          {title}
        </h3>
        <p className="lock-text-shadow relative mt-2 text-[15px] leading-relaxed text-gray-600 dark:text-gray-300">
          {subtitle}
        </p>
      </div>

      {onUnlock && (
        <>
          <button type="button" onClick={onUnlock} className={`${PRIMARY_BTN} ${PRIMARY_BTN_ON} mt-6`}>
            Unlock
          </button>
          <p className={`${HELP_ON_SCREEN} mt-2`}>Cancel anytime</p>
        </>
      )}
    </div>
  );
}