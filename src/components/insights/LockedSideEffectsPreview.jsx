import React from "react";

/**
 * What the Side Effects card's locked block draws instead of the list: the range
 * tabs, the count chip and three sample rows — a dot, a name, a bar and a count,
 * each one a shape.
 *
 * No symptom, severity or count is ever drawn from the person's own records, and
 * the rows are laid out at the real list's sizes so the locked card stands the
 * height the unlocked one does.
 */
const SAMPLE_ROWS = [72, 52, 34];

export default function LockedSideEffectsPreview() {
  return (
    <div>
      {/* The range tabs, as a pair of pills. */}
      <div className="mb-4 inline-flex items-center gap-1 rounded-full bg-gray-100 p-1 dark:bg-white/[0.06]">
        <span className="h-[32px] w-20 rounded-full bg-gray-200 dark:bg-white/10" />
        <span className="h-[32px] w-20 rounded-full bg-gray-100 dark:bg-white/[0.06]" />
      </div>

      <span className="inline-block h-5 w-32 rounded-full bg-gray-200 dark:bg-white/10" />

      <div className="mt-1.5">
        {SAMPLE_ROWS.map((width, index) => (
          <div key={index} className="flex w-full items-center gap-2.5 py-2">
            <span className="flex w-2 flex-shrink-0 justify-center">
              <span className="h-2 w-2 rounded-full bg-gray-300 dark:bg-white/20" />
            </span>
            <span className="h-3 rounded-full bg-gray-200 dark:bg-white/10" style={{ width: `${width}%` }} />
            <span className="ml-auto h-1.5 w-14 flex-shrink-0 rounded-full bg-gray-100 dark:bg-white/[0.08]" />
            <span className="h-3 w-4 flex-shrink-0 rounded-full bg-gray-200 dark:bg-white/10" />
          </div>
        ))}
      </div>

      <div className="mt-2">
        <span className="block h-2.5 w-40 rounded-full bg-gray-200 dark:bg-white/10" />
      </div>
    </div>
  );
}