import React from "react";
import ReportSamplePage from "@/components/report/ReportSamplePage";
import ReportArt from "@/components/report/ReportArt";
import PremiumLockGroup from "@/components/premium/PremiumLockGroup";
import PremiumLockFade from "@/components/premium/PremiumLockFade";
import useScrollLock from "@/hooks/useScrollLock";

/**
 * The whole locked Report screen, in one layer: the sample page (see
 * ReportSamplePage) under a light blur, one soft fade over its last third, and the
 * one lock group over that fade (see PremiumLockGroup — the same group the Insights
 * screen and the rotation card show).
 *
 * The blur is light — about 3.5px — so the page behind it is read as the screen it
 * is: the setup with the date range and the name, and under it the report itself,
 * with its purple band, its summary, its figures and its chart, in the app's own
 * colours — the light page in light mode, the darker sheet in dark mode. That
 * is the whole point of the screen: an account without Premium is meant to see what
 * it is buying. Nothing of the person's own is behind it — every value on the page
 * is made up for the picture — so a light blur hides nothing that needs hiding, and
 * the layer still takes no tap and no focus and is hidden from accessibility tools.
 *
 * The fade covers the last third only, so the top of the report stays plain to see,
 * and it is light — a lavender tint in light mode, a deep indigo in dark mode — drawn
 * by the same component the Insights lock uses (see PremiumLockFade), so the two
 * screens settle into the page at the same strength.
 *
 * It is a layer, not a route: it fills whatever positioned box it is given, so the
 * screen decides where it sits while the layer stays exactly as tall as the area
 * under the header. Nothing inside it scrolls, and while it is up the page behind
 * it is held still (see src/hooks/useScrollLock.js): the sample is a picture, so a
 * drag on it neither moves the page nor rubber-bands it.
 */
export default function ReportLockView({ onUnlock }) {
  useScrollLock();

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none select-none blur-[3.5px]">
        <ReportSamplePage />
      </div>

      <PremiumLockFade />

      {/* The group: centred on the screen both ways, on its own card (see
          PremiumLockGroup), with the screen's own 24px kept at the foot. The paper's
          band, its summary and the chart under the card are all still read around it. */}
      <div className="absolute inset-0 flex items-center justify-center px-4 py-6">
        <PremiumLockGroup
          art={<ReportArt size={150} />}
          title="Reports for your doctor"
          subtitle="Share your progress in one tap"
          onUnlock={onUnlock}
        />
      </div>
    </div>
  );
}