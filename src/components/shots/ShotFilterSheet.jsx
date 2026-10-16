import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import {
  SHEET_CHIP,
  SHEET_CHIP_OFF,
  SHEET_CHIP_ON,
  SHEET_LABEL_TEXT,
} from "@/components/modals/shot/sheetUi";

// ─────────────────────────────────────────────────────────────────────────────
// What the history is narrowed down by, kept out of the way until it is asked
// for: the filter icon in the header opens this sheet, and the three choices
// live here rather than in three rows on the screen above the list.
//
// Each choice is a chip, so a medication, a dose or a site is read at a glance
// and tapped once. A group with nothing to choose between (a single medication,
// say) is not shown at all. The sheet writes nothing: Apply hands the choices
// back to the list, and Clear is the whole history again.
// ─────────────────────────────────────────────────────────────────────────────

const ALL = "all";

function Group({ label, value, onChange, options }) {
  if (!options || options.length < 2) return null;
  return (
    <div className="mb-5">
      <p className={`${SHEET_LABEL_TEXT} mb-2`}>{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const chosen = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              aria-pressed={chosen}
              className={`${SHEET_CHIP} ${chosen ? SHEET_CHIP_ON : SHEET_CHIP_OFF}`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function ShotFilterSheet({ open, onClose, value, onApply, options }) {
  const [draft, setDraft] = useState(value);

  // The sheet opens on what the list is already showing.
  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  if (!open) return null;

  const set = (key) => (next) => setDraft((d) => ({ ...d, [key]: next }));
  const apply = () => { onApply?.(draft); onClose?.(); };
  const clear = () => { onApply?.({ medication: ALL, dose: ALL, site: ALL }); onClose?.(); };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/40 overlay-lock" onClick={onClose} />

      <div className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-white dark:bg-gray-900 card-line sheet-lock animate-in slide-in-from-bottom max-h-[85vh] overflow-y-auto no-scrollbar">
        <div className="px-5 pt-5 pb-4 flex items-start justify-between gap-3">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Filter</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 -m-1 flex items-center justify-center rounded-full text-gray-400"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5">
          <Group label="Medication" value={draft.medication} onChange={set("medication")} options={options.medication} />
          <Group label="Dose" value={draft.dose} onChange={set("dose")} options={options.dose} />
          <Group label="Site" value={draft.site} onChange={set("site")} options={options.site} />
        </div>

        <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-white/[0.08] px-5 pt-4 pb-modal-footer flex gap-3">
          <button type="button" onClick={clear} className="btn-pill btn-secondary flex-1">Clear</button>
          <button type="button" onClick={apply} className="btn-pill btn-primary flex-1">Apply</button>
        </div>
      </div>
    </div>
  );
}