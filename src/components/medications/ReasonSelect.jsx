import React, { useId, useState } from "react";
import { Check, X } from "lucide-react";
import SheetField from "@/components/modals/shot/SheetField";
import SheetPickerRow from "@/components/modals/shot/SheetPickerRow";
import ConfirmDialog from "@/components/ConfirmDialog";
import { SHEET_FIELD } from "@/components/modals/shot/sheetUi";
import { INDICATION_OPTIONS } from "@/lib/medicationRegimen";
import { sound } from "@/lib/sounds";

/** One reason in the menu: the tick, then the words — the sheet's own row. */
function ReasonRow({ label, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`flex w-full min-h-[52px] items-center gap-2 border-b border-gray-100 px-3.5 py-2.5 text-left transition-colors last:border-b-0 dark:border-white/[0.06] ${
        selected ? "bg-indigo-50 dark:bg-indigo-500/15" : "hover:bg-gray-50 dark:hover:bg-white/[0.05]"
      }`}
    >
      {/* The tick keeps its own slot, so every reason starts in the same place. */}
      <span className="flex w-4 shrink-0 justify-center" aria-hidden="true">
        {selected && <Check size={16} strokeWidth={3} className="text-indigo-600 dark:text-indigo-400" />}
      </span>
      <span
        className={`min-w-0 flex-1 text-[15px] leading-snug ${
          selected ? "font-medium text-indigo-700 dark:text-indigo-300" : "text-gray-900 dark:text-[#E8E9F0]"
        }`}
      >
        {label}
      </span>
    </button>
  );
}

/**
 * Why the medication was prescribed, as one dropdown row in the sheet's own style:
 * it reads "Select (optional)" until it is answered and the answer after that, and
 * it opens a list of the four reasons with a tick on the chosen one and a row that
 * removes the choice again.
 *
 * Choosing "Other" adds the one field its answer needs, so the reason from the
 * prescription is written down as well as named. Clearing a reason that was typed
 * asks first, because the words go with it.
 */
export default function ReasonSelect({ value, other, onChange, onOtherChange, error }) {
  const [open, setOpen] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const otherId = useId();

  const choose = (next) => {
    sound.tap();
    setOpen(false);
    if (next === value) return;
    // The typed reason belongs to "Other" alone: leaving it behind would save
    // words against a reason the user did not choose.
    if (next !== "Other") onOtherChange("");
    onChange(next);
  };

  const clear = () => {
    if (value === "Other" && String(other || "").trim()) {
      setConfirmClear(true);
      return;
    }
    sound.tap();
    onOtherChange("");
    onChange("");
  };

  return (
    <div>
      <SheetField label="Reason for taking it">
        <SheetPickerRow
          value={value}
          placeholder="Select (optional)"
          tappable
          onClick={() => setOpen((prev) => !prev)}
          ariaExpanded={open}
          ariaLabel="Reason for taking it"
        />

        {open && (
          <div className="mt-2 overflow-hidden rounded-2xl border border-gray-100 dark:border-white/[0.08]">
            {INDICATION_OPTIONS.map((option) => (
              <ReasonRow
                key={option}
                label={option}
                selected={value === option}
                onSelect={() => choose(option)}
              />
            ))}
            {value && (
              <button
                type="button"
                onClick={clear}
                className="flex min-h-[52px] w-full items-center gap-2 border-t border-gray-100 px-3.5 py-2.5 text-left text-[15px] text-gray-500 transition-colors hover:bg-gray-50 dark:border-white/[0.06] dark:text-[#9A9DAE] dark:hover:bg-white/[0.05]"
              >
                <span className="flex w-4 shrink-0 justify-center" aria-hidden="true">
                  <X size={16} strokeWidth={3} />
                </span>
                Clear the reason
              </button>
            )}
          </div>
        )}

        {error && <p className="mt-2 text-sm font-medium text-red-600 dark:text-red-400">{error}</p>}
      </SheetField>

      {/* The reason itself, once "Other" is the answer. */}
      {value === "Other" && (
        <SheetField label="Reason from your prescription" htmlFor={otherId} className="mt-4">
          <input
            id={otherId}
            type="text"
            value={other}
            onChange={(e) => onOtherChange(e.target.value)}
            placeholder="e.g. Fatty liver disease"
            autoComplete="off"
            className={SHEET_FIELD}
          />
        </SheetField>
      )}

      <ConfirmDialog
        open={confirmClear}
        tone="warning"
        title="Clear the reason?"
        message="The reason you typed will be removed with it."
        confirmLabel="Clear it"
        cancelLabel="Keep it"
        onConfirm={() => { setConfirmClear(false); onOtherChange(""); onChange(""); }}
        onCancel={() => setConfirmClear(false)}
      />
    </div>
  );
}