// The structured side-effect checklist, and the "when to get urgent help" list.
//
// Symptom names are the plain-language versions of the reactions listed in the
// GLP-1 prescribing information (gastrointestinal reactions, injection-site
// reactions, fatigue, headache, dizziness), with an "other" entry for anything
// else. Nothing here is a diagnosis.

export const SIDE_EFFECT_SYMPTOMS = [
  { key: "nausea", label: "Nausea", category: "gastrointestinal" },
  { key: "vomiting", label: "Vomiting", category: "gastrointestinal" },
  { key: "diarrhea", label: "Diarrhea", category: "gastrointestinal" },
  { key: "constipation", label: "Constipation", category: "gastrointestinal" },
  { key: "abdominal_pain", label: "Abdominal pain", category: "gastrointestinal" },
  { key: "reflux", label: "Heartburn / reflux", category: "gastrointestinal" },
  { key: "bloating", label: "Bloating", category: "gastrointestinal" },
  { key: "decreased_appetite", label: "Decreased appetite", category: "gastrointestinal" },
  { key: "fatigue", label: "Fatigue", category: "general" },
  { key: "headache", label: "Headache", category: "neurological" },
  { key: "dizziness", label: "Dizziness", category: "neurological" },
  { key: "injection_site", label: "Injection-site reaction", category: "dermatological" },
  { key: "other", label: "Other", category: "other" },
];

export const SEVERITY_LEVELS = [
  { value: "mild", label: "Mild" },
  { value: "moderate", label: "Moderate" },
  { value: "severe", label: "Severe" },
];

/** The checklist entry for a key, or null. */
export function symptomByKey(key) {
  return SIDE_EFFECT_SYMPTOMS.find((s) => s.key === key) || null;
}

/** The checklist entry a stored symptom text belongs to, or null. */
export function symptomFromText(text) {
  const lower = String(text || "").toLowerCase();
  if (!lower) return null;
  return (
    SIDE_EFFECT_SYMPTOMS.find((s) => lower.includes(s.label.toLowerCase())) ||
    SIDE_EFFECT_SYMPTOMS.find((s) => s.key !== "other" && lower.includes(s.key.replace(/_/g, " "))) ||
    null
  );
}

/**
 * The urgent-help list. Each line is drawn from a warning in the US prescribing
 * information for semaglutide, tirzepatide and liraglutide products; the source
 * of each line is stated so it can be checked against the label.
 */
export const URGENT_HELP_ITEMS = [
  {
    text: "Severe or persistent stomach pain, with or without vomiting",
    source: "Acute pancreatitis, Warnings and Precautions",
  },
  {
    text: "Repeated vomiting, or not being able to keep fluids down",
    source: "Acute pancreatitis and dehydration, Warnings and Precautions",
  },
  {
    text: "Signs of dehydration — very dry mouth, dark urine, passing little urine, feeling faint",
    source: "Acute kidney injury, Warnings and Precautions",
  },
  {
    text: "Yellowing of the skin or eyes",
    source: "Gallbladder disease, Warnings and Precautions",
  },
  {
    text: "Severe allergic reaction — swelling of the face, lips or throat, or trouble breathing",
    source: "Hypersensitivity reactions, Warnings and Precautions",
  },
  {
    text: "Changes in your vision",
    source: "Diabetic retinopathy complications, Warnings and Precautions",
  },
  {
    text: "A lump or swelling in your neck",
    source: "Thyroid C-cell tumours, boxed warning",
  },
  {
    text: "Trouble swallowing, or new persistent hoarseness",
    source: "Thyroid C-cell tumours, boxed warning",
  },
];

export const URGENT_HELP_CTA = "Call your doctor or local emergency number.";

export const URGENT_HELP_SOURCE =
  "These lines come from the US prescribing information for semaglutide, tirzepatide and liraglutide products. This is information, not a diagnosis — it does not mean your medication caused anything.";