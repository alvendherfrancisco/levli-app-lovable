import React from "react";
import InsightsSamplePage from "@/components/insights/InsightsSamplePage";
import InsightTrendArt from "@/components/insights/InsightTrendArt";
import PremiumLockGroup from "@/components/premium/PremiumLockGroup";
import PremiumLockFade from "@/components/premium/PremiumLockFade";
import useScrollLock from "@/hooks/useScrollLock";

/**
 * The whole locked Insights page, in one layer: the sample page (see
 * InsightsSamplePage) under a light blur, one soft fade over its last third, and
 * the one lock group sitting below the middle of the screen, over that fade (see
 * PremiumLockGroup — the same group the Report screen and the rotation card show).
 *
 * The blur is deliberately light — about 3.5px — so the cards behind it still read
 * as themselves: the weight line, the Expected toggle, the tinted stat tiles, the
 * level curve and its dose markers, the severity rows and the photo strip. That is
 * the whole point of the page: an account without Premium is meant to see what it
 * is missing. Nothing of the person's own is behind it — every value, line and
 * tile is made up for the picture (see InsightsSamplePage) — so a light blur hides
 * nothing that needs hiding, and the layer still takes no tap and no focus and is
 * hidden from accessibility tools.
 *
 * The fade is only the last third and light — the same tint, at the same strength, as
 * the Report lock draws (see PremiumLockFade), so both screens settle into the page
 * the same way without washing the cards out.
 *
 * It is a layer, not a route: the box it is given decides where it sits and how
 * tall it is, so the same thing serves the screen-sized area behind the Insights
 * header and the rounded card a caregiver reads. Nothing inside it scrolls.
 *
 * `lockScroll` holds the page behind it still, and only the screen-sized use asks
 * for it: the rounded card on "Shared with me" sits in a page that must keep
 * scrolling, so it leaves the page alone (see src/hooks/useScrollLock.js).
 *
 * `groupClassName` is the room the group keeps at the foot of the box it is put in.
 * The screen-sized use hands it the safe-area clearance the page used to carry
 * itself, so the group still sits clear of the tab bar while the sample page behind
 * it — and the fade over it — runs on to the very bottom of the screen, with no bare
 * strip of background left above the bar.
 */
export default function InsightsLockView({ onUnlock, lockScroll = false, className = "", groupClassName = "" }) {
  useScrollLock(lockScroll);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div aria-hidden="true" className="pointer-events-none select-none blur-[3.5px]">
        <InsightsSamplePage />
      </div>

      <PremiumLockFade />

      {/* The group: centred on the box it is given both ways, on its own card (see
          PremiumLockGroup) so its fade-in keeps the transform, and clear of the header
          above and of the safe area at the foot. */}
      <div className={`absolute inset-0 flex items-center justify-center px-4 py-6 ${groupClassName}`}>
        <PremiumLockGroup
          art={<InsightTrendArt size={150} />}
          title="See your whole journey"
          subtitle="Track every trend and photo"
          onUnlock={onUnlock}
        />
      </div>
    </div>
  );
}