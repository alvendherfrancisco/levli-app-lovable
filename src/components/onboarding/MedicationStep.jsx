import React from "react";
import { Check } from "lucide-react";
import OnboardingArt from "@/components/onboarding/OnboardingArt";
import { MedicationIllustration } from "@/components/onboarding/OnboardingIllustrations";
import { PillIcon } from "@/components/onboarding/LevliIcons";
import { COMPOUNDED_SEMAGLUTIDE, COMPOUNDED_TIRZEPATIDE } from "@/lib/medicationCatalogue";
import { sound } from "@/lib/sounds";

/**
 * The medications onboarding offers, in the order they are shown. Each carries
 * the generic behind it, which is what the dose and schedule screens read from.
 */
export const MED_OPTIONS = [
  { label: "Mounjaro®", generic: "Tirzepatide" },
  { label: "Wegovy®", generic: "Semaglutide" },
  { label: "Ozempic®", generic: "Semaglutide" },
  { label: "Zepbound®", generic: "Tirzepatide" },
  { label: "Saxenda®", generic: "Liraglutide" },
  { label: "Rybelsus®", generic: "Semaglutide" },
  { label: COMPOUNDED_SEMAGLUTIDE, generic: "Semaglutide" },
  { label: COMPOUNDED_TIRZEPATIDE, generic: "Tirzepatide" },
  { label: "Other", generic: null },
];

/**
 * The primary medication — one choice, not a list. Onboarding sets up the
 * medication a person is mainly on; anything else is added afterwards, from
 * Home or Medications, so every onboarding screen stays the same length.
 *
 * The choices sit in one white card, drawn on the app's standard surface, as a
 * column of equal pill rows: same height, same thin border, the pill mark on the
 * left and the name in the normal text colour, with the checkmark arriving on
 * the right only once a row is chosen.
 */
export default function MedicationStep({ selectedMed, onSelect }) {
  return (
    <div className="flex flex-col pb-6">
      <OnboardingArt>
        <MedicationIllustration />
      </OnboardingArt>
      <div className="text-center mb-3">
        <h1 className="text-[24px] sm:text-[28px] font-bold text-gray-800 mb-2 leading-tight px-2">
          Which medication are you on?
        </h1>
        <p className="text-[15px] text-gray-500 leading-relaxed px-2">This helps us tailor your dose schedule and inventory tracking.</p>
      </div>

      {/* Every choice in one card, one equal pill row each — the card carries the
          thin border and soft shadow, and the helper line sits inside it under
          the last row so the whole choice lives in one place. */}
      <div
        role="group"
        aria-label="Which medication are you on?"
        className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm dark:border-white/[0.12] dark:bg-white/[0.04]"
      >
        <div className="flex flex-col gap-2">
          {MED_OPTIONS.map((opt) => {
            const selected = selectedMed === opt.label;
            return (
              <button
                key={opt.label}
                type="button"
                onClick={() => { sound.tap(); onSelect(opt.label); }}
                aria-pressed={selected}
                className={`flex min-h-[44px] w-full items-center gap-2.5 rounded-full border px-3.5 py-2 text-left text-[15px] font-medium transition-all active:scale-[0.99] ${
                  selected
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
                    : "border-gray-200 bg-white text-gray-900 hover:border-gray-300 dark:border-white/[0.12] dark:bg-white/[0.05] dark:text-[#E8E9F0]"
                }`}
              >
                <PillIcon size={17} />
                <span className="min-w-0 flex-1">{opt.label}</span>
                {selected && <Check size={15} className="flex-shrink-0 text-indigo-600" strokeWidth={3} />}
              </button>
            );
          })}
        </div>

        <p className="mt-3 px-1 text-[13px] leading-snug text-gray-500 dark:text-[#9A9DAE]">
          Taking more than one? You can add the others after setup.
        </p>
      </div>
    </div>
  );
}