import React from "react";
import ReadOnlySection from "@/components/caregiver/ReadOnlySection";
import { dayLabel } from "@/lib/caregiverShare";

/**
 * The side-effects section of a shared record: how many have been logged, and the
 * most recent ones with the severity that was reported. Nothing here is a
 * judgement about a medication, only what was written down.
 *
 * It is drawn only while the owner has Premium: the whole shared view follows
 * their plan, so without it the page is held behind the blurred preview instead
 * (see SharedWithMe), and nothing of the record reaches this card at all.
 */
export default function SideEffectsReadOnlyCard({ events = [] }) {
  const recent = events.slice(0, 5);
  return (
    <ReadOnlySection title="Side effects" meta={events.length ? `${events.length} logged` : null}>
      {recent.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500">No side effects logged yet.</p>
      ) : (
        <div className="space-y-3">
          {recent.map((event) => (
            <div key={event.id} className="flex items-center justify-between gap-3 text-sm">
              <div className="min-w-0">
                <span className="block truncate text-gray-700 dark:text-gray-300">{event.symptom}</span>
                <span className="text-xs text-gray-500 dark:text-[#9A9DAE]">{dayLabel(event.onset_date)}</span>
              </div>
              {event.severity && (
                <span className="flex-shrink-0 rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                  {event.severity}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </ReadOnlySection>
  );
}