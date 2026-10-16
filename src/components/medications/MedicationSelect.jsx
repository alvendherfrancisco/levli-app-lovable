import React, { useId, useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
import SheetField from "@/components/modals/shot/SheetField";
import SheetPickerRow from "@/components/modals/shot/SheetPickerRow";
import {
  SHEET_FIELD, SHEET_HINT, SHEET_LABEL_TEXT,
} from "@/components/modals/shot/sheetUi";
import { medicationGroups } from "@/lib/medicationGroups";
import { sound } from "@/lib/sounds";

const HEADING =
  "px-3.5 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500";

/** One product: the name, its generic beside it, and its type on the right. */
function ProductRow({ row, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => { sound.tap(); onSelect(row.value); }}
      aria-pressed={selected}
      className={`flex w-full min-h-[52px] items-center gap-2 border-b border-gray-100 px-3.5 py-2.5 text-left transition-colors last:border-b-0 dark:border-white/[0.06] ${
        selected ? "bg-indigo-50 dark:bg-indigo-500/15" : "hover:bg-gray-50 dark:hover:bg-white/[0.05]"
      }`}
    >
      {/* The tick keeps its own slot, so every name starts in the same place. */}
      <span className="flex w-4 shrink-0 justify-center" aria-hidden="true">
        {selected && <Check size={16} strokeWidth={3} className="text-indigo-600 dark:text-indigo-400" />}
      </span>
      <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-1.5">
        <span className={`text-[15px] leading-snug ${selected
          ? "font-medium text-indigo-700 dark:text-indigo-300"
          : "text-gray-900 dark:text-[#E8E9F0]"}`}>{row.name}</span>
        {row.generic && <span className="text-xs text-gray-400 dark:text-gray-500">{row.generic}</span>}
      </span>
      {row.tag && <span className={`shrink-0 ${SHEET_HINT}`}>{row.tag}</span>}
    </button>
  );
}

/**
 * Choose the medication, in the Add shot sheet's own style.
 *
 * Open, it is a search field over two grouped lists — the GLP-1 medicines and the
 * peptides — and a third group for a product that is not listed, where the name
 * from the prescription is typed in. Once a medication is in hand the whole
 * panel collapses to the sheet's single dropdown row, showing the selection with
 * a Change option that opens the list again.
 *
 * Nothing is written here: the record is created only when the form is saved.
 */
export default function MedicationSelect({
  name, isCustom, customName, customGeneric,
  onChoose, onCustomName, onCustomGeneric, error,
}) {
  const chosen = !!name || (isCustom && !!customName.trim());
  const [expanded, setExpanded] = useState(!chosen);
  const [query, setQuery] = useState("");
  const customId = useId();
  const genericId = useId();
  const groups = useMemo(() => medicationGroups(query), [query]);
  const searching = !!query.trim();
  const empty = !groups.glp1.length && !groups.peptides.length;

  // Choosing a listed product closes the panel behind it: the form goes straight
  // on to the dose. The search is emptied, so opening the list again starts clean.
  const pick = (value) => {
    setQuery("");
    setExpanded(false);
    onChoose(value);
  };

  if (chosen && !expanded) {
    return (
      <SheetField label="Medication">
        <SheetPickerRow
          value={isCustom ? customName : name}
          tappable
          ariaExpanded={false}
          ariaLabel="Change medication"
          tag={<span className={SHEET_HINT}>Change</span>}
          onClick={() => { sound.tap(); setExpanded(true); }}
        />
      </SheetField>
    );
  }

  return (
    <div>
      <SheetField label="Medication" htmlFor="medication-search">
        <div className="relative">
          <Search
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            id="medication-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by brand or generic name"
            aria-label="Search by brand or generic name"
            autoComplete="off"
            className={`${SHEET_FIELD} pl-11`}
          />
        </div>
      </SheetField>

      <div className="mt-2 overflow-hidden rounded-2xl border border-gray-100 dark:border-white/[0.08]">
        {groups.glp1.length > 0 && (
          <div role="group" aria-label="GLP-1 medications">
            <p className={HEADING}>GLP-1 medications</p>
            {groups.glp1.map((row) => (
              <ProductRow key={row.key} row={row} selected={!isCustom && row.value === name} onSelect={pick} />
            ))}
          </div>
        )}

        {groups.peptides.length > 0 && (
          <div role="group" aria-label="Peptides and other">
            <p className={HEADING}>Peptides &amp; other</p>
            {groups.peptides.map((row) => (
              <ProductRow key={row.key} row={row} selected={!isCustom && row.value === name} onSelect={pick} />
            ))}
          </div>
        )}

        {empty && (
          <p role="status" aria-live="polite" className="px-3.5 py-3 text-xs text-gray-500 dark:text-[#9A9DAE]">
            Nothing matches “{query.trim()}”. Type the name below.
          </p>
        )}
      </div>

      <div className="mt-6">
        <p className={`${SHEET_LABEL_TEXT} mb-2`}>Other</p>

        <SheetField label="Not listed? Type the name" htmlFor={customId}>
          <input
            id={customId}
            type="text"
            value={customName}
            onChange={(e) => onCustomName(e.target.value)}
            placeholder="Type the name on your prescription"
            autoComplete="off"
            className={SHEET_FIELD}
          />
        </SheetField>

        <SheetField label="Generic name (optional)" htmlFor={genericId} className="mt-4">
          <input
            id={genericId}
            type="text"
            value={customGeneric}
            onChange={(e) => onCustomGeneric(e.target.value)}
            placeholder="e.g. semaglutide"
            autoComplete="off"
            className={SHEET_FIELD}
          />
        </SheetField>
      </div>

      {/* A name typed in by hand collapses the same way a listed product does:
          one tap and the form shows the selection on its own row. */}
      {isCustom && customName.trim() && (
        <button
          type="button"
          onClick={() => { sound.close(); setExpanded(false); }}
          className="btn-pill btn-primary mt-4 w-full"
        >
          Use this medication
        </button>
      )}

      {error && <p className="mt-2 text-sm font-medium text-red-600 dark:text-red-400">{error}</p>}
      {searching && empty && (
        <p className={`${SHEET_HINT} mt-2`}>Search checks every product the app carries, not just this list.</p>
      )}
    </div>
  );
}