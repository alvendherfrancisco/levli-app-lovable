import React from "react";
import { AlertTriangle } from "lucide-react";
import { CUSTOM_MEDICATION_WARNING } from "@/lib/medicationConfig";

const UNIT_CHOICES = ["mg", "mcg", "units", "IU", "mL"];

/**
 * The "Other / custom (prescriber-directed)" entry fields: the user types the
 * drug name and the dose, and is told plainly that Levli cannot verify it.
 * A custom entry is excluded from exposure modelling.
 */
export default function CustomMedicationFields({
  name, onNameChange, dose, onDoseChange, unit, onUnitChange, inputClass,
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Medication name</label>
        <input type="text" value={name} onChange={(e) => onNameChange(e.target.value)}
          placeholder="Type the name on your prescription" className={inputClass} />
      </div>
      <div>
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Dose</label>
        <div className="flex gap-2">
          <input type="number" min="0" step="any" inputMode="decimal" value={dose}
            onChange={(e) => onDoseChange(e.target.value)}
            placeholder="e.g. 0.5" className={`${inputClass} flex-1 min-w-0`} />
          <select value={unit} onChange={(e) => onUnitChange(e.target.value)} className={`${inputClass} w-28 flex-shrink-0`}>
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