import React from "react";
import { ScheduleIllustration } from "@/components/onboarding/OnboardingIllustrations";
import { plainBrandName } from "@/lib/medicationConfig";
import DoseField from "@/components/onboarding/DoseField";
import FrequencyField from "@/components/onboarding/FrequencyField";
import ScheduleTimingFields from "@/components/onboarding/ScheduleTimingFields";

/**
 * "Let's set your shot schedule."
 *
 * Every choice on this screen comes from the medication the person picked: the
 * frequencies its own prescribing information allows (and the one to start on),
 * the day and time controls that frequency actually asks for, and the strengths
 * its label lists. Nothing is hard-coded here and nothing is a recommendation —
 * the defaults are starting points the person can change, and the one line of
 * instruction repeated is the prescriber's.
 *
 * The state it works on lives with the rest of the onboarding answers (see
 * src/pages/Onboarding.jsx); this screen only draws it and hands changes back.
 */
export default function ScheduleStep({
  medication,
  otherMedications = 0,
  schedule,
  onChange,
  customDoses = [],
  onAddCustomDose,
}) {
  const name = plainBrandName(medication);

  return (
    <div className="flex flex-col">
      <ScheduleIllustration className="onb-art" />

      <div className="text-center mt-2.5 mb-3">
        <h1 className="text-[24px] sm:text-[28px] font-bold text-gray-800 mb-2 leading-tight px-2">
          Let's set your shot schedule.
        </h1>
        <p className="text-[15px] text-gray-500 leading-relaxed px-2">
          {name
            ? `For ${name}: set it once here, and Levli works out your next dose date from the last dose you log.`
            : "Set it once here, and Levli works out your next dose date from the last dose you log."}
          {otherMedications > 0 && " Your other medications can be set up later."}
        </p>
      </div>

      {/* The dose, from this product's own strengths. */}
      <DoseField
        medication={medication}
        schedule={schedule}
        customDoses={customDoses}
        onChange={onChange}
        onAddCustomDose={onAddCustomDose}
      />

      {/* How often — this product's own intervals, and the source they came from. */}
      <FrequencyField medication={medication} schedule={schedule} onChange={onChange} />

      {/* The day, days, interval or reminder time that frequency asks for. */}
      <ScheduleTimingFields medication={medication} schedule={schedule} onChange={onChange} />

      <p className="text-[12.5px] text-gray-500 leading-relaxed mt-4 px-1">
        Follow your prescriber's instructions. You can change any of this later.
      </p>
    </div>
  );
}