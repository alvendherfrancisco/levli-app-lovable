import React from "react";
import LevliLogo from "@/components/LevliLogo";

/**
 * The Levli mark as a premium lock's own badge: the app's droplet, at full
 * colour and never tinted, centred in a round 56px container with about 10px of
 * padding around it — so the mark is never cropped by the circle, and the circle
 * is never a square tile or a white box.
 *
 * The circle follows the device's light/dark setting, so it blends into the
 * surface it sits on in both: a pale lavender disc on a light surface, and a deep
 * indigo-to-purple gradient with a thin ring and a soft glow on a dark one. A
 * soft shadow under the droplet separates it from the circle in either mode.
 *
 * Every premium lock draws this one badge — the lock over the site-rotation
 * chart, the full-screen lock on Report, the history upsell and the shared
 * locked-card overlay — so they all read as the same mark and the screen's one
 * Unlock button stays the thing in focus. `size` takes a number of px or one of
 * the named sizes; the droplet is always 64% of the circle, which is what keeps
 * the padding in step at every size.
 */
const SIZES = { sm: 40, md: 56, lg: 64 };

export default function LevliLockIcon({ size = "md", className = "" }) {
  const px = typeof size === "number" ? size : (SIZES[size] || SIZES.md);
  const drop = Math.round(px * 0.64);

  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-violet-100 dark:bg-gradient-to-br dark:from-indigo-500 dark:to-violet-600 dark:shadow-[0_0_20px_rgba(139,92,246,0.45)] dark:ring-1 dark:ring-violet-400/40 ${className}`}
      style={{ width: px, height: px }}
    >
      <LevliLogo
        size={drop}
        className="drop-shadow-[0_1px_3px_rgba(0,0,0,0.18)] dark:drop-shadow-[0_2px_5px_rgba(0,0,0,0.4)]"
      />
    </span>
  );
}