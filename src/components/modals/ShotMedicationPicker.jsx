import React, { useId, useMemo, useState } from "react";
import { Check, Plus, Search } from "lucide-react";
import { medicationPickerGroups } from "@/lib/shotMedication";
import { sound } from "@/lib/sounds";
import SheetField from "@/components/modals/shot/SheetField";
import { SHEET_FIELD, SHEET_HINT } from "@/components/modals/shot/sheetUi";

/** One row of the list: the name on the left, the form tag on the right. */
function MedicationRow({ row, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => { sound.tap(); onSelect(row); }}
      aria-pressed={selected}
      className={`flex w-full min-h-[52px] items-center gap-2 border-b border-gray-100 px-3 py-2 text-left transition-colors last:border-b-0 dark:border-white/[0.06] ${
        selected ? "bg-indigo-50 dark:bg-indigo-500/15" : "hover:bg-gray-50 dark:hover:bg-white/[0.05]"
      }`}
    >
      {/* The tick keeps its own slot, so every name starts at the same place. */}
      <span className="flex w-4 shrink-0 justify-center" aria-hidden="true">
        {selected && <Check size={16} strokeWidth={3} className="text-indigo-600 dark:text-indigo-400" />}
      </span>
      <span className={`min-w-0 flex-1 truncate text-sm font-normal ${
        selected ? "text-indigo-700 dark:text-indigo-300" : "text-gray-900 dark:text-[#E8E9F0]"
      }`}>{row.name}</span>
      {row.status && row.status !== "active" && (
        <span className={`shrink-0 ${SHEET_HINT}`}>{row.status}</span>
      )}
      {row.tag && <span className={`shrink-0 ${SHEET_HINT}`}>{row.tag}</span>}
    </button>
  );
}

/**
 * The Log shot medication picker: a search field, the medications the user has
 * already saved in their own section, the shared product list A to Z below it
 * without repeating them, and "Others" pinned at the end of the list.
 *
 * It opens inside the sheet's own flow rather than over it, so it can never
 * cover the dose field below, and its list scrolls inside a capped height while
 * the search field and "Others" stay where they are. Choosing a row writes
 * nothing: the record is created only when the shot is saved, and a name typed
 * under "Others" is kept the same way — so it is waiting in the user's own
 * section next time.
 */
export default function ShotMedicationPicker({
  medications = [], current = "", isCustom = false, onChoose, onChooseCustom,
}) {
  const [query, setQuery] = useState("");
  // "Others" opens its own name field in place, with the name already on it when
  // the log being edited is a custom one.
  const [othersOpen, setOthersOpen] = useState(isCustom);
  const [customName, setCustomName] = useState(isCustom ? current : "");
  const customId = useId();
  const mineHeadingId = useId();
  const allHeadingId = useId();
  const groups = useMemo(
    () => medicationPickerGroups({ medications, current, query }),
    [medications, current, query],
  );
  const isEmpty = !groups.mine.length && !groups.catalogue.length;
  const headingClass = "px-3 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500";
  const canSaveCustom = !!customName.trim();

  const openOthers = () => { sound.tap(); setOthersOpen(true); };

  const saveCustom = () => {
    if (!canSaveCustom) return;
    sound.tap();
    onChooseCustom(customName.trim());
  };

  return (
    <div className="mt-2 rounded-xl border border-cardline bg-white dark:bg-[#1a1d2b] overflow-hidden">
      <div className="relative border-b border-gray-100 p-2 dark:border-white/[0.06]">
        <Search size={16} className="pointer-events-none absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search medication"
          aria-label="Search medication"
          autoComplete="off"
          className={`${SHEET_FIELD} pl-10`}
        />
      </div>

      <div className="max-h-[45dvh] overflow-y-auto overscroll-contain">
        {groups.mine.length > 0 && (
          <div role="group" aria-labelledby={mineHeadingId}>
            <p id={mineHeadingId} className={headingClass}>Your medications</p>
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
      </div>

      {/* The last row of the list, and the only one that stays where it is. */}
      <div className="border-t border-gray-100 dark:border-white/[0.06]">
        {othersOpen ? (
          <div className="p-3">
            <SheetField label="Medication name" htmlFor={customId}>
              <input
                id={customId}
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Type the name on your prescription"
                autoComplete="off"
                className={SHEET_FIELD}
              />
            </SheetField>
            <button
              type="button"
              onClick={saveCustom}
              disabled={!canSaveCustom}
              aria-disabled={!canSaveCustom || undefined}
              className="btn-pill btn-primary w-full mt-3"
            >
              Save
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={openOthers}
            aria-pressed={isCustom}
            className={`flex w-full min-h-[52px] items-center gap-2 px-3 py-2 text-left transition-colors ${
              isCustom ? "bg-indigo-50 dark:bg-indigo-500/15" : "hover:bg-gray-50 dark:hover:bg-white/[0.05]"
            }`}
          >
            <span className="flex w-4 shrink-0 justify-center" aria-hidden="true">
              {isCustom
                ? <Check size={16} strokeWidth={3} className="text-indigo-600 dark:text-indigo-400" />
                : <Plus size={16} className="text-gray-400 dark:text-white/25" />}
            </span>
            <span className={`min-w-0 flex-1 truncate text-sm font-normal ${
              isCustom ? "text-indigo-700 dark:text-indigo-300" : "text-gray-900 dark:text-[#E8E9F0]"
            }`}>Others</span>
            <span className={`shrink-0 ${SHEET_HINT}`}>Type the name</span>
          </button>
        )}
      </div>
    </div>
  );
}