import React, { useState } from "react";
import { CUSTOM_MEDICATION_WARNING } from "@/lib/medicationConfig";
import {
  MG_VIAL_NOTE, NON_STANDARD_DOSE_CONFIRM, NON_STANDARD_DOSE_MESSAGE,
  STRENGTH_BUTTON_LIMIT, isLabelStrength,
} from "@/lib/medicationRegimen";
import { choiceCls, helperCls, inputCls, labelCls, otherChoiceCls } from "@/components/medications/formStyles";
import FieldError from "@/components/medications/FieldError";

const UNITS = ["mg", "mcg", "units", "IU", "mL"];

/**
 * The dose field. A known product offers only the strengths its label lists —
 * as large buttons when there are six or fewer, otherwise a dropdown — plus
 * "Other dose (as prescribed)" for a dose the prescriber directed. A dose that
 * is not a label strength is never blocked: it asks for one confirmation tick.
 * When a dose is typed, the unit sits beside it and the keyboard is numeric.
 */
export default function DoseStrengthPicker({
  option, value, onChange, confirmed, onConfirmedChange, unit, onUnitChange, error,
}) {
  const [otherTouched, setOtherTouched] = useState(false);

  const strengths = option?.strengths || [];
  const hasStrengths = strengths.length > 0;
  const standard = isLabelStrength(option?.value, value);
  const typed = String(value ?? "").trim();
  const showOther = !hasStrengths || otherTouched || (typed !== "" && !standard);
  const needsConfirm = hasStrengths && typed !== "" && !standard;

  const pick = (v) => {
    setOtherTouched(false);
    onChange(String(v));
  };

  return (
    <div>
      <span className={labelCls}>Dose</span>

      {hasStrengths && (strengths.length <= STRENGTH_BUTTON_LIMIT ? (
        <div className="grid grid-cols-2 gap-3">
          {strengths.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => pick(d.value)}
              aria-pressed={standard && Number(typed) === d.value}
              className={choiceCls(standard && Number(typed) === d.value)}
            >
              {d.value} {d.unit}
            </button>
          ))}
        </div>
      ) : (
        <select
          value={standard ? typed : ""}
          onChange={(e) => pick(e.target.value)}
          aria-label="Dose strength"
          className={inputCls}
        >
          <option value="">Choose the strength on your pen</option>
          {strengths.map((d) => <option key={d.value} value={d.value}>{d.value} {d.unit}</option>)}
        </select>
      ))}

      {hasStrengths && !otherTouched && (
        <button type="button" onClick={() => setOtherTouched(true)} className={`${otherChoiceCls} mt-3`}>
          Other dose (as prescribed)
        </button>
      )}

      {showOther && (
        <div className={hasStrengths ? "mt-4" : ""}>
          <label htmlFor="other-dose" className="text-lg font-semibold text-gray-900 dark:text-white mb-2 block">
            {hasStrengths ? "Dose your prescriber directed" : "Dose from your prescription"}
          </label>
          <div className="flex items-center gap-3">
            <input
              id="other-dose"
              type="number"
              min="0"
              step="0.25"
              inputMode="decimal"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="e.g. 1.75"
              className={`${inputCls} flex-1 min-w-0`}
            />
            {hasStrengths ? (
              <span className="min-h-[56px] flex items-center px-4 rounded-2xl bg-gray-200 dark:bg-white/[0.16] text-lg font-bold text-gray-900 dark:text-white flex-shrink-0">
                {option.unit}
              </span>
            ) : (
              <select
                value={unit}
                onChange={(e) => onUnitChange(e.target.value)}
                aria-label="Dose unit"
                className="min-h-[56px] rounded-2xl border-2 border-gray-400 dark:border-white/40 bg-white dark:bg-white/[0.08] text-gray-900 dark:text-white px-3 text-lg font-semibold outline-none focus:border-indigo-500 flex-shrink-0"
              >
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            )}
          </div>
        </div>
      )}

      {needsConfirm && (
        <div className="mt-4 rounded-2xl border-2 border-orange-400 dark:border-orange-400/50 bg-orange-50 dark:bg-orange-500/15 p-4">
          <p className="text-lg text-orange-900 dark:text-orange-100 leading-snug">{NON_STANDARD_DOSE_MESSAGE}</p>
          <label className="flex items-start gap-3 mt-3 cursor-pointer min-h-[56px]">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => onConfirmedChange(e.target.checked)}
              className="w-8 h-8 mt-0.5 accent-indigo-600 flex-shrink-0"
            />
            <span className="text-lg font-semibold text-gray-900 dark:text-white">{NON_STANDARD_DOSE_CONFIRM}</span>
          </label>
        </div>
      )}

      {!hasStrengths && <p className={`${helperCls} mt-3`}>{CUSTOM_MEDICATION_WARNING}</p>}

      {(hasStrengths || unit === "mg") && <p className={`${helperCls} mt-3`}>{MG_VIAL_NOTE}</p>}

      <FieldError message={error} />
    </div>
  );
}