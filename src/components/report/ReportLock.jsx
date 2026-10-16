import React from "react";
import ReportArt from "@/components/report/ReportArt";
import { SUBTITLE } from "@/lib/uiStyles";

/**
 * The lock over the report preview while Levli Premium is not active.
 *
 * It is the onboarding's own page in miniature — its artwork slot, its headline
 * type, one muted line and its main button, 16px apart, with the illustration
 * 120px wide and a purple glow behind it — the same group the rotation lock puts
 * over its chart (see src/components/shots/SiteRotationLock.jsx), so the two
 * locked screens read as one thing.
 *
 * The scrim that fades the preview into the card is drawn by the preview itself
 * (see ReportPreview's `locked`), because only it knows the card's own surface in
 * the current theme; this is just the group that sits on top of it, held to the
 * card's margins. There is no way to put it away: the preview stays visible
 * behind it, and the only action is the way into the plans.
 */
export default function ReportLock({ onUnlock }) {
  return (
    <div className="relative flex w-full max-w-[320px] flex-col items-center text-center">
      {/* The group is the whole lock: the artwork at 88px, the headline and one
          muted line 12px apart, and the app's own primary pill 16px under them,
          full width — small enough that the four of them sit together in the
          preview's lower part without crowding it. */}
      <ReportArt size={88} />
      <h3 className="mt-3 text-[20px] font-semibold leading-tight text-auth-heading">Reports for your doctor</h3>
      <p className={`${SUBTITLE} mt-3`}>Share your progress in one tap</p>
      <button type="button" onClick={onUnlock} className="btn-pill btn-primary mt-4 w-full">
        Unlock
      </button>
    </div>
  );
}