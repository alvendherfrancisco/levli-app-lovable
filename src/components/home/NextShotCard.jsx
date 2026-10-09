import React, { useState } from "react";
import { Syringe } from "lucide-react";
import { toast } from "@/lib/toast";
import { useAppState } from "@/lib/AppState";
import { plainBrandName } from "@/lib/medicationConfig";
import { medicationSummaries, isActiveMedication } from "@/lib/medicationLink";
import MedicationShotCard from "@/components/home/MedicationShotCard";
import MedicationStatusNote from "@/components/home/MedicationStatusNote";
import { CARD, CARD_TITLE, INFO_BOX } from "@/lib/uiStyles";

/**
 * Next dose: one card per medication. Each medication's next date, last dose and
 * total doses come from its own schedule and its own logged shots, so two
 * medications running together are never mixed into one number.
 *
 * A medication that is paused, stopped or archived carries no next-dose date and
 * no reminder: it is only shown for what it is.
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
      <div className={CARD}>
        <h3 className={`${CARD_TITLE} mb-3`}>Next dose</h3>
        <div className={`${INFO_BOX} flex items-center gap-2`}>
          <Syringe size={16} className="flex-shrink-0" aria-hidden="true" />
          <p>No doses logged yet.</p>
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