import React, { useEffect, useState } from "react";
import { Calendar } from "lucide-react";
import { ERROR_TEXT, FIELD, FIELD_MARK, LABEL } from "@/lib/uiStyles";

/**
 * A day / month / year field — the app's usual input, with the calendar mark in
 * its left slot and the digits grouped as they are typed (DD / MM / YYYY).
 *
 * The page holds a real date (YYYY-MM-DD, the form every date in the app is
 * stored and compared in); this field holds what is on screen. A part-typed
 * date is kept as text and simply reports no value yet, so nothing is ever
 * guessed on the user's behalf — a date that is not a real day of a real month
 * yields no value either.
 */
function digitsOf(value) {
  return String(value || "").replace(/\D/g, "");
}

/** "1990-05-31" → "31051990" */
function isoToDigits(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ""));
  return m ? `${m[3]}${m[2]}${m[1]}` : "";
}

function format(digits) {
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean).join(" / ");
}

/** The digits as a real date, or "" — a day that does not exist is no date. */
function toIso(digits) {
  if (digits.length !== 8) return "";
  const day = Number(digits.slice(0, 2));
  const month = Number(digits.slice(2, 4));
  const year = Number(digits.slice(4, 8));
  const date = new Date(year, month - 1, day);
  const real =
    year >= 1900 &&
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day;
  if (!real) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${year}-${pad(month)}-${pad(day)}`;
}

export default function DateField({ id, label, value, onChange, error }) {
  const [text, setText] = useState(() => format(isoToDigits(value)));

  // Keep what is on screen in step with the value the page holds: a draft
  // restored on this device arrives as a value, and a value cleared elsewhere
  // clears the field. A half-typed date is left exactly as it was typed, since
  // it holds no value yet.
  useEffect(() => {
    if (toIso(digitsOf(text)) !== (value || "")) setText(format(isoToDigits(value)));
  }, [value]);

  const handleChange = (e) => {
    const digits = digitsOf(e.target.value).slice(0, 8);
    setText(format(digits));
    onChange(toIso(digits));
  };

  return (
    <div className="w-full">
      <label htmlFor={id} className={LABEL}>{label}</label>
      <div className="relative w-full">
        <Calendar className={FIELD_MARK} aria-hidden="true" />
        <input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="DD / MM / YYYY"
          maxLength={14}
          value={text}
          onChange={handleChange}
          className={FIELD}
        />
      </div>
      {error && <p className={`${ERROR_TEXT} mt-2`}>{error}</p>}
    </div>
  );
}