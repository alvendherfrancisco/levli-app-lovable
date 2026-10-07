import React from "react";
import { EmpathyIllustration } from "@/components/onboarding/OnboardingIllustrations";
import StepArt from "@/components/onboarding/StepArt";
import StepHeading from "@/components/onboarding/StepHeading";

export default function EmpathyStep() {
  return (
    <div className="flex flex-col gap-[clamp(0.5rem,2vh,1.5rem)] py-2">
      <StepArt size="hero">
        <EmpathyIllustration />
      </StepArt>
      <StepHeading
        title="GLP-1 journeys aren't always linear."
        subtitle="Good days, hard days, plateaus — Levli helps you notice the patterns, so you're never guessing alone."
      />
    </div>
  );
}