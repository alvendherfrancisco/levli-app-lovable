import React from "react";
import ReadOnlySection from "@/components/caregiver/ReadOnlySection";
import { dayLabel } from "@/lib/caregiverShare";

/**
 * The shots section of a shared record: the most recent doses, each with the
 * medication, the dose logged and the day it was given.
 */
export default function ShotsReadOnlyCard({ shots = [] }) {
  const recent = shots.slice(0, 5);
  return (
    <ReadOnlySection title="Shots" meta={shots.length ? `${shots.length} logged` : null}>
      {recent.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500">No shots logged yet.</p>
      ) : (
        <div className="space-y-3">
          {recent.map((shot) => (
            <div key={shot.id} className="flex items-center justify-between gap-3 text-sm">
              <div className="min-w-0">
                <span className="block truncate text-gray-700 dark:text-gray-300">{shot.medication}</span>
                <span className="text-xs text-gray-500 dark:text-[#9A9DAE]">
                  {dayLabel(shot.date)}
                  {shot.time ? ` · ${shot.time}` : ""}
                </span>
              </div>
              <span className="flex-shrink-0 text-gray-700 dark:text-gray-300">
                {shot.dose} {shot.dose_unit || "mg"}
              </span>
            </div>
          ))}
        </div>
      )}
    </ReadOnlySection>
  );
}