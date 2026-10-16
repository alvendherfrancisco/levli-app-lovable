import React from "react";
import ReadOnlySection from "@/components/caregiver/ReadOnlySection";
import { dayLabel } from "@/lib/caregiverShare";

/**
 * The journal section of a shared record: the latest entries as they were
 * written, each with the day it belongs to.
 */
export default function JournalReadOnlyCard({ entries = [] }) {
  const recent = entries.slice(0, 5);
  return (
    <ReadOnlySection title="Journal" meta={entries.length ? `${entries.length} entries` : null}>
      {recent.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500">No journal entries yet.</p>
      ) : (
        <div className="space-y-3">
          {recent.map((entry) => (
            <div key={entry.id}>
              <p className="text-xs text-gray-500 dark:text-[#9A9DAE]">
                {dayLabel(entry.date)}
                {entry.time ? ` · ${entry.time}` : ""}
                {entry.category ? ` · ${entry.category}` : ""}
              </p>
              <p className="line-clamp-2 text-sm text-gray-700 dark:text-gray-300">{entry.text}</p>
            </div>
          ))}
        </div>
      )}
    </ReadOnlySection>
  );
}