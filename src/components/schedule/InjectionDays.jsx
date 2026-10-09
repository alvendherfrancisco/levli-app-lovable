import React from "react";
import { LABEL } from "@/lib/authFormStyles";
import { sound } from "@/lib/sounds";
import { WEEKDAY_NAMES, WEEKDAY_SHORT, daysAreClose } from "@/lib/medicationSchedule";

/**
 * The day (or the two days) a medication is taken. Only ever shown for a
 * schedule that runs on weekdays — a daily medicine has no day to pick, and an
 * every-X-days or as-directed one has no weekday at all.
 *
 * The letters S M T W T F S are ambiguous, so each button carries the full day
 * name as its accessible label and announces whether it is chosen.
 *
 * The row is drawn as the card's own chips, not a second style: the label is the
 * same label every other field in the card uses, and the days are seven round
 * chips — white with a hairline border when unchosen, light indigo with an
 * indigo hairline when chosen, exactly like the "How often" chips above them.
 * They sit on an even spread, each the same size, sized to the width the card
 * actually has so the row never reaches past its padding.
 */
export default function InjectionDays({ count, value = [], onChange }) {
  const chosen = value || [];
  const twoDays = count === 2;

  const tap = (index) => {
    sound.tap();
    if (chosen.includes(index)) {
      onChange(chosen.filter((d) => d !== index));
      return;
    }
    if (chosen.length < count) {
      onChange([...chosen, index].sort((a, b) => a - b));
      return;
    }
    // Both days are already taken: the older pick gives way to the new one.
    onChange([...chosen.slice(1), index].sort((a, b) => a - b));
  };

  return (
    <div>
      <p className={`${LABEL} dark:text-gray-300`}>
        {twoDays ? "Injection days" : "Injection day"}
      </p>
      <div className="flex justify-between gap-1" role="group" aria-label={twoDays ? "Injection days" : "Injection day"}>
        {WEEKDAY_SHORT.map((letter, index) => {
          const selected = chosen.includes(index);
          return (
            <button
              key={WEEKDAY_NAMES[index]}
              type="button"
              onClick={() => tap(index)}
              aria-pressed={selected}
              aria-label={WEEKDAY_NAMES[index]}
              className={`flex aspect-square max-w-[44px] flex-1 items-center justify-center rounded-full text-[14px] font-medium transition-colors active:scale-[0.98] ${
                selected
                  ? "border-[1.5px] border-indigo-500 bg-indigo-50 text-indigo-700"
                  : "border border-gray-200 bg-white text-gray-900 hover:border-gray-300"
              }`}
            >
              {letter}
            </button>
          );
        })}
      </div>

      {twoDays && chosen.length === 2 && (
        <p className="text-xs text-gray-500 dark:text-[#9A9DAE] mt-2">
          Day 1: {WEEKDAY_NAMES[chosen[0]]} · Day 2: {WEEKDAY_NAMES[chosen[1]]}
        </p>
      )}

      {twoDays && chosen.length === 2 && daysAreClose(chosen[0], chosen[1]) && (
        <p className="text-xs text-orange-600 dark:text-orange-400 mt-1.5 leading-snug">
          Those two days sit next to each other. Check the plan your prescriber gave you.
        </p>
      )}
    </div>
  );
}