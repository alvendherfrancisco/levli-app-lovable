import React from "react";
import SiteRotationArt from "@/components/shots/SiteRotationArt";
import PremiumLockGroup from "@/components/premium/PremiumLockGroup";

/**
 * The lock over the rotation chart while Levli Premium is not active.
 *
 * It fills the whole card, and it is one soft scrim rather than a box: nothing at
 * the top, the card's own surface at the bottom, so the blurred preview is still
 * seen through it at the top and the words below sit straight on the card. No
 * border, no panel, no second surface.
 *
 * The group itself is the app's one lock group (see PremiumLockGroup) — the same
 * artwork slot, the same headline and muted line, the same main button and the
 * same terms line as the Report and Insights locks — so the three read as one
 * thing met in three places rather than three designs. Rotation is free, so the
 * lock is not about this chart: it points at Premium as a whole, and the line
 * under the headline is the set of benefits the paywall lists.
 *
 * There is no way to put it away: the preview stays visible behind it so the
 * feature can be seen for what it is, and it takes no tap of its own on the chart
 * below (see LockedSitesPreview). The only action is the way into the plans — and
 * because this one sits inside a page that must keep scrolling, it deliberately
 * leaves the page alone (see src/hooks/useScrollLock.js).
 */
export default function SiteRotationLock({ onUnlock }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-transparent via-white/75 to-white dark:via-gray-900/75 dark:to-gray-900"
      />

      <div className="relative w-full px-4">
        <PremiumLockGroup
          art={<SiteRotationArt />}
          title="More with Levli Premium"
          subtitle="Reports, insights and full history"
          onUnlock={onUnlock}
        />
      </div>
    </div>
  );
}