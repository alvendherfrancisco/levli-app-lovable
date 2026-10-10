import React from "react";
import { DATE_TIME_FIELD } from "@/lib/dateTimeField";

/**
 * A date field: the app's one date input, drawn and sized the same everywhere.
 *
 * Every date in the app is asked for with this field, so the width reset (see
 * src/lib/dateTimeField.js) is in one place and no form can grow a date control
 * that runs past its own padding. Its label stays with the form, above the
 * field, exactly as it was.
 *
 * `className` is for the row the field sits in — `flex-1` for a pair — never for
 * resizing the field itself.
 */
export default function DateInput({ id, value, onChange, ariaLabel, className = "", disabled = false }) {
  return (
    <input
      id={id}
      type="date"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      aria-label={ariaLabel}
      disabled={disabled}
      className={`${DATE_TIME_FIELD} ${className}`}
    />
  );
}