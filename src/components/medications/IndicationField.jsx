import React from "react";
import { INDICATION_OPTIONS } from "@/lib/medicationRegimen";
import { choiceCls, inputCls, labelCls } from "@/components/medications/formStyles";

/** Why the medication was prescribed — plain choices, with room to type your own. */
export default function IndicationField({ value, onChange, other, onOtherChange }) {
  return (
    <div>
      <span className={labelCls}>Why you take it</span>

      <div className="grid grid-cols-2 gap-3">
        {INDICATION_OPTIONS.map((o) => (
          <button key={o} type="button" onClick={() => onChange(o)} aria-pressed={value === o} className={choiceCls(value === o)}>
            {o}
          </button>
        ))}
      </div>

      {value === "Other" && (
        <div className="mt-4">
          <label htmlFor="indication-other" className="text-lg font-semibold text-gray-900 dark:text-white mb-2 block">
            Reason from your prescription
          </label>
          <input
            id="indication-other"
            type="text"
            value={other}
            autoComplete="off"
            onChange={(e) => onOtherChange(e.target.value)}
            placeholder="e.g. Fatty liver disease"
            className={inputCls}
          />
        </div>
      )}
    </div>
  );
}