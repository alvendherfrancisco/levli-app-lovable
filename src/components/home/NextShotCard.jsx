import React, { useState } from "react";
import { Syringe } from "lucide-react";
import { toast } from "@/lib/toast";
import { useAppState } from "@/lib/AppState";
import { plainBrandName } from "@/lib/medicationConfig";
import { medicationSummaries, isActiveMedication } from "@/lib/medicationLink";
import MedicationShotCard from "@/components/home/MedicationShotCard";
import MedicationStatusNote from "@/components/home/MedicationStatusNote";

/**
 * Next Shot — one card per medication. Each medication's next date, last dose
 * and total shots come from its own schedule and its own logged shots, so two
 * medications running together are never mixed into one number.
 *
 * A medication that is paused, stopped or archived carries no next-shot date
 * and no reminder: it is only shown for what it is.
 */
export default function NextShotCard({ onLogPastShot }) {
  const { shots, medications, repeatSchedules, profile, stopMedication } = useAppState();
  const [stopping, setStopping] = useState(false);

  const summaries = medicationSummaries({ medications, shots, repeatSchedules, profile });
  const running = summaries.filter((s) => isActiveMedication(s.medication));
  const halted = summaries.filter((s) => !isActiveMedication(s.medication) && s.totalShots > 0);

  const contact = (profile?.prescriber_contact || "").trim();
  const contactHref = contact
    ? (contact.includes("@") ? `mailto:${contact}` : `tel:${contact.replace(/[^\d+]/g, "")}`)
    : "";

  const handleStop = async (medicationName) => {
    setStopping(true);
    try {
      await stopMedication(medicationName);
      toast.success(`${plainBrandName(medicationName)} marked as stopped. Its schedule is paused.`);
    } catch (err) {
      toast.error("Could not update your medication");
    }
    setStopping(false);
  };

  if (running.length === 0 && halted.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 mx-4 mb-4">
        <p className="text-sm text-gray-400 dark:text-[#9A9DAE] mb-2">Next Shot</p>
        <div className="bg-indigo-50 dark:bg-indigo-500/10 rounded-xl p-3 flex items-start gap-2">
          <Syringe size={18} className="text-indigo-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-indigo-700 dark:text-indigo-300">No shots recorded yet. Add your first shot to start tracking your schedule.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {running.map((summary) => (
        <MedicationShotCard
          key={summary.medication.id || summary.medication.medication_name}
          summary={summary}
          contact={contact}
          contactHref={contactHref}
          stopping={stopping}
          onStop={() => handleStop(summary.medication.medication_name)}
          onLogPastShot={onLogPastShot}
        />
      ))}
      {halted.map((summary) => (
        <MedicationStatusNote
          key={summary.medication.id || summary.medication.medication_name}
          medication={summary.medication}
          totalShots={summary.totalShots}
        />
      ))}
    </>
  );
}