import React from "react";
import { ScheduleIllustration } from "@/components/onboarding/OnboardingIllustrations";
import DoseChoice from "@/components/schedule/DoseChoice";
import DoseAmountField from "@/components/schedule/DoseAmountField";
import ScheduleFields from "@/components/schedule/ScheduleFields";
import OnboardingArt from "@/components/onboarding/OnboardingArt";
import { allowsAnyDose, getAllowedDoses, getMedicationConfig } from "@/lib/medicationConfig";
import {
  CARD, CARD_GAP, HEADING, HEAD_BLOCK, HELP_IN_CARD, NOTICE, STACK, SUBTITLE,
} from "@/lib/uiStyles";

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
  // A product whose label lists no strengths — compounded, a peptide, "Other" —
  // is asked for the amount directly, in the same field style as the rest of the
  // card. A product with a label list keeps its own strength chips.
  const anyDose = getAllowedDoses(medication).length === 0 || allowsAnyDose(medication);

  return (
    <div className="flex flex-col pb-6">
      <OnboardingArt>
        <ScheduleIllustration />
      </OnboardingArt>
      <div className={HEAD_BLOCK}>
        <h1 className={HEADING}>
          {injectable ? "Let's set your shot schedule." : "Let's set your dose schedule."}
        </h1>
        <p className={SUBTITLE}>
          Set it once here, and Levli works out your next dose date from it.
        </p>
      </div>

      {/* The whole answer in one card, drawn like the account screens' own. */}
      <div className={`${CARD} ${CARD_GAP}`}>
        <div className={STACK}>
          {anyDose ? (
            <DoseAmountField medication={medication} value={dose} onChange={onDoseChange} />
          ) : (
            <DoseChoice
              medication={medication}
              value={dose}
              onChange={onDoseChange}
              other={doseOther}
              onOtherChange={onDoseOtherChange}
            />
          )}
          <ScheduleFields
            medication={medication}
            value={schedule}
            onChange={onScheduleChange}
            showStartDate
            frequencyLayout="grid"
          />
          <p className={HELP_IN_CARD}>{PRESCRIBER_HELPER}</p>
        </div>
      </div>
      {error && (
        <p className={NOTICE} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}