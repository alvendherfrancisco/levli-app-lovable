import React, { useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
import { MEDICATION_OPTIONS, OTHER_MEDICATION_OPTION } from "@/lib/medicationRegimen";
import { choiceCls, inputCls, labelCls } from "@/components/medications/formStyles";
import FieldError from "@/components/medications/FieldError";

/**
 * The searchable medication picker. Each option is its own card, shows the brand
 * with its generic name and the strengths the label lists, and is at least 60px
 * tall so it is easy to tap. "Other medication" asks the user to type their own
 * name (that field lives on the step, not here).
 */
export default function MedicationNamePicker({ selectedName, isCustom, onSelect, error }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const current = MEDICATION_OPTIONS.find((o) => o.value === selectedName) || null;
  const display = current ? current.label : isCustom ? OTHER_MEDICATION_OPTION.label : "";

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return MEDICATION_OPTIONS;
    return MEDICATION_OPTIONS.filter(
      (o) => o.label.toLowerCase().includes(q) || o.generic.toLowerCase().includes(q));
  }, [query]);

  const typed = query.trim();
  const exact = matches.some((o) => o.label.toLowerCase() === typed.toLowerCase());
  const pick = (selection) => {
    onSelect(selection);
    setOpen(false);
    setQuery("");
  };

  const rowClass = (selected) =>
    `w-full min-h-[64px] flex items-center justify-between gap-3 px-4 py-3 text-left rounded-2xl border-2 ${
      selected
        ? "bg-indigo-50 dark:bg-indigo-500/15 border-indigo-400 dark:border-indigo-400/60"
        : "bg-white dark:bg-white/[0.08] border-gray-400 dark:border-white/40"
    }`;

  return (
    <div>
      <label htmlFor="medication-search" className={labelCls}>Medication</label>

      {display && !open ? (
        <button
          type="button"
          onClick={() => { setOpen(true); setQuery(""); }}
          className="w-full min-h-[64px] flex items-center justify-between gap-3 text-left rounded-2xl border-2 border-indigo-400 dark:border-indigo-400/60 bg-indigo-50 dark:bg-indigo-500/15 px-4 py-3"
        >
          <span className="min-w-0">
            <span className="block text-xl font-bold text-gray-900 dark:text-white [overflow-wrap:anywhere]">{display}</span>
            {current && (
              <span className="block text-lg text-gray-700 dark:text-gray-200">
                {current.strengths.map((d) => d.value).join(", ")} mg
              </span>
            )}
          </span>
          <span className="text-lg font-bold text-indigo-700 dark:text-indigo-300 flex-shrink-0">Change</span>
        </button>
      ) : (
        <>
          <div className="relative">
            <Search size={24} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-300" aria-hidden="true" />
            <input
              id="medication-search"
              type="text"
              value={query}
              autoComplete="off"
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search brand or generic name"
              className={`${inputCls} pl-12`}
            />
          </div>

          <div className="mt-3 max-h-80 overflow-y-auto space-y-3">
            {matches.map((o) => {
              const selected = o.value === selectedName;
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => pick({ name: o.value, isCustom: false })}
                  aria-pressed={selected}
                  className={rowClass(selected)}
                >
                  <span className="min-w-0">
                    <span className="block text-xl font-semibold text-gray-900 dark:text-white">{o.label}</span>
                    <span className="block text-lg text-gray-700 dark:text-gray-200">
                      {o.strengths.map((d) => d.value).join(", ")} mg
                    </span>
                  </span>
                  {selected && <Check size={26} className="text-indigo-700 dark:text-indigo-300 flex-shrink-0" aria-hidden="true" />}
                </button>
              );
            })}

            {typed && !exact && (
              <button type="button" onClick={() => pick({ name: typed, isCustom: true })} className={rowClass(false)}>
                <span className="min-w-0">
                  <span className="block text-xl font-semibold text-gray-900 dark:text-white">Use “{typed}”</span>
                  <span className="block text-lg text-gray-700 dark:text-gray-200">Type your own medication name</span>
                </span>
              </button>
            )}

            {!matches.length && !typed && (
              <p className={`${choiceCls(false)} flex items-center`}>No match in the list below.</p>
            )}

            <button type="button" onClick={() => pick({ name: "", isCustom: true })} className={rowClass(false)}>
              <span className="min-w-0">
                <span className="block text-xl font-semibold text-gray-900 dark:text-white">{OTHER_MEDICATION_OPTION.label}</span>
                <span className="block text-lg text-gray-700 dark:text-gray-200">A medication that isn't listed above</span>
              </span>
            </button>
          </div>
        </>
      )}

      <FieldError message={error} />
    </div>
  );
}