import React from "react";
import { X } from "lucide-react";
import ClearFieldButton from "@/components/ClearFieldButton";
import SheetField from "@/components/modals/shot/SheetField";
import SheetPickerRow from "@/components/modals/shot/SheetPickerRow";
import SheetDoseField from "@/components/modals/shot/SheetDoseField";
import {
  SHEET_CHIP_OFF, SHEET_CHIP_ON, SHEET_CHIP_SM, SHEET_FIELD, SHEET_HINT,
} from "@/components/modals/shot/sheetUi";
import { SUPPLY_UNITS } from "@/lib/supplyTracking";
import { plainDateLabel } from "@/lib/medicationRegimen";
import { sound } from "@/lib/sounds";

/** Counts offered as one-tap chips in the "Doses left" field. */
const COUNT_PRESETS = [2, 4, 6, 12];

/** The clear control of an optional field: one small x on the field's line. */
function ClearX({ show, onClear, label }) {
  return (
    <ClearFieldButton
      show={show}
      onClear={onClear}
      ariaLabel={label}
      label={<X size={16} aria-hidden="true" />}
    />
  );
}

/**
 * Supply tracking, inside the Add / Edit Medication form's own "More details".
 *
 * The toggle is off by default and everything below it is optional: a count in
 * the unit the person counts in, the date the supply expires and the lot number
 * on the pack. All three use the fields the rest of this form uses — the same
 * number-and-unit row, the same date row, the same plain field.
 *
 * Logging a dose takes one off the count and deleting one puts it back (see
 * src/lib/AppState.jsx); the number is always correctable here by hand.
 */
export default function SupplyFields({
  trackSupply, onTrackSupplyChange,
  dosesLeft, onDosesLeftChange, unit, onUnitChange,
  expiryDate, onExpiryDateChange, lotNumber, onLotNumberChange,
}) {
  return (
    <div>
      <button
        type="button"
        onClick={() => { sound.tap(); onTrackSupplyChange(!trackSupply); }}
        role="switch"
        aria-checked={trackSupply}
        className="flex w-full items-center justify-between gap-4 py-3 text-left"
      >
        <span className="min-w-0">
          <span className="block text-[15px] text-gray-900 dark:text-[#E8E9F0]">Track supply</span>
          <span className="mt-0.5 block text-[13px] leading-snug text-gray-500 dark:text-[#9A9DAE]">
            {trackSupply
              ? "Counted down as you log doses."
              : "Keep a count, an expiry date and a lot number."}
          </span>
        </span>
        <span className={`relative h-7 w-12 flex-shrink-0 rounded-full transition-colors ${trackSupply ? "bg-indigo-500" : "bg-gray-300 dark:bg-gray-600"}`}>
          <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${trackSupply ? "translate-x-6" : "translate-x-1"}`} />
        </span>
      </button>

      {trackSupply && (
        <div className="space-y-4 pb-1">
          <div>
            <SheetField label="Doses left" htmlFor="supply-left">
              <SheetDoseField
                inputId="supply-left"
                value={dosesLeft}
                onChange={onDosesLeftChange}
                unit={unit}
                onUnitChange={onUnitChange}
                units={SUPPLY_UNITS}
                placeholder="4"
              />
            </SheetField>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {COUNT_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => onDosesLeftChange(String(preset))}
                  aria-pressed={Number(dosesLeft) === preset}
                  className={`${SHEET_CHIP_SM} ${Number(dosesLeft) === preset ? SHEET_CHIP_ON : SHEET_CHIP_OFF}`}
                >
                  {preset}
                </button>
              ))}
            </div>
            <p className={`${SHEET_HINT} mt-1.5`}>Logging a dose takes one off. Correct it by hand any time.</p>
          </div>

          <SheetField
            label="Expiry date"
            htmlFor="supply-expiry"
            trailing={<ClearX show={!!expiryDate} onClear={() => onExpiryDateChange("")} label="Clear the expiry date" />}
          >
            <div className="relative">
              <SheetPickerRow
                value={expiryDate ? plainDateLabel(expiryDate) : ""}
                placeholder="Not set"
              />
              <input
                id="supply-expiry"
                type="date"
                value={expiryDate || ""}
                onChange={(e) => onExpiryDateChange(e.target.value)}
                aria-label="Expiry date"
                className="absolute inset-0 h-full w-full min-w-0 box-border cursor-pointer text-[16px] opacity-0 dark:[color-scheme:dark]"
              />
            </div>
            <p className={`${SHEET_HINT} mt-1.5`}>We'll show a reminder as it nears.</p>
          </SheetField>

          <SheetField
            label="Lot number"
            htmlFor="supply-lot"
            trailing={<ClearX show={!!lotNumber} onClear={() => onLotNumberChange("")} label="Clear the lot number" />}
          >
            <input
              id="supply-lot"
              type="text"
              value={lotNumber}
              onChange={(e) => onLotNumberChange(e.target.value)}
              placeholder="e.g. 3F21A"
              autoComplete="off"
              className={SHEET_FIELD}
            />
          </SheetField>
        </div>
      )}
    </div>
  );
}