import React from "react";
import InsightsSamplePage from "@/components/insights/InsightsSamplePage";
import InsightsLockGroup from "@/components/insights/InsightsLockGroup";

/**
 * The whole locked Insights page, in one layer: the sample page (see
 * InsightsSamplePage) under a light blur, one soft fade over its last third, and
 * the one lock group sitting below the middle of the screen, over that fade.
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
 * The fade is only the last third and, in light mode, a very light tint: it settles
 * the group into the page without washing the cards out.
 *
 * It is a layer, not a route: the box it is given decides where it sits and how
 * tall it is, so the same thing serves the screen-sized area behind the Insights
 * header and the rounded card a caregiver reads. Nothing inside it scrolls.
 */
export default function InsightsLockView({ onUnlock, className = "" }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div aria-hidden="true" className="pointer-events-none select-none blur-[3.5px]">
        <InsightsSamplePage />
      </div>

      {/* The fade: transparent for the top two thirds, then the page's own surface
          arriving through the last one — a light tint in the middle of it, never a
          near-solid white wash, so the tiles and the charts above it keep their
          colour and the strip under it is still readable. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-b from-transparent via-white/30 to-white/55 dark:via-gray-950/40 dark:to-gray-950/60"
      />
      {/* The last stretch of the layer: the sample page is longer than the screen,
          so it is clipped at the bottom edge, and these few centimetres settle into
          the page's own surface so the cut is never seen. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-white dark:to-gray-950"
      />

      {/* The group: centred on the screen's own axis, held a step below the middle
          (the top padding is what moves it, so the fade-in below can own the
          transform), clear of the header and of the safe area at the foot. */}
      <div className="absolute inset-0 flex items-center justify-center px-4 pt-[18vh]">
        <div className="lock-group-in flex w-full justify-center">
          <InsightsLockGroup onUnlock={onUnlock} />
        </div>
      </div>
    </div>
  );
}