import React from "react";
import { DATE_TIME_FIELD } from "@/lib/dateTimeField";

/**
 * A time field: the app's one time input, the date field's twin.
 *
 * A native time control has the same width behaviour as a date one (see
 * src/lib/dateTimeField.js), so it is drawn from the same class string and
 * lines up with the fields beside it in either mode.
 */
export default function TimeInput({ id, value, onChange, ariaLabel, className = "", disabled = false }) {
  return (
    <input
      id={id}
      type="time"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      aria-label={ariaLabel}
      disabled={disabled}
      className={`${DATE_TIME_FIELD} ${className}`}
    />
  );
}