import React, { useState } from "react";
import { Check } from "lucide-react";
import { sound } from "@/lib/sounds";
import { isSet, isBlockedClear, nextSingle } from "@/lib/optionGroup";

// The label, the chips and the helper line come from the flow's own tokens (see
// src/lib/authStyles.js), so every form that draws a group of chips switches with
// the device's light/dark setting. The chosen chip is the app's indigo in both
// modes, with white on it.
const LABEL_CLASS = "text-sm font-semibold text-auth-text";
const CHIP_CLASS = "inline-flex items-center gap-1.5 min-h-[44px] rounded-xl border-2 px-3 text-sm font-semibold transition-colors";
const SELECTED_CLASS = "bg-indigo-600 border-indigo-600 text-white";
const UNSELECTED_CLASS = "bg-auth-card border-auth-border text-auth-text";

/**
 * One selectable option group, shared by every form in the app.
 *
 * The rule is the same everywhere (see src/lib/optionGroup.js): tapping a
 * selected option again clears it, unless the field is required — then the tap
 * does nothing and only another option changes the value. An optional group
 * holding a value offers Clear beside its label and a muted "Tap again to
 * clear" reminder under the chips.
 *
 * Chip size, colour and wrapping come from the caller as class strings, so each
 * form keeps exactly the look it had. Only the shared extras are added: the
 * tick on the selected option and aria-pressed.
 */
export default function OptionChips({
  label, labelClass = LABEL_CLASS,
  options = [], value, onChange,
  required = false,
  clearLabel = "Clear", showClearHint = true,
  helper, blockedMessage,
  chipClass = CHIP_CLASS, selectedClass = SELECTED_CLASS, unselectedClass = UNSELECTED_CLASS,
  wrapClass = "flex flex-wrap gap-2",
  showCheck = true, soundOnSelect = false,
  children,
}) {
  // Raised only where a refusal has something to say (the repeat day picker:
  // "Pick at least one day."). Everywhere else a refused tap is silent.
  const [blocked, setBlocked] = useState(false);

  const chip = (selected) => `${chipClass} ${selected ? selectedClass : unselectedClass}`;

  const tap = (option) => {
    if (isBlockedClear(value, option, { required })) {
      if (blockedMessage) setBlocked(true);
      return;
    }
    setBlocked(false);
    if (value !== option && soundOnSelect) sound.tap();
    if (value === option) sound.tap(); // clearing: the soft tap the rule asks for
    onChange(nextSingle(value, option, { required }));
  };

  const canClear = !required && isSet(value);

  const clear = () => {
    sound.tap();
    setBlocked(false);
    onChange(null);
  };

  return (
    <div>
      {label && (
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className={labelClass}>{label}</span>
          {canClear && (
            <button
              type="button"
              onClick={clear}
              className="min-h-[44px] inline-flex items-center px-2 -mr-2 text-xs font-semibold text-auth-link active:opacity-70"
            >
              {clearLabel}
            </button>
          )}
        </div>
      )}

      <div className={wrapClass} role="group" aria-label={typeof label === "string" ? label : undefined}>
        {options.map((o) => {
          const selected = o.value === value;
          return (
            <button
              key={String(o.value)}
              type="button"
              onClick={() => tap(o.value)}
              aria-pressed={selected}
              disabled={o.disabled}
              className={chip(selected)}
            >
              {selected && showCheck && (
                <Check size={14} strokeWidth={3} className="flex-shrink-0" aria-hidden="true" />
              )}
              <span className="min-w-0">{o.label}</span>
              {o.sublabel && <span className={o.sublabelClass || "text-[11px] opacity-80"}>{o.sublabel}</span>}
            </button>
          );
        })}
      </div>

      {helper && <p className="text-xs text-auth-muted mt-2 leading-snug">{helper}</p>}
      {canClear && showClearHint && (
        <p className="text-xs text-auth-faint mt-1.5">Tap again to clear</p>
      )}
      {blocked && blockedMessage && (
        <p className="text-xs text-orange-600 dark:text-orange-400 mt-1.5">{blockedMessage}</p>
      )}

      {children}
    </div>
  );
}