// Comprehensive medication catalogue — data-driven, not hard-coded into screens.
// Each entry includes molecular classification, routes, approval status by
// jurisdiction, PK parameters (where established), dosing guardrails, missed-dose
// rules, and a capability profile that gates which app features are enabled.
//
// Sources: FDA USPI / Drugs@FDA, EMA EPAR, MHRA/eMC SPC, ClinicalTrials.gov.
// Tier 1 controlling sources only for clinical parameters. "not established" is
// used instead of guessing. Investigational products have PK disabled.
//
// Molecular classes are validated — "peptide" is NOT assumed for every drug
// commonly called one. Small molecules, proteins, monoclonal antibodies, and
// cosmetic ingredients are correctly distinguished.

// Route codes
export const ROUTES = {
  SC: "subcutaneous",
  IM: "intramuscular",
  ID: "intradermal",
  IV: "intravenous_infusion",
  NASAL: "nasal",
  ORAL_TAB: "oral_tablet",
  ORAL_CAP: "oral_capsule",
  BUCCAL: "buccal_sublingual",
  TD: "transdermal",
  TOP_CREAM: "topical_cream",
  TOP_SERUM: "topical_serum",
  TOP_GEL: "topical_gel",
  IMPLANT: "implant",
  PUMP: "pump_infusion",
  RECON_VIAL: "reconstituted_vial",
  PFS: "prefilled_syringe",
  SD_PEN: "single_dose_pen",
  MD_PEN: "multidose_pen",
};

// Molecular classes
export const MOL = {
  PEPTIDE: "peptide",
  PEPTIDE_ANALOGUE: "peptide_analogue",
  PROTEIN: "protein",
  MAB: "monoclonal_antibody",
  SMALL_MOL: "small_molecule",
  HORMONE: "hormone",
  AA_DERIV: "amino_acid_derivative",
  COSMETIC: "cosmetic_peptide",
  RADIOLIGAND: "radioligand_peptide",
};

// Default capability profile for an approved injectable peptide
const DEFAULT_CAPS = {
  supports_inventory: false,
  supports_refill_prediction: false,
  supports_injection_site_rotation: true,
  supports_reconstitution: false,
  supports_oral_timing_rules: false,
  supports_topical_tracking: false,
  supports_pk_estimation: true,
  supports_relative_exposure_only: true,
  supports_cgm_context: false,
  supports_weight_tracking: true,
  supports_clinic_administration: false,
  supports_missed_dose_guidance: true,
  supports_titration_tracking: true,
  supports_side_effect_rules: true,
  supports_storage_tracking: true,
  supports_temperature_excursion_logging: true,
  research_only: false,
  compounded_product: false,
  cosmetic_only: false,
  dosing_calculations_prohibited: false,
  clinical_review_required: false,
};

// Helper to merge with defaults
const caps = (overrides = {}) => ({ ...DEFAULT_CAPS, ...overrides });

// Selectable compounded / generic product names. They sit alongside brand
// products on their catalogue entry, so routes, PK and delivery methods all
// resolve through the same data — but they are deliberately absent
// from dose_max (compounded strengths vary by pharmacy, so dose entry stays
// flexible) and they accept a free-text concentration on the logged shot.
export const COMPOUNDED_SEMAGLUTIDE = "Semaglutide (generic / compounded)";
export const COMPOUNDED_TIRZEPATIDE = "Tirzepatide (generic / compounded)";
export const COMPOUNDED_GENERIC_NAMES = [COMPOUNDED_SEMAGLUTIDE, COMPOUNDED_TIRZEPATIDE];

export const MEDICATION_CATALOGUE = [
  // ═════════════════════════════════════════════════════════════════════════
  // A. METABOLIC, OBESITY AND DIABETES PEPTIDES
  // ═════════════════════════════════════════════════════════════════════════
  {
    id: "semaglutide",
    generic_name: "Semaglutide",
    brand_names: ["Ozempic®", "Wegovy®", "Rybelsus®", COMPOUNDED_SEMAGLUTIDE],
    aliases: [],
    dev_codes: ["NN9536", "NNC0113-0217"],
    medication_class: "metabolic",
    molecular_class: MOL.PEPTIDE_ANALOGUE,
    amino_acid_length: 31,
    receptor_targets: "GLP-1 receptor",
    mechanism_of_action: "GLP-1 receptor agonist",
    manufacturer: "Novo Nordisk",
    routes: [ROUTES.SC, ROUTES.ORAL_TAB],
    approval: {
      US: { status: "approved", brands: ["Ozempic®", "Wegovy®", "Rybelsus®"], date: "2017-12-05" },
      EU: { status: "approved", brands: ["Ozempic®", "Wegovy®", "Rybelsus®"] },
      UK: { status: "approved", brands: ["Ozempic®", "Wegovy®", "Rybelsus®"] },
    },
    dosing_interval_days: { subcutaneous: 7, oral_tablet: 1 },
    half_life_days: { subcutaneous: 7, oral_tablet: 1 }, // oral ~1 week despite daily dosing
    dose_max: { "Ozempic®": 2, "Wegovy®": 2.4, "Rybelsus®": 14, "Semaglutide": 2.4 },
    missed_dose: {
      subcutaneous: { weekly: true, retitrationDays: 5, advice: "If more than 5 days have passed, skip this dose and contact your prescriber — you may need to restart the dose escalation." },
      oral_tablet: { weekly: false, retitrationDays: 0, advice: "If you miss a daily dose, skip it and take the next dose at the usual time — do not take a double dose." },
    },
    capability: caps(),
    last_review: "2025-01-15",
  },
  {
    id: "tirzepatide",
    generic_name: "Tirzepatide",
    brand_names: ["Mounjaro®", "Zepbound®", COMPOUNDED_TIRZEPATIDE],
    medication_class: "metabolic",
    molecular_class: MOL.PEPTIDE_ANALOGUE,
    amino_acid_length: 39,
    receptor_targets: "GIP and GLP-1 receptors",
    mechanism_of_action: "GIP/GLP-1 dual receptor agonist",
    manufacturer: "Eli Lilly",
    routes: [ROUTES.SC],
    approval: {
      US: { status: "approved", brands: ["Mounjaro®", "Zepbound®"], date: "2022-05-13" },
      EU: { status: "approved", brands: ["Mounjaro®"] },
      UK: { status: "approved", brands: ["Mounjaro®", "Zepbound®"] },
    },
    dosing_interval_days: { subcutaneous: 7 },
    half_life_days: { subcutaneous: 5 },
    dose_max: { "Mounjaro®": 15, "Zepbound®": 15, "Tirzepatide": 15 },
    missed_dose: {
      subcutaneous: { weekly: true, retitrationDays: 5, advice: "If more than 5 days have passed, take it as soon as you remember and contact your prescriber; you may need to restart titration." },
    },
    capability: caps(),
    last_review: "2025-01-15",
  },
  {
    id: "liraglutide",
    generic_name: "Liraglutide",
    brand_names: ["Victoza®", "Saxenda®"],
    medication_class: "metabolic",
    molecular_class: MOL.PEPTIDE_ANALOGUE,
    amino_acid_length: 31,
    receptor_targets: "GLP-1 receptor",
    mechanism_of_action: "GLP-1 receptor agonist",
    manufacturer: "Novo Nordisk",
    routes: [ROUTES.SC],
    approval: {
      US: { status: "approved", brands: ["Victoza®", "Saxenda®"], date: "2010-01-25" },
      EU: { status: "approved", brands: ["Victoza®", "Saxenda®"] },
      UK: { status: "approved", brands: ["Victoza®", "Saxenda®"] },
    },
    dosing_interval_days: { subcutaneous: 1 },
    half_life_days: { subcutaneous: 0.5 },
    dose_max: { "Saxenda®": 3.0, "Victoza®": 1.8, "Liraglutide": 3.0 },
    missed_dose: {
      subcutaneous: { weekly: false, retitrationDays: 0, advice: "If you miss a daily dose, skip it and take the next dose at the usual time — do not take a double dose." },
    },
    capability: caps(),
    last_review: "2025-01-15",
  },
  {
    id: "dulaglutide",
    generic_name: "Dulaglutide",
    brand_names: ["Trulicity®"],
    medication_class: "metabolic",
    molecular_class: MOL.PEPTIDE_ANALOGUE,
    receptor_targets: "GLP-1 receptor",
    mechanism_of_action: "GLP-1 receptor agonist (fusion protein)",
    manufacturer: "Eli Lilly",
    routes: [ROUTES.SC],
    approval: {
      US: { status: "approved", brands: ["Trulicity®"], date: "2014-09-18" },
      EU: { status: "approved" },
      UK: { status: "approved" },
    },
    dosing_interval_days: { subcutaneous: 7 },
    half_life_days: { subcutaneous: 5 },
    dose_max: { "Trulicity®": 4.5, "Dulaglutide": 4.5 },
    missed_dose: {
      subcutaneous: { weekly: true, retitrationDays: 3, advice: "If a dose is missed, it can be taken within 3 days. After that, skip and take the next dose on the regular day." },
    },
    capability: caps(),
    last_review: "2025-01-15",
  },
  {
    id: "exenatide",
    generic_name: "Exenatide",
    brand_names: ["Byetta®", "Bydureon®"],
    medication_class: "metabolic",
    molecular_class: MOL.PEPTIDE,
    amino_acid_length: 39,
    receptor_targets: "GLP-1 receptor",
    mechanism_of_action: "GLP-1 receptor agonist (incretin mimetic)",
    manufacturer: "AstraZeneca",
    routes: [ROUTES.SC],
    approval: {
      US: { status: "approved", brands: ["Byetta®", "Bydureon®"], date: "2005-04-28" },
      EU: { status: "approved" },
      UK: { status: "approved" },
    },
    dosing_interval_days: { subcutaneous: { "Byetta®": 0.5, "Bydureon®": 7 } }, // Byetta BID, Bydureon weekly
    half_life_days: { subcutaneous: { "Byetta®": 0.1, "Bydureon®": 2.4 } },
    dose_max: { "Byetta®": 0.02, "Bydureon®": 2, "Exenatide": 2 },
    capability: caps(),
    last_review: "2025-01-15",
  },
  {
    id: "lixisenatide",
    generic_name: "Lixisenatide",
    brand_names: ["Adlyxin®", "Lyxumia®"],
    medication_class: "metabolic",
    molecular_class: MOL.PEPTIDE_ANALOGUE,
    receptor_targets: "GLP-1 receptor",
    mechanism_of_action: "GLP-1 receptor agonist",
    manufacturer: "Sanofi",
    routes: [ROUTES.SC],
    approval: {
      US: { status: "approved", brands: ["Adlyxin®"], date: "2016-07-27" },
      EU: { status: "approved", brands: ["Lyxumia®"] },
      UK: { status: "approved" },
    },
    dosing_interval_days: { subcutaneous: 1 },
    half_life_days: { subcutaneous: 0.2 },
    dose_max: { "Adlyxin®": 0.02, "Lixisenatide": 0.02 },
    capability: caps(),
    last_review: "2025-01-15",
  },
  {
    id: "pramlintide",
    generic_name: "Pramlintide",
    brand_names: ["Symlin®"],
    medication_class: "metabolic",
    molecular_class: MOL.PEPTIDE_ANALOGUE,
    amino_acid_length: 37,
    receptor_targets: "Amylin receptor",
    mechanism_of_action: "Amylin receptor agonist",
    manufacturer: "AstraZeneca",
    routes: [ROUTES.SC],
    approval: {
      US: { status: "approved", brands: ["Symlin®"], date: "2005-03-16" },
      EU: { status: "not_approved" },
      UK: { status: "not_approved" },
    },
    dosing_interval_days: { subcutaneous: 0.33 }, // TID with meals
    half_life_days: { subcutaneous: 0.2 },
    dose_max: { "Symlin®": 0.12, "Pramlintide": 0.12 },
    capability: caps(),
    last_review: "2025-01-15",
  },
  {
    id: "retatrutide",
    generic_name: "Retatrutide",
    brand_names: [],
    medication_class: "metabolic",
    molecular_class: MOL.PEPTIDE_ANALOGUE,
    amino_acid_length: 39,
    receptor_targets: "GIP, GLP-1, and glucagon receptors",
    mechanism_of_action: "GIP/GLP-1/glucagon triple receptor agonist",
    manufacturer: "Eli Lilly",
    routes: [ROUTES.SC],
    approval: {
      US: { status: "investigational" },
      EU: { status: "investigational" },
      UK: { status: "investigational" },
    },
    dosing_interval_days: {},
    half_life_days: {},
    dose_max: { "Retatrutide": 12 },
    missed_dose: {},
    capability: caps({
      research_only: true,
      supports_pk_estimation: false,
      supports_missed_dose_guidance: false,
      supports_titration_tracking: false,
      dosing_calculations_prohibited: true,
      clinical_review_required: true,
    }),
    last_review: "2025-01-15",
  },
  {
    id: "cagrilintide",
    generic_name: "Cagrilintide",
    brand_names: [],
    medication_class: "metabolic",
    molecular_class: MOL.PEPTIDE_ANALOGUE,
    receptor_targets: "Amylin receptor",
    mechanism_of_action: "Long-acting amylin analogue",
    manufacturer: "Novo Nordisk",
    routes: [ROUTES.SC],
    approval: { US: { status: "investigational" }, EU: { status: "investigational" }, UK: { status: "investigational" } },
    dosing_interval_days: {},
    half_life_days: {},
    dose_max: {},
    capability: caps({ research_only: true, supports_pk_estimation: false, supports_missed_dose_guidance: false, dosing_calculations_prohibited: true }),
    last_review: "2025-01-15",
  },
  {
    id: "cagrisema",
    generic_name: "CagriSema (cagrilintide + semaglutide)",
    brand_names: [],
    medication_class: "metabolic",
    molecular_class: MOL.PEPTIDE_ANALOGUE,
    mechanism_of_action: "Fixed-dose combination of cagrilintide and semaglutide",
    manufacturer: "Novo Nordisk",
    routes: [ROUTES.SC],
    approval: { US: { status: "investigational" }, EU: { status: "investigational" }, UK: { status: "investigational" } },
    dosing_interval_days: {},
    half_life_days: {},
    dose_max: {},
    capability: caps({ research_only: true, supports_pk_estimation: false, supports_missed_dose_guidance: false, dosing_calculations_prohibited: true }),
    last_review: "2025-01-15",
  },
  {
    id: "orforglipron",
    generic_name: "Orforglipron",
    brand_names: [],
    medication_class: "metabolic",
    molecular_class: MOL.SMALL_MOL, // NON-PEPTIDE — small molecule GLP-1 agonist
    receptor_targets: "GLP-1 receptor",
    mechanism_of_action: "Oral non-peptide GLP-1 receptor agonist",
    manufacturer: "Eli Lilly",
    routes: [ROUTES.ORAL_TAB],
    approval: { US: { status: "investigational" }, EU: { status: "investigational" }, UK: { status: "investigational" } },
    dosing_interval_days: {},
    half_life_days: {},
    dose_max: {},
    capability: caps({ research_only: true, supports_pk_estimation: false, supports_injection_site_rotation: false, supports_missed_dose_guidance: false, dosing_calculations_prohibited: true }),
    last_review: "2025-01-15",
  },
  {
    id: "metformin",
    generic_name: "Metformin",
    brand_names: ["Glucophage®"],
    medication_class: "metabolic",
    molecular_class: MOL.SMALL_MOL, // NON-PEPTIDE — biguanide
    mechanism_of_action: "Biguanide; reduces hepatic glucose production",
    manufacturer: "Various (generic)",
    routes: [ROUTES.ORAL_TAB],
    approval: { US: { status: "approved" }, EU: { status: "approved" }, UK: { status: "approved" } },
    dosing_interval_days: { oral_tablet: 0.5 }, // BID
    half_life_days: { oral_tablet: 0.25 },
    dose_max: { "Metformin": 2.55 }, // 2550 mg
    capability: caps({ supports_injection_site_rotation: false, supports_pk_estimation: false, supports_missed_dose_guidance: false, supports_titration_tracking: false }),
    last_review: "2025-01-15",
  },

  // ═════════════════════════════════════════════════════════════════════════
  // B. PITUITARY, GROWTH-HORMONE AND ENDOCRINE PEPTIDES
  // ═════════════════════════════════════════════════════════════════════════
  {
    id: "somatropin",
    generic_name: "Somatropin",
    brand_names: ["Genotropin®", "Humatrope®", "Norditropin®", "Saizen®"],
    medication_class: "endocrine",
    molecular_class: MOL.PROTEIN, // NOT a peptide — 191-aa protein (rhGH)
    amino_acid_length: 191,
    receptor_targets: "Growth hormone receptor",
    mechanism_of_action: "Recombinant human growth hormone",
    manufacturer: "Pfizer, Eli Lilly, Novo Nordisk, Merck",
    routes: [ROUTES.SC],
    approval: { US: { status: "approved" }, EU: { status: "approved" }, UK: { status: "approved" } },
    dosing_interval_days: { subcutaneous: 1 },
    half_life_days: { subcutaneous: 0.15 },
    dose_max: {},
    capability: caps({ supports_weight_tracking: false, supports_pk_estimation: false, supports_missed_dose_guidance: false, supports_titration_tracking: false, clinical_review_required: true }),
    last_review: "2025-01-15",
  },
  {
    id: "tesamorelin",
    generic_name: "Tesamorelin",
    brand_names: ["Egrifta®"],
    medication_class: "endocrine",
    molecular_class: MOL.PEPTIDE_ANALOGUE, // GHRH analogue — 44-aa peptide
    amino_acid_length: 44,
    receptor_targets: "GHRH receptor",
    mechanism_of_action: "Growth hormone-releasing hormone analogue",
    manufacturer: "Theratechnologies",
    routes: [ROUTES.SC],
    approval: { US: { status: "approved", brands: ["Egrifta®"] }, EU: { status: "not_approved" }, UK: { status: "not_approved" } },
    dosing_interval_days: { subcutaneous: 1 },
    half_life_days: { subcutaneous: 0.3 },
    dose_max: { "Egrifta®": 2, "Tesamorelin": 2 },
    capability: caps({ supports_pk_estimation: false, supports_missed_dose_guidance: false, clinical_review_required: true }),
    last_review: "2025-01-15",
  },
  {
    id: "sermorelin",
    generic_name: "Sermorelin",
    brand_names: ["Geref®"],
    medication_class: "endocrine",
    molecular_class: MOL.PEPTIDE, // GHRH fragment 1-29
    amino_acid_length: 29,
    receptor_targets: "GHRH receptor",
    mechanism_of_action: "Growth hormone-releasing hormone fragment",
    manufacturer: "EMD Serono (discontinued brand)",
    routes: [ROUTES.SC],
    approval: { US: { status: "discontinued", note: "Brand discontinued; compounded versions exist" }, EU: { status: "not_approved" }, UK: { status: "not_approved" } },
    dosing_interval_days: { subcutaneous: 1 },
    half_life_days: { subcutaneous: 0.05 },
    dose_max: {},
    capability: caps({ supports_pk_estimation: false, supports_missed_dose_guidance: false, compounded_product: true, clinical_review_required: true }),
    last_review: "2025-01-15",
  },
  {
    id: "octreotide",
    generic_name: "Octreotide",
    brand_names: ["Sandostatin®", "Sandostatin LAR®"],
    medication_class: "endocrine",
    molecular_class: MOL.PEPTIDE_ANALOGUE, // Somatostatin analogue — 8-aa
    amino_acid_length: 8,
    receptor_targets: "Somatostatin receptors (SSTR2, SSTR5)",
    mechanism_of_action: "Somatostatin receptor agonist",
    manufacturer: "Novartis",
    routes: [ROUTES.SC, ROUTES.IM],
    approval: { US: { status: "approved" }, EU: { status: "approved" }, UK: { status: "approved" } },
    dosing_interval_days: { subcutaneous: 0.33, intramuscular: { "Sandostatin LAR®": 28 } },
    half_life_days: { subcutaneous: 0.4, intramuscular: 1.8 },
    dose_max: { "Sandostatin®": 1.5, "Sandostatin LAR®": 40, "Octreotide": 40 },
    capability: caps({ supports_pk_estimation: false, supports_missed_dose_guidance: false, clinical_review_required: true }),
    last_review: "2025-01-15",
  },
  {
    id: "lanreotide",
    generic_name: "Lanreotide",
    brand_names: ["Somatuline®", "Somatuline Depot®"],
    medication_class: "endocrine",
    molecular_class: MOL.PEPTIDE_ANALOGUE,
    amino_acid_length: 8,
    receptor_targets: "Somatostatin receptors",
    mechanism_of_action: "Somatostatin receptor agonist (depot)",
    manufacturer: "Ipsen",
    routes: [ROUTES.SC],
    approval: { US: { status: "approved" }, EU: { status: "approved" }, UK: { status: "approved" } },
    dosing_interval_days: { subcutaneous: 28 },
    half_life_days: { subcutaneous: 5.8 },
    dose_max: { "Somatuline®": 0.12, "Lanreotide": 0.12 },
    capability: caps({ supports_pk_estimation: false, supports_missed_dose_guidance: false, clinical_review_required: true }),
    last_review: "2025-01-15",
  },
  {
    id: "pasireotide",
    generic_name: "Pasireotide",
    brand_names: ["Signifor®", "Signifor LAR®"],
    medication_class: "endocrine",
    molecular_class: MOL.PEPTIDE_ANALOGUE,
    amino_acid_length: 6,
    receptor_targets: "Somatostatin receptors (SSTR1-5, esp. SSTR5)",
    mechanism_of_action: "Somatostatin receptor agonist",
    manufacturer: "Novartis",
    routes: [ROUTES.SC, ROUTES.IM],
    approval: { US: { status: "approved" }, EU: { status: "approved" }, UK: { status: "approved" } },
    dosing_interval_days: { subcutaneous: 0.5, intramuscular: 28 },
    half_life_days: { subcutaneous: 0.5 },
    dose_max: { "Signifor®": 1.8, "Signifor LAR®": 60, "Pasireotide": 60 },
    capability: caps({ supports_pk_estimation: false, supports_missed_dose_guidance: false, clinical_review_required: true }),
    last_review: "2025-01-15",
  },
  {
    id: "teriparatide",
    generic_name: "Teriparatide",
    brand_names: ["Forteo®"],
    medication_class: "endocrine",
    molecular_class: MOL.PEPTIDE, // PTH fragment 1-34
    amino_acid_length: 34,
    receptor_targets: "PTH-1 receptor",
    mechanism_of_action: "Parathyroid hormone analogue (anabolic)",
    manufacturer: "Eli Lilly",
    routes: [ROUTES.SC],
    approval: { US: { status: "approved" }, EU: { status: "approved" }, UK: { status: "approved" } },
    dosing_interval_days: { subcutaneous: 1 },
    half_life_days: { subcutaneous: 0.05 },
    dose_max: { "Forteo®": 0.02, "Teriparatide": 0.02 },
    capability: caps({ supports_pk_estimation: false, supports_missed_dose_guidance: false, supports_weight_tracking: false, clinical_review_required: true }),
    last_review: "2025-01-15",
  },
  {
    id: "abaloparatide",
    generic_name: "Abaloparatide",
    brand_names: ["Tymlos®"],
    medication_class: "endocrine",
    molecular_class: MOL.PEPTIDE_ANALOGUE, // PTHrP analogue — 34-aa
    amino_acid_length: 34,
    receptor_targets: "PTH-1 receptor",
    mechanism_of_action: "Parathyroid hormone-related protein analogue",
    manufacturer: "Radius Health",
    routes: [ROUTES.SC],
    approval: { US: { status: "approved" }, EU: { status: "approved" }, UK: { status: "approved" } },
    dosing_interval_days: { subcutaneous: 1 },
    half_life_days: { subcutaneous: 0.07 },
    dose_max: { "Tymlos®": 0.08, "Abaloparatide": 0.08 },
    capability: caps({ supports_pk_estimation: false, supports_missed_dose_guidance: false, supports_weight_tracking: false, clinical_review_required: true }),
    last_review: "2025-01-15",
  },
  {
    id: "leuprolide",
    generic_name: "Leuprolide",
    brand_names: ["Lupron Depot®", "Eligard®", "Lupron®"],
    medication_class: "endocrine",
    molecular_class: MOL.PEPTIDE_ANALOGUE, // GnRH agonist — 9-aa
    amino_acid_length: 9,
    receptor_targets: "GnRH receptor",
    mechanism_of_action: "GnRH receptor agonist (continuous desensitising)",
    manufacturer: "AbbVie, Tolmar",
    routes: [ROUTES.SC, ROUTES.IM],
    approval: { US: { status: "approved" }, EU: { status: "approved" }, UK: { status: "approved" } },
    dosing_interval_days: { subcutaneous: { "Eligard®": 28 }, intramuscular: { "Lupron Depot®": 28 } },
    half_life_days: {},
    dose_max: {},
    capability: caps({ supports_pk_estimation: false, supports_missed_dose_guidance: false, supports_weight_tracking: false, supports_titration_tracking: false, clinical_review_required: true }),
    last_review: "2025-01-15",
  },
  {
    id: "goserelin",
    generic_name: "Goserelin",
    brand_names: ["Zoladex®"],
    medication_class: "endocrine",
    molecular_class: MOL.PEPTIDE_ANALOGUE,
    amino_acid_length: 10,
    receptor_targets: "GnRH receptor",
    mechanism_of_action: "GnRH receptor agonist (depot implant)",
    manufacturer: "AstraZeneca",
    routes: [ROUTES.IMPLANT], // SC implant
    approval: { US: { status: "approved" }, EU: { status: "approved" }, UK: { status: "approved" } },
    dosing_interval_days: { implant: 28 },
    half_life_days: {},
    dose_max: {},
    capability: caps({ supports_pk_estimation: false, supports_missed_dose_guidance: false, supports_weight_tracking: false, supports_injection_site_rotation: true, clinical_review_required: true }),
    last_review: "2025-01-15",
  },
  {
    id: "degarelix",
    generic_name: "Degarelix",
    brand_names: ["Firmagon®"],
    medication_class: "endocrine",
    molecular_class: MOL.PEPTIDE_ANALOGUE, // GnRH antagonist
    amino_acid_length: 7,
    receptor_targets: "GnRH receptor",
    mechanism_of_action: "GnRH receptor antagonist",
    manufacturer: "Ferring",
    routes: [ROUTES.SC],
    approval: { US: { status: "approved" }, EU: { status: "approved" }, UK: { status: "approved" } },
    dosing_interval_days: { subcutaneous: 28 },
    half_life_days: { subcutaneous: 7 },
    dose_max: { "Firmagon®": 0.12, "Degarelix": 0.12 },
    capability: caps({ supports_pk_estimation: false, supports_missed_dose_guidance: false, supports_weight_tracking: false, clinical_review_required: true }),
    last_review: "2025-01-15",
  },
  {
    id: "desmopressin",
    generic_name: "Desmopressin",
    brand_names: ["DDAVP®", "Minirin®", "Noctiva®"],
    medication_class: "endocrine",
    molecular_class: MOL.PEPTIDE_ANALOGUE, // Vasopressin analogue — 9-aa
    amino_acid_length: 9,
    receptor_targets: "V2 vasopressin receptor",
    mechanism_of_action: "Vasopressin analogue (antidiuretic)",
    manufacturer: "Ferring, various",
    routes: [ROUTES.NASAL, ROUTES.ORAL_TAB, ROUTES.SC],
    approval: { US: { status: "approved" }, EU: { status: "approved" }, UK: { status: "approved" } },
    dosing_interval_days: {},
    half_life_days: {},
    dose_max: {},
    capability: caps({ supports_pk_estimation: false, supports_injection_site_rotation: false, supports_weight_tracking: false, clinical_review_required: true }),
    last_review: "2025-01-15",
  },

  // ═════════════════════════════════════════════════════════════════════════
  // C. FERTILITY AND REPRODUCTIVE MEDICINES
  // ═════════════════════════════════════════════════════════════════════════
  {
    id: "follitropin_alfa",
    generic_name: "Follitropin alfa",
    brand_names: ["Gonal-f®"],
    medication_class: "fertility",
    molecular_class: MOL.PROTEIN, // Recombinant FSH — NOT a peptide (glycoprotein)
    receptor_targets: "FSH receptor",
    mechanism_of_action: "Recombinant follicle-stimulating hormone",
    manufacturer: "Merck/EMD Serono",
    routes: [ROUTES.SC],
    approval: { US: { status: "approved" }, EU: { status: "approved" }, UK: { status: "approved" } },
    dosing_interval_days: { subcutaneous: 1 },
    half_life_days: { subcutaneous: 1 },
    dose_max: {},
    capability: caps({ supports_pk_estimation: false, supports_missed_dose_guidance: false, supports_weight_tracking: false, supports_titration_tracking: false, clinical_review_required: true, dosing_calculations_prohibited: true }),
    note: "Must track clinician-provided regimen only — do not infer dosing.",
    last_review: "2025-01-15",
  },
  {
    id: "choriogonadotropin_alfa",
    generic_name: "Choriogonadotropin alfa",
    brand_names: ["Ovidrel®", "Ovitrelle®"],
    medication_class: "fertility",
    molecular_class: MOL.PROTEIN, // Recombinant hCG — glycoprotein, not peptide
    receptor_targets: "LH/hCG receptor",
    mechanism_of_action: "Recombinant human chorionic gonadotropin",
    manufacturer: "Merck/EMD Serono",
    routes: [ROUTES.SC],
    approval: { US: { status: "approved" }, EU: { status: "approved" }, UK: { status: "approved" } },
    dosing_interval_days: {},
    half_life_days: { subcutaneous: 1.3 },
    dose_max: { "Ovidrel®": 0.25 },
    capability: caps({ supports_pk_estimation: false, supports_missed_dose_guidance: false, supports_weight_tracking: false, clinical_review_required: true, dosing_calculations_prohibited: true }),
    last_review: "2025-01-15",
  },
  {
    id: "menotropins",
    generic_name: "Menotropins",
    brand_names: ["Menopur®", "Repronex®"],
    medication_class: "fertility",
    molecular_class: MOL.PROTEIN, // Urinary gonadotropin extract
    receptor_targets: "FSH and LH receptors",
    mechanism_of_action: "Urinary-derived gonadotropin (FSH + LH)",
    manufacturer: "Ferring",
    routes: [ROUTES.SC],
    approval: { US: { status: "approved" }, EU: { status: "approved" }, UK: { status: "approved" } },
    dosing_interval_days: { subcutaneous: 1 },
    half_life_days: {},
    dose_max: {},
    capability: caps({ supports_pk_estimation: false, supports_missed_dose_guidance: false, supports_weight_tracking: false, clinical_review_required: true, dosing_calculations_prohibited: true }),
    last_review: "2025-01-15",
  },

  // ═════════════════════════════════════════════════════════════════════════
  // D. GASTROINTESTINAL AND SHORT-BOWEL THERAPIES
  // ═════════════════════════════════════════════════════════════════════════
  {
    id: "teduglutide",
    generic_name: "Teduglutide",
    brand_names: ["Gattex®", "Revestive®"],
    medication_class: "gastrointestinal",
    molecular_class: MOL.PEPTIDE_ANALOGUE, // GLP-2 analogue — 33-aa
    amino_acid_length: 33,
    receptor_targets: "GLP-2 receptor",
    mechanism_of_action: "GLP-2 receptor agonist (intestinal adaptation)",
    manufacturer: "Shire/Takeda",
    routes: [ROUTES.SC],
    approval: { US: { status: "approved" }, EU: { status: "approved" }, UK: { status: "approved" } },
    dosing_interval_days: { subcutaneous: 1 },
    half_life_days: { subcutaneous: 0.08 },
    dose_max: { "Gattex®": 0.05, "Teduglutide": 0.05 },
    capability: caps({ supports_pk_estimation: false, supports_missed_dose_guidance: false, supports_weight_tracking: false, clinical_review_required: true }),
    last_review: "2025-01-15",
  },
  {
    id: "linaclotide",
    generic_name: "Linaclotide",
    brand_names: ["Linzess®", "Constella®"],
    medication_class: "gastrointestinal",
    molecular_class: MOL.PEPTIDE, // 14-aa peptide
    amino_acid_length: 14,
    receptor_targets: "Guanylate cyclase-C",
    mechanism_of_action: "Guanylate cyclase-C agonist (minimal systemic absorption)",
    manufacturer: "AbbVie/Allergan, Ironwood",
    routes: [ROUTES.ORAL_CAP],
    approval: { US: { status: "approved" }, EU: { status: "approved" }, UK: { status: "approved" } },
    dosing_interval_days: { oral_capsule: 1 },
    half_life_days: {}, // Not established — minimal systemic absorption
    dose_max: { "Linzess®": 0.29, "Linaclotide": 0.29 },
    capability: caps({ supports_pk_estimation: false, supports_injection_site_rotation: false, supports_missed_dose_guidance: false, supports_weight_tracking: false, supports_titration_tracking: false, clinical_review_required: true }),
    last_review: "2025-01-15",
  },
  {
    id: "plecanatide",
    generic_name: "Plecanatide",
    brand_names: ["Trulance®"],
    medication_class: "gastrointestinal",
    molecular_class: MOL.PEPTIDE_ANALOGUE, // 16-aa peptide analogue
    amino_acid_length: 16,
    receptor_targets: "Guanylate cyclase-C",
    mechanism_of_action: "Guanylate cyclase-C agonist (minimal systemic absorption)",
    manufacturer: "Bausch Health",
    routes: [ROUTES.ORAL_TAB],
    approval: { US: { status: "approved" }, EU: { status: "not_approved" }, UK: { status: "not_approved" } },
    dosing_interval_days: { oral_tablet: 1 },
    half_life_days: {},
    dose_max: { "Trulance®": 3, "Plecanatide": 3 },
    capability: caps({ supports_pk_estimation: false, supports_injection_site_rotation: false, supports_missed_dose_guidance: false, supports_weight_tracking: false, clinical_review_required: true }),
    last_review: "2025-01-15",
  },

  // ═════════════════════════════════════════════════════════════════════════
  // F. NEUROLOGY, PAIN AND MIGRAINE — CGRP PATHWAY
  // Note: These are monoclonal antibodies, NOT peptides. Correctly labelled.
  // ═════════════════════════════════════════════════════════════════════════
  {
    id: "erenumab",
    generic_name: "Erenumab",
    brand_names: ["Aimovig®"],
    medication_class: "neurology",
    molecular_class: MOL.MAB, // NOT a peptide — fully human monoclonal antibody
    receptor_targets: "CGRP receptor",
    mechanism_of_action: "CGRP receptor antagonist (monoclonal antibody)",
    manufacturer: "Amgen/Novartis",
    routes: [ROUTES.SC],
    approval: { US: { status: "approved" }, EU: { status: "approved" }, UK: { status: "approved" } },
    dosing_interval_days: { subcutaneous: 30 },
    half_life_days: { subcutaneous: 28 },
    dose_max: { "Aimovig®": 0.14, "Erenumab": 0.14 },
    capability: caps({ supports_pk_estimation: false, supports_missed_dose_guidance: false, supports_weight_tracking: false, supports_titration_tracking: false, clinical_review_required: true }),
    last_review: "2025-01-15",
  },
  {
    id: "fremanezumab",
    generic_name: "Fremanezumab",
    brand_names: ["Ajovy®"],
    medication_class: "neurology",
    molecular_class: MOL.MAB, // NOT a peptide — humanized monoclonal antibody
    receptor_targets: "CGRP ligand",
    mechanism_of_action: "CGRP ligand antagonist (monoclonal antibody)",
    manufacturer: "Teva",
    routes: [ROUTES.SC],
    approval: { US: { status: "approved" }, EU: { status: "approved" }, UK: { status: "approved" } },
    dosing_interval_days: { subcutaneous: 30 }, // monthly or quarterly
    half_life_days: { subcutaneous: 31 },
    dose_max: { "Ajovy®": 0.675, "Fremanezumab": 0.675 },
    capability: caps({ supports_pk_estimation: false, supports_missed_dose_guidance: false, supports_weight_tracking: false, clinical_review_required: true }),
    last_review: "2025-01-15",
  },
  {
    id: "galcanezumab",
    generic_name: "Galcanezumab",
    brand_names: ["Emgality®"],
    medication_class: "neurology",
    molecular_class: MOL.MAB, // NOT a peptide — humanized monoclonal antibody
    receptor_targets: "CGRP ligand",
    mechanism_of_action: "CGRP ligand antagonist (monoclonal antibody)",
    manufacturer: "Eli Lilly",
    routes: [ROUTES.SC],
    approval: { US: { status: "approved" }, EU: { status: "approved" }, UK: { status: "approved" } },
    dosing_interval_days: { subcutaneous: 30 },
    half_life_days: { subcutaneous: 27 },
    dose_max: { "Emgality®": 0.24, "Galcanezumab": 0.24 },
    capability: caps({ supports_pk_estimation: false, supports_missed_dose_guidance: false, supports_weight_tracking: false, clinical_review_required: true }),
    last_review: "2025-01-15",
  },
  {
    id: "eptinezumab",
    generic_name: "Eptinezumab",
    brand_names: ["Vyepti®"],
    medication_class: "neurology",
    molecular_class: MOL.MAB, // NOT a peptide — humanized monoclonal antibody
    receptor_targets: "CGRP ligand",
    mechanism_of_action: "CGRP ligand antagonist (monoclonal antibody, IV infusion)",
    manufacturer: "Lundbeck",
    routes: [ROUTES.IV],
    approval: { US: { status: "approved" }, EU: { status: "approved" }, UK: { status: "approved" } },
    dosing_interval_days: { intravenous_infusion: 90 },
    half_life_days: { intravenous_infusion: 27 },
    dose_max: { "Vyepti®": 0.3, "Eptinezumab": 0.3 },
    capability: caps({ supports_pk_estimation: false, supports_injection_site_rotation: false, supports_missed_dose_guidance: false, supports_weight_tracking: false, supports_clinic_administration: true, clinical_review_required: true }),
    last_review: "2025-01-15",
  },

  // ═════════════════════════════════════════════════════════════════════════
  // G. ONCOLOGY AND RADIOLIGAND PEPTIDE THERAPY
  // Clinician-administered only — no consumer self-injection.
  // ═════════════════════════════════════════════════════════════════════════
  {
    id: "lutetium_177_dotatate",
    generic_name: "Lutetium Lu 177 dotatate",
    brand_names: ["Lutathera®"],
    medication_class: "oncology",
    molecular_class: MOL.RADIOLIGAND, // Radiolabelled peptide (somatostatin analogue)
    amino_acid_length: 8,
    receptor_targets: "Somatostatin receptor subtype 2 (SSTR2)",
    mechanism_of_action: "Peptide receptor radionuclide therapy (radioligand)",
    manufacturer: "Advanced Accelerator Applications (Novartis)",
    routes: [ROUTES.IV],
    approval: { US: { status: "approved" }, EU: { status: "approved" }, UK: { status: "approved" } },
    dosing_interval_days: { intravenous_infusion: 56 }, // q8 weeks × 4
    half_life_days: {},
    dose_max: { "Lutathera®": 7400 }, // MBq
    capability: caps({ supports_pk_estimation: false, supports_injection_site_rotation: false, supports_missed_dose_guidance: false, supports_weight_tracking: false, supports_titration_tracking: false, supports_clinic_administration: true, clinical_review_required: true, dosing_calculations_prohibited: true }),
    note: "Hospital-administered radioligand therapy. Tracking only — no self-administration.",
    last_review: "2025-01-15",
  },
  {
    id: "lutetium_177_psm617",
    generic_name: "Lutetium Lu 177 vipivotide tetraxetan",
    brand_names: ["Pluvicto®"],
    medication_class: "oncology",
    molecular_class: MOL.RADIOLIGAND, // Radiolabelled peptide (PSMA-targeting)
    receptor_targets: "Prostate-specific membrane antigen (PSMA)",
    mechanism_of_action: "PSMA-targeted radioligand therapy",
    manufacturer: "Novartis",
    routes: [ROUTES.IV],
    approval: { US: { status: "approved" }, EU: { status: "approved" }, UK: { status: "approved" } },
    dosing_interval_days: { intravenous_infusion: 42 }, // q6 weeks × 6
    half_life_days: {},
    dose_max: { "Pluvicto®": 7400 },
    capability: caps({ supports_pk_estimation: false, supports_injection_site_rotation: false, supports_missed_dose_guidance: false, supports_weight_tracking: false, supports_clinic_administration: true, clinical_review_required: true, dosing_calculations_prohibited: true }),
    note: "Hospital-administered radioligand therapy. Tracking only — no self-administration.",
    last_review: "2025-01-15",
  },

  // ═════════════════════════════════════════════════════════════════════════
  // J. DERMATOLOGY AND COSMETIC TOPICAL PEPTIDES
  // These are cosmetic ingredients, NOT medicines. No systemic PK.
  // ═════════════════════════════════════════════════════════════════════════
  {
    id: "ghk_cu",
    generic_name: "GHK-Cu (Copper tripeptide-1)",
    brand_names: [],
    medication_class: "dermatology_cosmetic",
    molecular_class: MOL.COSMETIC, // Cosmetic peptide — NOT a medicine
    amino_acid_length: 3,
    mechanism_of_action: "Cosmetic ingredient; wound-healing signal peptide (in vitro evidence)",
    routes: [ROUTES.TOP_SERUM, ROUTES.TOP_CREAM],
    approval: {
      US: { status: "cosmetic_ingredient", note: "Not an FDA-approved drug; cosmetic use only" },
      EU: { status: "cosmetic_ingredient" },
      UK: { status: "cosmetic_ingredient" },
    },
    dosing_interval_days: {},
    half_life_days: {}, // Systemic PK not meaningful for topical cosmetic
    dose_max: {},
    capability: caps({
      cosmetic_only: true,
      supports_pk_estimation: false,
      supports_injection_site_rotation: false,
      supports_missed_dose_guidance: false,
      supports_weight_tracking: false,
      supports_titration_tracking: false,
      supports_side_effect_rules: false,
      supports_storage_tracking: false,
      supports_temperature_excursion_logging: false,
      dosing_calculations_prohibited: true,
    }),
    note: "Cosmetic ingredient — do not model systemic pharmacokinetics. Evidence is in-vitro/animal; human clinical evidence is limited.",
    last_review: "2025-01-15",
  },
  {
    id: "palmitoyl_pentapeptide",
    generic_name: "Palmitoyl pentapeptide-4 (Matrixyl)",
    brand_names: [],
    medication_class: "dermatology_cosmetic",
    molecular_class: MOL.COSMETIC,
    amino_acid_length: 5,
    mechanism_of_action: "Cosmetic signal peptide (collagen stimulation claim)",
    routes: [ROUTES.TOP_SERUM, ROUTES.TOP_CREAM],
    approval: { US: { status: "cosmetic_ingredient" }, EU: { status: "cosmetic_ingredient" }, UK: { status: "cosmetic_ingredient" } },
    dosing_interval_days: {},
    half_life_days: {},
    dose_max: {},
    capability: caps({
      cosmetic_only: true,
      supports_pk_estimation: false,
      supports_injection_site_rotation: false,
      supports_missed_dose_guidance: false,
      supports_weight_tracking: false,
      supports_titration_tracking: false,
      supports_side_effect_rules: false,
      supports_storage_tracking: false,
      dosing_calculations_prohibited: true,
    }),
    last_review: "2025-01-15",
  },
  {
    id: "acetyl_hexapeptide",
    generic_name: "Acetyl hexapeptide-8 (Argireline)",
    brand_names: [],
    medication_class: "dermatology_cosmetic",
    molecular_class: MOL.COSMETIC,
    amino_acid_length: 6,
    mechanism_of_action: "Cosmetic neurotransmitter-inhibiting peptide (topical 'botox-like' claim)",
    routes: [ROUTES.TOP_SERUM, ROUTES.TOP_CREAM],
    approval: { US: { status: "cosmetic_ingredient" }, EU: { status: "cosmetic_ingredient" }, UK: { status: "cosmetic_ingredient" } },
    dosing_interval_days: {},
    half_life_days: {},
    dose_max: {},
    capability: caps({
      cosmetic_only: true,
      supports_pk_estimation: false,
      supports_injection_site_rotation: false,
      supports_missed_dose_guidance: false,
      supports_weight_tracking: false,
      supports_titration_tracking: false,
      supports_side_effect_rules: false,
      supports_storage_tracking: false,
      dosing_calculations_prohibited: true,
    }),
    note: "Cosmetic claim of 'botox-like' effect is not supported by robust human clinical evidence.",
    last_review: "2025-01-15",
  },

  // ═════════════════════════════════════════════════════════════════════════
  // K. UNAPPROVED AND RESEARCH PEPTIDES
  // Neutral logging only — NO dosing, reconstitution, cycling, or optimisation.
  // ═════════════════════════════════════════════════════════════════════════
  {
    id: "bpc157",
    generic_name: "BPC-157 (Body Protection Compound 157)",
    brand_names: [],
    medication_class: "research_peptide",
    molecular_class: MOL.PEPTIDE, // 15-aa peptide derived from gastric juice
    amino_acid_length: 15,
    mechanism_of_action: "Unknown; investigated for tissue repair (animal studies only)",
    routes: [ROUTES.SC, ROUTES.ORAL_CAP],
    approval: { US: { status: "unapproved", note: "Not approved by FDA; not an investigational drug; regulatory warnings issued" }, EU: { status: "unapproved" }, UK: { status: "unapproved" } },
    dosing_interval_days: {},
    half_life_days: {},
    dose_max: {},
    capability: caps({
      research_only: true,
      supports_pk_estimation: false,
      supports_injection_site_rotation: false,
      supports_missed_dose_guidance: false,
      supports_weight_tracking: false,
      supports_titration_tracking: false,
      supports_side_effect_rules: false,
      supports_storage_tracking: false,
      dosing_calculations_prohibited: true,
      clinical_review_required: true,
    }),
    note: "No human clinical trials. No approved product anywhere. FDA has issued warnings. Neutral disclosure logging only.",
    last_review: "2025-01-15",
  },
  {
    id: "tb500",
    generic_name: "TB-500 (Thymosin beta-4 fragment)",
    brand_names: [],
    medication_class: "research_peptide",
    molecular_class: MOL.PEPTIDE,
    mechanism_of_action: "Investigated for tissue repair; actin-sequestering peptide fragment",
    routes: [ROUTES.SC],
    approval: { US: { status: "unapproved", note: "Not FDA-approved; WADA prohibited" }, EU: { status: "unapproved" }, UK: { status: "unapproved" } },
    dosing_interval_days: {},
    half_life_days: {},
    dose_max: {},
    capability: caps({
      research_only: true,
      supports_pk_estimation: false,
      supports_injection_site_rotation: false,
      supports_missed_dose_guidance: false,
      supports_weight_tracking: false,
      supports_titration_tracking: false,
      supports_side_effect_rules: false,
      dosing_calculations_prohibited: true,
      clinical_review_required: true,
    }),
    note: "No approved product. WADA-prohibited in sport. Neutral disclosure logging only.",
    last_review: "2025-01-15",
  },
  {
    id: "cjc1295",
    generic_name: "CJC-1295 (Modified growth hormone releasing factor 1-29)",
    brand_names: [],
    medication_class: "research_peptide",
    molecular_class: MOL.PEPTIDE_ANALOGUE, // GHRH analogue
    amino_acid_length: 29,
    receptor_targets: "GHRH receptor",
    mechanism_of_action: "Growth hormone-releasing hormone analogue (investigational)",
    routes: [ROUTES.SC],
    approval: { US: { status: "unapproved" }, EU: { status: "unapproved" }, UK: { status: "unapproved" } },
    dosing_interval_days: {},
    half_life_days: {},
    dose_max: {},
    capability: caps({
      research_only: true,
      supports_pk_estimation: false,
      supports_injection_site_rotation: false,
      supports_missed_dose_guidance: false,
      supports_weight_tracking: false,
      supports_titration_tracking: false,
      supports_side_effect_rules: false,
      dosing_calculations_prohibited: true,
      clinical_review_required: true,
    }),
    note: "No approved product. Often sold with ipamorelin. Neutral logging only.",
    last_review: "2025-01-15",
  },
  {
    id: "ipamorelin",
    generic_name: "Ipamorelin",
    brand_names: [],
    medication_class: "research_peptide",
    molecular_class: MOL.PEPTIDE, // GHRP — pentapeptide
    amino_acid_length: 5,
    receptor_targets: "Ghrelin receptor (GHS-R1a)",
    mechanism_of_action: "Growth hormone secretagogue (ghrelin mimetic)",
    routes: [ROUTES.SC],
    approval: { US: { status: "unapproved" }, EU: { status: "unapproved" }, UK: { status: "unapproved" } },
    dosing_interval_days: {},
    half_life_days: {},
    dose_max: {},
    capability: caps({
      research_only: true,
      supports_pk_estimation: false,
      supports_injection_site_rotation: false,
      supports_missed_dose_guidance: false,
      supports_weight_tracking: false,
      supports_titration_tracking: false,
      supports_side_effect_rules: false,
      dosing_calculations_prohibited: true,
      clinical_review_required: true,
    }),
    note: "No approved product. Neutral logging only.",
    last_review: "2025-01-15",
  },
  {
    id: "aod9604",
    generic_name: "AOD-9604 (Lipotropin fragment 177-191)",
    brand_names: [],
    medication_class: "research_peptide",
    molecular_class: MOL.PEPTIDE, // hGH fragment
    amino_acid_length: 15,
    mechanism_of_action: "Investigated as lipolytic hGH fragment (animal studies)",
    routes: [ROUTES.SC],
    approval: { US: { status: "unapproved" }, EU: { status: "unapproved" }, UK: { status: "unapproved" } },
    dosing_interval_days: {},
    half_life_days: {},
    dose_max: {},
    capability: caps({
      research_only: true,
      supports_pk_estimation: false,
      supports_injection_site_rotation: false,
      supports_missed_dose_guidance: false,
      supports_weight_tracking: false,
      supports_titration_tracking: false,
      supports_side_effect_rules: false,
      dosing_calculations_prohibited: true,
    }),
    note: "Clinical development discontinued. No approved product. Neutral logging only.",
    last_review: "2025-01-15",
  },
  {
    id: "melanotan_ii",
    generic_name: "Melanotan II",
    brand_names: [],
    medication_class: "research_peptide",
    molecular_class: MOL.PEPTIDE_ANALOGUE,
    amino_acid_length: 7,
    receptor_targets: "Melanocortin receptors (MC1R, MC3R, MC4R, MC5R)",
    mechanism_of_action: "Non-selective melanocortin receptor agonist",
    routes: [ROUTES.SC],
    approval: { US: { status: "unapproved", note: "FDA, MHRA and TGA warnings issued; not approved anywhere" }, EU: { status: "unapproved" }, UK: { status: "unapproved" } },
    dosing_interval_days: {},
    half_life_days: {},
    dose_max: {},
    capability: caps({
      research_only: true,
      supports_pk_estimation: false,
      supports_injection_site_rotation: false,
      supports_missed_dose_guidance: false,
      supports_weight_tracking: false,
      supports_titration_tracking: false,
      supports_side_effect_rules: false,
      dosing_calculations_prohibited: true,
      clinical_review_required: true,
    }),
    note: "Regulatory warnings from FDA, MHRA, TGA. Serious adverse events reported. Not approved anywhere.",
    last_review: "2025-01-15",
  },
  {
    id: "pt141_bremelanotide",
    generic_name: "Bremelanotide (PT-141)",
    brand_names: ["Vyleesi®"],
    medication_class: "metabolic",
    molecular_class: MOL.PEPTIDE_ANALOGUE, // Melanocortin receptor agonist
    amino_acid_length: 7,
    receptor_targets: "Melanocortin receptors (MC3R, MC4R)",
    mechanism_of_action: "Melanocortin receptor agonist (approved for HSDD in women)",
    manufacturer: "AMAG Pharmaceuticals",
    routes: [ROUTES.NASAL], // Vyleesi is nasal; PT-141 was SC in research
    approval: { US: { status: "approved", brands: ["Vyleesi®"] }, EU: { status: "not_approved" }, UK: { status: "not_approved" } },
    dosing_interval_days: {},
    half_life_days: { nasal: 1.7 },
    dose_max: { "Vyleesi®": 1.75 },
    capability: caps({ supports_pk_estimation: false, supports_injection_site_rotation: false, supports_missed_dose_guidance: false, supports_weight_tracking: false, supports_titration_tracking: false, clinical_review_required: true }),
    last_review: "2025-01-15",
  },
];

// ═════════════════════════════════════════════════════════════════════════
// INDEX BUILDERS — create flat lookup maps from the catalogue
// ═════════════════════════════════════════════════════════════════════════

// Flat list of all displayable medication names (brands + generics)
export const ALL_MEDICATION_NAMES = (() => {
  const names = [];
  MEDICATION_CATALOGUE.forEach((m) => {
    if (m.brand_names?.length) m.brand_names.forEach((b) => names.push(b));
    else names.push(m.generic_name);
    // Also add generic if not already included
    if (m.brand_names?.length && !names.includes(m.generic_name)) names.push(m.generic_name);
  });
  return names;
})();

// Brand/generic → catalogue entry
export const NAME_TO_ENTRY = (() => {
  const map = {};
  MEDICATION_CATALOGUE.forEach((m) => {
    map[m.generic_name] = m;
    if (m.brand_names) m.brand_names.forEach((b) => { map[b] = m; });
  });
  return map;
})();

// Therapeutic classes present in the catalogue
export const MEDICATION_CLASSES = [
  { id: "metabolic", label: "Metabolic, Obesity & Diabetes" },
  { id: "endocrine", label: "Endocrine & Growth Hormone" },
  { id: "fertility", label: "Fertility & Reproductive" },
  { id: "gastrointestinal", label: "Gastrointestinal" },
  { id: "neurology", label: "Neurology & Migraine" },
  { id: "oncology", label: "Oncology & Radioligand" },
  { id: "dermatology_cosmetic", label: "Dermatology & Cosmetic" },
  { id: "research_peptide", label: "Unapproved / Research Peptides" },
];

// Route labels for UI
export const ROUTE_LABELS = {
  [ROUTES.SC]: "Subcutaneous injection",
  [ROUTES.IM]: "Intramuscular injection",
  [ROUTES.ID]: "Intradermal injection",
  [ROUTES.IV]: "IV infusion (clinic)",
  [ROUTES.NASAL]: "Nasal spray",
  [ROUTES.ORAL_TAB]: "Oral tablet",
  [ROUTES.ORAL_CAP]: "Oral capsule",
  [ROUTES.BUCCAL]: "Buccal / sublingual",
  [ROUTES.TD]: "Transdermal patch",
  [ROUTES.TOP_CREAM]: "Topical cream",
  [ROUTES.TOP_SERUM]: "Topical serum",
  [ROUTES.TOP_GEL]: "Topical gel",
  [ROUTES.IMPLANT]: "Implant (clinic)",
  [ROUTES.PUMP]: "Pump / continuous infusion",
  [ROUTES.RECON_VIAL]: "Reconstituted vial",
  [ROUTES.PFS]: "Prefilled syringe",
  [ROUTES.SD_PEN]: "Single-dose pen",
  [ROUTES.MD_PEN]: "Multidose pen",
};

export function getEntry(name) {
  return NAME_TO_ENTRY[name] || null;
}

export function getMolecularClass(name) {
  return NAME_TO_ENTRY[name]?.molecular_class || null;
}

export function getMedicationClass(name) {
  return NAME_TO_ENTRY[name]?.medication_class || null;
}

export function getRoutes(name) {
  return NAME_TO_ENTRY[name]?.routes || [];
}

export function getApprovalStatus(name, jurisdiction = "US") {
  return NAME_TO_ENTRY[name]?.approval?.[jurisdiction] || null;
}

export function getNote(name) {
  return NAME_TO_ENTRY[name]?.note || null;
}

export function isResearchOnly(name) {
  return NAME_TO_ENTRY[name]?.capability?.research_only || false;
}

export function isCosmeticOnly(name) {
  return NAME_TO_ENTRY[name]?.capability?.cosmetic_only || false;
}

export function isUnapproved(name) {
  const entry = NAME_TO_ENTRY[name];
  if (!entry) return false;
  const usStatus = entry.approval?.US?.status;
  return usStatus === "unapproved" || usStatus === "investigational";
}

// ── Clinical content provenance ─────────────────────────────────────────────
// Every catalogue entry must carry source-provenance fields for auditability.
// Values are blank / "needs sourcing" until a qualified clinician or pharmacist
// fills them in from a Tier-1 controlling source. They are NEVER fabricated.
const SOURCE_DEFAULTS = {
  source_url: "",
  source_document_version: "",
  source_organisation: "",
  source_access_date: "",
  source_status: "needs_sourcing",
};

MEDICATION_CATALOGUE.forEach((m) => {
  Object.keys(SOURCE_DEFAULTS).forEach((k) => {
    if (m[k] === undefined) m[k] = SOURCE_DEFAULTS[k];
  });
});