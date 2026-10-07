import React from "react";

/**
 * The two optional fields of a custom ("Others") medication entry:
 *
 *   Generic name    — what the active ingredient is called, if the user knows
 *                     it. Optional: nothing is asked for that they may not have.
 *   Strengths       — the amounts the product comes in, typed once as a list so
 *                     each one becomes a quick-choice chip next time. Leaving it
 *                     empty is fine: the dose is then typed on the log itself.
 *
 * Both are used by the two places a custom entry is made (the Add Shot Log sheet
 * and the Add / Edit Medication form), so the wording can never drift apart.
 */
export default function CustomProductDetails({
  generic, onGenericChange, strengths, onStrengthsChange, inputClass,
}) {
  return (
    <>
      <div>
        <label htmlFor="custom-med-generic" className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
          Generic name (optional)
        </label>
        <input
          id="custom-med-generic"
          type="text"
          value={generic}
          autoComplete="off"
          onChange={(e) => onGenericChange(e.target.value)}
          placeholder="e.g. semaglutide, or the active ingredient on the label"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="custom-med-strengths" className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
          Strengths (optional)
        </label>
        <input
          id="custom-med-strengths"
          type="text"
          inputMode="decimal"
          value={strengths}
          autoComplete="off"
          onChange={(e) => onStrengthsChange(e.target.value)}
          placeholder="e.g. 250, 500"
          className={inputClass}
        />
        <p className="text-xs text-gray-500 dark:text-[#9A9DAE] mt-1.5 leading-snug">
          Separate them with commas — each one becomes a quick-choice chip next time. Leave it empty to type the dose each time instead.
        </p>
      </div>
    </>
  );
}