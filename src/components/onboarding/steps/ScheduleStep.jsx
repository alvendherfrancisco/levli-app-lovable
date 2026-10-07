import React from "react";
import { ScheduleIllustration } from "@/components/onboarding/OnboardingIllustrations";
import StepArt from "@/components/onboarding/StepArt";
import StepHeading from "@/components/onboarding/StepHeading";
import { chip } from "@/components/onboarding/onboardingStyles";
import { sound } from "@/lib/sounds";

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

/**
 * Step 6 — how often, and which day. The dose is not asked for again here: it was
 * chosen on the medication step, where it belongs to a specific product. What was
 * chosen is shown back as a summary so the step still reads as a whole picture.
 */
export default function ScheduleStep({
  frequency, setFrequency, shotDay, setShotDay, frequencyOptions, doseSummary,
}) {
  return (
    <div className="flex flex-col gap-[clamp(0.5rem,1.8vh,1.25rem)] py-2">
      <StepArt size="compact">
        <ScheduleIllustration />
      </StepArt>

      <StepHeading
        title="Let's set your shot schedule."
        subtitle="Set it once here, and Levli works out your next dose date from it."
      />

      {doseSummary && (
        <div className="rounded-2xl border border-border bg-background px-3.5 py-2.5 text-center">
          <p className="text-[13px] text-muted-foreground">Your dose</p>
          <p className="text-[15px] font-semibold text-foreground">{doseSummary}</p>
        </div>
      )}

      <div>
        <p className="mb-2 text-sm font-semibold text-foreground">How often?</p>
        <div className="flex flex-wrap gap-2">
          {frequencyOptions.map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => { sound.tap(); setFrequency(opt.label); }}
              aria-pressed={frequency === opt.label}
              className={`${chip(frequency === opt.label)} min-h-[46px] rounded-xl px-3.5 text-sm font-medium`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-foreground">Preferred day</p>
        <div className="grid grid-cols-7 gap-1">
          {DAYS.map((d, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { sound.tap(); setShotDay(i); }}
              aria-label={`Day ${i + 1}`}
              aria-pressed={shotDay === i}
              className={`${chip(shotDay === i)} h-11 w-full rounded-full text-sm font-semibold`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}