import React, { useState } from "react";
import { Check } from "lucide-react";
import { CUSTOM_MEDICATION_WARNING } from "@/lib/medicationConfig";
import {
  MG_VIAL_NOTE, NON_STANDARD_DOSE_CONFIRM, NON_STANDARD_DOSE_MESSAGE,
  PRESCRIBER_ONLY_NOTE, isLabelStrength,
} from "@/lib/medicationRegimen";
import { sound } from "@/lib/sounds";

const UNITS = ["mg", "mcg", "units", "IU", "mL"];

const chipClass = (selected) =>
  `inline-flex min-h-[44px] min-w-[56px] items-center justify-center gap-1 rounded-xl border px-3 text-sm font-semibold ${
    selected
      ? "bg-indigo-600 border-indigo-600 text-white"
      : "bg-white dark:bg-white/[0.05] border-cardline text-gray-900 dark:text-[#E8E9F0]"
  }`;

const otherChipClass = (active) =>
  `inline-flex min-h-[44px] items-center gap-1 rounded-xl border border-dashed px-3 text-sm font-semibold ${
    active
      ? "border-indigo-400 text-indigo-600 dark:text-indigo-300"
      : "border-cardline text-gray-600 dark:text-gray-300"
  }`;

const hintClass = "text-xs text-gray-500 dark:text-[#9A9DAE] mt-2 leading-snug";

/**
 * The dose field. A known product offers only the strengths its label lists, as
 * tappable chips that wrap onto new lines, plus "Other dose" for an amount the
 * prescriber directed. The unit sits beside the field as plain text with a small
 * Change link. Nothing is suggested or adjusted: a strength that is not on the
 * label is never blocked, it only has to be checked against the prescription.
 */
export default function DoseStrengthPicker({
  option, value, onChange, confirmed, onConfirmedChange, unit, onUnitChange, suggested, error,
}) {
  const [otherTouched, setOtherTouched] = useState(false);
  const [unitOpen, setUnitOpen] = useState(false);

  const strengths = option?.strengths || [];
  const hasStrengths = strengths.length > 0;
  const standard = isLabelStrength(option?.value, value);
  const typed = String(value ?? "").trim();
  const showOther = !hasStrengths || otherTouched || (typed !== "" && !standard);
  const needsConfirm = hasStrengths && typed !== "" && !standard;
  // An empty unit (a medication the user typed themselves) shows the choices.
  const showUnits = unitOpen || !unit;

  const pick = (v) => {
    sound.tap();
    setOtherTouched(false);
    onChange(String(v));
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Dose</span>
        <span className="flex items-center gap-1 shrink-0">
          <span className="text-sm text-gray-600 dark:text-[#9A9DAE]">{unit || "unit"}</span>
          <button
            type="button"
            onClick={() => { sound.tap(); setUnitOpen((v) => !v); }}
            aria-expanded={showUnits}
            className="min-h-[44px] px-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400"
          >
            Change
          </button>
        </span>
      </div>

      {showUnits && (
        <div className="flex flex-wrap gap-2 mb-2">
          {UNITS.map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => { sound.tap(); onUnitChange(u); setUnitOpen(false); }}
              aria-pressed={unit === u}
              className={chipClass(unit === u)}
            >
              {u}
            </button>
          ))}
        </div>
      )}

      {hasStrengths && (
        <div className="flex flex-wrap gap-2">
          {strengths.map((d) => {
            const selected = standard && Number(typed) === d.value;
            return (
              <button
                key={d.value}
                type="button"
                onClick={() => pick(d.value)}
                aria-pressed={selected}
                className={chipClass(selected)}
              >
                {selected && <Check size={14} strokeWidth={3} />}
                {d.value}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => { sound.tap(); setOtherTouched(true); }}
            className={otherChipClass(otherTouched)}
          >
            Other dose
          </button>
        </div>
      )}

      {showOther && (
        <div className={hasStrengths || otherTouched ? "mt-2" : ""}>
          <label htmlFor="other-dose" className="text-xs font-medium text-gray-600 dark:text-[#9A9DAE] mb-1.5 block">
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
            className="w-full min-h-[52px] rounded-xl border border-gray-200 dark:border-white/[0.12] dark:bg-white/[0.05] dark:text-[#E8E9F0] px-3 py-2.5 text-sm outline-none focus:border-indigo-400"
          />
        </div>
      )}

      {suggested && <p className={hintClass}>Suggested from the label — change it if your prescription says otherwise.</p>}

      {needsConfirm && (
        <div className="mt-3 rounded-xl border border-orange-200 dark:border-orange-500/25 bg-orange-50 dark:bg-orange-500/10 p-3">
          <p className="text-sm text-orange-800 dark:text-orange-200 leading-snug">{NON_STANDARD_DOSE_MESSAGE}</p>
          <label className="flex items-start gap-3 mt-2 cursor-pointer min-h-[44px]">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => onConfirmedChange(e.target.checked)}
              className="w-6 h-6 mt-0.5 accent-indigo-600 flex-shrink-0"
            />
            <span className="text-sm text-gray-900 dark:text-[#E8E9F0]">{NON_STANDARD_DOSE_CONFIRM}</span>
          </label>
        </div>
      )}

      {!hasStrengths && <p className={hintClass}>{CUSTOM_MEDICATION_WARNING}</p>}

      <p className={hintClass}>{PRESCRIBER_ONLY_NOTE}</p>

      {unit === "mg" && <p className={hintClass}>{MG_VIAL_NOTE}</p>}

      {error && <p className="text-sm font-medium text-red-600 dark:text-red-400 mt-2">{error}</p>}
    </div>
  );
}