import React from "react";
import IndicationField from "@/components/medications/IndicationField";
import StepHelp from "@/components/medications/StepHelp";
import { helperCls, inputCls, labelCls, stepHeadingCls } from "@/components/medications/formStyles";
import { DOSE_STEP_HELPER, PRESCRIBER_ONLY_NOTE } from "@/lib/medicationRegimen";

/** Step 4 — the optional details, all of which can be added later. */
export default function DoctorStep({
  prescriberName, onPrescriberNameChange, prescriberContact, onPrescriberContactChange,
  doseStep, onDoseStepChange, notes, onNotesChange,
  indication, onIndicationChange, indicationOther, onIndicationOtherChange,
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className={stepHeadingCls}>Your doctor's details</h2>
        <p className={`${helperCls} mt-2`}>This step is optional — tap Next to skip it and add these later.</p>
        <StepHelp text="These details save you looking them up later. “Dose step” is the words your own doctor used, such as starter dose or maintenance dose." />
      </div>

      <div>
        <label htmlFor="prescriber-name" className={labelCls}>Prescriber name</label>
        <input id="prescriber-name" type="text" value={prescriberName} autoComplete="off"
          onChange={(e) => onPrescriberNameChange(e.target.value)} placeholder="e.g. Dr Patel" className={inputCls} />
      </div>

      <div>
        <label htmlFor="prescriber-contact" className={labelCls}>Prescriber phone or email</label>
        <input id="prescriber-contact" type="text" value={prescriberContact} autoComplete="off"
          onChange={(e) => onPrescriberContactChange(e.target.value)} placeholder="e.g. 020 7000 0000" className={inputCls} />
      </div>

      <div>
        <label htmlFor="dose-step" className={labelCls}>Dose step from your doctor (optional)</label>
        <input id="dose-step" type="text" value={doseStep} autoComplete="off"
          onChange={(e) => onDoseStepChange(e.target.value)} placeholder="e.g. starter dose" className={inputCls} />
        <p className={`${helperCls} mt-2`}>{DOSE_STEP_HELPER}</p>
        <p className={`${helperCls} mt-1`}>{PRESCRIBER_ONLY_NOTE} Levli does not create a dose plan for you.</p>
      </div>

      <IndicationField
        value={indication}
        onChange={onIndicationChange}
        other={indicationOther}
        onOtherChange={onIndicationOtherChange}
      />

      <div>
        <label htmlFor="med-notes" className={labelCls}>Notes (optional)</label>
        <textarea id="med-notes" value={notes} onChange={(e) => onNotesChange(e.target.value)} rows={3}
          placeholder="Anything you want to remember" className={inputCls} />
      </div>
    </div>
  );
}