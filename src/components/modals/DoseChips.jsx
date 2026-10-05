import React, { useState } from "react";
import { Check, Plus } from "lucide-react";
import { DOSE_UNIT } from "@/lib/doseOptions";
import { CUSTOM_DOSE_COLOR, getDoseColor, getDoseStyle } from "@/lib/doseColors";
import { sound } from "@/lib/sounds";

/**
 * Compact single-select dose chips (40px tall), filled with each dose's own
 * colour (see src/lib/doseColors.js) and ringed + ticked when selected. The
 * neutral "Other" chip opens a small numeric entry so a compounded dose can be
 * logged, saved and offered as a chip next time.
 */
export default function DoseChips({ medication, options = [], value, unit = DOSE_UNIT, onSelect, onAddCustom }) {
  const numeric = Number(value) || 0;
  const isChipValue = options.includes(numeric);
  const [otherOpen, setOtherOpen] = useState(!isChipValue && numeric > 0);
  const [custom, setCustom] = useState(!isChipValue && numeric > 0 ? String(numeric) : "");
  const [saving, setSaving] = useState(false);

  const customDose = parseFloat(custom);
  const canSave = !saving && !isNaN(customDose) && customDose > 0;

  // The selected chip is ringed in its own colour; every chip keeps its fill.
  const chipClass = (selected) =>
    `inline-flex items-center justify-center h-10 px-3.5 rounded-xl text-[15px] font-semibold transition-all active:scale-95 ${
      selected ? "ring-2 ring-offset-2 ring-offset-white dark:ring-offset-[#0f1117]" : ""
    }`;

  const handleAdd = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await onAddCustom(customDose);
      setOtherOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Dose</label>
        <span className="text-xs text-gray-400 dark:text-gray-500">{unit}</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {options.map((v) => {
          const color = getDoseColor(medication, v);
          const selected = !otherOpen && numeric === v;
          return (
            <button
              key={v}
              type="button"
              onClick={() => { sound.tap(); setOtherOpen(false); onSelect(v); }}
              style={{ ...getDoseStyle(medication, v), ...(selected ? { "--tw-ring-color": color } : {}) }}
              className={chipClass(selected)}
            >
              {selected && <Check size={14} strokeWidth={3} className="mr-1 flex-shrink-0" />}
              {v}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => {
            sound.tap();
            setCustom(isChipValue ? "" : numeric > 0 ? String(numeric) : "");
            setOtherOpen(true);
          }}
          style={{ ...(otherOpen ? { "--tw-ring-color": CUSTOM_DOSE_COLOR } : {}) }}
          className={`${chipClass(otherOpen)} gap-1 border bg-white dark:bg-white/[0.04] ${
            otherOpen
              ? "border-gray-300 dark:border-white/[0.2] text-gray-700 dark:text-gray-200"
              : "border-gray-200 dark:border-white/[0.12] text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-white/[0.2]"
          }`}
        >
          {otherOpen ? <Check size={14} strokeWidth={3} /> : <Plus size={15} strokeWidth={2.5} />}
          Other
        </button>
      </div>

      {otherOpen && (
        <div className="mt-2">
          <div className="flex items-center gap-2 min-h-[48px] border border-gray-200 dark:border-white/[0.1] dark:bg-white/[0.05] rounded-xl px-3 py-2">
            <input
              type="number" inputMode="decimal" min="0" step="0.01" autoFocus aria-label="Dose amount"
              value={custom}
              onChange={(e) => {
                setCustom(e.target.value);
                // The typed value is the dose being logged; "Add custom
                // dosage" additionally keeps it as a chip next time.
                const next = parseFloat(e.target.value);
                onSelect(next > 0 ? next : "");
              }}
              placeholder="Custom dose"
              className="flex-1 min-w-0 bg-transparent outline-none text-lg font-semibold text-gray-900 dark:text-[#E8E9F0]"
            />
            <span className="text-sm text-gray-400 dark:text-gray-500 flex-shrink-0">{unit}</span>
            <button
              type="button" onClick={handleAdd} disabled={!canSave}
              className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold disabled:opacity-50 flex-shrink-0 whitespace-nowrap"
            >
              {saving ? "Saving…" : "Add custom dosage"}
            </button>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">Saved doses appear as chips next time.</p>
        </div>
      )}
    </div>
  );
}