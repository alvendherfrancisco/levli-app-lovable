import React from "react";
import { Check } from "lucide-react";
import { LABEL } from "@/lib/authFormStyles";
import { SCHEDULE } from "@/lib/medicationSchedule";
import { sound } from "@/lib/sounds";

/**
 * How often the medication is taken, as an even two-column grid of pill chips —
 * the four regular frequencies, then "As directed by my prescriber" on a line of
 * its own. Every chip is the same height and the same width within its column,
 * so the choice reads as one tidy block.
 *
 * The chosen chip is the app's own selected style: light indigo fill, an indigo
 * hairline and indigo text, with a small tick. The group is required, so tapping
 * the chosen chip again changes nothing.
 */
const CHIP =
  "flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-full px-3 text-center text-[13px] font-medium leading-tight transition-colors active:scale-[0.98]";
const UNSELECTED = "border border-gray-200 bg-white text-gray-900 hover:border-gray-300";
const SELECTED = "border-[1.5px] border-indigo-500 bg-indigo-50 text-indigo-700";

export default function FrequencyGrid({ label = "How often", options = [], value, onChange }) {
  return (
    <div>
      {label && <p className={LABEL}>{label}</p>}
      <div role="group" aria-label={label} className="grid grid-cols-2 gap-2">
        {options.map((o) => {
          const selected = o.value === value;
          const full = o.value === SCHEDULE.AS_DIRECTED;
          return (
            <button
              key={String(o.value)}
              type="button"
              onClick={() => {
                if (selected) return;
                sound.tap();
                onChange(o.value);
              }}
              aria-pressed={selected}
              className={`${CHIP} ${selected ? SELECTED : UNSELECTED} ${full ? "col-span-2" : ""}`}
            >
              {selected && <Check size={13} strokeWidth={3} className="flex-shrink-0" aria-hidden="true" />}
              <span className="min-w-0">{o.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}