import React, { useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import { monthKeysBetween, monthNameOf } from "@/lib/monthGroups";

// ─────────────────────────────────────────────────────────────────────────────
// The calendar button a long list carries in its header.
//
// It opens the months the list actually holds — the year first, then that year's
// months — and jumping to one asks the list to go there. A month the list has
// nothing in is shown, but dimmed: the picker never promises an entry that is not
// there.
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

export default function MonthJumpButton({ months = [], onJump, title = "Jump to month", className = "" }) {
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

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={title}
        className="btn-pill btn-pill-sm btn-secondary"
      >
        <CalendarDays size={18} aria-hidden="true" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div
            className="absolute inset-0 bg-black/40 overlay-lock"
            onClick={() => setOpen(false)}
          />
          <div className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-white dark:bg-gray-900 card-line sheet-lock animate-in slide-in-from-bottom max-h-[80vh] overflow-y-auto no-scrollbar pb-modal-footer">
            <div className="px-5 pt-5 pb-3">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h2>
              <p className="text-xs text-gray-500 dark:text-[#9A9DAE] mt-0.5">
                The months this list has entries in.
              </p>
            </div>

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
                    {name.slice(0, 3)}
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