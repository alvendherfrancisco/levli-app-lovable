import React from "react";

/**
 * What the shared side-effects section draws while it is locked: three sample
 * rows in the shape of the real ones — a symptom, its date and its severity chip,
 * every one of them a grey bar.
 *
 * Nothing of the shared record is drawn behind the blur: the caregiver follows the
 * owner's plan, and a record that is locked is never shown in part. The rows keep
 * the section's own sizes, so its height does not change when the lock comes off.
 */
export default function LockedSideEffectsPreview() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((index) => (
        <div key={index} className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <span className="block h-3.5 w-2/3 rounded-full bg-gray-200 dark:bg-white/10" />
            <span className="mt-2 block h-3 w-20 rounded-full bg-gray-100 dark:bg-white/[0.08]" />
          </div>
          <span className="h-5 w-16 flex-shrink-0 rounded-full bg-gray-200 dark:bg-white/10" />
        </div>
      ))}
    </div>
  );
}