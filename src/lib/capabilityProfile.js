// Medication capability profile system.
// Every medication has an explicit capability profile that determines which
// app functions are enabled. This prevents inappropriate features from
// appearing for the wrong medication (e.g., PK curves for unapproved research
// peptides, injection-site rotation for oral tablets, dose calculators for
// cosmetics).

import { NAME_TO_ENTRY } from "@/lib/medicationCatalogue";

const DEFAULT_PROFILE = {
  supports_inventory: false,
  supports_refill_prediction: false,
  supports_injection_site_rotation: false,
  supports_reconstitution: false,
  supports_oral_timing_rules: false,
  supports_topical_tracking: false,
  supports_pk_estimation: false,
  supports_relative_exposure_only: false,
  supports_cgm_context: false,
  supports_weight_tracking: false,
  supports_clinic_administration: false,
  supports_missed_dose_guidance: false,
  supports_titration_tracking: false,
  supports_side_effect_rules: false,
  supports_storage_tracking: false,
  supports_temperature_excursion_logging: false,
  research_only: false,
  compounded_product: false,
  cosmetic_only: false,
  dosing_calculations_prohibited: false,
  clinical_review_required: false,
};

export function getCapabilityProfile(medicationName) {
  const entry = NAME_TO_ENTRY[medicationName];
  if (!entry) return { ...DEFAULT_PROFILE };
  return { ...DEFAULT_PROFILE, ...entry.capability };
}

export function canEstimateExposure(medicationName) {
  const caps = getCapabilityProfile(medicationName);
  return caps.supports_pk_estimation && !caps.research_only && !caps.cosmetic_only;
}

export function canShowInjectionSiteRotation(medicationName) {
  return getCapabilityProfile(medicationName).supports_injection_site_rotation;
}

export function canShowMissedDoseGuidance(medicationName) {
  return getCapabilityProfile(medicationName).supports_missed_dose_guidance;
}

export function canShowWeightTracking(medicationName) {
  return getCapabilityProfile(medicationName).supports_weight_tracking;
}

export function canShowTitrationTracking(medicationName) {
  return getCapabilityProfile(medicationName).supports_titration_tracking;
}

export function canShowSideEffectRules(medicationName) {
  return getCapabilityProfile(medicationName).supports_side_effect_rules;
}

export function isDosingProhibited(medicationName) {
  return getCapabilityProfile(medicationName).dosing_calculations_prohibited;
}

export function requiresClinicalReview(medicationName) {
  return getCapabilityProfile(medicationName).clinical_review_required;
}

// Returns a human-readable warning banner for research/cosmetic/unapproved products
export function getCapabilityWarning(medicationName) {
  const caps = getCapabilityProfile(medicationName);
  if (caps.research_only) {
    return "This product is not an approved medicine. Levli allows neutral disclosure logging only — no dosing, reconstitution, or optimisation instructions are provided.";
  }
  if (caps.cosmetic_only) {
    return "This is a cosmetic ingredient, not a medicine. Levli does not model systemic pharmacokinetics or provide dosing for cosmetic products.";
  }
  if (caps.dosing_calculations_prohibited && !caps.research_only) {
    return "Dose calculations are disabled for this product. Follow your prescriber's instructions exactly.";
  }
  return null;
}

// Returns the molecular class label for display
export const MOL_CLASS_LABELS = {
  peptide: "Peptide",
  peptide_analogue: "Peptide analogue",
  protein: "Protein / biologic",
  monoclonal_antibody: "Monoclonal antibody",
  small_molecule: "Small molecule (non-peptide)",
  hormone: "Hormone",
  amino_acid_derivative: "Amino-acid derivative",
  cosmetic_peptide: "Cosmetic peptide ingredient",
  radioligand_peptide: "Radioligand peptide",
};

export function getMolecularClassLabel(medicationName) {
  const entry = NAME_TO_ENTRY[medicationName];
  if (!entry) return "";
  return MOL_CLASS_LABELS[entry.molecular_class] || entry.molecular_class;
}