import React, { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import HeaderIconButton, { HEADER_GLYPH } from "@/components/longlist/HeaderIconButton";
import { monthKeysBetween, monthNameOf } from "@/lib/monthGroups";

// ─────────────────────────────────────────────────────────────────────────────
// The calendar button a long list carries, and the sheet it opens.
//
// The sheet shows the months the list actually holds, one year at a time: the
// year sits between two arrows above the grid, the twelve months are equal chips
// three to a row, and a month the list has nothing in is greyed out and cannot be
// picked. The month the list was last sent to is the highlighted one, so where
// the list stands is read from the grid itself rather than from a marker.
//
// A list that also narrows by date (the Journal: this week, this month) passes
// them as `quickOptions`; they sit in three equal columns on one row above the
// year, so every date choice is behind this one button.
//
// The sheet is drawn at the top of the document (a portal) rather than inside the
// header that opens it. The header is a sticky bar with a stacking order of its
// own, and a sheet drawn inside it lands beneath the bottom tab bar and the
// floating add button on the page — which is what used to cover the last months.
// At the top of the document it is above both, so January through December are
// all on screen and all tappable.
//
// `months` is every month the list holds, newest first (see src/lib/monthGroups.js).
// `onOpenChange` is how a page takes its own floating button out of the way while
// the sheet is up.
// ─────────────────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const CHIP =
  "btn-pill btn-pill-sm w-full justify-center border border-gray-200 bg-white text-gray-700 " +
  "dark:border-white/[0.12] dark:bg-white/[0.05] dark:text-[#E8E9F0]";
const CHIP_ON =
  "btn-pill btn-pill-sm w-full justify-center border-[1.5px] border-indigo-300 bg-indigo-50 font-semibold text-indigo-700 " +
  "dark:border-indigo-500/40 dark:bg-indigo-500/20 dark:text-indigo-300";
// A month the list has nothing in: still a chip of the same size, so the grid
// stays square, but plainly not a choice.
const CHIP_EMPTY =
  "btn-pill btn-pill-sm w-full justify-center border border-gray-100 bg-white text-gray-300 " +
  "dark:border-white/[0.06] dark:bg-white/[0.02] dark:text-gray-600";

// The three quick dates, one row of equal chips. Their own label length decides
// nothing: every one of them is a third of the row.
const QUICK =
  "inline-flex w-full min-w-0 min-h-[38px] items-center justify-center rounded-full border border-gray-200 " +
  "bg-white px-2 text-[13px] font-medium text-gray-700 dark:border-white/[0.12] dark:bg-white/[0.05] dark:text-[#E8E9F0]";
const QUICK_ON =
  "inline-flex w-full min-w-0 min-h-[38px] items-center justify-center rounded-full border-[1.5px] " +
  "border-indigo-300 bg-indigo-50 px-2 text-[13px] font-semibold text-indigo-700 " +
  "dark:border-indigo-500/40 dark:bg-indigo-500/20 dark:text-indigo-300";

// A year arrow: the same 44px target and the same 24px glyph as every header icon.
const ARROW =
  "w-11 h-11 flex shrink-0 items-center justify-center rounded-full text-gray-600 dark:text-gray-400 " +
  "disabled:opacity-30 disabled:cursor-not-allowed";

export default function MonthJumpButton({
  months = [], onJump, title = "Jump to month", className = "",
  compact = false, quickOptions = null, quickValue = null, onQuick = null,
  onOpenChange = null,
}) {
  const [open, setOpen] = useState(false);
  // The month the list was last sent to: the one the grid highlights.
  const [picked, setPicked] = useState(null);

  const available = useMemo(() => new Set(months), [months]);
  const years = useMemo(() => {
    const set = new Set();
    months.forEach((key) => set.add(key.slice(0, 4)));
    return [...set].sort((a, b) => (a < b ? 1 : -1));
  }, [months]);

  // The months between the newest and oldest the list holds, so a year's grid is
  // complete rather than a scatter of the entries that happen to be loaded.
  const range = useMemo(() => {
    if (!months.length) return [];
    return monthKeysBetween(months[months.length - 1], months[0]);
  }, [months]);
  const inRange = useMemo(() => new Set(range), [range]);

  const [year, setYear] = useState(years[0] || "");
  const shownYear = years.includes(year) ? year : years[0];

  if (!months.length) return null;

  const hasQuick = !!(quickOptions && quickOptions.length);

  // The years the list covers, newest first: the left arrow steps back through
  // them and the right one forward, and neither goes past the ends of the list.
  const at = years.indexOf(shownYear);
  const olderYear = at >= 0 ? years[at + 1] : undefined;
  const newerYear = at > 0 ? years[at - 1] : undefined;

  // One open/close, so a page is told either way and can put its floating button
  // back the moment the sheet is gone.
  const setOpenState = (next) => { setOpen(next); onOpenChange?.(next); };

  const sheet = (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/40 overlay-lock" onClick={() => setOpenState(false)} />

      <div className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-white dark:bg-gray-900 card-line sheet-lock animate-in slide-in-from-bottom max-h-[80vh] overflow-y-auto no-scrollbar">
        {/* The sheet's own handle: something pulled up, not a page that arrived. */}
        <div className="pt-3 flex justify-center" aria-hidden="true">
          <span className="h-1.5 w-10 rounded-full bg-gray-200 dark:bg-white/[0.15]" />
        </div>

        <div className="px-5 pt-3 pb-3">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h2>
        </div>

        {/* The quick dates this list offers: one row, three equal chips. */}
        {hasQuick && (
          <div className="px-5 pb-4 grid grid-cols-3 gap-2">
            {quickOptions.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => { setOpenState(false); onQuick?.(option.key); }}
                aria-pressed={option.key === quickValue}
                className={option.key === quickValue ? QUICK_ON : QUICK}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}

        {/* The year the grid belongs to: a clear label between two arrows, rather
            than a pill that looks like one of the chips. */}
        <div className="px-5 pb-3 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setYear(olderYear)}
            disabled={!olderYear}
            aria-label="Previous year"
            className={ARROW}
          >
            <ChevronLeft size={HEADER_GLYPH} aria-hidden="true" />
          </button>
          <span className="text-base font-semibold text-gray-900 dark:text-white">{shownYear}</span>
          <button
            type="button"
            onClick={() => setYear(newerYear)}
            disabled={!newerYear}
            aria-label="Next year"
            className={ARROW}
          >
            <ChevronRight size={HEADER_GLYPH} aria-hidden="true" />
          </button>
        </div>

        {/* Twelve equal chips, three to a row: the month in hand highlighted, a
            month with nothing in it greyed out and unpressable. */}
        <div className="px-5 pb-5 grid grid-cols-3 gap-2">
          {MONTH_NAMES.map((name, index) => {
            const key = `${shownYear}-${String(index + 1).padStart(2, "0")}`;
            const has = available.has(key);
            const usable = has || inRange.has(key);
            const chosen = usable && key === picked;
            return (
              <button
                key={key}
                type="button"
                disabled={!usable}
                onClick={() => { setPicked(key); setOpenState(false); onJump?.(key); }}
                aria-pressed={chosen}
                aria-label={monthNameOf(key)}
                className={!usable ? CHIP_EMPTY : chosen ? CHIP_ON : CHIP}
              >
                {name.slice(0, 3)}
              </button>
            );
          })}
        </div>

        {/* The way out, at the foot of the sheet. */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-white/[0.08] px-5 pt-4 pb-modal-footer">
          <button type="button" onClick={() => setOpenState(false)} className="btn-pill btn-secondary w-full">
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={className}>
      {compact ? (
        <HeaderIconButton label={title} onClick={() => setOpenState(true)}>
          <CalendarDays size={HEADER_GLYPH} aria-hidden="true" />
        </HeaderIconButton>
      ) : (
        <button
          type="button"
          onClick={() => setOpenState(true)}
          aria-label={title}
          className="btn-pill btn-pill-sm btn-secondary"
        >
          <CalendarDays size={20} aria-hidden="true" />
        </button>
      )}

      {open && createPortal(sheet, document.body)}
    </div>
  );
}