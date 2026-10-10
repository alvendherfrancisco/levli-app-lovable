import React from "react";
import { ChevronDown } from "lucide-react";
import SheetField from "@/components/modals/shot/SheetField";
import { SHEET_FIELD_SELECT } from "@/components/modals/shot/sheetUi";
import { sound } from "@/lib/sounds";

/**
 * A dropdown in the sheet's own field style: the same 52px pill as every other
 * field, one down chevron on the right (the platform's own up-and-down arrows
 * are hidden), and the grey word "Select" while nothing is chosen.
 */
export default function SheetSelect({ id, label, value, onChange, options = [] }) {
  return (
    <SheetField label={label} htmlFor={id}>
      <div className="relative">
        <select
          id={id}
          value={value || ""}
          onChange={(e) => { sound.tap(); onChange(e.target.value); }}
          className={`${SHEET_FIELD_SELECT} ${value ? "" : "text-gray-400 dark:text-gray-500"}`}
        >
          <option value="">Select</option>
          {options.map((o) => (
            <option key={o.value} value={o.value} disabled={!!o.disabled}>{o.label}</option>
          ))}
        </select>
        <ChevronDown
          size={18}
          aria-hidden="true"
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
        />
      </div>
    </SheetField>
  );
}