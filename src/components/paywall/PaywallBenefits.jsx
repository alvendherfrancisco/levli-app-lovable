import React from "react";
import { Activity, FileText, PersonStanding } from "lucide-react";
import { PREMIUM_BENEFITS } from "@/lib/premiumPlans";

/** Each benefit's own tile icon, by the id the benefit is filed under. */
const ICONS = { reports: FileText, sites: PersonStanding, insights: Activity };

/**
 * The three things Premium opens, one quiet row each: a small rounded tile with
 * the icon, the label beside it, and a muted line under the label. Nothing longer
 * than that — the screen has three of these to read, not an essay.
 */
export default function PaywallBenefits() {
  return (
    <ul className="mt-6 space-y-3">
      {PREMIUM_BENEFITS.map(({ id, label, detail }) => {
        const Icon = ICONS[id] || FileText;
        return (
          <li key={id} className="flex items-center gap-3">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/15">
              <Icon size={17} className="text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-gray-900 dark:text-white">{label}</span>
              <span className="block text-xs text-gray-500 dark:text-[#9A9DAE]">{detail}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}