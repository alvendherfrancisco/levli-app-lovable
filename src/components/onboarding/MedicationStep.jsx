import React from "react";
import { Check } from "lucide-react";
import OnboardingArt from "@/components/onboarding/OnboardingArt";
import { MedicationIllustration } from "@/components/onboarding/OnboardingIllustrations";
import {
  CUSTOM_MEDICATION_NAME, getMedicationConfig, medicationFormTag,
} from "@/lib/medicationConfig";
import {
  InjectionIcon, PillIcon, NeutralIcon,
} from "@/components/onboarding/MedicationIcons";
import { sound } from "@/lib/sounds";
import { ACCENT_TEXT, CHIP, CHIP_IDLE, CHIP_ON, HEADING, HEAD_BLOCK, SUBTITLE } from "@/lib/uiStyles";

/**
 * The products this step offers, in the order it sets them: the injectable
 * brands first, then the oral ones, then the two generic / compounded entries,
 * with "Others" last. Onboarding asks for the one medication a person is mainly
 * on; anything else is added afterwards from Home or Medications.
 *
 * `value` is what choosing a chip stores — the catalogue's own product name, so
 * every other screen resolves the product, its strengths and its interval from
 * it. `label` is only how the chip reads on screen.
 *
 * Each chip's icon says how the product is taken — the pen for the injectables,
 * the capsule for the oral products, and a plain plus for "Others", which
 * implies no route. Every chip carries one icon only.
 */
const ONBOARDING_MEDICATIONS = [
  { value: "Mounjaro®", label: "Mounjaro®" },
  { value: "Wegovy®", label: "Wegovy®" },
  { value: "Ozempic®", label: "Ozempic®" },
  { value: "Zepbound®", label: "Zepbound®" },
  { value: "Saxenda®", label: "Saxenda®" },
  { value: "Rybelsus®", label: "Rybelsus®" },
  { value: "Foundayo®", label: "Foundayo®" },
  { value: "Semaglutide", label: "Semaglutide (generic / compounded)" },
  { value: "Tirzepatide", label: "Tirzepatide (generic / compounded)" },
  { value: CUSTOM_MEDICATION_NAME, label: CUSTOM_MEDICATION_NAME },
];

export const MED_OPTIONS = ONBOARDING_MEDICATIONS.map((m) => ({
  ...m,
  generic: getMedicationConfig(m.value)?.genericName || "",
  icon: m.value === CUSTOM_MEDICATION_NAME
    ? NeutralIcon
    : medicationFormTag(m.value) === "Pill" ? PillIcon : InjectionIcon,
}));

/**
 * One medication chip: its route icon, then the name, and a small check when it
 * is chosen. Every chip is the same height, and the icon is the same height and
 * the same distance from the name on all of them, so the names line up. Pill
 * rounded, the card's own surface with a hairline border; the chosen one turns
 * the app's soft indigo with an indigo hairline. The icon keeps its own gradient
 * in both states, and every colour here comes from the tokens, so the chips
 * follow the device's light/dark setting like the rest of the flow.
 */
function MedChip({ option, selected, onSelect }) {
  const { label, icon: Icon, value } = option;
  return (
    <button
      type="button"
      onClick={() => { sound.tap(); onSelect(value); }}
      aria-pressed={selected}
      className={`${CHIP} max-w-full ${selected ? CHIP_ON : CHIP_IDLE}`}
    >
      {Icon && <Icon height={28} />}
      {label}
      {selected && <Check size={14} className={`flex-shrink-0 ${ACCENT_TEXT}`} strokeWidth={2.5} />}
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
          same gap across as between the rows. Each chip keeps its own surface
          fill and hairline border, so it stays visible without a card behind
          it. */}
      <div
        role="group"
        aria-label="Which medication are you on?"
        className="flex flex-wrap justify-center gap-2"
      >
        {MED_OPTIONS.map((opt) => (
          <MedChip
            key={opt.value}
            option={opt}
            selected={selectedMed === opt.value}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}