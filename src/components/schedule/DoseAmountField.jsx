import React from "react";
import { LABEL } from "@/lib/authFormStyles";
import { PRESCRIBER_ONLY_NOTE } from "@/lib/medicationRegimen";
import { getDoseUnit } from "@/lib/medicationConfig";

/**
 * The dose amount, for a product whose label lists no strengths — compounded,
 * a peptide, or "Other". It is the app's own field, drawn like the account
 * screens' inputs: pill-rounded, a hairline border, white fill and the unit
 * sitting inside the field on the right rather than beside the label.
 *
 * The amount stays optional and is never suggested: it is whatever the
 * prescriber said, which is why the helper line is the only note under it.
 */
const INPUT =
  "h-12 w-full rounded-full border border-gray-200 bg-white pl-4 pr-16 text-[16px] text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-indigo-500";

export default function DoseAmountField({ medication, value, onChange }) {
  const unit = getDoseUnit(medication);

  return (
    <div>
      <label htmlFor="dose-amount" className={LABEL}>Dose</label>
      <div className="relative">
        <input
          id="dose-amount"
          type="number"
          min="0"
          step="0.25"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. 0.5"
          className={INPUT}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[13px] text-gray-400"
        >
          {unit}
        </span>
      </div>
      <p className="mt-2 text-xs leading-snug text-gray-500">{PRESCRIBER_ONLY_NOTE}</p>
    </div>
  );
}