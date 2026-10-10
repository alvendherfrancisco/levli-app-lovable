import React, { useId, useMemo, useState } from "react";
import { Check, Plus, Search, X } from "lucide-react";
import { medicationPickerGroups } from "@/lib/shotMedication";
import { sound } from "@/lib/sounds";
import useModal from "@/hooks/useModal";
import SheetField from "@/components/modals/shot/SheetField";
import { SHEET_FIELD, SHEET_HINT } from "@/components/modals/shot/sheetUi";

/**
 * One row of the list: the name, the small grey word beside it, and the tick when
 * it is the medication in hand. A long name wraps onto a second line rather than
 * being cut off, so a compounded or research product is never shown as
 * "Semaglutide (generic / comp…".
 */
function MedicationRow({ row, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => { sound.tap(); onSelect(row); }}
      aria-pressed={selected}
      className={`flex w-full min-h-[52px] items-center gap-2 border-b border-gray-100 px-4 py-2.5 text-left transition-colors last:border-b-0 dark:border-white/[0.06] ${
        selected ? "bg-indigo-50 dark:bg-indigo-500/15" : "hover:bg-gray-50 dark:hover:bg-white/[0.05]"
      }`}
    >
      {/* The tick keeps its own slot, so every name starts at the same place. */}
      <span className="flex w-4 shrink-0 justify-center" aria-hidden="true">
        {selected && <Check size={16} strokeWidth={3} className="text-indigo-600 dark:text-indigo-400" />}
      </span>
      <span className={`min-w-0 flex-1 break-words text-sm leading-snug font-normal ${
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
 * Choose medication: the picker the Log shot sheet's Medication row opens.
 *
 * A sheet of its own, over the sheet behind it — a search field, the medications
 * the user has already added in their own section (the one in hand first), the
 * shared product list A to Z below it without repeating them, and "Others" pinned
 * at the end of the list. Choosing a row writes nothing: the record is created
 * only when the log is saved, and a name typed under "Others" is kept the same
 * way — so it is waiting in the user's own section next time.
 */
export default function MedicationPickerSheet({
  open, onClose, medications = [], current = "", isCustom = false, onChoose, onChooseCustom,
}) {
  const [query, setQuery] = useState("");
  // "Others" opens its own name field in place, with the name already on it when
  // the log being edited is a custom one.
  const [othersOpen, setOthersOpen] = useState(isCustom);
  const [customName, setCustomName] = useState(isCustom ? current : "");
  const customId = useId();
  const titleId = useId();
  const mineHeadingId = useId();
  const allHeadingId = useId();
  // Its own sheet behaviour: Escape, the back button and a focus trap belong to
  // the topmost sheet, so this one closes before the log behind it does.
  const sheetRef = useModal({ open, onDismiss: onClose });
  const groups = useMemo(
    () => medicationPickerGroups({ medications, current, query }),
    [medications, current, query],
  );
  const isEmpty = !groups.mine.length && !groups.catalogue.length;
  const headingClass = "px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500";
  const canSaveCustom = !!customName.trim();

  if (!open) return null;

  const openOthers = () => { sound.tap(); setOthersOpen(true); };

  const saveCustom = () => {
    if (!canSaveCustom) return;
    sound.tap();
    onChooseCustom(customName.trim());
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 overlay-lock" onClick={onClose} aria-hidden="true" />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative flex flex-col w-full sm:max-w-[520px] max-h-[88dvh] overflow-hidden sheet-lock bg-white dark:bg-[#0f1117] rounded-t-3xl sm:rounded-3xl animate-in slide-in-from-bottom sm:mx-4 dark:shadow-[0_-8px_40px_rgba(0,0,0,0.5)] outline-none"
      >
        <div className="shrink-0 bg-white dark:bg-[#0f1117]">
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-white/20" />
          </div>
          <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-1">
            <h2 id={titleId} className="min-w-0 break-words text-[20px] font-semibold leading-tight text-gray-900 dark:text-[#E8E9F0]">
              Choose medication
            </h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center"
            >
              <X size={22} className="text-gray-400" />
            </button>
          </div>
          <div className="relative px-5 pb-3">
            <Search size={16} className="pointer-events-none absolute left-9 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
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
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain no-scrollbar">
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
            <p role="status" aria-live="polite" className="px-4 py-4 text-xs text-gray-500 dark:text-[#9A9DAE]">
              Nothing matches “{query.trim()}”. Choose Others below and type the name from your prescription.
            </p>
          )}
        </div>

        {/* The last row of the list, and the only one that stays where it is. */}
        <div className="shrink-0 border-t border-gray-100 pb-[env(safe-area-inset-bottom,0px)] dark:border-white/[0.06]">
          {othersOpen ? (
            <div className="p-4">
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
              className={`flex w-full min-h-[52px] items-center gap-2 px-4 py-2.5 text-left transition-colors ${
                isCustom ? "bg-indigo-50 dark:bg-indigo-500/15" : "hover:bg-gray-50 dark:hover:bg-white/[0.05]"
              }`}
            >
              <span className="flex w-4 shrink-0 justify-center" aria-hidden="true">
                {isCustom
                  ? <Check size={16} strokeWidth={3} className="text-indigo-600 dark:text-indigo-400" />
                  : <Plus size={16} className="text-gray-400 dark:text-white/25" />}
              </span>
              <span className={`min-w-0 flex-1 break-words text-sm leading-snug font-normal ${
                isCustom ? "text-indigo-700 dark:text-indigo-300" : "text-gray-900 dark:text-[#E8E9F0]"
              }`}>Others</span>
              <span className={`shrink-0 ${SHEET_HINT}`}>Type the name</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}