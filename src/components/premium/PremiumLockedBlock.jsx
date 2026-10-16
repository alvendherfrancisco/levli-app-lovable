import React from "react";
import { useSubscription } from "@/lib/SubscriptionContext";
import PremiumLockGroup from "@/components/premium/PremiumLockGroup";

/**
 * One locked block of a card: what it draws while Levli Premium is not active.
 *
 * The children are the block's own preview — sample shapes, never the person's
 * real values (see the previews in src/components/insights/) — held under a soft
 * blur, with one scrim fading from nothing at the top to the card's own surface at
 * the bottom, and the lock group over it.
 *
 * The preview is inert: no tap, no selection, and — because only the Unlock button
 * takes touches — no scroll is ever caught by the layer, so the page scrolls over
 * a locked card exactly as it does over a free one. Nothing is put away and
 * nothing is dismissed: the preview stays behind the lock, which is what the
 * blur is for.
 */
export default function PremiumLockedBlock({
  children, full = false, art = null, headline = "", line = "", unlockable = true, className = "",
}) {
  const { openPaywall } = useSubscription();

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div aria-hidden="true" className="pointer-events-none select-none opacity-70 blur-[3px]">
        {children}
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-white/70 to-white dark:via-gray-900/70 dark:to-gray-900"
      />

      <PremiumLockGroup
        full={full}
        art={art}
        headline={headline}
        line={line}
        onUnlock={unlockable ? openPaywall : null}
      />
    </div>
  );
}