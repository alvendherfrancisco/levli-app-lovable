import React from "react";
import DoseStrengthPicker from "@/components/medications/DoseStrengthPicker";
import StepHelp from "@/components/medications/StepHelp";
import { helperCls, stepHeadingCls } from "@/components/medications/formStyles";

/** Step 2 — the dose. */
export default function DoseStep({ option, value, onChange, confirmed, onConfirmedChange, unit, onUnitChange, error }) {
  return (
    <div>
      <h2 className={stepHeadingCls}>What's your dose?</h2>
      <p className={`${helperCls} mt-2`}>Tap the amount shown on your pen, tablet or prescription.</p>
      <StepHelp text="Medicines come in set amounts. Tap the one printed on your pen or tablet. If your doctor asked for a different amount, tap “Other dose (as prescribed)” and type it in — you can always keep the dose your doctor has told you to take." />

      <div className="mt-5">
        <DoseStrengthPicker
          option={option}
          value={value}
          onChange={onChange}
          confirmed={confirmed}
          onConfirmedChange={onConfirmedChange}
          unit={unit}
          onUnitChange={onUnitChange}
          error={error}
        />
      </div>
    </div>
  );
}