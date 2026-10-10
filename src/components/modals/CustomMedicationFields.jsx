import React from "react";
import { AlertTriangle, ChevronDown } from "lucide-react";
import { CUSTOM_MEDICATION_WARNING } from "@/lib/medicationConfig";
import SheetField from "@/components/modals/shot/SheetField";
import { SHEET_FIELD, SHEET_FIELD_SELECT } from "@/components/modals/shot/sheetUi";

const UNIT_CHOICES = ["mg", "mcg", "units", "IU", "mL"];

/**
 * The "Others" entry fields: the drug name (the only required one), an optional
 * generic name, the dose unit and the dose itself, which may be typed freely.
 * A dose added here is offered as a chip — a strength — next time, and a custom
 * entry is excluded from exposure modelling.
 *
 * Every field is the sheet's own, so they line up with the fields above them.
 * The dose row is a two-part row that always fits inside the sheet: the number
 * input takes the remaining width and the unit dropdown is a fixed 104px, capped
 * at 40%. Both use a 16px font so iOS Safari does not zoom the page on focus.
 */
export default function CustomMedicationFields({
  name, onNameChange, generic, onGenericChange,
  dose, onDoseChange, unit, onUnitChange,
}) {
  return (
    <div className="space-y-6">
      <SheetField label="Medication name">
        <input
          type="text" value={name} onChange={(e) => onNameChange(e.target.value)}
          placeholder="Type the name on your prescription" className={SHEET_FIELD}
        />
      </SheetField>

      <SheetField label="Generic name">
        <input
          type="text" value={generic || ""} onChange={(e) => onGenericChange(e.target.value)}
          placeholder="e.g. semaglutide" className={SHEET_FIELD}
        />
      </SheetField>

      <SheetField label="Dose">
        <div className="flex items-center gap-2">
          <input
            type="number" min="0" step="any" inputMode="decimal"
            value={dose}
            onChange={(e) => onDoseChange(e.target.value)}
            placeholder="0.5"
            aria-label="Dose amount"
            className={`${SHEET_FIELD} flex-1 basis-0`}
          />
          <div className="relative w-[104px] max-w-[40%] flex-shrink-0">
            <select
              value={unit}
              onChange={(e) => onUnitChange(e.target.value)}
              aria-label="Dose unit"
              className={SHEET_FIELD_SELECT}
            >
              {UNIT_CHOICES.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
            <ChevronDown
              size={16}
              aria-hidden="true"
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </div>
        </div>
      </SheetField>

      <div className="rounded-2xl border border-orange-200 dark:border-orange-500/20 bg-orange-50 dark:bg-orange-500/10 px-3.5 py-3">
        <p className="text-xs font-semibold text-orange-700 dark:text-orange-300 flex items-center gap-1.5">
          <AlertTriangle size={13} className="flex-shrink-0" /> {CUSTOM_MEDICATION_WARNING}
        </p>
        <p className="text-[11px] text-orange-700/80 dark:text-orange-300/80 mt-1">
          Enter exactly what your prescriber or pharmacy gave you. Custom entries are kept out of the medication exposure estimate.
        </p>
      </div>
    </div>
  );
}