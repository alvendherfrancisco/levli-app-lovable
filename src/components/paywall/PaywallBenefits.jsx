import React from "react";
import { Check } from "lucide-react";
import { PREMIUM_BENEFITS } from "@/lib/premiumPlans";

/**
 * What Premium gives you, as a plain checklist: a check in a soft indigo circle
 * and one short line each — no icon grid, and nothing to read twice.
 */
export default function PaywallBenefits() {
  return (
    <ul className="mt-6 space-y-3">
      {PREMIUM_BENEFITS.map((benefit) => (
        <li key={benefit} className="flex items-start gap-2.5">
          <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-500/15">
            <Check size={12} strokeWidth={3} className="text-indigo-600 dark:text-indigo-300" aria-hidden="true" />
          </span>
          <span className="text-sm text-gray-700 dark:text-[#E8E9F0]">{benefit}</span>
        </li>
      ))}
    </ul>
  );
}