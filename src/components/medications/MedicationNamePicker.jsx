import React, { useMemo, useState } from "react";
import { Search, Check } from "lucide-react";
import { MEDICATION_OPTIONS } from "@/lib/medicationRegimen";
import { OTHERS_LABEL } from "@/lib/medicationConfig";
import MedicationName from "@/components/MedicationName";
import { sound } from "@/lib/sounds";

/**
 * Quick-choice medication picker: a row of tappable product chips (the product's
 * own name — trademark mark and all — beside its generic name in smaller text), a
 * searchable field underneath for finding one faster, and an "Others" chip for a
 * medication that isn't listed, whose details are typed on the form below.
 * Chips wrap rather than scroll sideways.
 *
 * The list is the shared catalogue, in the catalogue's own order
 * (src/lib/medicationConfig.js), so it is the same list everywhere in the app.
 */

const chipClass = (selected) =>
  `inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border-2 px-3 py-2 ${
    selected
      ? "bg-indigo-600 border-indigo-600 text-white"
      : "bg-white dark:bg-white/[0.05] border-gray-200 dark:border-white/[0.12] text-gray-900 dark:text-[#E8E9F0]"
  }`;

const subClass = (selected) =>
  `text-[11px] ${selected ? "text-indigo-100" : "text-gray-500 dark:text-[#9A9DAE]"}`;

export default function MedicationNamePicker({ selectedName, isCustom, onSelect, error }) {
  const [query, setQuery] = useState("");

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return MEDICATION_OPTIONS;
    // The stored name carries the trademark mark; a plain search for "Ozempic"
    // still matches it, because the mark only ever sits at the end of the name.
    return MEDICATION_OPTIONS.filter(
      (o) => o.label.toLowerCase().includes(q) || o.generic.toLowerCase().includes(q));
  }, [query]);

  const pick = (selection) => {
    sound.tap();
    if (selection.isCustom) setQuery("");
    onSelect(selection);
  };

  return (
    <div>
      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Medication</span>

      <div className="flex flex-wrap gap-2">
        {matches.map((o) => {
          const selected = !isCustom && o.value === selectedName;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => pick({ name: o.value, isCustom: false })}
              aria-pressed={selected}
              className={chipClass(selected)}
            >
              {selected && <Check size={14} strokeWidth={3} className="flex-shrink-0" />}
              <MedicationName name={o.value} className="text-sm font-semibold" />
              {o.generic && <span className={subClass(selected)}>· {o.generic}</span>}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => pick({ name: "", isCustom: true })}
          aria-pressed={isCustom}
          className={chipClass(isCustom)}
        >
          {isCustom && <Check size={14} strokeWidth={3} className="flex-shrink-0" />}
          <span className="text-sm font-semibold">{OTHERS_LABEL}</span>
          <span className={subClass(isCustom)}>· type the details</span>
        </button>
      </div>

      {!matches.length && (
        <p className="text-xs text-gray-500 dark:text-[#9A9DAE] mt-2">
          No match in the list. Choose “{OTHERS_LABEL}” and type the name from your prescription.
        </p>
      )}

      <div className="relative mt-2">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          id="medication-search"
          type="text"
          value={query}
          autoComplete="off"
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by brand or generic name"
          className="w-full min-h-[48px] rounded-xl border border-gray-200 dark:border-white/[0.12] dark:bg-white/[0.05] dark:text-[#E8E9F0] pl-9 pr-3 py-2 text-sm outline-none focus:border-indigo-400"
        />
      </div>

      {error && <p className="text-sm font-medium text-red-600 dark:text-red-400 mt-2">{error}</p>}
    </div>
  );
}