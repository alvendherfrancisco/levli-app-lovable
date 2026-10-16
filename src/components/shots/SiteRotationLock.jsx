import React from "react";

/**
 * The lock over the rotation chart while Levli Premium is not active.
 *
 * One compact panel over the blurred preview it belongs to, and nothing else: the
 * app's own icon, what the feature is for, and the single way into the plans. It
 * keeps itself inside the card's own 16px margins, sits centred on the preview,
 * and follows the device's light/dark setting — the icon is the app's full-colour
 * artwork in both, never tinted.
 *
 * There is no way to put it away: the preview stays visible behind it so the
 * feature can be seen for what it is, and the way to it is never folded down to a
 * row.
 */
export default function SiteRotationLock({ onUnlock }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-4">
      <div className="flex w-full flex-col items-center rounded-2xl bg-white/90 p-6 text-center shadow-sm backdrop-blur-[2px] dark:bg-gray-900/90">
        <img
          src="/assets/brand/levli-icon-96.png?v=2"
          alt=""
          width={48}
          height={48}
          className="h-12 w-12 rounded-xl"
        />

        <p className="mt-4 font-bold text-gray-900 dark:text-white">See where you've injected</p>
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          Track your sites and rotate them easily.
        </p>

        <button type="button" onClick={onUnlock} className="btn-pill btn-primary mt-4 w-full">
          Unlock
        </button>
      </div>
    </div>
  );
}