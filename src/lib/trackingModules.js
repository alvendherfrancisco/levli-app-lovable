import { Activity, Apple, Dumbbell, Heart, Scale, Syringe } from "lucide-react";

/**
 * The six tracking modules, in the order they are offered.
 *
 * One card per module, named exactly as the thing it turns on: the Home card,
 * the Insights panel and the report section all read the same words. Water sits
 * inside nutrition and mood inside the journal, so neither gets a module of its
 * own — one module, one choice.
 *
 * Nothing is on by default: the list a person chose is what the app reads, and
 * an empty choice is a real answer (nothing is shown until they add it back in
 * Settings). These definitions live here rather than on the onboarding screen
 * so the choices and the Settings rows can never drift apart.
 */
export const TRACKING_MODULES = [
  { key: "symptoms", label: "Side effects", desc: "Note how you feel after a dose", Icon: Activity },
  { key: "weight", label: "Weight", desc: "Track progress toward your goal", Icon: Scale },
  { key: "nutrition", label: "Nutrition and water", desc: "Log meals, protein and water", Icon: Apple },
  { key: "exercise", label: "Exercise", desc: "Note your activity each day", Icon: Dumbbell },
  { key: "sites", label: "Injection sites and pain", desc: "Rotate with confidence", Icon: Syringe },
  { key: "journal", label: "Journal and mood", desc: "Keep a private diary of how you feel", Icon: Heart },
];

/** The modules this profile chose, or null when the question was never asked. */
export function chosenTrackingModules(profile) {
  return Array.isArray(profile?.tracking_modules) ? profile.tracking_modules : null;
}

/**
 * Whether one module is switched on for this profile.
 *
 * A profile that has never answered (an account that finished onboarding before
 * the question existed, or one that never got that far) keeps every module: an
 * unasked question is not a "no". Once the answer is stored — including an empty
 * one — it is the only thing that decides.
 */
export function trackingEnabled(profile, key) {
  const chosen = chosenTrackingModules(profile);
  if (chosen === null) return true;
  return chosen.includes(key);
}