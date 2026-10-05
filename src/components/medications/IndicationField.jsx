import React, { useState } from "react";
import { INDICATION_OPTIONS } from "@/lib/medicationRegimen";
import OptionChips from "@/components/OptionChips";
import ConfirmDialog from "@/components/ConfirmDialog";

const bigChoice =
  "inline-flex items-center justify-center gap-1.5 min-h-[60px] rounded-2xl border-2 px-3 text-base font-semibold";

/**
 * Why the medication was prescribed — plain choices, with room to type your own.
 * Optional: tapping the chosen one again (or Clear) empties it. When "Other" is
 * the choice and a reason has been typed, clearing asks first, because the
 * typed reason would go with it.
 */
export default function IndicationField({ value, onChange, other, onOtherChange, error }) {
  const [confirmClear, setConfirmClear] = useState(false);

  const handleChange = (next) => {
    if (next === null && value === "Other" && String(other || "").trim()) {
      setConfirmClear(true);
      return;
    }
    if (next === null) onOtherChange("");
    onChange(next);
  };

  const clearNow = () => {
    setConfirmClear(false);
    onOtherChange("");
    onChange(null);
  };

  return (
    <div>
      <OptionChips
        label="Indication (as prescribed)"
        options={INDICATION_OPTIONS.map((o) => ({ value: o, label: o }))}
        value={value}
        onChange={handleChange}
        labelClass="text-base font-semibold text-gray-800 dark:text-gray-200"
        chipClass={bigChoice}
        wrapClass="grid grid-cols-2 gap-2"
      >
        {value === "Other" && (
          <div className="mt-2">
            <label htmlFor="indication-other" className="text-sm font-medium text-gray-600 dark:text-[#9A9DAE] mb-1.5 block">
              Reason from your prescription
            </label>
            <input
              id="indication-other"
              type="text"
              value={other}
              autoComplete="off"
              onChange={(e) => onOtherChange(e.target.value)}
              placeholder="e.g. Fatty liver disease"
              className="w-full min-h-[60px] rounded-2xl border-2 border-gray-200 dark:border-white/[0.12] dark:bg-white/[0.05] dark:text-[#E8E9F0] px-4 py-3 text-base outline-none focus:border-indigo-400"
            />
          </div>
        )}

        {error && <p className="text-base font-medium text-red-600 dark:text-red-400 mt-2">{error}</p>}
      </OptionChips>

      <ConfirmDialog
        open={confirmClear}
        tone="warning"
        title="Clear the indication?"
        message="The reason you typed will be removed with it."
        confirmLabel="Clear it"
        cancelLabel="Keep it"
        onConfirm={clearNow}
        onCancel={() => setConfirmClear(false)}
      />
    </div>
  );
}