import React from "react";
import { sound } from "@/lib/sounds";

/**
 * One measurement preference: its label on the left, a two-segment control of
 * equal width on the right.
 *
 * Every control is the same width, so their left and right edges line up down
 * the section, and each segment takes half of it whatever the label says. The
 * whole row is the same height as a 44pt touch target, built from theme tokens
 * rather than fixed colours.
 */
export default function SegmentedControl({ label, value, options, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 min-h-[44px]">
      <span className="text-sm font-semibold text-foreground/80">{label}</span>
      <div
        role="group"
        aria-label={label}
        className="flex w-40 h-11 flex-shrink-0 rounded-xl border border-border bg-muted p-1"
      >
        {options.map((option) => {
          const on = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={on}
              onClick={() => { sound.tap(); onChange(option.value); }}
              className={`flex-1 rounded-lg text-sm font-semibold transition-colors ${
                on ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}