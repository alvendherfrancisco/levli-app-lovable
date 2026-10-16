import React from "react";

/**
 * One of the icons a page carries in its header — the settings gear, the report,
 * the calendar, the filter, the search.
 *
 * Every one of them is the same icon: a 24px glyph (HEADER_GLYPH) inside a 44px
 * touch target, in the same weight and the same colour, so a header reads as one
 * row of equal controls whichever page it belongs to and whatever the icons are.
 *
 * Only its height is pulled back out of the layout (`-my-1.5`), so the icon
 * contributes no more height than the title beside it: the row stays exactly
 * 72px, which is what the month headers below stick to, and a header icon can
 * never push them out of line. Its width is left alone, so two of them never
 * overlap their tap targets.
 *
 * `active` is the one thing a header icon adds when what it is for is on: the
 * small dot on the filter whenever a filter is narrowing the list.
 */
export const HEADER_GLYPH = 24;

export const HEADER_ICON =
  "-my-1.5 w-11 h-11 flex shrink-0 items-center justify-center rounded-full " +
  "text-gray-600 dark:text-gray-400";

export default function HeaderIconButton({ label, onClick, active = false, children, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`${HEADER_ICON} relative ${className}`}
    >
      {children}
      {active && (
        <span
          className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400"
          aria-hidden="true"
        />
      )}
    </button>
  );
}