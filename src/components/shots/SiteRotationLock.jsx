import React from "react";
import { Crown } from "lucide-react";

/**
 * The lock over the rotation chart while Levli Premium is not active.
 *
 * One compact panel rather than loose text on top of the figures: a crowned mark,
 * what the feature is for, the one button into the plans, and a quiet way to fold
 * the card down to a single row. The panel holds itself 24px clear of the preview
 * it covers, and covers all of it, so the dimmed chart behind can never be tapped
 * or panned.
 */
export default function SiteRotationLock({ onUnlock, onDismiss }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-6">
      <div className="flex w-full max-w-[300px] flex-col items-center rounded-2xl bg-white/90 p-6 text-center shadow-sm backdrop-blur-[2px] dark:bg-gray-900/90">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-500/15">
          <Crown size={22} className="text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
        </span>

        <p className="mt-4 font-bold text-gray-900 dark:text-white">See where you've injected</p>
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          Track your sites and rotate them easily.
        </p>

        <button type="button" onClick={onUnlock} className="btn-pill btn-primary mt-4 w-full">
          Unlock Premium
        </button>
        <button type="button" onClick={onDismiss} className="btn-link mt-4 text-sm">
          Not now
        </button>
      </div>
    </div>
  );
}