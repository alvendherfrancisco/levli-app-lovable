import React, { useState } from "react";
import { CUSTOM_MEDICATION_WARNING } from "@/lib/medicationConfig";
import {
  MG_VIAL_NOTE, NON_STANDARD_DOSE_CONFIRM, NON_STANDARD_DOSE_MESSAGE,
  STRENGTH_BUTTON_LIMIT, isLabelStrength,
} from "@/lib/medicationRegimen";

const UNITS = ["mg", "mcg", "units", "IU", "mL"];

const bigChoice = (selected) =>
  `min-h-[60px] rounded-2xl border-2 px-3 text-lg font-semibold ${
    selected
      ? "bg-indigo-600 border-indigo-600 text-white"
      : "bg-white dark:bg-white/[0.05] border-gray-200 dark:border-white/[0.12] text-gray-900 dark:text-[#E8E9F0]"
  }`;

/**
 * The dose field. A known product offers only the strengths its label lists —
 * as large buttons when there are six or fewer, otherwise a dropdown — plus
 * "Other dose (as prescribed)" for a dose the prescriber directed. A dose that
 * is not a label strength is never blocked: it asks for one confirmation tick.
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
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="text-base font-semibold text-gray-800 dark:text-gray-200">Dose</span>
        {hasStrengths ? (
          <span className="text-base font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-white/[0.06] rounded-xl px-3 py-1.5">
            {option.unit}
          </span>
        ) : (
          <select
            value={unit}
            onChange={(e) => onUnitChange(e.target.value)}
            aria-label="Dose unit"
            className="min-h-[48px] rounded-xl border-2 border-gray-200 dark:border-white/[0.12] dark:bg-white/[0.05] dark:text-[#E8E9F0] px-3 text-base outline-none focus:border-indigo-400"
          >
            {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        )}
      </div>

      {hasStrengths && (strengths.length <= STRENGTH_BUTTON_LIMIT ? (
        <div className="grid grid-cols-2 gap-2">
          {strengths.map((d) => {
            const selected = standard && Number(typed) === d.value;
            return (
              <button key={d.value} type="button" onClick={() => pick(d.value)} aria-pressed={selected} className={bigChoice(selected)}>
                {d.value} {d.unit}
              </button>
            );
          })}
        </div>
      ) : (
        <select
          value={standard ? typed : ""}
          onChange={(e) => pick(e.target.value)}
          aria-label="Dose strength"
          className="w-full min-h-[60px] rounded-2xl border-2 border-gray-200 dark:border-white/[0.12] dark:bg-white/[0.05] dark:text-[#E8E9F0] px-4 text-lg outline-none focus:border-indigo-400"
        >
          <option value="">Choose the strength on your pen</option>
          {strengths.map((d) => <option key={d.value} value={d.value}>{d.value} {d.unit}</option>)}
        </select>
      ))}

      {hasStrengths && !otherTouched && (
        <button
          type="button"
          onClick={() => setOtherTouched(true)}
          className="mt-2 w-full min-h-[56px] rounded-2xl border-2 border-dashed border-gray-300 dark:border-white/[0.18] text-base font-semibold text-gray-700 dark:text-gray-300"
        >
          Other dose (as prescribed)
        </button>
      )}

      {showOther && (
        <div className={hasStrengths || otherTouched ? "mt-2" : ""}>
          <label htmlFor="other-dose" className="text-sm font-medium text-gray-600 dark:text-[#9A9DAE] mb-1.5 block">
            {hasStrengths ? "Dose your prescriber directed" : "Dose from your prescription"}
          </label>
          <input
            id="other-dose"
            type="number"
            min="0"
            step="0.25"
            inputMode="decimal"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="e.g. 1.75"
            className="w-full min-h-[60px] rounded-2xl border-2 border-gray-200 dark:border-white/[0.12] dark:bg-white/[0.05] dark:text-[#E8E9F0] px-4 py-3 text-lg outline-none focus:border-indigo-400"
          />
        </div>
      )}

      {needsConfirm && (
        <div className="mt-3 rounded-2xl border border-orange-200 dark:border-orange-500/25 bg-orange-50 dark:bg-orange-500/10 p-4">
          <p className="text-base text-orange-800 dark:text-orange-200 leading-snug">{NON_STANDARD_DOSE_MESSAGE}</p>
          <label className="flex items-start gap-3 mt-3 cursor-pointer min-h-[44px]">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => onConfirmedChange(e.target.checked)}
              className="w-7 h-7 mt-0.5 accent-indigo-600 flex-shrink-0"
            />
            <span className="text-base text-gray-900 dark:text-[#E8E9F0]">{NON_STANDARD_DOSE_CONFIRM}</span>
          </label>
        </div>
      )}

      {!hasStrengths && <p className="text-base text-gray-600 dark:text-[#9A9DAE] mt-2">{CUSTOM_MEDICATION_WARNING}</p>}

      {unit === "mg" && <p className="text-sm text-gray-500 dark:text-[#9A9DAE] mt-2 leading-snug">{MG_VIAL_NOTE}</p>}

      {error && <p className="text-base font-medium text-red-600 dark:text-red-400 mt-2">{error}</p>}
    </div>
  );
}