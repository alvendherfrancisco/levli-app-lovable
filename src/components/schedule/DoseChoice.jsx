import React from "react";
import { Check, Plus } from "lucide-react";
import useDoseColors from "@/hooks/useDoseColors";
import {
  CUSTOM_MEDICATION_WARNING, allowsAnyDose, getAllowedDoses, getDoseUnit,
} from "@/lib/medicationConfig";
import { PRESCRIBER_ONLY_NOTE } from "@/lib/medicationRegimen";
import { sound } from "@/lib/sounds";
import {
  CHIP_IDLE, CHIP_ON, CHIP_WRAP, ERROR_TEXT, FIELD_PLAIN, FIELD_TRAILING,
  HELP_IN_CARD, LABEL_TEXT,
} from "@/lib/uiStyles";

// Every chip in this card is the app's own pill — one height, one 16pt label and
// one padding, exactly as the "How often" options are drawn. The dose chips sit
// in an even three-column grid, so no chip is squeezed around its own number.
const NEUTRAL = `${CHIP_WRAP} w-full ${CHIP_IDLE} dark:border-white/[0.12] dark:bg-white/[0.05] dark:text-[#E8E9F0]`;
// The chosen strength, drawn the way every other selection in Levli is drawn: a
// light indigo fill, a hairline indigo border and indigo text. The strength's
// own colour stays on the unchosen chips, as the dot the maker's pen carries.
const SELECTED = `${CHIP_WRAP} w-full ${CHIP_ON} dark:border-indigo-500/40 dark:bg-indigo-500/10 dark:text-indigo-300`;
// The add option: the same pill and height, drawn as an invitation — a dashed
// hairline and grey text — rather than as an answer.
const OTHER = `${CHIP_WRAP} w-full border border-dashed border-gray-300 bg-white text-gray-500 hover:border-gray-400 dark:border-white/[0.16] dark:bg-white/[0.03] dark:text-[#9A9DAE]`;
const INPUT = `${FIELD_PLAIN} dark:border-white/[0.12] dark:bg-white/[0.05] dark:text-[#E8E9F0]`;

/**
 * The dose: the strengths this product's label lists, as chips, with the number
 * always written on the chip and the manufacturer's own colour on the dot beside
 * it — the colour is a recognition cue and never the only signal. The chosen
 * chip is the app's own selected style, so the shape of the answer reads the
 * same here as it does on every other screen.
 *
 * "+ Other" takes an amount the prescriber directed instead. It sits in the grid
 * as the last pill, bordered with a dashed hairline, and tapping it turns that
 * pill into the amount field with the unit inside it on the right. A typed dose
 * stays optional and is never drawn as a labelled strength. A product with no
 * label strengths at all (compounded, peptides, "Others") asks for the amount
 * straight away.
 */
export default function DoseChoice({ medication, value, onChange, other = false, onOtherChange, error }) {
  const { color } = useDoseColors();
  const strengths = getAllowedDoses(medication);
  const unit = getDoseUnit(medication);
  const typed = String(value ?? "").trim();
  const isListed = strengths.some((d) => String(d.value) === typed);
  // "Other" is open when it was tapped, or when the dose in hand is not one of
  // the product's own strengths — an entry being edited, for instance.
  const openOther = other || (typed !== "" && !isListed);
  const anyDose = strengths.length === 0 || allowsAnyDose(medication);

  const pick = (dose) => {
    sound.tap();
    onOtherChange?.(false);
    onChange(String(dose));
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className={`${LABEL_TEXT} dark:text-gray-300`}>Dose</span>
        {/* The unit is always on screen beside the amounts. */}
        <span className={`${HELP_IN_CARD} dark:text-[#9A9DAE]`}>{unit}</span>
      </div>

      {anyDose ? (
        <div>
          <label htmlFor="dose-other" className={`${LABEL_TEXT} mb-2 block dark:text-[#9A9DAE]`}>
            Dose from your prescription
          </label>
          <input
            id="dose-other"
            type="number"
            min="0"
            step="0.25"
            inputMode="decimal"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="e.g. 0.5"
            className={INPUT}
          />
        </div>
      ) : (
        // The strengths as an even three-column grid of pill chips — every chip
        // the same width and height as the ones beside it, with the add option in
        // the last cell. They wrap onto a second row at the same gap.
        <div className="grid grid-cols-3 gap-2" role="group" aria-label="Dose">
          {strengths.map((d) => {
            const selected = !openOther && typed === String(d.value);
            return (
              <button
                key={d.value}
                type="button"
                onClick={() => pick(d.value)}
                aria-pressed={selected}
                aria-label={`${d.value} ${unit}`}
                className={selected ? SELECTED : NEUTRAL}
              >
                {selected ? (
                  <Check size={14} strokeWidth={2.5} aria-hidden="true" />
                ) : (
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: color(medication, d.value) }}
                    aria-hidden="true"
                  />
                )}
                {d.value}
              </button>
            );
          })}
          {openOther ? (
            // The add option has become the field itself: the amount with the
            // unit inside it, on a line of its own inside the same grid.
            <div className="col-span-3">
              <label htmlFor="dose-other" className={`${LABEL_TEXT} mb-2 block dark:text-[#9A9DAE]`}>
                Dose your prescriber directed
              </label>
              <div className="relative">
                <input
                  id="dose-other"
                  type="number"
                  min="0"
                  step="0.25"
                  inputMode="decimal"
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  placeholder="e.g. 0.5"
                  className={`${FIELD_TRAILING} dark:border-white/[0.12] dark:bg-white/[0.05] dark:text-[#E8E9F0]`}
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[13px] text-gray-400"
                >
                  {unit}
                </span>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => { sound.tap(); onOtherChange?.(true); }}
              className={OTHER}
            >
              <Plus size={14} strokeWidth={2.5} aria-hidden="true" />
              Other
            </button>
          )}
        </div>
      )}

      {!anyDose && typed !== "" && !isListed && (
        <p className={`${HELP_IN_CARD} mt-2 dark:text-[#9A9DAE]`}>{CUSTOM_MEDICATION_WARNING}</p>
      )}
      <p className={`${HELP_IN_CARD} mt-2 dark:text-[#9A9DAE]`}>{PRESCRIBER_ONLY_NOTE}</p>
      {error && <p className={`${ERROR_TEXT} mt-2 dark:text-red-400`}>{error}</p>}
    </div>
  );
}