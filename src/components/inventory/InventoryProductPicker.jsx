import React, { useEffect, useRef } from "react";
import OptionChips from "@/components/OptionChips";
import { getMedicationPickerNames } from "@/lib/medicationConfig";
import { genericNameFor } from "@/lib/inventoryDefaults";

/** The chip that reveals a text field for a product not in the list. */
export const OTHER_PRODUCT = "other";

const INPUT_CLASS = "w-full min-h-[52px] box-border rounded-xl border border-gray-200 dark:border-white/[0.12] dark:bg-white/[0.05] dark:text-[#E8E9F0] px-3 py-2.5 text-base outline-none focus:border-indigo-400";

/**
 * "Which product?" — one tap for a medication the user is already taking (brand
 * with its generic name underneath), or Other to type it. Picking a medication
 * is what pre-fills the rest of the form.
 */
export default function InventoryProductPicker({ medications = [], selected, onPick, customName, onCustomName, error }) {
  const otherRef = useRef(null);
  // Starts from what is already selected, so opening the form in edit mode on a
  // hand-typed product shows its name without stealing focus and popping the
  // keyboard. Only a tap on Other does that.
  const wasOther = useRef(selected === OTHER_PRODUCT);

  // The keyboard appears on the tap of Other, never on its own.
  useEffect(() => {
    if (selected === OTHER_PRODUCT && !wasOther.current) otherRef.current?.focus();
    wasOther.current = selected === OTHER_PRODUCT;
  }, [selected]);

  const names = [...new Set(medications.map((m) => m.medication_name).filter(Boolean))];
  const options = [
    ...names.map((name) => ({ value: name, label: name, sublabel: genericNameFor(name) })),
    { value: OTHER_PRODUCT, label: "Other" },
  ];

  return (
    <div>
      <OptionChips
        label="Product"
        options={options}
        value={selected}
        onChange={onPick}
        required
        soundOnSelect
        chipClass="inline-flex items-center gap-1.5 min-h-[44px] max-w-full rounded-xl border-2 px-3 text-sm font-semibold transition-colors"
        helper={names.length === 0 ? "No medications saved yet — tap Other and type the name from your prescription." : undefined}
      />

      {selected === OTHER_PRODUCT && (
        <input
          ref={otherRef}
          type="text"
          list="inventory-med-list"
          value={customName}
          autoComplete="off"
          onChange={(e) => onCustomName(e.target.value)}
          placeholder="e.g. Ozempic®"
          className={`${INPUT_CLASS} mt-2`}
        />
      )}
      <datalist id="inventory-med-list">
        {getMedicationPickerNames().map((m) => <option key={m} value={m} />)}
      </datalist>

      {error && <p className="text-sm font-medium text-red-600 dark:text-red-400 mt-2">{error}</p>}
    </div>
  );
}