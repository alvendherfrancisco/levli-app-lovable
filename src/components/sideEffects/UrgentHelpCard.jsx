import React from "react";
import { AlertTriangle, ChevronDown } from "lucide-react";
import { URGENT_HELP_ITEMS, URGENT_HELP_CTA, URGENT_HELP_SOURCE } from "@/lib/sideEffectSymptoms";

/**
 * The persistent "When to get urgent help" card. Plain language, no diagnosis,
 * and it opens on tap. `highlight` is used when a severe symptom was just
 * logged, so the list is shown straight away.
 */
export default function UrgentHelpCard({ open, onToggle, highlight = false }) {
  return (
    <div className={`rounded-2xl border p-3 ${
      highlight
        ? "bg-red-50 dark:bg-red-500/10 border-red-300 dark:border-red-500/40"
        : "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/25"
    }`}>
      <button onClick={onToggle} className="w-full flex items-center justify-between gap-2 text-left">
        <span className={`flex items-center gap-2 text-sm font-semibold ${
          highlight ? "text-red-700 dark:text-red-300" : "text-amber-800 dark:text-amber-300"
        }`}>
          <AlertTriangle size={16} className="flex-shrink-0" />
          When to get urgent help
        </span>
        <ChevronDown size={16} className={`flex-shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {highlight && (
        <p className="text-xs mt-2 text-red-700 dark:text-red-300">
          You logged a severe symptom. {URGENT_HELP_CTA}
        </p>
      )}

      {open && (
        <div className="mt-3">
          <ul className="space-y-2">
            {URGENT_HELP_ITEMS.map((item) => (
              <li key={item.text} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-current mt-1.5 flex-shrink-0 text-amber-500" />
                <span className="text-xs text-gray-700 dark:text-[#E8E9F0] leading-relaxed">
                  {item.text}
                </span>
              </li>
            ))}
          </ul>
          <p className={`text-sm font-semibold mt-3 ${highlight ? "text-red-700 dark:text-red-300" : "text-amber-800 dark:text-amber-300"}`}>
            {URGENT_HELP_CTA}
          </p>
          <p className="text-[11px] mt-1.5 text-gray-500 dark:text-[#9A9DAE] leading-relaxed">{URGENT_HELP_SOURCE}</p>
        </div>
      )}
    </div>
  );
}