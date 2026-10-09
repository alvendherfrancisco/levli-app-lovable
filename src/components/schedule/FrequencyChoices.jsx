import React from "react";
import { Check } from "lucide-react";
import OptionChips from "@/components/OptionChips";
import { getScheduleOptions } from "@/lib/medicationSchedule";

/**
 * How often the medication is taken. The choices come from the product's own
 * catalogue entry, so a medication whose label states one schedule shows that
 * schedule as confirmed instead of offering a choice — and a product whose
 * protocol varies (compounded, peptides, "Others") offers the full set.
 *
 * The chips are the app's shared option chips, so they look and behave like
 * every other choice in Levli: same shape, same border, same 44pt target, with
 * the selected state announced to a screen reader.
 */
export default function FrequencyChoices({ medication, value, onChange }) {
  const options = getScheduleOptions(medication);

  if (options.length === 1) {
    return (
      <div>
        <p className="mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">How often</p>
        <div
          role="group"
          aria-label="How often"
          className="flex h-12 items-center justify-between gap-3 rounded-full border border-indigo-600 bg-indigo-50 px-4 dark:border-indigo-500/40 dark:bg-indigo-500/10"
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-indigo-700 dark:text-indigo-300">
            <Check size={14} strokeWidth={3} aria-hidden="true" />
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