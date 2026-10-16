import React from "react";
import { X } from "lucide-react";
import ClearFieldButton from "@/components/ClearFieldButton";
import SheetField from "@/components/modals/shot/SheetField";
import { SHEET_FIELD, SHEET_HINT } from "@/components/modals/shot/sheetUi";
import { getIntervalDays, intervalWarning, plainBrandName } from "@/lib/medicationConfig";

// ─────────────────────────────────────────────────────────────────────────────
// "Custom dose interval (optional)" — the interval a prescriber directed for
// THIS medication.
//
// It lives with the regimen it belongs to (moved here from the Profile's old
// Shot Preferences card), and it is only ever an override: the field itself
// stays closed until the user says their prescriber directed something
// different. With nothing set, the medication's own interval — or its label's —
// decides the next dose date, exactly as before.
// ─────────────────────────────────────────────────────────────────────────────

const numericOnly = (value) => value.replace(/[^0-9]/g, "").slice(0, 2);

export default function IntervalOverrideField({ medication, value, onChange }) {
  const label = getIntervalDays(medication);
  const warning = intervalWarning(medication, value);
  const on = value !== "" && value != null;

  const defaultLine = label
    ? `Every ${label} day${label === 1 ? "" : "s"}, from ${plainBrandName(medication)}`
    : "The interval your medication is dosed at";

  return (
    <SheetField
      label="Custom dose interval (optional)"
      htmlFor="custom-interval"
      trailing={on ? (
        <ClearFieldButton
          show
          onClear={() => onChange("")}
          ariaLabel="Clear the custom dose interval"
          label={<X size={16} aria-hidden="true" />}
        />
      ) : undefined}
    >
      <p className="text-sm text-gray-500 dark:text-[#9A9DAE] mb-2">{defaultLine}</p>

      {on ? (
        <div className="relative">
          <input
            id="custom-interval"
            type="text"
            inputMode="numeric"
            value={value}
            onChange={(e) => onChange(numericOnly(e.target.value))}
            placeholder={String(label || 7)}
            className={`${SHEET_FIELD} pr-20`}
          />
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">days</span>
        </div>
      ) : (
        <button type="button" onClick={() => onChange(String(label || 7))} className="btn-link text-sm">
          Use my prescriber's interval
        </button>
      )}

      <p className={`${SHEET_HINT} mt-1.5`}>
        Only set this if your prescriber told you to use a different interval.
      </p>
      {warning && (
        <p className="mt-1.5 text-xs font-medium text-orange-600 dark:text-orange-400">{warning}</p>
      )}
    </SheetField>
  );
}