import React from "react";
import { Search, X } from "lucide-react";
import { JOURNAL_CHOICES } from "@/lib/journalMeta";
import { SHEET_DATE_FIELD } from "@/components/modals/shot/sheetUi";

// ─────────────────────────────────────────────────────────────────────────────
// What the Journal is narrowed down by: the category, the word to look for, and
// the dates to cover.
//
// The categories are one row that scrolls sideways rather than a block that
// stacks into three rows, so the list itself is never pushed further down the
// screen. The search looks through what was written and the mood; the dates are
// this week, this month, or a range the reader picks. Every control here only
// narrows what is shown — nothing is ever written, hidden for good or deleted,
// and "Clear filters" puts the whole list back.
// ─────────────────────────────────────────────────────────────────────────────

const PERIODS = [
  { key: "all", label: "All" },
  { key: "week", label: "This week" },
  { key: "month", label: "This month" },
  { key: "custom", label: "Custom" },
];

const CHIP_ON = "border-[1.5px] border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-500/40 dark:bg-indigo-500/20 dark:text-indigo-300";
const CHIP_OFF = "border border-gray-200 bg-white text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-[#9A9DAE]";

export default function JournalFilters({
  category, onCategory,
  search, onSearch,
  period, onPeriod,
  from, to, onFrom, onTo,
}) {
  return (
    <div className="w-full">
      {/* One row of category chips, scrolling sideways. */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 pt-4 pb-3">
        <button
          type="button"
          onClick={() => onCategory("All")}
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

      {/* What to look for. */}
      <div className="px-4">
        <div className="relative">
          <Search size={16} aria-hidden="true" className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search your entries"
            aria-label="Search journal entries"
            className="w-full h-[52px] rounded-full border border-gray-200 bg-white pl-10 pr-11 text-[16px] text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-indigo-300 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-[#E8E9F0] dark:placeholder:text-gray-500"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearch("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full text-gray-400"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Which dates to cover. */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 pt-3">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => onPeriod(p.key)}
            aria-pressed={period === p.key}
            className={`btn-pill btn-pill-sm shrink-0 ${period === p.key ? CHIP_ON : CHIP_OFF}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {period === "custom" && (
        <div className="px-4 pt-3 grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs text-gray-500 dark:text-[#9A9DAE] mb-1 block">From</span>
            <input type="date" value={from} onChange={(e) => onFrom(e.target.value)} className={SHEET_DATE_FIELD} />
          </label>
          <label className="block">
            <span className="text-xs text-gray-500 dark:text-[#9A9DAE] mb-1 block">To</span>
            <input type="date" value={to} onChange={(e) => onTo(e.target.value)} className={SHEET_DATE_FIELD} />
          </label>
        </div>
      )}
    </div>
  );
}