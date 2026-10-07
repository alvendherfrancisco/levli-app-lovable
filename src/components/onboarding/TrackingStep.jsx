import React from "react";
import { Activity, Apple, Dumbbell, Heart, Scale, Syringe } from "lucide-react";
import OptionCard from "@/components/onboarding/OptionCard";
import OnboardingArt from "@/components/onboarding/OnboardingArt";
import { TrackingIllustration } from "@/components/onboarding/OnboardingIllustrations";
import { sound } from "@/lib/sounds";

/**
 * The two modules Levli suggests to start with. They are ordinary selections —
 * shown ticked, and unticked like any other if the person would rather track
 * neither.
 */
export const SUGGESTED_TRACKING = ["symptoms", "weight"];

/**
 * One card per module, named exactly as the thing it turns on: the Home card,
 * the Insights panel and the report section all read the same words. Water sits
 * inside nutrition and mood inside the journal, so neither gets a card of its
 * own — one module, one choice.
 */
export const TRACKING_OPTIONS = [
  { key: "symptoms", label: "Side effects", desc: "Note how you feel after a dose", Icon: Activity },
  { key: "weight", label: "Weight", desc: "Track progress toward your goal", Icon: Scale },
  { key: "nutrition", label: "Nutrition and water", desc: "Log meals, protein and water", Icon: Apple },
  { key: "exercise", label: "Exercise", desc: "Note your activity each day", Icon: Dumbbell },
  { key: "sites", label: "Injection sites and pain", desc: "Rotate with confidence", Icon: Syringe },
  { key: "journal", label: "Journal and mood", desc: "Keep a private diary of how you feel", Icon: Heart },
];

const UNIT_GROUPS = [
  { key: "weight_unit", label: "Weight", options: [{ value: "lb", label: "lb" }, { value: "kg", label: "kg" }] },
  { key: "height_unit", label: "Height", options: [{ value: "in", label: "ft / in" }, { value: "cm", label: "cm" }] },
  { key: "liquid_unit", label: "Liquids", options: [{ value: "oz", label: "oz" }, { value: "mL", label: "mL" }] },
];

/**
 * What the person wants to keep an eye on.
 *
 * This is a multi-select with no wrong answer: any combination is fine, an empty
 * one is fine too, and nothing here ever holds Next back. The choices are what
 * the tracking modules on Home and in Reports are read from.
 */
export default function TrackingStep({ tracking, setTracking, units, setUnits }) {
  const setOne = (key, on) => {
    setTracking((prev) =>
      on
        ? (prev.includes(key) ? prev : [...prev, key])
        : prev.filter((k) => k !== key)
    );
  };

  return (
    <div className="flex flex-col">
      <OnboardingArt>
        <TrackingIllustration />
      </OnboardingArt>

      <div className="text-center mb-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2 leading-tight px-2">
          What would you like to keep an eye on?
        </h1>
        <p className="text-base text-gray-500 leading-relaxed px-2">
          Log as much or as little as feels right for you.
        </p>
        <p className="text-sm text-gray-400 leading-relaxed px-2 mt-1.5">
          Pick any that apply. You can change this anytime in Settings.
        </p>
      </div>

      <div
        role="group"
        aria-label="What would you like to keep an eye on?"
        className="flex flex-col gap-2.5 mb-4"
      >
        {TRACKING_OPTIONS.map((opt) => (
          <OptionCard
            key={opt.key}
            icon={opt.Icon}
            label={opt.label}
            description={opt.desc}
            selected={tracking.includes(opt.key)}
            onToggle={(on) => setOne(opt.key, on)}
          />
        ))}
      </div>

      {/* Measurement preferences — how what is logged is shown, not what is
          tracked, so they stay separate from the cards above. */}
      <div className="border-t border-border pt-4">
        <p className="text-sm font-semibold text-gray-600 mb-3">Measurement preferences</p>
        <div className="space-y-2">
          {UNIT_GROUPS.map((group) => (
            <div key={group.key} className="flex items-center justify-between">
              <span className="text-sm text-gray-500">{group.label}</span>
              <div className="flex gap-1.5">
                {group.options.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { sound.tap(); setUnits((prev) => ({ ...prev, [group.key]: opt.value })); }}
                    className={`min-h-[44px] px-3.5 rounded-xl text-sm font-medium transition-colors ${
                      units[group.key] === opt.value
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
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