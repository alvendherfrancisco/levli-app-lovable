import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import { SHEET_FIELD_SELECT } from "@/components/modals/shot/sheetUi";

/**
 * The report's date range as one field rather than a row of chips: the field
 * shows the range in hand, and every range — however long its label — is listed
 * over the page when it is tapped.
 *
 * The field is the same field the "Name for report" input is (SHEET_FIELD_SELECT:
 * the same height, corner radius and padding, with the room on the right the
 * chevron sits in), so the two read as one form. The list is drawn at the top of
 * the document like every other sheet in the app, and the range in hand is the
 * row marked in it: one tap closes the list and hands the choice back.
 */
export default function RangeSelect({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.id === value) || options[0];

  const choose = (id) => {
    setOpen(false);
    onChange(id);
  };

  return (
    <div>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={`${label}: ${selected.label}`}
          className={`${SHEET_FIELD_SELECT} flex items-center text-left`}
        >
          <span className="block min-w-0 truncate">{selected.label}</span>
        </button>
        <ChevronDown
          size={18}
          aria-hidden="true"
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
        />
      </div>

      {open && createPortal(
        <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center">
          <div className="absolute inset-0 bg-black/40 overlay-lock" onClick={() => setOpen(false)} />

          <div className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-white dark:bg-gray-900 card-line sheet-lock animate-in slide-in-from-bottom max-h-[85vh] overflow-y-auto no-scrollbar">
            <div className="pt-3 flex justify-center" aria-hidden="true">
              <span className="h-1.5 w-10 rounded-full bg-gray-200 dark:bg-white/[0.15]" />
            </div>

            <div className="px-5 pt-3 pb-3">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">{label}</h2>
            </div>

            <div role="listbox" aria-label={label} className="px-5 space-y-2">
              {options.map((option) => {
                const active = option.id === selected.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => choose(option.id)}
                    className={`w-full min-h-[52px] flex items-center justify-between gap-3 rounded-2xl border px-4 text-left text-[16px] transition-colors ${
                      active
                        ? "border-[1.5px] border-indigo-300 bg-indigo-50 font-semibold text-indigo-700 dark:border-indigo-500/40 dark:bg-indigo-500/20 dark:text-indigo-300"
                        : "border-gray-200 text-gray-700 dark:border-white/[0.12] dark:text-[#E8E9F0]"
                    }`}
                  >
                    <span className="truncate">{option.label}</span>
                    {active && <Check size={18} className="shrink-0" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>

            <div className="sticky bottom-0 mt-5 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-white/[0.08] px-5 pt-4 pb-modal-footer">
              <button type="button" onClick={() => setOpen(false)} className="btn-pill btn-secondary w-full">
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}