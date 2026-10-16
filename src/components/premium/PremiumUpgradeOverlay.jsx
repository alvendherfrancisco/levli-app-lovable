import React, { useId } from "react";
import usePremiumPlans from "@/hooks/usePremiumPlans";
import { PREMIUM_OVERLAY_CONTENT } from "@/components/premium/premiumOverlay";

/**
 * The one Premium upgrade overlay: a small centred card over the page it belongs
 * to, dimmed just enough to hold the card off it.
 *
 * It is drawn with the app's own dialog parts — the same card surface, hairline,
 * corner radius and entry animation the confirmation dialog uses (see
 * src/components/ConfirmDialog.jsx and the .confirm-card rules in src/index.css),
 * and the same primary pill as every other action — so it reads as part of the app
 * rather than as a promotion laid over it.
 *
 * The order is the one the eye should take: the mark, the headline, one line
 * under it, the action, and the terms last. Nothing here is large: a 48px mark
 * with a 24px indigo glyph, a 20px headline and a single line of support — the
 * headline carries the message, not the artwork.
 *
 * The amount and the terms are read from the product's own prices while the card
 * is up (see src/hooks/usePremiumPlans.js and src/lib/premiumPlans.js), so the
 * card carries no price, no discount and no trial of its own and can never
 * disagree with the paywall. Until they arrive — or if they cannot be read at all
 * — the line is simply not shown, and nothing is invented in its place.
 *
 * `onUnlock` is the screen's own way into the plans (the app's paywall, opened
 * through the subscription context — never a second purchase path). It is absent
 * on a record read on someone else's behalf: a caregiver follows the owner's plan
 * and there is nothing to sell them, so the card then carries its words alone and
 * no button and no terms.
 *
 * It is a layer over its own box, not a route: the box it is given decides where
 * the dim ends, so the screen's own header, its back button and the bottom tab bar
 * all stay as they are — which is also how the overlay is left when it is not
 * wanted. The card keeps clear of the safe areas at both ends, and scrolls inside
 * itself only if a larger system text size makes it taller than the room it has.
 */
export default function PremiumUpgradeOverlay({ variant, onUnlock }) {
  const content = PREMIUM_OVERLAY_CONTENT[variant] || PREMIUM_OVERLAY_CONTENT.insights;
  const { Icon, headline, description } = content;
  const uid = useId();

  // The prices are asked for only when there is something to price — a card with
  // no button needs none.
  const { plans } = usePremiumPlans(!!onUnlock);
  const terms = plans[0]?.terms || "";

  return (
    <div
      className="absolute inset-0 flex items-center justify-center px-6 py-6"
      style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))" }}
    >
      {/* The dim: enough to lift the card off the page behind it and no more. No
          second blur is added here — the page keeps its own light blur alone. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-black/25 dark:bg-black/50" />

      <div
        role="dialog"
        aria-labelledby={`${uid}-title`}
        aria-describedby={`${uid}-desc`}
        className="confirm-card sheet-lock relative flex max-h-full w-full max-w-[360px] flex-col overflow-y-auto rounded-3xl border border-gray-200 bg-white p-6 text-center shadow-2xl dark:border-white/10 dark:bg-[#16181f] dark:shadow-[0_24px_60px_rgba(0,0,0,0.6)]"
      >
        <span className="mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-500/15">
          <Icon size={24} className="text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
        </span>

        <h2 id={`${uid}-title`} className="mt-4 text-xl font-bold leading-snug text-gray-900 dark:text-white">
          {headline}
        </h2>
        <p id={`${uid}-desc`} className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
          {description}
        </p>

        {onUnlock && (
          <>
            <button type="button" onClick={onUnlock} className="btn-pill btn-primary mt-6 w-full">
              Unlock Premium
            </button>
            {/* What the plan actually costs and what it renews at, in the product's
                own words — or nothing at all. */}
            {terms && <p className="mt-3 text-xs leading-relaxed text-gray-500 dark:text-gray-400">{terms}</p>}
          </>
        )}
      </div>
    </div>
  );
}