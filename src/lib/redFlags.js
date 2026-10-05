// Deterministic GLP-1 red-flag keyword classification.
// Class-gated: only fires for approved GLP-1 classes (semaglutide, tirzepatide,
// liraglutide). Never fires for investigational or unknown medications.
// Non-diagnostic: provides information and escalation wording only, never a diagnosis.

import { DRUG_CLASS } from "@/lib/medicationData";

// Sourced from semaglutide/tirzepatide/liraglutide USPI "Warnings and Precautions".
const EMERGENCY_TERMS = [
  "severe abdominal pain", "abdominal pain that moves to back", "pain moving to back",
  "pain radiating to back", "persistent vomiting", "unable to keep fluids",
  "cannot keep fluids", "difficulty breathing", "shortness of breath",
  "swelling of face", "swelling of throat", "swelling of lips", "throat swelling",
  "severe allergic reaction", "anaphylaxis", "signs of pancreatitis",
  // Checklist entries that reach this tier on severity alone.
  "severe vomiting", "severe diarrhea", "severe diarrhoea",
  "yellowing of the skin", "yellowing of the eyes",
];

const URGENT_TERMS = [
  "repeated vomiting", "severe dehydration", "dark urine", "little urination",
  "severe injection site reaction", "sudden vision", "vision changes",
  "right upper quadrant", "gallbladder", "mood change", "behaviour change",
  "behavior change", "suicidal", "depression", "severe constipation",
  // Boxed-warning symptoms: thyroid C-cell tumours.
  "lump or swelling in your neck", "swelling in your neck", "hoarseness",
  "trouble swallowing", "persistent vomiting",
];

const APPROVED_GLPTONE_CLASSES = new Set(["Semaglutide", "Tirzepatide", "Liraglutide"]);

export function classifyRedFlag(text, medication) {
  if (!text) return { tier: "none", matched: [] };
  const generic = DRUG_CLASS[medication] || medication;
  if (!APPROVED_GLPTONE_CLASSES.has(generic)) return { tier: "none", matched: [] };

  const lower = String(text).toLowerCase();
  const matched = [];
  for (const t of EMERGENCY_TERMS) if (lower.includes(t)) matched.push(t);
  if (matched.length) return { tier: "emergency", matched };

  for (const t of URGENT_TERMS) if (lower.includes(t)) matched.push(t);
  if (matched.length) return { tier: "urgent", matched };

  return { tier: "none", matched: [] };
}

export const RED_FLAG_WORDING = {
  emergency: "These symptoms can be serious. If severe or worsening, contact emergency services or your healthcare provider now.",
  urgent: "Contact your clinician promptly if this persists or worsens.",
};

export const RED_FLAG_DISCLAIMER =
  "This is information based on prescribing information for your medication, not a diagnosis. It does not mean the medication caused your symptoms.";