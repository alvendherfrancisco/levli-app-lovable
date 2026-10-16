import React from "react";
import { Crown } from "lucide-react";

/**
 * The small "Premium" mark a locked card wears in its header: a soft indigo pill,
 * the crown and one word. Never a solid fill, so it reads as a label on the card
 * rather than a button to press.
 */
export default function PremiumBadge() {
  return (
    <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
      <Crown size={11} aria-hidden="true" />
      Premium
    </span>
  );
}