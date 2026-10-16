import React from "react";

/**
 * What the Side Effects card's locked block draws instead of the list: the range
 * tabs, the count chip and three sample rows — a severity dot, a symptom, the
 * amber-to-red bar and its count — with the last-logged line and the severity key
 * under them, exactly where the real card puts them.
 *
 * The rows are sample entries made up for the picture, never the person's own
 * records: the symptoms named here are the app's own checklist words, and no
 * severity, count or date is read from anything. The rows are laid out at the real
 * list's sizes and in its colours, so the card is recognised at a glance.
 */
const SAMPLE_ROWS = [
  { name: "Nausea", severity: "mild", count: 3 },
  { name: "Fatigue", severity: "mild", count: 2 },
  { name: "Headache", severity: "moderate", count: 1 },
];

/** The dot each severity is drawn with — the real card's own ladder. */
const SEVERITY_DOT = { mild: "#F59E0B", moderate: "#F97316", severe: "#E11D48" };
const SEVERITY_KEY = ["mild", "moderate", "severe"];

export default function LockedSideEffectsPreview() {
  return (
    <div>
      {/* The range tabs, as a pair of pills. */}
      <div className="mb-4 inline-flex items-center gap-1 rounded-full bg-gray-100 p-1 dark:bg-white/[0.06]">
        <span className="flex min-h-[32px] items-center rounded-full bg-indigo-600 px-3 text-[11px] font-medium text-white sm:text-xs">
          30 Days
        </span>
        <span className="flex min-h-[32px] items-center rounded-full px-3 text-[11px] font-medium text-gray-500 sm:text-xs dark:text-[#9A9DAE]">
          90 Days
        </span>
      </div>

      <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:bg-white/[0.06] dark:text-[#C0C3D4]">
        6 in last 30 days
      </span>

      <div className="mt-1.5">
        {SAMPLE_ROWS.map((row) => (
          <div key={row.name} className="flex w-full items-center gap-2.5 py-2">
            <span className="flex w-2 flex-shrink-0 justify-center">
              <span className="h-2 w-2 rounded-full" style={{ background: SEVERITY_DOT[row.severity] }} />
            </span>
            <span className="min-w-0 flex-1 truncate text-sm text-gray-700 dark:text-[#E8E9F0]">{row.name}</span>
            <span className="h-1.5 w-14 flex-shrink-0 overflow-hidden rounded-full bg-gray-100 dark:bg-white/[0.08]">
              <span
                className="block h-full rounded-full"
                style={{ width: `${row.count * 32}%`, background: "linear-gradient(90deg,#F59E0B,#E11D48)" }}
              />
            </span>
            <span className="w-5 flex-shrink-0 text-right text-xs tabular-nums text-gray-500 dark:text-[#9A9DAE]">
              {row.count}
            </span>
          </div>
        ))}
      </div>

      {/* What the rows are read with, in the real card's own words and places. */}
      <p className="mt-2 text-[12.5px] leading-snug text-gray-400 dark:text-[#9A9DAE]">
        Last logged 2 weeks ago · Most often 2-3 days after a shot
      </p>
      <p className="mt-1.5 flex items-center gap-3 text-[12.5px] leading-snug text-gray-400 dark:text-[#9A9DAE]">
        {SEVERITY_KEY.map((level) => (
          <span key={level} className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: SEVERITY_DOT[level] }} />
            {level.charAt(0).toUpperCase() + level.slice(1)}
          </span>
        ))}
      </p>
    </div>
  );
}