import React, { useId, useMemo, useState } from "react";
import { Check, Pill, Plus, Search } from "lucide-react";
import { medicationPickerGroups } from "@/lib/shotMedication";
import { sound } from "@/lib/sounds";

/** One selectable row: the brand name over its generic name and strengths. */
function MedicationRow({ row, selected, onSelect }) {
  const detail = [row.generic, row.strengths || (row.anyDose ? "Strength set by your pharmacy" : "")]
    .filter(Boolean)
    .join(" · ");
  return (
    <button
      type="button"
      onClick={() => { sound.tap(); onSelect(row); }}
      aria-pressed={selected}
      className={`w-full min-h-[52px] px-3 py-2.5 text-left flex items-start gap-2 transition-colors ${
        selected ? "bg-indigo-50 dark:bg-indigo-500/15" : "hover:bg-gray-50 dark:hover:bg-white/[0.05]"
      }`}
    >
      <span className="mt-0.5 flex-shrink-0" aria-hidden="true">
        {selected
          ? <Check size={16} strokeWidth={3} className="text-indigo-600 dark:text-indigo-400" />
          : <Pill size={16} className="text-gray-300 dark:text-white/25" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block text-sm font-semibold break-words ${
          selected ? "text-indigo-700 dark:text-indigo-300" : "text-gray-900 dark:text-[#E8E9F0]"
        }`}>{row.name}</span>
        {detail && (
          <span className="block text-xs text-gray-500 dark:text-[#9A9DAE] mt-0.5 break-words">{detail}</span>
        )}
      </span>
      {row.status && row.status !== "active" && (
        <span className="text-[11px] text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5">{row.status}</span>
      )}
    </button>
  );
}

/**
 * The Add Shot Log medication picker: two groups — the medications already
 * saved in Meds first, then the built-in catalogue — and a final "Others" row.
 *
 * It opens inside the sheet's own flow rather than over it, so it can never
 * cover the dose chips below, and its list scrolls inside a capped height.
 * Choosing a row writes nothing: the record is created only when the shot is
 * saved.
 */
export default function ShotMedicationPicker({
  medications = [], current = "", isCustom = false, onChoose, onChooseCustom,
}) {
  const [query, setQuery] = useState("");
  const mineHeadingId = useId();
  const allHeadingId = useId();
  const groups = useMemo(
    () => medicationPickerGroups({ medications, current, query }),
    [medications, current, query],
  );
  const isEmpty = !groups.mine.length && !groups.catalogue.length;
  const headingClass = "px-3 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500";

  return (
    <div className="mt-2 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#1a1d2b] overflow-hidden">
      <div className="relative p-2 border-b border-gray-100 dark:border-white/[0.06]">
        <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by brand or generic name"
          aria-label="Search medications by brand or generic name"
          autoComplete="off"
          className="w-full min-h-[44px] rounded-lg border border-gray-200 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-[#E8E9F0] pl-9 pr-3 py-2 text-sm outline-none focus:border-indigo-400"
        />
      </div>

      <div className="max-h-[45dvh] overflow-y-auto overscroll-contain">
        {groups.mine.length > 0 && (
          <div role="group" aria-labelledby={mineHeadingId}>
            <p id={mineHeadingId} className={headingClass}>My medications</p>
            {groups.mine.map((row) => (
              <MedicationRow key={row.key} row={row} selected={!isCustom && row.name === current} onSelect={onChoose} />
            ))}
          </div>
        )}

        {groups.catalogue.length > 0 && (
          <div role="group" aria-labelledby={allHeadingId}>
            <p id={allHeadingId} className={headingClass}>All medications</p>
            {groups.catalogue.map((row) => (
              <MedicationRow key={row.key} row={row} selected={!isCustom && row.name === current} onSelect={onChoose} />
            ))}
          </div>
        )}

        {isEmpty && (
          <p role="status" aria-live="polite" className="px-3 py-4 text-xs text-gray-500 dark:text-[#9A9DAE]">
            Nothing matches “{query.trim()}”. Choose Others below and type the name from your prescription.
          </p>
        )}

        <button
          type="button"
          onClick={() => { sound.tap(); onChooseCustom(); }}
          aria-pressed={isCustom}
          className={`w-full min-h-[52px] px-3 py-2.5 text-left flex items-start gap-2 border-t border-gray-100 dark:border-white/[0.06] transition-colors ${
            isCustom ? "bg-indigo-50 dark:bg-indigo-500/15" : "hover:bg-gray-50 dark:hover:bg-white/[0.05]"
          }`}
        >
          <span className="mt-0.5 flex-shrink-0" aria-hidden="true">
            {isCustom
              ? <Check size={16} strokeWidth={3} className="text-indigo-600 dark:text-indigo-400" />
              : <Plus size={16} className="text-gray-300 dark:text-white/25" />}
          </span>
          <span className="min-w-0 flex-1">
            <span className={`block text-sm font-semibold ${
              isCustom ? "text-indigo-700 dark:text-indigo-300" : "text-gray-900 dark:text-[#E8E9F0]"
            }`}>Others</span>
            <span className="block text-xs text-gray-500 dark:text-[#9A9DAE] mt-0.5">
              Type the name from your prescription
            </span>
          </span>
        </button>
      </div>
    </div>
  );
}