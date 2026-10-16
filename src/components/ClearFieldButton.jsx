import React from "react";
import { sound } from "@/lib/sounds";

/**
 * The Clear control for an optional field that is not an option group — a date,
 * a line of text. It matches the Clear button that sits beside a chip group's
 * label, so clearing a value reads the same across every form. Rendered only
 * when there is something to clear.
 */
export default function ClearFieldButton({ show, onClear, label = "Clear", ariaLabel, className = "" }) {
  if (!show) return null;
  return (
    <button
      type="button"
      onClick={() => { sound.tap(); onClear(); }}
      aria-label={ariaLabel}
      className={`min-h-[44px] inline-flex items-center px-2 -mr-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 active:opacity-70 ${className}`}
    >
      {label}
    </button>
  );
}