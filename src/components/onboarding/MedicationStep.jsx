import React from "react";
import { Check } from "lucide-react";
import OnboardingArt from "@/components/onboarding/OnboardingArt";
import { MedicationIllustration } from "@/components/onboarding/OnboardingIllustrations";
import { COMPOUNDED_SEMAGLUTIDE, COMPOUNDED_TIRZEPATIDE } from "@/lib/medicationCatalogue";
import {
  InjectionIcon, PillIcon, ComboIcon, NeutralIcon,
} from "@/components/onboarding/MedicationIcons";
import { sound } from "@/lib/sounds";

/**
 * The medications onboarding offers, in the order they are shown. Each carries
 * the generic behind it, which is what the dose and schedule screens read from,
 * and the icon that says how it is taken: the pen for the injectables, the
 * capsule for the oral products, both marks for Wegovy, and a plain plus for
 * "Other", which implies no route.
 */
export const MED_OPTIONS = [
  { label: "Mounjaro®", generic: "Tirzepatide", icon: InjectionIcon },
  { label: "Wegovy®", generic: "Semaglutide", icon: ComboIcon },
  { label: "Ozempic®", generic: "Semaglutide", icon: InjectionIcon },
  { label: "Zepbound®", generic: "Tirzepatide", icon: InjectionIcon },
  { label: "Saxenda®", generic: "Liraglutide", icon: InjectionIcon },
  { label: "Rybelsus®", generic: "Semaglutide", icon: PillIcon },
  { label: "Foundayo®", generic: "Orforglipron", icon: PillIcon },
  { label: COMPOUNDED_SEMAGLUTIDE, generic: "Semaglutide", icon: InjectionIcon },
  { label: COMPOUNDED_TIRZEPATIDE, generic: "Tirzepatide", icon: InjectionIcon },
  { label: "Other", generic: null, icon: NeutralIcon },
];

// The two compounded names are the longest on the list: each is given a line of
// its own rather than being squeezed beside a neighbour.
const LONG_LABELS = [COMPOUNDED_SEMAGLUTIDE, COMPOUNDED_TIRZEPATIDE];
const SHORT_MEDS = MED_OPTIONS.filter((o) => o.label !== "Other" && !LONG_LABELS.includes(o.label));
const LONG_MEDS = MED_OPTIONS.filter((o) => LONG_LABELS.includes(o.label));
const OTHER_MED = MED_OPTIONS.find((o) => o.label === "Other");

/**
 * One medication chip: its route icon, then the name, and a small check when it
 * is chosen. Every chip is the same height, and the icon is the same height and
 * the same distance from the name on all of them, so the names line up. Pill
 * rounded, white with a hairline grey border; the chosen one turns light indigo
 * with an indigo hairline. The icon keeps its own gradient in both states.
 */
function MedChip({ label, Icon, selected, onSelect, compact = false }) {
  return (
    <button
      type="button"
      onClick={() => { sound.tap(); onSelect(label); }}
      aria-pressed={selected}
      className={`inline-flex h-11 max-w-full items-center gap-1.5 whitespace-nowrap rounded-full font-medium transition-all active:scale-[0.98] ${
        compact ? "pl-2.5 pr-3.5 text-[13px]" : "pl-2.5 pr-4 text-[14px]"
      } ${
        selected
          ? "border-[1.5px] border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
          : "border border-gray-200 bg-white text-gray-900 hover:border-gray-300 dark:border-white/[0.12] dark:bg-white/[0.05] dark:text-[#E8E9F0]"
      }`}
    >
      {Icon && <Icon height={28} />}
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
            Icon={opt.icon}
            selected={selectedMed === opt.label}
            onSelect={onSelect}
          />
        ))}
        {LONG_MEDS.map((opt) => (
          <div key={opt.label} className="flex w-full justify-center">
            <MedChip
              label={opt.label}
              Icon={opt.icon}
              selected={selectedMed === opt.label}
              onSelect={onSelect}
              compact
            />
          </div>
        ))}
        {OTHER_MED && (
          <MedChip
            label={OTHER_MED.label}
            Icon={OTHER_MED.icon}
            selected={selectedMed === OTHER_MED.label}
            onSelect={onSelect}
          />
        )}
      </div>
    </div>
  );
}