import React, { useEffect, useRef, useState } from "react";
import OptionChips from "@/components/OptionChips";
import { QUANTITY_AMOUNTS, QUANTITY_UNITS } from "@/lib/inventoryDefaults";

/** The chip that reveals the numeric field for an amount not offered. */
const OTHER_AMOUNT = "other";

const INPUT_CLASS = "flex-1 min-w-0 min-h-[52px] box-border rounded-xl border border-gray-200 dark:border-white/[0.12] dark:bg-white/[0.05] dark:text-[#E8E9F0] px-3 py-2.5 text-base outline-none focus:border-indigo-400";

/**
 * "How many do you have?" — the amounts people actually hold as chips, with a
 * typed amount for anything else. The unit a quantity is counted in sits as
 * plain text beside the field, behind a small Change link rather than a
 * dropdown. Both starting and remaining quantity save this value for a new
 * product.
 */
export default function InventoryQuantityField({ value, onChange, unit, onUnitChange, error }) {
  const [typing, setTyping] = useState(false);
  const [unitEditing, setUnitEditing] = useState(false);
  const [focusPending, setFocusPending] = useState(false);
  const amountRef = useRef(null);

  const asNumber = Number(value);
  const isAmount = value !== "" && QUANTITY_AMOUNTS.includes(asNumber) && String(asNumber) === String(value).trim();
  const showInput = typing || (value !== "" && !isAmount);
  const chipValue = isAmount ? asNumber : (showInput ? OTHER_AMOUNT : null);

  useEffect(() => {
    if (focusPending) { amountRef.current?.focus(); setFocusPending(false); }
  }, [focusPending]);

  const pickAmount = (next) => {
    if (next === OTHER_AMOUNT) {
      setTyping(true);
      onChange("");
      setFocusPending(true);
      return;
    }
    setTyping(false);
    onChange(String(next));
  };

  return (
    <div>
      <OptionChips
        label="How many do you have?"
        options={[...QUANTITY_AMOUNTS.map((n) => ({ value: n, label: String(n) })), { value: OTHER_AMOUNT, label: "Other" }]}
        value={chipValue}
        onChange={pickAmount}
        required
        soundOnSelect
      />

      <div className="flex items-center gap-2 mt-2">
        {showInput && (
          <input
            ref={amountRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={value}
            onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="How many?"
            aria-label="How many do you have?"
            className={INPUT_CLASS}
          />
        )}
        <span className="text-sm text-gray-500 dark:text-[#9A9DAE] flex-shrink-0">{unit}</span>
        <button
          type="button"
          onClick={() => setUnitEditing((v) => !v)}
          aria-expanded={unitEditing}
          className="min-h-[44px] inline-flex items-center px-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 active:opacity-70 flex-shrink-0"
        >
          {unitEditing ? "Done" : "Change"}
        </button>
      </div>

      {unitEditing && (
        <div className="mt-3">
          <OptionChips
            label="Unit"
            options={QUANTITY_UNITS.map((u) => ({ value: u, label: u }))}
            value={unit}
            onChange={(next) => { if (next) onUnitChange(next); }}
            required
            soundOnSelect
          />
        </div>
      )}

      {error && <p className="text-sm font-medium text-red-600 dark:text-red-400 mt-2">{error}</p>}
    </div>
  );
}