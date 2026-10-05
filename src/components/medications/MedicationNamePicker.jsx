import React, { useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
import { MEDICATION_OPTIONS, OTHER_MEDICATION_OPTION } from "@/lib/medicationRegimen";

/**
 * The searchable medication picker. Each row shows the brand with its generic
 * name and the strengths the label lists, so the right product is easy to spot.
 * Picking a row reports the name to store; "Other medication" asks the user to
 * type their own name (that field lives on the form, not here).
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

  const rowClass = "w-full min-h-[60px] flex items-center justify-between gap-3 px-4 py-3 text-left";

  return (
    <div>
      <label htmlFor="medication-search" className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-2 block">
        Medication
      </label>

      {display && !open ? (
        <button
          type="button"
          onClick={() => { setOpen(true); setQuery(""); }}
          className="w-full min-h-[60px] flex items-center justify-between gap-3 text-left rounded-2xl border-2 border-indigo-300 dark:border-indigo-500/40 bg-indigo-50 dark:bg-indigo-500/10 px-4 py-3"
        >
          <span className="min-w-0">
            <span className="block text-lg font-bold text-gray-900 dark:text-[#E8E9F0] [overflow-wrap:anywhere]">{display}</span>
            {current && (
              <span className="block text-sm text-gray-600 dark:text-[#9A9DAE]">
                {current.strengths.map((d) => d.value).join(", ")} mg
              </span>
            )}
          </span>
          <span className="text-base font-bold text-indigo-600 dark:text-indigo-400 flex-shrink-0">Change</span>
        </button>
      ) : (
        <>
          <div className="relative">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              id="medication-search"
              type="text"
              value={query}
              autoComplete="off"
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search brand or generic name"
              className="w-full min-h-[60px] rounded-2xl border-2 border-gray-200 dark:border-white/[0.12] dark:bg-white/[0.05] dark:text-[#E8E9F0] pl-12 pr-4 py-3 text-lg outline-none focus:border-indigo-400"
            />
          </div>

          <div className="mt-3 max-h-72 overflow-y-auto rounded-2xl border border-gray-200 dark:border-white/[0.12] divide-y divide-gray-100 dark:divide-white/[0.06]">
            {matches.map((o) => {
              const selected = o.value === selectedName;
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => pick({ name: o.value, isCustom: false })}
                  aria-pressed={selected}
                  className={`${rowClass} ${selected ? "bg-indigo-50 dark:bg-indigo-500/15" : "bg-white dark:bg-transparent"}`}
                >
                  <span className="min-w-0">
                    <span className="block text-lg font-semibold text-gray-900 dark:text-[#E8E9F0]">{o.label}</span>
                    <span className="block text-sm text-gray-600 dark:text-[#9A9DAE]">
                      {o.strengths.map((d) => d.value).join(", ")} mg
                    </span>
                  </span>
                  {selected && <Check size={22} className="text-indigo-600 flex-shrink-0" />}
                </button>
              );
            })}

            {typed && !exact && (
              <button type="button" onClick={() => pick({ name: typed, isCustom: true })} className={`${rowClass} bg-white dark:bg-transparent`}>
                <span className="min-w-0">
                  <span className="block text-lg font-semibold text-gray-900 dark:text-[#E8E9F0]">Use “{typed}”</span>
                  <span className="block text-sm text-gray-600 dark:text-[#9A9DAE]">Type your own medication name</span>
                </span>
              </button>
            )}

            {!matches.length && !typed && (
              <p className="px-4 py-3 text-base text-gray-500 dark:text-[#9A9DAE]">No match in the list.</p>
            )}

            <button type="button" onClick={() => pick({ name: "", isCustom: true })} className={`${rowClass} bg-white dark:bg-transparent`}>
              <span className="min-w-0">
                <span className="block text-lg font-semibold text-gray-900 dark:text-[#E8E9F0]">{OTHER_MEDICATION_OPTION.label}</span>
                <span className="block text-sm text-gray-600 dark:text-[#9A9DAE]">A medication that isn't listed above</span>
              </span>
            </button>
          </div>
        </>
      )}

      {error && <p className="text-base font-medium text-red-600 dark:text-red-400 mt-2">{error}</p>}
    </div>
  );
}