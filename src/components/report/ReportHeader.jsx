import React from "react";
import { ChevronLeft } from "lucide-react";
import PremiumBadge from "@/components/PremiumBadge";

/**
 * The Report screen's own header — Back, its name, and the crown pill that says
 * the screen is a Premium feature.
 *
 * It is one component because the screen has two states: the full screen, where
 * everything under it is the form and the preview, and the locked screen, where
 * everything under it is the blurred sample. Both wear the very same header, so
 * the way in and out of the screen never moves.
 *
 * `showBadge` is off on the locked screen, where the header is all an account
 * without Premium keeps: Back and the screen's name, and nothing else.
 */
export default function ReportHeader({ onBack, showBadge = true }) {
  return (
    <header
      className="w-full sticky top-0 z-30 grid items-center px-5 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800"
      style={{
        gridTemplateColumns: "1fr auto 1fr",
        paddingTop: "calc(0.75rem + env(safe-area-inset-top, 0px))",
        paddingBottom: "0.75rem",
      }}
    >
      <button
        onClick={onBack}
        aria-label="Back"
        className="justify-self-start flex items-center gap-1 min-w-[44px] min-h-[44px] text-indigo-600 dark:text-indigo-400"
      >
        <ChevronLeft size={22} /><span className="font-medium">Back</span>
      </button>
      <div className="flex items-center justify-center gap-2">
        <h1 className="whitespace-nowrap text-[18px] font-semibold text-gray-900 dark:text-white">Report</h1>
        {showBadge && <PremiumBadge />}
      </div>
      {/* The header carries no second download action: the one main button at the
          foot of the screen is the only way the report is exported. */}
      <span aria-hidden="true" />
    </header>
  );
}