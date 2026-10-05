import React, { useState } from "react";
import { Plus } from "lucide-react";
import { DOSE_UNIT } from "@/lib/doseOptions";

/**
 * Large single-select dose chips. The "Other" chip opens a small numeric entry
 * so a compounded dose can be logged, saved and offered as a chip next time.
 */
export default function DoseChips({ options = [], value, unit = DOSE_UNIT, onSelect, onAddCustom }) {
  const numeric = Number(value) || 0;
  const isChipValue = options.includes(numeric);
  const [otherOpen, setOtherOpen] = useState(!isChipValue && numeric > 0);
  const [custom, setCustom] = useState(!isChipValue && numeric > 0 ? String(numeric) : "");
  const [saving, setSaving] = useState(false);

  const customDose = parseFloat(custom);
  const canSave = !saving && !isNaN(customDose) && customDose > 0;

  const chipClass = (selected) =>
    `px-4 py-3 rounded-xl text-lg font-bold border transition-all active:scale-95 ${
      selected
        ? "bg-indigo-600 text-white border-indigo-600"
        : "bg-white dark:bg-white/[0.05] text-gray-700 dark:text-[#E8E9F0] border-gray-200 dark:border-white/[0.1]"
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
      <div className="flex items-baseline justify-between mb-2">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Dose</label>
        <span className="text-xs text-gray-400 dark:text-gray-500">{unit}</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {options.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => { setOtherOpen(false); onSelect(v); }}
            className={chipClass(!otherOpen && numeric === v)}
          >
            {v}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            setCustom(isChipValue ? "" : numeric > 0 ? String(numeric) : "");
            setOtherOpen(true);
          }}
          className={`${chipClass(otherOpen)} flex items-center gap-1`}
        >
          <Plus size={16} strokeWidth={2.5} /> Other
        </button>
      </div>

      {otherOpen && (
        <div className="mt-2">
          <div className="flex items-center gap-2 border border-gray-200 dark:border-white/[0.1] dark:bg-white/[0.05] rounded-xl px-3 py-2">
            <input
              type="number" inputMode="decimal" min="0" step="0.01" autoFocus
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
              className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold disabled:opacity-50 flex-shrink-0"
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