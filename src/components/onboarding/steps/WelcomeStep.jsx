import React from "react";
import { WelcomeIllustration } from "@/components/onboarding/OnboardingIllustrations";
import StepArt from "@/components/onboarding/StepArt";
import StepHeading from "@/components/onboarding/StepHeading";

export default function WelcomeStep() {
  return (
    <div className="flex flex-col gap-[clamp(0.5rem,2vh,1.5rem)] py-2">
      <StepArt size="hero">
        <WelcomeIllustration />
      </StepArt>
      <StepHeading
        title="You're starting a journey — we're here for it."
        subtitle="Levli helps you track your shots, symptoms, and progress, so you can feel more in control, one day at a time."
      />
    </div>
  );
}