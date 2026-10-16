import React from "react";
import ReportSamplePage from "@/components/report/ReportSamplePage";
import PremiumUpgradeOverlay from "@/components/premium/PremiumUpgradeOverlay";

/**
 * The locked Report screen: the sample report (see ReportSamplePage) under a light
 * blur, with the one Premium upgrade overlay over it (see PremiumUpgradeOverlay).
 *
 * The blur is only 2px, so the page behind it is read as the screen it is — the
 * setup with the date range and the name, and under it the report itself: a white
 * page with its purple band, its summary, its figures and its chart. Nothing of the
 * person's own is behind it — every value on the page is made up for the picture —
 * so a light blur hides nothing that needs hiding, and the layer still takes no tap
 * and no focus and is hidden from accessibility tools.
 *
 * It is a layer, not a route: it fills whatever positioned box it is given, so the
 * screen decides where it sits while the layer stays exactly as tall as the area
 * under the header. Nothing inside it scrolls.
 */
export default function ReportLockView({ onUnlock }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none select-none blur-[2px]">
        <ReportSamplePage />
      </div>

      <PremiumUpgradeOverlay variant="report" onUnlock={onUnlock} />
    </div>
  );
}