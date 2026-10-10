import { Activity, Apple, Dumbbell, Heart, Scale, Syringe } from "lucide-react";

/**
 * The six tracking modules, in the order they are offered.
 *
 * One card per module, named exactly as the thing it turns on: the Home card,
 * the Insights panel and the report section all read the same words. Water sits
 * inside nutrition and mood inside the journal, so neither gets a module of its
 * own — one module, one choice.
 *
 * Every module is always on. Home, Insights and the daily grid draw all of them
 * unconditionally, so nothing in the app is shown or hidden by what was picked
 * here: the list is now only what the onboarding step offers, and it lives in
 * this one place so that screen's wording can never drift.
 */
export const TRACKING_MODULES = [
  { key: "symptoms", label: "Side effects", desc: "Note how you feel after a dose", Icon: Activity },
  { key: "weight", label: "Weight", desc: "Track progress toward your goal", Icon: Scale },
  { key: "nutrition", label: "Nutrition and water", desc: "Log meals, protein and water", Icon: Apple },
  { key: "exercise", label: "Exercise", desc: "Note your activity each day", Icon: Dumbbell },
  { key: "sites", label: "Injection sites and pain", desc: "Rotate with confidence", Icon: Syringe },
  { key: "journal", label: "Journal and mood", desc: "Keep a private diary of how you feel", Icon: Heart },
];