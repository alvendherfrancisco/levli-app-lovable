import React from "react";
import { ChevronDown } from "lucide-react";
import { SHEET_FIELD, SHEET_FIELD_SELECT } from "@/components/modals/shot/sheetUi";

/**
 * The sheet's plain dose field: the amount, and the unit it is measured in.
 *
 * It is used wherever there is no strength list to choose from — a compounded
 * product, a research peptide, or a medication the user named themselves — so
 * the person types the amount exactly as their prescriber or their label states
 * it. The number field takes the remaining width and the unit dropdown is a
 * fixed 104px capped at 40% of the row, so the row always fits inside the sheet
 * at any text size.
 */
export default function SheetDoseField({
  value, onChange, unit, onUnitChange,
  units = ["mg", "mcg"], inputId, placeholder = "0.5",
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        id={inputId}
        type="number"
        min="0"
        step="any"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Dose amount"
        className={`${SHEET_FIELD} flex-1 basis-0`}
      />
      <div className="relative w-[104px] max-w-[40%] shrink-0">
        <select
          value={unit}
          onChange={(e) => onUnitChange(e.target.value)}
          aria-label="Dose unit"
          className={SHEET_FIELD_SELECT}
        >
          {units.map((u) => <option key={u} value={u}>{u}</option>)}
        </select>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
        />
      </div>
    </div>
  );
}