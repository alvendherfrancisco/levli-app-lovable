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
    <div className="flex flex-col pb-6">
      <OnboardingArt>
        <TrackingIllustration />
      </OnboardingArt>

      <div className="text-center mb-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2 leading-tight px-2">
          What would you like to keep an eye on?
        </h1>
        <p className="mt-1 text-[15px] text-gray-500 leading-relaxed px-2">
          Pick any that apply. You can change this later.
        </p>
      </div>

      {/* All six choices in one card — one compact row each, divided by a
          hairline. The card carries the single thin border and soft shadow. */}
      <div
        role="group"
        aria-label="What would you like to keep an eye on?"
        className="mb-3 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/[0.12] dark:bg-white/[0.04]"
      >
        <div className="divide-y divide-gray-100 dark:divide-white/[0.08]">
          {TRACKING_OPTIONS.map((opt) => (
            <OptionCard
              key={opt.key}
              icon={opt.Icon}
              label={opt.label}
              selected={tracking.includes(opt.key)}
              onToggle={(on) => setOne(opt.key, on)}
            />
          ))}
        </div>
      </div>

      {/* Measurement preferences — how what is logged is shown, not what is
          tracked, so they sit in their own card below the choices, drawn on the
          app's standard surface. */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/[0.12] dark:bg-white/[0.04]">
        <p className="mb-1.5 text-[13px] font-medium text-gray-900 dark:text-[#E8E9F0]">Measurement preferences</p>
        <div className="divide-y divide-gray-100 dark:divide-white/[0.08]">
          {UNIT_GROUPS.map((group) => (
            <div key={group.key} className="flex items-center justify-between gap-3 py-2.5">
              <span className="text-[15px] text-gray-900 dark:text-[#E8E9F0]">{group.label}</span>
              {/* One pill, split in two: the same width and height on every row,
                  so the three sit in a neat column. */}
              <div
                role="group"
                aria-label={group.label}
                className="flex h-10 w-[112px] flex-shrink-0 rounded-full bg-gray-100 p-0.5 dark:bg-white/[0.08]"
              >
                {group.options.map((opt) => {
                  const on = units[group.key] === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      aria-pressed={on}
                      onClick={() => { sound.tap(); setUnits((prev) => ({ ...prev, [group.key]: opt.value })); }}
                      className={`flex-1 rounded-full text-[13px] font-medium transition-colors ${
                        on ? "bg-indigo-600 text-white" : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}