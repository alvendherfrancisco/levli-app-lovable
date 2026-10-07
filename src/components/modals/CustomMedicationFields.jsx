import React from "react";
import { AlertTriangle } from "lucide-react";
import { CUSTOM_MEDICATION_WARNING } from "@/lib/medicationConfig";
import CustomProductDetails from "@/components/modals/CustomProductDetails";

const UNIT_CHOICES = ["mg", "mcg", "units", "IU", "mL"];

/**
 * The "Others" entry fields: the medication name (required), the generic name
 * and strengths the user may know (both optional), the dose unit, and the dose
 * being logged — typed freely, because there is no label to take a list from.
 * The entry is flagged plainly as one Levli cannot verify, and it is excluded
 * from exposure modelling.
 *
 * The dose row is a two-part row that always fits inside the sheet: the number
 * input takes the remaining width (flex: 1 1 0, min-width: 0) and the unit
 * select is a fixed 120px capped at 40%. Both are 48px tall with the same
 * border and radius, and use a 16px font so iOS Safari does not zoom the page
 * on focus (which is what used to shove the sheet sideways).
 */
export default function CustomMedicationFields({
  name, onNameChange, dose, onDoseChange, unit, onUnitChange, inputClass,
  generic = "", onGenericChange, strengths = "", onStrengthsChange,
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Medication name</label>
        <input type="text" value={name} onChange={(e) => onNameChange(e.target.value)}
          placeholder="Type the name on your prescription" className={`${inputClass} min-w-0`} />
      </div>

      <CustomProductDetails
        generic={generic}
        onGenericChange={onGenericChange}
        strengths={strengths}
        onStrengthsChange={onStrengthsChange}
        inputClass={inputClass}
      />

      <div>
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Dose</label>
        <div className="flex items-center gap-2">
          <input
            type="number" min="0" step="any" inputMode="decimal"
            value={dose}
            onChange={(e) => onDoseChange(e.target.value)}
            placeholder="0.5"
            aria-label="Dose amount"
            className={`${inputClass} flex-1 basis-0 min-w-0 h-12`}
          />
          <select
            value={unit}
            onChange={(e) => onUnitChange(e.target.value)}
            aria-label="Dose unit"
            className="h-12 w-[120px] max-w-[40%] flex-shrink-0 min-w-0 text-base text-gray-900 dark:text-[#E8E9F0] bg-white dark:bg-white/[0.05] border border-gray-200 dark:border-white/[0.1] rounded-xl px-3 outline-none focus:border-indigo-300"
          >
            {UNIT_CHOICES.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </div>
      <div className="rounded-xl border border-orange-200 dark:border-orange-500/20 bg-orange-50 dark:bg-orange-500/10 px-3 py-2">
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