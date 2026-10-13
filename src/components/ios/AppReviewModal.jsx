import React, { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { sendIOSEvent } from "@/lib/iosBridge";
import { getLaunchCount } from "@/lib/appReview";

/**
 * The in-app "rate Levli" card, opened once per session when iOS reports 5+
 * launches (see src/lib/appReview.js).
 */
export default function AppReviewModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const show = () => {
      setOpen(true);
      sendIOSEvent("wanillajs.event.review.modalShown", { launchCount: getLaunchCount() });
    };
    window.addEventListener("levli:open-review-modal", show);
    return () => window.removeEventListener("levli:open-review-modal", show);
  }, []);

  if (!open) return null;

  const dismiss = (via) => {
    sendIOSEvent("wanillajs.event.review.modalDismissed", { launchCount: getLaunchCount(), via });
    setOpen(false);
  };
  const review = () => {
    sendIOSEvent("wanillajs.event.review.openAppStore", { launchCount: getLaunchCount() });
    setOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 px-6 overlay-lock" onClick={() => dismiss("backdrop")}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-title"
        className="confirm-card w-full max-w-sm rounded-3xl bg-white p-6 text-center card-line dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-500/15">
          <Star className="h-6 w-6 text-indigo-600 dark:text-indigo-400" fill="currentColor" />
        </div>
        <h2 id="review-title" className="text-lg font-semibold text-gray-900 dark:text-white">Enjoying Levli?</h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">A quick review on the App Store helps others find the app.</p>
        <button type="button" onClick={review} className="btn-pill btn-primary mt-6 w-full">Add a review</button>
        <button type="button" onClick={() => dismiss("closeButton")} className="btn-pill btn-secondary mt-3 w-full">Not now</button>
      </div>
    </div>
  );
}