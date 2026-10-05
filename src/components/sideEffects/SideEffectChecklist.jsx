import React from "react";
import { Check } from "lucide-react";
import { SIDE_EFFECT_SYMPTOMS } from "@/lib/sideEffectSymptoms";

/** The side-effect checklist — tap any number of symptoms. */
export default function SideEffectChecklist({ selected = [], onToggle }) {
  return (
    <div className="flex flex-wrap gap-2">
      {SIDE_EFFECT_SYMPTOMS.map((s) => {
        const active = selected.includes(s.key);
        return (
          <button
            key={s.key}
            onClick={() => onToggle(s.key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${
              active
                ? "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-500/30"
                : "bg-white dark:bg-white/[0.05] text-gray-500 dark:text-[#9A9DAE] border-gray-200 dark:border-white/[0.1]"
            }`}
          >
            {active && <Check size={13} />}
            {s.label}
          </button>
        );
      })}
    </div>
  );
}