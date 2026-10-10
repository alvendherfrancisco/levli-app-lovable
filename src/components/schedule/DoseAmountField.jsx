import React from "react";
import { PRESCRIBER_ONLY_NOTE } from "@/lib/medicationRegimen";
import { getDoseUnit } from "@/lib/medicationConfig";
import { FIELD_TRAILING, HELP_IN_CARD, LABEL } from "@/lib/uiStyles";

/**
 * The dose amount, for a product whose label lists no strengths — compounded,
 * a peptide, or "Other". It is the app's own field, drawn from the shared
 * tokens: the same height, the same pill, the same hairline border, with the
 * unit sitting inside the field on the right rather than beside the label.
 *
 * The amount stays optional and is never suggested: it is whatever the
 * prescriber said, which is why the helper line is the only note under it.
 */
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
          className={FIELD_TRAILING}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[13px] text-auth-faint"
        >
          {unit}
        </span>
      </div>
      <p className={`${HELP_IN_CARD} mt-2`}>{PRESCRIBER_ONLY_NOTE}</p>
    </div>
  );
}