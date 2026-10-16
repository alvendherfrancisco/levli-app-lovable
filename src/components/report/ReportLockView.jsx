import React from "react";
import ReportSamplePage from "@/components/report/ReportSamplePage";
import ReportLock from "@/components/report/ReportLock";

/**
 * The whole locked Report screen, in one layer: the sample page (see
 * ReportSamplePage) under a light blur, one soft fade over its last third, and the
 * one lock group over that fade.
 *
 * The blur is light — about 3.5px — so the page behind it is read as the screen it
 * is: the setup with the date range and the name, and under it the report itself,
 * a white page with its purple band, its summary, its figures and its chart. That
 * is the whole point of the screen: an account without Premium is meant to see what
 * it is buying. Nothing of the person's own is behind it — every value on the page
 * is made up for the picture — so a light blur hides nothing that needs hiding, and
 * the layer still takes no tap and no focus and is hidden from accessibility tools.
 *
 * The fade covers the last third only, so the top of the report stays plain to see:
 * a light lavender tint in light mode, a deep indigo in dark mode, and the last
 * stretch settling into that tint's own solid colour so the sample's cut edge is
 * never seen.
 *
 * It is a layer, not a route: it fills whatever positioned box it is given, so the
 * screen decides where it sits while the layer stays exactly as tall as the area
 * under the header. Nothing inside it scrolls.
 */
export default function ReportLockView({ onUnlock }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none select-none blur-[3.5px]">
        <ReportSamplePage />
      </div>

      {/* The fade: transparent for the top two thirds, then the tint arriving
          through the last one. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-b from-transparent via-white/25 to-indigo-50/70 dark:via-indigo-950/30 dark:to-indigo-950/70"
      />
      {/* The last stretch: the sample page is longer than the screen, so it is
          clipped at the bottom edge, and these few centimetres settle into the
          tint's solid colour so the cut is never seen. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-indigo-50 dark:to-indigo-950"
      />

      {/* The group: centred on the screen's own axis, a step below the middle so the
          paper's band and its summary stay in view above it (the top padding is what
          moves it), with the screen's own 24px kept at the foot. */}
      <div className="absolute inset-0 flex items-center justify-center px-4 pb-6 pt-[14vh]">
        <ReportLock onUnlock={onUnlock} />
      </div>
    </div>
  );
}