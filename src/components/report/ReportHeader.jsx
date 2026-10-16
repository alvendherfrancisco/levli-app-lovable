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
 *
 * `titleRight` is that locked screen's own arrangement: the name is right-aligned
 * on the header's right edge, against the same 16px margin the rest of the screen
 * is set on — the setup card, the preview and the lock group all sit on it — with
 * Back alone on the left. The name keeps the same type, the same height and the
 * same vertical alignment it has when it is centred, so only its side changes. An
 * account with Premium keeps the name centred beside its crown pill.
 */
export default function ReportHeader({ onBack, showBadge = true, titleRight = false }) {
  const title = (
    <h1 className="whitespace-nowrap text-[18px] font-semibold text-gray-900 dark:text-white">Report</h1>
  );

  return (
    <header
      className={`w-full sticky top-0 z-30 items-center bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 ${
        titleRight ? "flex justify-between px-4" : "grid px-5"
      }`}
      style={{
        ...(titleRight ? null : { gridTemplateColumns: "1fr auto 1fr" }),
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

      {titleRight ? title : (
        <div className="flex items-center justify-center gap-2">
          {title}
          {showBadge && <PremiumBadge />}
        </div>
      )}

      {/* The header carries no second download action: the one main button at the
          foot of the screen is the only way the report is exported. */}
      {!titleRight && <span aria-hidden="true" />}
    </header>
  );
}