import React from "react";
import { Check } from "lucide-react";
import OnboardingArt from "@/components/onboarding/OnboardingArt";
import { MedicationIllustration } from "@/components/onboarding/OnboardingIllustrations";
import { COMPOUNDED_SEMAGLUTIDE, COMPOUNDED_TIRZEPATIDE } from "@/lib/medicationCatalogue";
import {
  InjectionIcon, PillIcon, NeutralIcon,
} from "@/components/onboarding/MedicationIcons";
import { sound } from "@/lib/sounds";
import { CHIP, CHIP_IDLE, CHIP_ON, CHIP_WRAP, HEADING, HEAD_BLOCK, SUBTITLE } from "@/lib/uiStyles";

/**
 * The medications onboarding offers, in the order they are shown. Each carries
 * the generic behind it, which is what the dose and schedule screens read from,
 * and the icon that says how it is taken: the pen for the injectables, the
 * capsule for the oral products, and a plain plus for "Other", which implies no
 * route. Every chip carries one icon only.
 */
export const MED_OPTIONS = [
  { label: "Mounjaro®", generic: "Tirzepatide", icon: InjectionIcon },
  { label: "Wegovy®", generic: "Semaglutide", icon: InjectionIcon },
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
function MedChip({ label, Icon, selected, onSelect, wrap = false }) {
  return (
    <button
      type="button"
      onClick={() => { sound.tap(); onSelect(label); }}
      aria-pressed={selected}
      className={`${wrap ? CHIP_WRAP : CHIP} max-w-full ${selected ? CHIP_ON : CHIP_IDLE}`}
    >
      {Icon && <Icon height={28} />}
      {label}
      {selected && <Check size={14} className="flex-shrink-0 text-indigo-600" strokeWidth={2.5} />}
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
      <div className={HEAD_BLOCK}>
        <h1 className={HEADING}>Which medication are you on?</h1>
        <p className={SUBTITLE}>This helps us tailor your dose schedule and inventory tracking.</p>
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
              wrap
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