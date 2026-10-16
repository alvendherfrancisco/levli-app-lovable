import React from "react";
import SiteRotationArt from "@/components/shots/SiteRotationArt";
import { HEADING, PRIMARY_BTN, PRIMARY_BTN_ON, SUBTITLE } from "@/lib/uiStyles";

/**
 * The lock over the rotation chart while Levli Premium is not active.
 *
 * It fills the whole card, and it is one soft scrim rather than a box: nothing at
 * the top, the card's own surface at the bottom, so the blurred preview is still
 * seen through it at the top and the words below sit straight on the card. No
 * border, no panel, no second surface.
 *
 * The content is the onboarding's own page in miniature — its artwork slot, its
 * headline type, one muted line, and its main button, 16px apart, with the
 * illustration 120px wide and a purple glow behind it — so the locked chart reads
 * as the next step of the same flow rather than a barrier.
 *
 * There is no way to put it away: the preview stays visible behind it so the
 * feature can be seen for what it is, and it takes no tap and no scroll of its own
 * (see LockedSitesPreview). The only action is the way into the plans.
 */
export default function SiteRotationLock({ onUnlock }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-transparent via-white/75 to-white dark:via-gray-900/75 dark:to-gray-900"
      />

      {/* One column, the width the onboarding's own step content has, so the
          illustration, the words and the button stay a group on a wide card
          instead of stretching across it. */}
      <div className="relative flex w-full max-w-[320px] flex-col items-center pb-6 text-center">
        <SiteRotationArt />
        {/* The lock points at Premium as a whole rather than naming this chart
            as one of its benefits: rotation is free, and what Premium carries is
            the set of benefits the paywall lists. */}
        <h3 className={`${HEADING} mt-4`}>More with Levli Premium</h3>
        <p className={`${SUBTITLE} mt-4 whitespace-nowrap`}>Reports, insights and full history</p>
        <button type="button" onClick={onUnlock} className={`${PRIMARY_BTN} ${PRIMARY_BTN_ON} mt-4`}>
          Unlock
        </button>
      </div>
    </div>
  );
}