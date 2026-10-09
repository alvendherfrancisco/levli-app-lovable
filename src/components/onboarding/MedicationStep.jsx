import React from "react";
import { Check } from "lucide-react";
import OnboardingArt from "@/components/onboarding/OnboardingArt";
import { MedicationIllustration } from "@/components/onboarding/OnboardingIllustrations";
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
  { label: "Foundayo®", generic: "Orforglipron" },
  { label: COMPOUNDED_SEMAGLUTIDE, generic: "Semaglutide" },
  { label: COMPOUNDED_TIRZEPATIDE, generic: "Tirzepatide" },
  { label: "Other", generic: null },
];

// The two compounded names are the longest on the list: each is given a line of
// its own rather than being squeezed beside a neighbour.
const LONG_LABELS = [COMPOUNDED_SEMAGLUTIDE, COMPOUNDED_TIRZEPATIDE];
const SHORT_MEDS = MED_OPTIONS.filter((o) => o.label !== "Other" && !LONG_LABELS.includes(o.label));
const LONG_MEDS = MED_OPTIONS.filter((o) => LONG_LABELS.includes(o.label));
const OTHER_MED = MED_OPTIONS.find((o) => o.label === "Other");

/**
 * One medication chip: text only, only as wide as its own name, always on one
 * line. Pill-rounded, white with a hairline grey border; the chosen one turns
 * light indigo with an indigo hairline and carries a small check on the right.
 * Every chip is the same height and the same type size.
 */
function MedChip({ label, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => { sound.tap(); onSelect(label); }}
      aria-pressed={selected}
      className={`inline-flex h-11 items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-[14px] font-medium transition-all active:scale-[0.98] ${
        selected
          ? "border-[1.5px] border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
          : "border border-gray-200 bg-white text-gray-900 hover:border-gray-300 dark:border-white/[0.12] dark:bg-white/[0.05] dark:text-[#E8E9F0]"
      }`}
    >
      {label}
      {selected && <Check size={14} className="flex-shrink-0 text-indigo-600" strokeWidth={3} />}
    </button>
  );
}

/**
 * The primary medication — one choice, not a list. Onboarding sets up the
 * medication a person is mainly on; anything else is added afterwards, from
 * Home or Medications, so every onboarding screen stays the same length.
 *
 * The choices sit directly on the screen's own background — no card around
 * them: pill chips that wrap and centre themselves, each only as wide as its
 * own name, with nothing else under the block.
 */
export default function MedicationStep({ selectedMed, onSelect }) {
  return (
    <div className="flex flex-col pb-2">
      <OnboardingArt>
        <MedicationIllustration />
      </OnboardingArt>
      <div className="text-center mb-4">
        <h1 className="text-[24px] sm:text-[28px] font-bold text-gray-800 mb-2 leading-tight px-2">
          Which medication are you on?
        </h1>
        <p className="text-[15px] text-gray-500 leading-relaxed px-2">This helps us tailor your dose schedule and inventory tracking.</p>
      </div>

      {/* The chips sit straight on the screen's background, centred, with the
          same gap across as between the rows. Each chip keeps its own white
          fill and hairline border, so it stays visible without a card behind
          it. */}
      <div
        role="group"
        aria-label="Which medication are you on?"
        className="flex flex-wrap justify-center gap-2"
      >
        {SHORT_MEDS.map((opt) => (
          <MedChip
            key={opt.label}
            label={opt.label}
            selected={selectedMed === opt.label}
            onSelect={onSelect}
          />
        ))}
        {/* Too long to sit beside another chip, so each takes a row of its own
            — still only as wide as its name. */}
        {LONG_MEDS.map((opt) => (
          <div key={opt.label} className="flex w-full justify-center">
            <MedChip
              label={opt.label}
              selected={selectedMed === opt.label}
              onSelect={onSelect}
            />
          </div>
        ))}
        {OTHER_MED && (
          <MedChip
            label={OTHER_MED.label}
            selected={selectedMed === OTHER_MED.label}
            onSelect={onSelect}
          />
        )}
      </div>
    </div>
  );
}