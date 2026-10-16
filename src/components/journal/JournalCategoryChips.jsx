import React from "react";
import { JOURNAL_CHOICES } from "@/lib/journalMeta";

// ─────────────────────────────────────────────────────────────────────────────
// The one row the Journal is narrowed down by: its categories, wrapped onto as
// many lines as they need rather than scrolling sideways, so every one of them —
// All, Mood, Energy, Food, Exercise, Milestone, General — is on screen at once
// and nothing has to be dragged into view.
//
// The chips are drawn in the page's own 16px margins, the same margins the month
// cards below them sit in, and each is the app's small pill (38px — see the
// button tokens in src/index.css), so the block reads as controls rather than as
// a band across the page.
//
// It is the only filter on the screen. The word to look for has its own field
// behind the header's search icon, and the dates have their own place in the
// calendar sheet — so the list itself starts just under this row.
// ─────────────────────────────────────────────────────────────────────────────

const CHIP_ON = "border-[1.5px] border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-500/40 dark:bg-indigo-500/20 dark:text-indigo-300";
const CHIP_OFF = "border border-gray-200 bg-white text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-[#9A9DAE]";
const CHIP =
  "inline-flex items-center gap-1.5 min-h-[38px] rounded-full px-3.5 text-xs font-medium border transition-colors";

export default function JournalCategoryChips({ category, onCategory }) {
  return (
    <div className="flex flex-wrap gap-2 px-4 pt-4 pb-3">
      <button
        type="button"
        onClick={() => onCategory("All")}
        aria-pressed={category === "All"}
        className={`${CHIP} ${category === "All" ? "bg-indigo-600 text-white border-indigo-600" : CHIP_OFF}`}
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
            className={`${CHIP} ${active ? "text-white" : CHIP_OFF}`}
          >
            {React.cloneElement(c.icon, { size: 13, style: active ? { color: "#fff" } : { color: c.color } })}
            {c.label}
          </button>
        );
      })}
    </div>
  );
}