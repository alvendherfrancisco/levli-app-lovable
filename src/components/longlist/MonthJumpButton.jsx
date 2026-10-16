import React, { useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import HeaderIconButton from "@/components/longlist/HeaderIconButton";
import { monthKeysBetween, monthNameOf } from "@/lib/monthGroups";

// ─────────────────────────────────────────────────────────────────────────────
// The calendar button a long list carries in its header.
//
// It opens the months the list actually holds — the year first, then that year's
// months — and a month with entries in it is marked with a dot, so the picker
// never promises a month the list has nothing in. Jumping to one asks the list to
// go there.
//
// A list that also narrows by date (the Journal: this week, this month) passes
// them as `quickOptions` and they sit at the top of the same sheet, so every date
// choice is behind this one button instead of in a row on the screen.
//
// `months` is every month the list holds, newest first (see src/lib/monthGroups.js).
// ─────────────────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const CHIP =
  "btn-pill btn-pill-sm min-w-[4.5rem] justify-center border border-gray-200 bg-white text-gray-700 " +
  "dark:border-white/[0.12] dark:bg-white/[0.05] dark:text-[#E8E9F0]";
const CHIP_ON =
  "btn-pill btn-pill-sm min-w-[4.5rem] justify-center border-[1.5px] border-indigo-300 bg-indigo-50 text-indigo-700 " +
  "dark:border-indigo-500/40 dark:bg-indigo-500/20 dark:text-indigo-300";

export default function MonthJumpButton({
  months = [], onJump, title = "Jump to month", className = "",
  compact = false, quickOptions = null, quickValue = null, onQuick = null,
}) {
  const [open, setOpen] = useState(false);

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

  return (
    <div className={className}>
      {compact ? (
        <HeaderIconButton label={title} onClick={() => setOpen(true)}>
          <CalendarDays size={20} aria-hidden="true" />
        </HeaderIconButton>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={title}
          className="btn-pill btn-pill-sm btn-secondary"
        >
          <CalendarDays size={18} aria-hidden="true" />
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div
            className="absolute inset-0 bg-black/40 overlay-lock"
            onClick={() => setOpen(false)}
          />
          <div className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-white dark:bg-gray-900 card-line sheet-lock animate-in slide-in-from-bottom max-h-[80vh] overflow-y-auto no-scrollbar pb-modal-footer">
            <div className="px-5 pt-5 pb-3">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h2>
            </div>

            {/* The quick dates this list offers, ahead of the months themselves. */}
            {hasQuick && (
              <div className="px-5 pb-4 flex flex-wrap gap-2">
                {quickOptions.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => { setOpen(false); onQuick?.(option.key); }}
                    aria-pressed={option.key === quickValue}
                    className={option.key === quickValue ? CHIP_ON : CHIP}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}

            {/* The years the list covers, newest first. */}
            <div className="px-5 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
              {years.map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => setYear(y)}
                  aria-pressed={y === shownYear}
                  className={`btn-pill btn-pill-sm shrink-0 ${
                    y === shownYear
                      ? "border-[1.5px] border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-500/40 dark:bg-indigo-500/20 dark:text-indigo-300"
                      : CHIP
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>

            <div className="px-5 pb-5 grid grid-cols-3 gap-2">
              {MONTH_NAMES.map((name, index) => {
                const key = `${shownYear}-${String(index + 1).padStart(2, "0")}`;
                const has = available.has(key);
                const usable = has || inRange.has(key);
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={!usable}
                    onClick={() => {
                      setOpen(false);
                      onJump?.(key);
                    }}
                    className={`btn-pill btn-pill-sm justify-center ${
                      has ? CHIP : "border border-gray-100 bg-white text-gray-300 dark:border-white/[0.06] dark:bg-white/[0.02] dark:text-gray-600"
                    }`}
                    aria-label={monthNameOf(key)}
                  >
                    <span className="flex flex-col items-center leading-none">
                      <span>{name.slice(0, 3)}</span>
                      {/* A month with entries is marked, so a month is never picked blind. */}
                      <span
                        className={`mt-1 w-1 h-1 rounded-full ${has ? "bg-indigo-500 dark:bg-indigo-400" : "bg-transparent"}`}
                        aria-hidden="true"
                      />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}