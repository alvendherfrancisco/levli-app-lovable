import React from "react";
import { Check } from "lucide-react";
import useDoseColors from "@/hooks/useDoseColors";
import {
  CUSTOM_MEDICATION_WARNING, allowsAnyDose, getAllowedDoses, getDoseUnit,
} from "@/lib/medicationConfig";
import { PRESCRIBER_ONLY_NOTE } from "@/lib/medicationRegimen";
import { sound } from "@/lib/sounds";
import {
  CHIP_IDLE, CHIP_ON, ERROR_TEXT, FIELD_PLAIN, HELP_IN_CARD, LABEL_TEXT,
} from "@/lib/uiStyles";

// The shared chip: one height, one pill and one 16pt text with every other chip
// in the app, plus the dark overrides this surface needs.
const NEUTRAL = `${CHIP_IDLE} dark:border-white/[0.12] dark:bg-white/[0.05] dark:text-[#E8E9F0]`;
// The chosen strength, drawn the way every other selection in Levli is drawn: a
// light indigo fill, a hairline indigo border and indigo text. The strength's
// own colour stays on the unchosen chips, as the dot the maker's pen carries.
const SELECTED = `${CHIP_ON} dark:border-indigo-500/40 dark:bg-indigo-500/10 dark:text-indigo-300`;
const INPUT = `${FIELD_PLAIN} dark:border-white/[0.12] dark:bg-white/[0.05] dark:text-[#E8E9F0]`;

/**
 * The dose: the strengths this product's label lists, as chips, with the number
 * always written on the chip and the manufacturer's own colour on the dot beside
 * it — the colour is a recognition cue and never the only signal. The chosen
 * chip is the app's own selected style, so the shape of the answer reads the
 * same here as it does on every other screen.
 *
 * "+ Other" takes an amount the prescriber directed instead. It stays optional,
 * and a typed dose is drawn as a neutral chip rather than as a labelled
 * strength. A product with no label strengths at all (compounded, peptides,
 * "Others") asks for the amount straight away.
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
        <span className="text-xs font-medium text-gray-500 dark:text-[#9A9DAE]">{unit}</span>
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
        <div className="flex flex-wrap gap-2" role="group" aria-label="Dose">
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
          <button
            type="button"
            onClick={() => { sound.tap(); onOtherChange?.(!openOther); }}
            aria-pressed={openOther}
            className={openOther ? SELECTED : NEUTRAL}
          >
            + Other
          </button>
        </div>
      )}

      {!anyDose && openOther && (
        <div className="mt-2">
          <label htmlFor="dose-other" className={`${LABEL_TEXT} mb-2 block dark:text-[#9A9DAE]`}>
            Dose your prescriber directed
          </label>
          <input
            id="dose-other"
            type="number"
            min="0"
            step="0.25"
            inputMode="decimal"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="e.g. 1.75"
            className={INPUT}
          />
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