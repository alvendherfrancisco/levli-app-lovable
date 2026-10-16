import React, { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import InsightSheet from "@/components/insights/InsightSheet";
import { sound } from "@/lib/sounds";

/**
 * Which medication the level card draws, when the account holds more than one:
 * the name in hand in a small pill beside the card's title, and the medications
 * the app can draw listed over the page when it is tapped. The one in hand is the
 * row marked, and choosing another closes the list and redraws the graph.
 */
export default function LevelMedicationPicker({ options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const current = options.find((option) => option.id === value) || options[0];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={`Medication: ${current?.name}`}
        className="btn-pill btn-pill-sm btn-secondary min-w-0 max-w-[48%] gap-1"
      >
        <span className="truncate">{current?.name}</span>
        <ChevronDown size={15} aria-hidden="true" className="shrink-0 text-gray-400" />
      </button>

      <InsightSheet open={open} onClose={() => setOpen(false)} title="Medication">
        <ul className="space-y-2">
          {options.map((option) => {
            const active = option.id === current?.id;
            return (
              <li key={option.id}>
                <button
                  type="button"
                  onClick={() => { sound.tap(); onChange(option.id); setOpen(false); }}
                  aria-pressed={active}
                  className={`flex w-full min-h-[52px] items-center gap-3 rounded-2xl border px-4 text-left text-[16px] ${
                    active
                      ? "border-[1.5px] border-indigo-300 bg-indigo-50 font-semibold text-indigo-700 dark:border-indigo-500/40 dark:bg-indigo-500/20 dark:text-indigo-300"
                      : "border-gray-200 text-gray-700 dark:border-white/[0.12] dark:text-[#E8E9F0]"
                  }`}
                >
                  <span className="min-w-0 flex-1 break-words">{option.name}</span>
                  {active && <Check size={18} className="shrink-0" aria-hidden="true" />}
                </button>
              </li>
            );
          })}
        </ul>
      </InsightSheet>
    </>
  );
}