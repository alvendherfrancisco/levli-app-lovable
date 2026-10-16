import React from "react";
import DoseChips from "@/components/modals/DoseChips";
import SheetField from "@/components/modals/shot/SheetField";
import SheetDoseField from "@/components/modals/shot/SheetDoseField";
import { SHEET_HINT } from "@/components/modals/shot/sheetUi";
import { NON_STANDARD_DOSE_CONFIRM, NON_STANDARD_DOSE_MESSAGE } from "@/lib/medicationRegimen";

/**
 * The starting dose, in the Log shot sheet's own field.
 *
 * A product whose label lists strengths offers them as chips with "+ Other"; a
 * product with no list to choose from — a compounded or research one — has its
 * amount typed with its unit instead. A dose the label does not list is never
 * blocked: it only has to be checked against the prescription before it saves.
 */
export default function RegimenDoseField({
  medication, options = [], value, unit, onChange, onUnitChange, onAddCustom,
  confirmed, onConfirmedChange, needsConfirm, suggested, error,
}) {
  return (
    <div>
      {options.length > 0 ? (
        <DoseChips
          key={medication}
          label="Starting dose"
          medication={medication}
          options={options}
          value={Number(value) || 0}
          unit={unit}
          onSelect={onChange}
          onAddCustom={onAddCustom}
          variant="neutral"
        />
      ) : (
        <SheetField label="Starting dose">
          <SheetDoseField
            value={value}
            onChange={onChange}
            unit={unit}
            onUnitChange={onUnitChange}
            units={["mcg", "mg"]}
          />
        </SheetField>
      )}

      {suggested && (
        <p className={`${SHEET_HINT} mt-2`}>Suggested from the label — change it if your prescription says otherwise.</p>
      )}

      {needsConfirm && (
        <div className="mt-3 rounded-xl border border-orange-200 bg-orange-50 p-3 dark:border-orange-500/25 dark:bg-orange-500/10">
          <p className="text-sm leading-snug text-orange-800 dark:text-orange-200">{NON_STANDARD_DOSE_MESSAGE}</p>
          <label className="mt-2 flex min-h-[44px] cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => onConfirmedChange(e.target.checked)}
              className="mt-0.5 h-6 w-6 shrink-0 accent-indigo-600"
            />
            <span className="text-sm text-gray-900 dark:text-[#E8E9F0]">{NON_STANDARD_DOSE_CONFIRM}</span>
          </label>
        </div>
      )}

      {error && <p className="mt-2 text-sm font-medium text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}