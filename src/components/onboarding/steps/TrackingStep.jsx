import React from "react";
import { Check } from "lucide-react";
import { TrackingIllustration } from "@/components/onboarding/OnboardingIllustrations";
import StepArt from "@/components/onboarding/StepArt";
import StepHeading from "@/components/onboarding/StepHeading";
import { chip } from "@/components/onboarding/onboardingStyles";
import { sound } from "@/lib/sounds";
import {
  MoodIcon, HeartIcon, ScaleIcon, NutritionIcon, InjectionSiteIcon,
} from "@/components/onboarding/LevliIcons";

const TRACKING_OPTIONS = [
  { key: "symptoms", label: "Symptoms", desc: "How you're feeling", Icon: MoodIcon },
  { key: "mood", label: "Mood", desc: "Emotional wellbeing", Icon: HeartIcon },
  { key: "weight", label: "Weight", desc: "Progress over time", Icon: ScaleIcon },
  { key: "nutrition", label: "Nutrition", desc: "Meals, water, protein", Icon: NutritionIcon },
  { key: "sites", label: "Injection sites", desc: "Rotate with confidence", Icon: InjectionSiteIcon },
];

const UNIT_GROUPS = [
  { key: "weight_unit", label: "Weight", options: [{ value: "lb", label: "lb" }, { value: "kg", label: "kg" }] },
  { key: "height_unit", label: "Height", options: [{ value: "in", label: "ft / in" }, { value: "cm", label: "cm" }] },
  { key: "liquid_unit", label: "Liquids", options: [{ value: "oz", label: "oz" }, { value: "mL", label: "mL" }] },
];

/**
 * Step 7 — what to keep an eye on, and the measurement preferences.
 *
 * The five choices are a two-column grid rather than five full-width rows, which
 * is what lets the whole step, including the unit preferences, sit on one screen.
 */
export default function TrackingStep({ tracking, setTracking, units, setUnits }) {
  const toggle = (key) => {
    sound.tap();
    setTracking((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  return (
    <div className="flex flex-col gap-[clamp(0.5rem,1.8vh,1.25rem)] py-2">
      <StepArt size="compact">
        <TrackingIllustration />
      </StepArt>

      <StepHeading
        title="What would you like to keep an eye on?"
        subtitle="As much or as little as feels right for you. You can change this later."
      />

      <div className="grid grid-cols-2 gap-2">
        {TRACKING_OPTIONS.map((opt) => {
          const selected = tracking.includes(opt.key);
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => toggle(opt.key)}
              aria-pressed={selected}
              className={`${chip(selected)} min-h-[64px] flex-col rounded-2xl px-3 py-2 text-left`}
            >
              <span className="flex w-full items-center gap-1.5">
                <opt.Icon size={22} />
                <span className="flex-1 text-[13px] font-semibold">{opt.label}</span>
                {selected && <Check size={14} strokeWidth={3} className="flex-shrink-0" />}
              </span>
              <span className="mt-0.5 w-full text-left text-[11px] leading-tight opacity-80">{opt.desc}</span>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-border bg-background p-3">
        <p className="text-sm font-semibold text-foreground">Measurement preferences</p>
        <div className="mt-2 space-y-2">
          {UNIT_GROUPS.map((group) => (
            <div key={group.key} className="flex min-h-[44px] items-center justify-between gap-2">
              <span className="text-sm text-muted-foreground">{group.label}</span>
              <div className="flex gap-1.5">
                {group.options.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { sound.tap(); setUnits((prev) => ({ ...prev, [group.key]: opt.value })); }}
                    aria-pressed={units[group.key] === opt.value}
                    className={`${chip(units[group.key] === opt.value)} min-h-[44px] min-w-[64px] rounded-xl px-3 text-sm font-medium`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}