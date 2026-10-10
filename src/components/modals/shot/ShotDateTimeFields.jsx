import React from "react";
import { Calendar, Clock } from "lucide-react";
import SheetField from "@/components/modals/shot/SheetField";
import { SHEET_DATE_FIELD_MARK } from "@/components/modals/shot/sheetUi";

/**
 * One date or time field: the sheet's field, with its own mark on the left.
 *
 * The mark is drawn by the app and the field keeps the control's width reset
 * (see src/lib/dateTimeField.js), so the two fields never grow past the sheet's
 * padding on a small phone whatever the browser prints for a date.
 */
function DateTimeField({ mark: Mark, type, value, onChange, ariaLabel }) {
  return (
    <div className="relative flex-1 basis-0 min-w-0">
      <Mark
        size={17}
        aria-hidden="true"
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
      />
      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
        className={SHEET_DATE_FIELD_MARK}
      />
    </div>
  );
}

/** The shot's date and time, side by side, equal width, 12px apart. */
export default function ShotDateTimeFields({ date, time, onDateChange, onTimeChange }) {
  return (
    <SheetField label="Date and time">
      <div className="flex w-full gap-3">
        <DateTimeField mark={Calendar} type="date" value={date} onChange={onDateChange} ariaLabel="Shot date" />
        <DateTimeField mark={Clock} type="time" value={time} onChange={onTimeChange} ariaLabel="Shot time" />
      </div>
    </SheetField>
  );
}