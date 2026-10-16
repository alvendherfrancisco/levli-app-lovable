import React from "react";
import PremiumBadge from "@/components/PremiumBadge";
import { HEADING, PRIMARY_BTN, PRIMARY_BTN_ON, SUBTITLE } from "@/lib/uiStyles";

/**
 * What sits over a locked block: either the whole lock — the illustration, the
 * headline, the muted line and the Unlock button, in the onboarding's own type
 * and spacing — or, on the cards that only need to say "this is Premium", the
 * button alone.
 *
 * `full` is the group the first locked card wears (see InsightTrendArt); a slim
 * group is just the button, so four locks on one screen never become four
 * illustrations. `onUnlock` missing means the lock is read only — the caregiver
 * view follows the owner's plan and has nothing to sell — and then the slim group
 * says so with the Premium mark instead of a button.
 *
 * Nothing here takes a tap of its own: the layer around it passes touches
 * through, so the page still scrolls over a locked card.
 */
export default function PremiumLockGroup({ full = false, art = null, headline = "", line = "", onUnlock }) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-5">
      <div className={`flex flex-col items-center text-center ${full ? "w-full max-w-[320px]" : ""}`}>
        {full && (
          <>
            {art}
            {headline && <h3 className={`${HEADING} mt-3`}>{headline}</h3>}
            {line && <p className={`${SUBTITLE} mt-2`}>{line}</p>}
          </>
        )}

        {onUnlock ? (
          <button
            type="button"
            onClick={onUnlock}
            className={`pointer-events-auto ${PRIMARY_BTN} ${PRIMARY_BTN_ON} ${full ? "mt-4" : "!w-auto px-7"}`}
          >
            Unlock
          </button>
        ) : (
          !full && <PremiumBadge />
        )}
      </div>
    </div>
  );
}