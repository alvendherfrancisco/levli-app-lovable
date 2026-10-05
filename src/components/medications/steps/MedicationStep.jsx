import React from "react";
import { ShieldCheck } from "lucide-react";
import MedicationNamePicker from "@/components/medications/MedicationNamePicker";
import StepHelp from "@/components/medications/StepHelp";
import FieldError from "@/components/medications/FieldError";
import { helperCls, inputCls, labelCls, stepHeadingCls } from "@/components/medications/formStyles";

/** Step 1 — which medication. */
export default function MedicationStep({ selectedName, isCustom, customName, onSelect, onCustomNameChange, option, error }) {
  return (
    <div>
      <h2 className={stepHeadingCls}>Which medication?</h2>
      <p className={`${helperCls} mt-2`}>Pick the medicine on your prescription, then tap Next.</p>
      <StepHelp text="Choose the name printed on your prescription, pen or tablet. If your medicine isn't in the list, tap “Other medication (type name)” and type it in yourself." />

      <div className="mt-5">
        <MedicationNamePicker
          selectedName={selectedName}
          isCustom={isCustom}
          onSelect={onSelect}
          error={isCustom ? null : error}
        />
      </div>

      {isCustom && (
        <div className="mt-5">
          <label htmlFor="custom-med-name" className={labelCls}>Medication name</label>
          <input
            id="custom-med-name"
            type="text"
            value={customName}
            autoComplete="off"
            onChange={(e) => onCustomNameChange(e.target.value)}
            placeholder="Type the name from your prescription"
            className={inputCls}
          />
          <FieldError message={error} />
        </div>
      )}

      {option?.routeLabel && (
        <div className="mt-5 flex items-center gap-3 rounded-2xl bg-gray-100 dark:bg-white/[0.08] px-4 py-4">
          <ShieldCheck size={26} className="flex-shrink-0 text-indigo-600 dark:text-indigo-300" aria-hidden="true" />
          <span className="text-lg text-gray-700 dark:text-gray-200">
            Route: <span className="font-semibold text-gray-900 dark:text-white">{option.routeLabel}</span>
          </span>
        </div>
      )}
    </div>
  );
}