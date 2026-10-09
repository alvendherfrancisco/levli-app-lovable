import React from "react";
import OptionCard from "@/components/onboarding/OptionCard";
import OnboardingArt from "@/components/onboarding/OnboardingArt";
import { TrackingIllustration } from "@/components/onboarding/OnboardingIllustrations";
import { TRACKING_MODULES } from "@/lib/trackingModules";
import { sound } from "@/lib/sounds";
import {
  CARD, CARD_FLUSH, CARD_GAP, HEADING, HEAD_BLOCK, LABEL, SUBTITLE,
} from "@/lib/uiStyles";

const UNIT_GROUPS = [
  { key: "weight_unit", label: "Weight", options: [{ value: "lb", label: "lb" }, { value: "kg", label: "kg" }] },
  { key: "height_unit", label: "Height", options: [{ value: "in", label: "ft / in" }, { value: "cm", label: "cm" }] },
  { key: "liquid_unit", label: "Liquids", options: [{ value: "oz", label: "oz" }, { value: "mL", label: "mL" }] },
];

/**
 * What the person wants to keep an eye on.
 *
 * This is a multi-select with no wrong answer: any combination is fine, an empty
 * one is fine too, and nothing here ever holds Next back. Nothing starts ticked:
 * the first-time screen shows every row empty, and what is ticked here is exactly
 * what Home and Insights show (both read from src/lib/trackingModules.js).
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

      <div className={HEAD_BLOCK}>
        <h1 className={HEADING}>What would you like to keep an eye on?</h1>
        <p className={SUBTITLE}>Pick any that apply. You can change this later.</p>
      </div>

      {/* All six choices in one card — one compact row each, divided by a
          hairline. The card carries the single thin border and soft shadow. */}
      <div
        role="group"
        aria-label="What would you like to keep an eye on?"
        className={`${CARD_FLUSH} ${CARD_GAP} overflow-hidden`}
      >
        <div className="divide-y divide-gray-100 dark:divide-white/[0.08]">
          {TRACKING_MODULES.map((opt) => (
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
      <div className={`${CARD} ${CARD_GAP}`}>
        <p className={LABEL}>Measurement preferences</p>
        <div className="divide-y divide-gray-100 dark:divide-white/[0.08]">
          {UNIT_GROUPS.map((group) => (
            <div key={group.key} className="flex items-center justify-between gap-3 py-2">
              <span className="text-[16px] text-gray-900 dark:text-[#E8E9F0]">{group.label}</span>
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
                      className={`flex-1 rounded-full text-[14px] font-medium transition-colors ${
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