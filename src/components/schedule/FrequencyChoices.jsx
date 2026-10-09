import React from "react";
import { Check } from "lucide-react";
import OptionChips from "@/components/OptionChips";
import FrequencyGrid from "./FrequencyGrid";
import { getScheduleOptions } from "@/lib/medicationSchedule";
import { LABEL, LIST_TEXT } from "@/lib/uiStyles";

/**
 * How often the medication is taken. The choices come from the product's own
 * catalogue entry, so a medication whose label states one schedule shows that
 * schedule as confirmed instead of offering a choice — and a product whose
 * protocol varies (compounded, peptides, "Others") offers the full set.
 *
 * The chips are the app's shared option chips, so they look and behave like
 * every other choice in Levli: same shape, same border, same 44pt target, with
 * the selected state announced to a screen reader.
 *
 * A caller can ask for `layout="grid"` instead: the same choices, drawn as the
 * even two-column grid of pill chips the onboarding schedule screen uses.
 */
export default function FrequencyChoices({ medication, value, onChange, layout = "chips" }) {
  const options = getScheduleOptions(medication);

  if (layout === "grid" && options.length > 1) {
    return (
      <FrequencyGrid
        options={options.map((o) => ({ value: o.id, label: o.label }))}
        value={value}
        onChange={onChange}
      />
    );
  }

  if (options.length === 1) {
    return (
      <div>
        <p className={LABEL}>How often</p>
        <div
          role="group"
          aria-label="How often"
          className="flex h-12 items-center justify-between gap-3 rounded-full border border-indigo-500 bg-indigo-50 px-4 dark:border-indigo-500/40 dark:bg-indigo-500/10"
        >
          <span className={`flex items-center gap-2 ${LIST_TEXT} text-indigo-700 dark:text-indigo-300`}>
            <Check size={14} strokeWidth={2.5} aria-hidden="true" />
            {options[0].label}
          </span>
          <span className="flex-shrink-0 text-xs font-medium text-indigo-500 dark:text-indigo-300">
            From the label
          </span>
        </div>
      </div>
    );
  }

  return (
    <OptionChips
      label="How often"
      options={options.map((o) => ({ value: o.id, label: o.label }))}
      value={value}
      onChange={onChange}
      required
      soundOnSelect
    />
  );
}