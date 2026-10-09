import React from "react";
import { Check } from "lucide-react";
import OnboardingArt from "@/components/onboarding/OnboardingArt";
import { MedicationIllustration } from "@/components/onboarding/OnboardingIllustrations";
import { PillIcon } from "@/components/onboarding/LevliIcons";
import { InjectionIcon, NeutralIcon } from "@/components/onboarding/MedicationIcons";
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

// The mark each chip carries, following how the product is taken: an injection
// pen for the injectables, a capsule for the tablets, both for Wegovy (which
// comes either way), and a plain plus for anything not on the list.
const ORAL_LABELS = ["Rybelsus®", "Foundayo®"];
const BOTH_LABELS = ["Wegovy®"];

/** The mark's size, so every chip carries the same one. */
const ICON = 28;

function medIcon(label) {
  if (BOTH_LABELS.includes(label)) {
    return (
      <>
        <PillIcon size={ICON} />
        <InjectionIcon size={ICON} />
      </>
    );
  }
  if (ORAL_LABELS.includes(label)) return <PillIcon size={ICON} />;
  if (label === "Other") return <NeutralIcon size={ICON} />;
  return <InjectionIcon size={ICON} />;
}

/**
 * One medication chip: only as wide as its own name, always on one line, with
 * its route mark on the left and the checkmark arriving on the right only once
 * the chip is chosen. Every chip is the same height, tall enough for the full
 * size of its mark.
 */
function MedChip({ label, selected, onSelect, compact = false }) {
  return (
    <button
      type="button"
      onClick={() => { sound.tap(); onSelect(label); }}
      aria-pressed={selected}
      className={`inline-flex h-12 items-center gap-2 whitespace-nowrap rounded-full px-3.5 font-medium transition-all active:scale-[0.98] ${
        compact ? "text-[12px]" : "text-[14px]"
      } ${
        selected
          ? "border-[1.5px] border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
          : "border border-gray-200 bg-white text-gray-900 hover:border-gray-300 dark:border-white/[0.12] dark:bg-white/[0.05] dark:text-[#E8E9F0]"
      }`}
    >
      <span className="flex flex-shrink-0 items-center gap-2">{medIcon(label)}</span>
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
 * own name, with the helper line below the block as plain small text.
 */
export default function MedicationStep({ selectedMed, onSelect }) {
  return (
    <div className="flex flex-col pb-8">
      <OnboardingArt>
        <MedicationIllustration />
      </OnboardingArt>
      <div className="text-center mb-3">
        <h1 className="text-[24px] sm:text-[28px] font-bold text-gray-800 mb-2 leading-tight px-2">
          Which medication are you on?
        </h1>
        <p className="text-[15px] text-gray-500 leading-relaxed px-2">This helps us tailor your dose schedule and inventory tracking.</p>
      </div>

      {/* The chips sit straight on the screen's background, centred, with the
          same gaps both ways. Each chip keeps its own white fill and hairline
          border, so it stays visible without a card behind it. */}
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
              compact
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

      <p className="mt-5 px-2 text-center text-[13px] leading-snug text-gray-500 dark:text-[#9A9DAE]">
        Taking more than one? You can add the others after setup.
      </p>
    </div>
  );
}