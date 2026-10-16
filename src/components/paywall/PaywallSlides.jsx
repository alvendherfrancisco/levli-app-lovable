import React, { useState } from "react";
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
 *
 * How strong each picture is drawn is read from the swipe itself, not from which
 * slide the track has passed: the slide in hand is full size and full strength and
 * the ones either side are a step back, and every position in between is the one
 * the finger is at (`.paywall-slide` and --slide-step, in src/index.css). A swipe
 * and a tap on the progress bar therefore both arrive smoothly, and the picture
 * never jumps to full at the halfway point. With reduced motion only the size and
 * the strength are dropped; the slide in hand is simply the one in hand.
 */
export default function PaywallSlides({ trackRef, index, onIndexChange }) {
  // Where the track is, as a number of slides: 0 is the first one in hand, 0.5 is
  // exactly between two of them, 1 is the second one arrived at. It starts on the
  // slide the screen opens on, so nothing is out of place before the first swipe.
  const [swipe, setSwipe] = useState(index);

  const handleScroll = () => {
    const el = trackRef.current;
    if (!el || !el.clientWidth) return;
    const at = el.scrollLeft / el.clientWidth;
    setSwipe(at);
    const next = Math.max(0, Math.min(PREMIUM_SLIDES.length - 1, Math.round(at)));
    if (next !== index) onIndexChange(next);
  };

  return (
    <div
      ref={trackRef}
      onScroll={handleScroll}
      className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
    >
      {PREMIUM_SLIDES.map((slide, i) => {
        const Art = ART[slide.id] || InsightsIllustration;
        // 0 for the slide in hand, up to 1 for the one a whole slide away.
        const step = Math.min(1, Math.abs(i - swipe));
        return (
          <div key={slide.id} className="w-full flex-shrink-0 snap-center">
            <div className="paywall-art paywall-slide" style={{ "--slide-step": step.toFixed(3) }}>
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