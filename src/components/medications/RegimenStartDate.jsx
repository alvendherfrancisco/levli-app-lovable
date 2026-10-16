import React from "react";
import { Calendar, Check } from "lucide-react";
import SheetField from "@/components/modals/shot/SheetField";
import {
  SHEET_CHIP, SHEET_CHIP_OFF, SHEET_CHIP_ON, SHEET_DATE_FIELD_MARK, SHEET_HINT,
} from "@/components/modals/shot/sheetUi";
import { sound } from "@/lib/sounds";

/** Today, and yesterday, as the value a date input expects ("YYYY-MM-DD"). */
const pad = (n) => String(n).padStart(2, "0");
const dayKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const shift = (days) => { const d = new Date(); d.setDate(d.getDate() + days); return dayKey(d); };

/**
 * The date of the first dose: today by default, with Today and Yesterday as
 * one-tap chips and the sheet's own date field for an earlier day.
 */
export default function RegimenStartDate({ value, onChange, error }) {
  const today = shift(0);
  const yesterday = shift(-1);
  const shortcuts = [{ value: today, label: "Today" }, { value: yesterday, label: "Yesterday" }];

  return (
    <SheetField label="Start date" htmlFor="start-date">
      <div className="mb-2 grid grid-cols-2 gap-2" role="group" aria-label="Start date">
        {shortcuts.map((s) => {
          const selected = value === s.value;
          return (
            <button
              key={s.value}
              type="button"
              onClick={() => { sound.tap(); onChange(s.value); }}
              aria-pressed={selected}
              className={`${SHEET_CHIP} ${selected ? SHEET_CHIP_ON : SHEET_CHIP_OFF}`}
            >
              {selected && <Check size={15} strokeWidth={3} aria-hidden="true" />}
              {s.label}
            </button>
          );
        })}
      </div>

      <div className="relative">
        <Calendar
          size={17}
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          id="start-date"
          type="date"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Start date"
          className={SHEET_DATE_FIELD_MARK}
        />
      </div>

      <p className={`${SHEET_HINT} mt-1.5`}>Change it if you started earlier.</p>

      {error && <p className="mt-2 text-sm font-medium text-red-600 dark:text-red-400">{error}</p>}
    </SheetField>
  );
}