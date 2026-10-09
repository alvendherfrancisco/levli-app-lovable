import React from "react";
import { Check } from "lucide-react";
import { SCHEDULE } from "@/lib/medicationSchedule";
import { sound } from "@/lib/sounds";
import { CHIP_IDLE, CHIP_ON, CHIP_WRAP, LABEL, LIST_TEXT } from "@/lib/uiStyles";

/**
 * How often the medication is taken, as an even two-column grid of pill chips —
 * the four regular frequencies, then "As directed by my prescriber" on a line of
 * its own. Every chip is the same height and the same width within its column,
 * so the choice reads as one tidy block.
 *
 * The chosen chip is the app's own selected style, drawn from the shared tokens:
 * a light indigo fill, a hairline indigo border and indigo text, with a small
 * tick. The group is required, so tapping the chosen chip again changes nothing.
 */
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
              className={`${CHIP_WRAP} w-full ${LIST_TEXT} leading-tight ${selected ? CHIP_ON : CHIP_IDLE} ${full ? "col-span-2" : ""}`}
            >
              {selected && <Check size={14} strokeWidth={2.5} className="flex-shrink-0" aria-hidden="true" />}
              <span className="min-w-0">{o.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}