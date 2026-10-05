import React from "react";
import { INDICATION_OPTIONS } from "@/lib/medicationRegimen";

const bigChoice = (selected) =>
  `min-h-[60px] rounded-2xl border-2 px-3 text-base font-semibold ${
    selected
      ? "bg-indigo-600 border-indigo-600 text-white"
      : "bg-white dark:bg-white/[0.05] border-gray-200 dark:border-white/[0.12] text-gray-900 dark:text-[#E8E9F0]"
  }`;

/** Why the medication was prescribed — plain choices, with room to type your own. */
export default function IndicationField({ value, onChange, other, onOtherChange, error }) {
  return (
    <div>
      <label htmlFor="indication-other" className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-2 block">
        Indication (as prescribed)
      </label>

      <div className="grid grid-cols-2 gap-2">
        {INDICATION_OPTIONS.map((o) => (
          <button key={o} type="button" onClick={() => onChange(o)} aria-pressed={value === o} className={bigChoice(value === o)}>
            {o}
          </button>
        ))}
      </div>

      {value === "Other" && (
        <div className="mt-2">
          <label htmlFor="indication-other" className="text-sm font-medium text-gray-600 dark:text-[#9A9DAE] mb-1.5 block">
            Reason from your prescription
          </label>
          <input
            id="indication-other"
            type="text"
            value={other}
            autoComplete="off"
            onChange={(e) => onOtherChange(e.target.value)}
            placeholder="e.g. Fatty liver disease"
            className="w-full min-h-[60px] rounded-2xl border-2 border-gray-200 dark:border-white/[0.12] dark:bg-white/[0.05] dark:text-[#E8E9F0] px-4 py-3 text-base outline-none focus:border-indigo-400"
          />
        </div>
      )}

      {error && <p className="text-base font-medium text-red-600 dark:text-red-400 mt-2">{error}</p>}
    </div>
  );
}