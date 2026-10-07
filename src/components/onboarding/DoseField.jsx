import React from "react";
import DoseChips from "@/components/modals/DoseChips";
import { allowsAnyDose, getDoseUnit } from "@/lib/medicationConfig";
import { getDoseChips } from "@/lib/doseOptions";

/**
 * The dose, as chips.
 *
 * Against a product whose label lists its strengths, only those strengths are
 * offered — each in the colour the maker gives it, with the number always
 * shown — plus "Other" for a dose the prescriber set differently. A product with
 * no label list (compounded, peptide, custom) can only be typed. Nothing here
 * carries a strength over from another medication: the step reconciles the
 * stored dose whenever the medication changes.
 */
export default function DoseField({ medication, schedule, customDoses, onChange, onAddCustomDose }) {
  const unverified = !!medication && allowsAnyDose(medication);

  return (
    <div className="mb-4">
      <DoseChips
        medication={medication}
        options={getDoseChips(medication, customDoses)}
        value={schedule.dose}
        unit={getDoseUnit(medication)}
        label="Your dose (optional)"
        helper={unverified ? "Levli has no label for this product, so this dose can't be checked." : undefined}
        onSelect={(dose) => onChange({ ...schedule, dose })}
        onAddCustom={(dose) => {
          onAddCustomDose(dose);
          onChange({ ...schedule, dose });
        }}
      />
    </div>
  );
}