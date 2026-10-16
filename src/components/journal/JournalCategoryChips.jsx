import React from "react";
import { JOURNAL_CHOICES } from "@/lib/journalMeta";

// ─────────────────────────────────────────────────────────────────────────────
// The one row the Journal is narrowed down by: its categories, scrolling
// sideways rather than stacking into a block, with a soft fade at the right edge
// so it is clear there is more of the row to reach.
//
// It is the only filter on the screen. The word to look for has its own field
// behind the header's search icon, and the dates have their own place in the
// calendar sheet — so the list itself starts just under this row.
// ─────────────────────────────────────────────────────────────────────────────

const CHIP_ON = "border-[1.5px] border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-500/40 dark:bg-indigo-500/20 dark:text-indigo-300";
const CHIP_OFF = "border border-gray-200 bg-white text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-[#9A9DAE]";

export default function JournalCategoryChips({ category, onCategory }) {
  return (
    <div className="relative">
      <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 pt-4 pb-3">
        <button
          type="button"
          onClick={() => onCategory("All")}
          aria-pressed={category === "All"}
          className={`shrink-0 min-h-[38px] px-3.5 rounded-full text-xs font-medium border transition-colors ${
            category === "All" ? "bg-indigo-600 text-white border-indigo-600" : CHIP_OFF
          }`}
        >
          All
        </button>
        {JOURNAL_CHOICES.map((c) => {
          const active = category === c.key;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => onCategory(c.key)}
              aria-pressed={active}
              style={active ? { background: c.color, borderColor: c.color } : {}}
              className={`shrink-0 flex items-center gap-1.5 min-h-[38px] px-3.5 rounded-full text-xs font-medium border transition-colors ${
                active ? "text-white" : CHIP_OFF
              }`}
            >
              {React.cloneElement(c.icon, { size: 13, style: active ? { color: "#fff" } : { color: c.color } })}
              {c.label}
            </button>
          );
        })}
      </div>

      {/* The fade that says the row runs on. It only ever draws, never intercepts. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white to-transparent dark:from-gray-950"
      />
    </div>
  );
}