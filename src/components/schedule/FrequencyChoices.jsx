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
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">How often</p>
        <div
          role="group"
          aria-label="How often"
          className="flex items-center justify-between gap-3 min-h-[44px] rounded-xl border-2 border-indigo-200 bg-indigo-50 dark:border-indigo-500/30 dark:bg-indigo-500/10 px-3 py-2.5"
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-indigo-700 dark:text-indigo-300">
            <Check size={14} strokeWidth={3} aria-hidden="true" />
            {options[0].label}
          </span>
          <span className="text-xs font-medium text-indigo-500 dark:text-indigo-300 flex-shrink-0">
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