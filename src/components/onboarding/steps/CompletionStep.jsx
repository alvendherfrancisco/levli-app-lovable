import React from "react";
import { CompletionIllustration } from "@/components/onboarding/OnboardingIllustrations";
import StepArt from "@/components/onboarding/StepArt";
import StepHeading from "@/components/onboarding/StepHeading";

export default function CompletionStep() {
  return (
    <div className="flex flex-col gap-[clamp(0.5rem,2vh,1.5rem)] py-2">
      <StepArt size="hero">
        <div className="h-full w-full animate-onb-bounce">
          <CompletionIllustration />
        </div>
      </StepArt>
      <StepHeading
        title="You're all set."
        subtitle="Your Home is ready — next shot, mood, and progress, all in one calm place."
      />
    </div>
  );
}