import React, { useLayoutEffect, useRef, useState } from "react";
import { Check, Plus } from "lucide-react";
import { DOSE_UNIT } from "@/lib/doseOptions";
import { NEUTRAL_DOSE_COLOR } from "@/lib/doseColors";
import useDoseColors from "@/hooks/useDoseColors";
import { sound } from "@/lib/sounds";
import {
  SHEET_CHIP, SHEET_CHIP_OFF, SHEET_CHIP_ON, SHEET_FIELD, SHEET_HINT, SHEET_LABEL_TEXT,
} from "@/components/modals/shot/sheetUi";

/**
 * Compact single-select dose chips, with the neutral "Other" chip that opens a
 * small numeric entry so a compounded dose can be logged, saved and offered as a
 * chip next time.
 *
 * Two looks, one behaviour. The default fills each strength with its own colour
 * (see src/lib/doseColors.js) and rings the one that is selected. The "neutral"
 * look, which the Add Shot Log sheet uses, draws every strength as the same pill
 * as the fields around it and keeps the dose's own colour in a small dot alone,
 * so the row reads as one form rather than a palette. Either way a selected chip
 * carries the app's indigo and a tick, never a solid fill or a thick outline.
 */
export default function DoseChips({
  medication, options = [], value, unit = DOSE_UNIT, onSelect, onAddCustom, variant = "color",
  label = "Dose",
}) {
  const numeric = Number(value) || 0;
  const isChipValue = options.includes(numeric);
  const [otherOpen, setOtherOpen] = useState(!isChipValue && numeric > 0);
  const [custom, setCustom] = useState(!isChipValue && numeric > 0 ? String(numeric) : "");
  const [saving, setSaving] = useState(false);
  // Every chip's colour comes from the dose palette, in the theme in use, so
  // changing the medication or the theme repaints them at once.
  const { color, style } = useDoseColors();
  // The "Other" field takes focus only when the user taps the chip themselves,
  // never just because the panel happened to be open as the sheet appeared.
  const doseInputRef = useRef(null);
  const focusOnOpen = useRef(false);
  const neutral = variant === "neutral";

  // A layout effect runs in the same task as the tap, which is what lets iOS
  // raise the keyboard for a focus it treats as deliberate.
  useLayoutEffect(() => {
    if (!otherOpen || !focusOnOpen.current) return;
    focusOnOpen.current = false;
    try { doseInputRef.current?.focus({ preventScroll: true }); } catch { /* ignore */ }
  }, [otherOpen]);

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

  // Both looks open the custom entry the same way.
  const openOther = () => {
    sound.tap();
    setCustom(isChipValue ? "" : numeric > 0 ? String(numeric) : "");
    // A deliberate tap on "Other", so the field may take focus here.
    if (otherOpen) {
      try { doseInputRef.current?.focus({ preventScroll: true }); } catch { /* ignore */ }
    } else {
      focusOnOpen.current = true;
      setOtherOpen(true);
    }
  };

  return (
    <div>
      {/* The unit sits beside the label, as small grey text on the right. */}
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <label className={neutral ? SHEET_LABEL_TEXT : "text-sm font-semibold text-gray-700 dark:text-gray-300"}>{label}</label>
        <span className={neutral ? SHEET_HINT : "text-xs text-gray-400 dark:text-gray-500"}>{unit}</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {options.map((v) => {
          const chipColor = color(medication, v);
          const selected = !otherOpen && numeric === v;
          // Neutral: one pill per strength, the dose's own colour kept to a dot.
          if (neutral) {
            return (
              <button
                key={v}
                type="button"
                onClick={() => { sound.tap(); setOtherOpen(false); onSelect(v); }}
                aria-pressed={selected}
                className={`${SHEET_CHIP} ${selected ? SHEET_CHIP_ON : SHEET_CHIP_OFF}`}
              >
                <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: chipColor }} />
                <span className="min-w-0">{v}</span>
                {selected && <Check size={15} strokeWidth={3} aria-hidden="true" className="shrink-0" />}
              </button>
            );
          }
          return (
            <button
              key={v}
              type="button"
              onClick={() => { sound.tap(); setOtherOpen(false); onSelect(v); }}
              style={{ ...style(medication, v), ...(selected ? { "--tw-ring-color": chipColor } : {}) }}
              className={chipClass(selected)}
            >
              {selected && <Check size={14} strokeWidth={3} className="mr-1 flex-shrink-0" />}
              {v}
            </button>
          );
        })}

        {neutral ? (
          <button
            type="button"
            onClick={openOther}
            aria-pressed={otherOpen}
            className={`${SHEET_CHIP} border border-dashed border-gray-300 text-gray-500 dark:border-white/[0.2] dark:text-gray-400`}
          >
            {otherOpen ? <Check size={15} strokeWidth={3} aria-hidden="true" /> : <Plus size={16} strokeWidth={2.5} aria-hidden="true" />}
            Other
          </button>
        ) : (
          <button
            type="button"
            onClick={openOther}
            style={{ ...(otherOpen ? { "--tw-ring-color": NEUTRAL_DOSE_COLOR } : {}) }}
            className={`${chipClass(otherOpen)} gap-1 border bg-white dark:bg-white/[0.04] ${
              otherOpen
                ? "border-gray-300 dark:border-white/[0.2] text-gray-700 dark:text-gray-200"
                : "border-gray-200 dark:border-white/[0.12] text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-white/[0.2]"
            }`}
          >
            {otherOpen ? <Check size={14} strokeWidth={3} /> : <Plus size={15} strokeWidth={2.5} />}
            Other
          </button>
        )}
      </div>

      {otherOpen && (
        <div className="mt-2">
          <div className={`flex items-center gap-2 ${neutral
            ? SHEET_FIELD
            : "min-h-[48px] border border-gray-200 dark:border-white/[0.1] dark:bg-white/[0.05] rounded-xl px-3 py-2"}`}>
            <input
              type="number" inputMode="decimal" min="0" step="0.01" ref={doseInputRef} aria-label="Dose amount"
              value={custom}
              onChange={(e) => {
                setCustom(e.target.value);
                // The typed value is the dose being logged; "Add custom
                // dosage" additionally keeps it as a chip next time.
                const next = parseFloat(e.target.value);
                onSelect(next > 0 ? next : "");
              }}
              placeholder="Custom dose"
              className={`flex-1 min-w-0 bg-transparent outline-none text-gray-900 dark:text-[#E8E9F0] ${
                neutral ? "text-[16px]" : "text-lg font-semibold"
              }`}
            />
            <span className="text-sm text-gray-400 dark:text-gray-500 flex-shrink-0">{unit}</span>
            <button
              type="button" onClick={handleAdd} disabled={!canSave}
              className="px-3 py-2 btn-pill btn-pill-sm btn-primary text-xs font-semibold whitespace-nowrap flex-shrink-0"
            >
              {saving ? "Saving…" : "Add custom dosage"}
            </button>
          </div>
          <p className={neutral ? `${SHEET_HINT} mt-1.5` : "text-xs text-gray-400 dark:text-gray-500 mt-1.5"}>
            Saved doses appear as chips next time.
          </p>
        </div>
      )}
    </div>
  );
}