import React from "react";
import ReportArt from "@/components/report/ReportArt";
import { SUBTITLE } from "@/lib/uiStyles";

/**
 * The one lock group the Report screen shows while Levli Premium is not active:
 * the report illustration in the onboarding's own manner (see ReportArt, 96px
 * wide over its soft purple glow), one headline, one muted line, and the app's
 * own primary pill under them.
 *
 * The spacing is the group's own: 12px between the illustration, the headline and
 * the line, and 16px above the button, which is full width within the group. The
 * group ends there: the screen's privacy line belongs to the report itself, so an
 * account with Premium reads it above the download button, and the locked screen
 * carries no line of its own under the button.
 *
 * It sits over the blurred sample page (see ReportLockView), so it is the only
 * thing on the screen that can be pressed. There is no way to put it away: the
 * blur stays, and the one action is the way into the plans.
 */
export default function ReportLock({ onUnlock }) {
  return (
    <div className="relative flex w-full max-w-[320px] flex-col items-center text-center">
      <ReportArt size={96} />
      <h3 className="mt-3 text-[20px] font-semibold leading-tight text-gray-900 dark:text-white">
        Reports for your doctor
      </h3>
      <p className={`${SUBTITLE} mt-3`}>Share your progress in one tap</p>
      <button type="button" onClick={onUnlock} className="btn-pill btn-primary mt-4 w-full">
        Unlock
      </button>
    </div>
  );
}