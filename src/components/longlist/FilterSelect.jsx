import React from "react";
import { ChevronDown } from "lucide-react";
import { SHEET_FIELD_SELECT, SHEET_LABEL_TEXT } from "@/components/modals/shot/sheetUi";

/**
 * One filter on a list screen: a label, and the choice itself as a dropdown.
 *
 * It is the sheet's own field (the same 52px pill, hairline and type as every
 * other field in the app) with the app's own chevron drawn on its right, so a
 * filter row looks like the rest of the form it belongs to rather than a
 * control of its own.
 *
 * `options` is [{ value, label }]; the first entry is normally the "all" choice.
 */
export default function FilterSelect({ label, value, onChange, options, className = "" }) {
  return (
    <div className={className}>
      <label className="block">
        <span className={`${SHEET_LABEL_TEXT} mb-2 block`}>{label}</span>
        <span className="relative block">
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={SHEET_FIELD_SELECT}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <ChevronDown
            size={18}
            aria-hidden="true"
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
          />
        </span>
      </label>
    </div>
  );
}