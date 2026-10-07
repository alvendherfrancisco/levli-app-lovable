import React from "react";
import { TrackingIllustration } from "@/components/onboarding/OnboardingIllustrations";
import OptionCard from "@/components/onboarding/OptionCard";
import SegmentedControl from "@/components/onboarding/SegmentedControl";
import {
  SideEffectIcon,
  HeartIcon,
  ScaleIcon,
  NutritionIcon,
  InjectionSiteIcon,
} from "@/components/onboarding/LevliIcons";

/**
 * What the person would like to keep an eye on.
 *
 * Five cards, all built from one card component, so they are identical apart
 * from their words — same radius, border, padding, height and spacing — each
 * with a checkbox on the right so the choice reads without relying on colour.
 *
 * Nothing here is required: logging "as little as feels right" means Next is
 * never blocked, and every card can be turned back off. Each option matches the
 * module it turns on — side effects, weight, nutrition and water, injection
 * sites and pain, mood and journal. Water is logged with nutrition, so it sits
 * inside that card rather than being a module of its own, and exercise is logged
 * with the day's other numbers, so it is not offered here.
 *
 * The measurement preferences below are a section of their own: a divider, a
 * heading, and one line saying what the units are used for. Liquids only appear
 * once nutrition is being tracked, because that is the only place they are used.
 */
const TRACKING_OPTIONS = [
  { key: "symptoms", label: "Side effects", desc: "Note how you're feeling day to day", Icon: SideEffectIcon },
  { key: "weight", label: "Weight", desc: "Monitor progress over time", Icon: ScaleIcon },
  { key: "nutrition", label: "Nutrition and water", desc: "Log meals, water and protein", Icon: NutritionIcon },
  { key: "sites", label: "Injection sites and pain", desc: "Rotate with confidence", Icon: InjectionSiteIcon },
  { key: "mood", label: "Mood and journal", desc: "Track how you feel, and write it down", Icon: HeartIcon },
];

const UNIT_ROWS = [
  { key: "weight_unit", label: "Weight", options: [{ value: "lb", label: "lb" }, { value: "kg", label: "kg" }] },
  { key: "height_unit", label: "Height", options: [{ value: "in", label: "ft / in" }, { value: "cm", label: "cm" }] },
  { key: "liquid_unit", label: "Liquids", options: [{ value: "oz", label: "oz" }, { value: "mL", label: "mL" }], needsNutrition: true },
];

export default function TrackingStep({ tracking, setTracking, units, setUnits }) {
  const toggle = (key) => {
    setTracking((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const tracksNutrition = tracking.includes("nutrition");

  return (
    <div className="flex flex-col">
      <TrackingIllustration />

      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
          What would you like to keep an eye on?
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed mt-2">
          Log as much or as little as feels right for you.
        </p>
        <p className="text-sm text-muted-foreground leading-snug mt-2">
          Pick any that apply. You can change this anytime in Settings.
        </p>
      </div>

      <div className="mt-6 space-y-4">
        {TRACKING_OPTIONS.map((opt) => (
          <OptionCard
            key={opt.key}
            icon={opt.Icon}
            label={opt.label}
            description={opt.desc}
            selected={tracking.includes(opt.key)}
            onToggle={() => toggle(opt.key)}
          />
        ))}
      </div>

      {/* Measurement preferences — its own section, below the cards. */}
      <div className="mt-8 pt-6 border-t border-border">
        <p className="text-base font-semibold text-foreground">Measurement preferences</p>
        <p className="text-sm text-muted-foreground leading-snug mt-2">Used for your logs and reports.</p>
        <div className="mt-4 space-y-2">
          {UNIT_ROWS.filter((row) => !row.needsNutrition || tracksNutrition).map((row) => (
            <SegmentedControl
              key={row.key}
              label={row.label}
              value={units[row.key]}
              options={row.options}
              onChange={(value) => setUnits((prev) => ({ ...prev, [row.key]: value }))}
            />
          ))}
        </div>
      </div>
    </div>
  );
}