import React from "react";
import InsightsSamplePage from "@/components/insights/InsightsSamplePage";
import PremiumUpgradeOverlay from "@/components/premium/PremiumUpgradeOverlay";

/**
 * The locked Insights page: the sample page (see InsightsSamplePage) under a light
 * blur, with the one Premium upgrade overlay over it (see PremiumUpgradeOverlay).
 *
 * The blur is only 2px, so every card behind it still reads as itself — the weight
 * line, the Expected toggle, the tinted stat tiles, the level curve and its dose
 * markers, the severity rows and the photo strip. That is the point of the page: an
 * account without Premium is meant to see what it is missing. Nothing of the
 * person's own is behind it — every value, line and tile is made up for the picture
 * — so a light blur hides nothing that needs hiding, and the layer still takes no
 * tap and no focus and is hidden from accessibility tools.
 *
 * It is a layer, not a route: the box it is given decides where it sits and how tall
 * it is, so the same thing serves the screen-sized area behind the Insights header
 * and the rounded card a caregiver reads. The caregiver passes no `onUnlock` — the
 * card then carries its words alone, with no button, because there is nothing to
 * sell someone reading another person's record.
 */
export default function InsightsLockView({ onUnlock, className = "" }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div aria-hidden="true" className="pointer-events-none select-none blur-[2px]">
        <InsightsSamplePage />
      </div>

      <PremiumUpgradeOverlay variant="insights" onUnlock={onUnlock} />
    </div>
  );
}