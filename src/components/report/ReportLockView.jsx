import React from "react";
import ReportSamplePage from "@/components/report/ReportSamplePage";
import ReportLock from "@/components/report/ReportLock";

/**
 * The whole locked Report screen, in one layer: the sample page (see
 * ReportSamplePage) held under a single continuous blur, one soft scrim fading
 * it into the page's own surface towards the foot, and the one lock group
 * centred over it.
 *
 * It is a layer, not a route: it fills whatever positioned box it is given, so
 * the screen decides where it sits while the layer stays exactly as tall as the
 * area under the header. Nothing inside it scrolls, and the sample page is
 * clipped by that box's edge — with the scrim reaching the page's surface
 * exactly there, a long sample simply fades out rather than leaving empty space
 * under the group.
 *
 * The blocked page takes no tap and no focus: the blurred layer is inert and the
 * group carries the only control on the screen.
 */
export default function ReportLockView({ onUnlock }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none select-none blur-[5px]">
        <ReportSamplePage />
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-b from-transparent via-gray-50/80 to-gray-50 dark:via-gray-950/80 dark:to-gray-950"
      />

      <div className="absolute inset-0 flex items-center justify-center px-4">
        <ReportLock onUnlock={onUnlock} />
      </div>
    </div>
  );
}