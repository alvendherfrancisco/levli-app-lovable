import React from "react";
import { PREMIUM_SLIDES } from "@/lib/premiumPlans";
import { HEADING, SUBTITLE } from "@/lib/uiStyles";
import {
  HistoryIllustration, InsightsIllustration, ReportsIllustration, ShotLimitIllustration,
} from "@/components/paywall/PaywallIllustrations";

/** Each slide's own picture, by the benefit it belongs to. */
const ART = {
  shots: ShotLimitIllustration,
  insights: InsightsIllustration,
  history: HistoryIllustration,
  reports: ReportsIllustration,
};

/**
 * The four benefits, side by side and swiped one at a time — the way the
 * onboarding moves from step to step, and the reason this screen reads as the
 * step after it: the same artwork slot at the top, a headline in the same type,
 * one short line under it, and the picture the copy is about.
 *
 * The slides are a plain scroll-snap track, so a swipe is the browser's own
 * gesture — nothing is emulated — and the caller's progress bar pages it (see
 * PaywallModal). Every slide is the same width, so a swipe always lands whole.
 *
 * Every slide is also the same shape, top to bottom: one illustration area of a
 * fixed height (.paywall-art — the same on all four, whatever screen they are on),
 * 24px, the headline, 8px, its line. The headline therefore sits at exactly the
 * same height on every slide, and the plans under the track never move as the
 * slides change.
 */
export default function PaywallSlides({ trackRef, index, onIndexChange }) {
  const handleScroll = () => {
    const el = trackRef.current;
    if (!el || !el.clientWidth) return;
    const next = Math.max(0, Math.min(PREMIUM_SLIDES.length - 1, Math.round(el.scrollLeft / el.clientWidth)));
    if (next !== index) onIndexChange(next);
  };

  return (
    <div
      ref={trackRef}
      onScroll={handleScroll}
      className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
    >
      {PREMIUM_SLIDES.map((slide) => {
        const Art = ART[slide.id] || InsightsIllustration;
        return (
          <div key={slide.id} className="w-full flex-shrink-0 snap-center">
            <div className="paywall-art">
              <Art />
            </div>
            <h2 className={`${HEADING} mt-6 text-center`}>{slide.headline}</h2>
            <p className={`${SUBTITLE} mt-2 text-center`}>{slide.line}</p>
          </div>
        );
      })}
    </div>
  );
}