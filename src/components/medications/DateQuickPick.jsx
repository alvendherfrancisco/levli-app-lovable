import React from "react";
import { CalendarDays } from "lucide-react";
import { choiceCls, helperCls, inputCls, labelCls } from "@/components/medications/formStyles";
import FieldError from "@/components/medications/FieldError";

const pad = (n) => String(n).padStart(2, "0");
const toKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** The Monday of next week (today, when today is not Monday). */
function nextMondayKey() {
  const d = new Date();
  const delta = (8 - d.getDay()) % 7 || 7;
  d.setDate(d.getDate() + delta);
  return toKey(d);
}

/**
 * A date field with quick choices, so the picker does not have to be opened.
 * Full width and on its own row: nothing can overlap or overflow.
 */
export default function DateQuickPick({ id, label, value, onChange, withNextMonday, error }) {
  const today = toKey(new Date());
  const monday = nextMondayKey();
  const plain = value
    ? new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
      weekday: "long", month: "long", day: "numeric", year: "numeric",
    })
    : "";

  return (
    <div>
      <label htmlFor={id} className={labelCls}>{label}</label>
      <input id={id} type="date" value={value} onChange={(e) => onChange(e.target.value)} className={inputCls} />

      <div className="flex gap-3 mt-3">
        <button type="button" onClick={() => onChange(today)} aria-pressed={value === today} className={`${choiceCls(value === today)} flex-1`}>
          Today
        </button>
        {withNextMonday && (
          <button type="button" onClick={() => onChange(monday)} aria-pressed={value === monday} className={`${choiceCls(value === monday)} flex-1`}>
            Next Monday
          </button>
        )}
      </div>

      {plain && (
        <p className={`${helperCls} mt-3 flex items-center gap-2`}>
          <CalendarDays size={22} className="flex-shrink-0 text-gray-600 dark:text-gray-300" aria-hidden="true" />
          {plain}
        </p>
      )}

      <FieldError message={error} />
    </div>
  );
}