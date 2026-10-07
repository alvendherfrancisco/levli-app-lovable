import React from "react";
import { ScheduleIllustration } from "@/components/onboarding/OnboardingIllustrations";
import DoseChoice from "@/components/schedule/DoseChoice";
import ScheduleFields from "@/components/schedule/ScheduleFields";
import { getMedicationConfig } from "@/lib/medicationConfig";

/** The one line of guidance on this screen, as the clinical team worded it. */
const PRESCRIBER_HELPER = "Follow your prescriber's instructions.";

const INJECTABLE_ROUTES = ["subcutaneous", "intramuscular", "intradermal"];

/**
 * Onboarding's schedule step, for the primary medication only.
 *
 * Every control here is driven by the medication chosen in the step before it:
 * the strengths come from the product's own dose list, and the frequency, day,
 * time and interval come from its schedule. Change the medication and the
 * answers here are replaced with the new product's own — nothing carries over.
 *
 * The dose is optional. A pre-filled value is the label's own starting point,
 * never a recommendation, and everything can be changed.
 */
export default function ScheduleStep({
  medication, dose, onDoseChange, doseOther, onDoseOtherChange, schedule, onScheduleChange, error,
}) {
  const route = getMedicationConfig(medication)?.route || "";
  const injectable = !route || INJECTABLE_ROUTES.includes(route);

  return (
    <div className="flex flex-col">
      <ScheduleIllustration />
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
          {injectable ? "Let's set your shot schedule." : "Let's set your dose schedule."}
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed mt-2">
          Set it once here, and Levli works out your next dose date from it.
        </p>
      </div>

      <div className="space-y-5">
        <DoseChoice
          medication={medication}
          value={dose}
          onChange={onDoseChange}
          other={doseOther}
          onOtherChange={onDoseOtherChange}
        />
        <ScheduleFields
          medication={medication}
          value={schedule}
          onChange={onScheduleChange}
          showStartDate
        />
      </div>

      <p className="text-[12.5px] text-muted-foreground leading-relaxed px-1 mt-4">{PRESCRIBER_HELPER}</p>
      {error && (
        <p className="text-[13.5px] font-medium text-red-600 mt-1.5 px-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}