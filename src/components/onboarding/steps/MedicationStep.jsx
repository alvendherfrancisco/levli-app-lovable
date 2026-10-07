import React from "react";
import { Check, ChevronDown, Plus } from "lucide-react";
import MedicationName from "@/components/MedicationName";
import StepArt from "@/components/onboarding/StepArt";
import StepHeading from "@/components/onboarding/StepHeading";
import MedicationSelectionCard from "@/components/onboarding/MedicationSelectionCard";
import { chip, chipBar } from "@/components/onboarding/onboardingStyles";
import { MedicationIllustration } from "@/components/onboarding/OnboardingIllustrations";
import {
  OTHERS_LABEL, genericSubtitle, getCatalogueEntries,
} from "@/lib/medicationConfig";
import { newCatalogueEntry, newCustomEntry } from "@/lib/onboardingMeds";
import { sound } from "@/lib/sounds";

/**
 * Step 3 — which medication(s), and the dose of each.
 *
 * The catalogue is a two-column grid inside its own fixed-height area, so the
 * title and the Continue button never move: only the list scrolls. "Others" is a
 * bar that stays put at the bottom of the step, opening a custom entry whose name
 * is required and whose generic name is optional.
 *
 * Picking a product immediately offers its doses as chips; a product with no
 * listed strengths (or a custom entry) takes a typed dose instead. The optional
 * extras sit folded away on each chosen medication, so the step stays quiet.
 */
export default function MedicationStep({ meds, setMeds, savedRegimens = [] }) {
  const entries = getCatalogueEntries();
  const customSelected = meds.some((m) => m.isCustom);

  const has = (name) => meds.some((m) => m.name === name);
  const regimenFor = (name) => savedRegimens.find((r) => r.medication_name === name);

  const toggle = (name) => {
    sound.tap();
    setMeds((prev) => (
      prev.some((m) => m.name === name)
        ? prev.filter((m) => m.name !== name)
        : [...prev, newCatalogueEntry(name, regimenFor(name))]
    ));
  };

  const toggleCustom = () => {
    sound.tap();
    setMeds((prev) => (
      prev.some((m) => m.isCustom) ? prev.filter((m) => !m.isCustom) : [...prev, newCustomEntry()]
    ));
  };

  const update = (key, patch) => setMeds((prev) => prev.map((m) => (m.key === key ? { ...m, ...patch } : m)));
  const remove = (key) => setMeds((prev) => prev.filter((m) => m.key !== key));

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 py-1">
      <StepArt size="compact">
        <MedicationIllustration />
      </StepArt>

      <StepHeading
        title="Which medication are you on?"
        subtitle="Pick everything you take — Levli uses this for your dose schedule and stock."
      />

      {/* The list is the only thing that scrolls here. */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-0.5">
        <div className="grid grid-cols-2 gap-2">
          {entries.map((entry) => {
            const selected = has(entry.brandName);
            const generic = genericSubtitle(entry.brandName);
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => toggle(entry.brandName)}
                aria-pressed={selected}
                className={`${chip(selected)} min-h-[56px] flex-col rounded-xl px-3 py-2 text-left`}
              >
                <span className="flex w-full items-start gap-1.5">
                  <MedicationName name={entry.brandName} className="flex-1 text-[14px] font-semibold leading-snug" />
                  {selected && <Check size={14} strokeWidth={3} className="mt-0.5 flex-shrink-0" />}
                </span>
                {generic && <span className="mt-0.5 w-full text-left text-[11px] leading-tight opacity-80">{generic}</span>}
              </button>
            );
          })}
        </div>

        {meds.length > 0 && (
          <div className="mt-2 space-y-2">
            {meds.map((m) => (
              <MedicationSelectionCard
                key={m.key}
                entry={m}
                savedRegimen={regimenFor(m.name.trim())}
                duplicateName={!m.isCustom}
                onChange={(patch) => update(m.key, patch)}
                onRemove={() => remove(m.key)}
              />
            ))}
          </div>
        )}
      </div>

      <button type="button" onClick={toggleCustom} aria-pressed={customSelected} className={chipBar(customSelected)}>
        <span className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-current">
            <Plus size={16} />
          </span>
          <span className="min-w-0">
            <span className="block text-[15px] font-semibold">{OTHERS_LABEL}</span>
            <span className="block text-[11px] leading-tight opacity-80">Not listed? Type the name yourself</span>
          </span>
        </span>
        {customSelected ? <Check size={18} className="flex-shrink-0" /> : <ChevronDown size={18} className="flex-shrink-0" />}
      </button>
    </div>
  );
}