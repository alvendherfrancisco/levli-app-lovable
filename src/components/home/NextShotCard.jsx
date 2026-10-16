import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Syringe, Pill } from "lucide-react";
import { toast } from "@/lib/toast";
import { useAppState } from "@/lib/AppState";
import { plainBrandName } from "@/lib/medicationConfig";
import { medicationSummaries, isActiveMedication } from "@/lib/medicationLink";
import MedicationShotCard from "@/components/home/MedicationShotCard";
import MedicationStatusNote from "@/components/home/MedicationStatusNote";
import ConfirmDialog from "@/components/ConfirmDialog";

/**
 * Next Shot — one card per medication. Each medication's next date, last dose
 * and total shots come from its own schedule and its own logged shots, so two
 * medications running together are never mixed into one number.
 *
 * A medication that has been archived carries no next-shot date and no reminder:
 * it is only shown for what it is, with the way back to Meds.
 *
 * A regimen is stopped in one place only: Archive, asked for from the reminder
 * card below and confirmed in the same dialog the My Medications screen uses.
 */
export default function NextShotCard({ onLogPastShot }) {
  const { shots, medications, repeatSchedules, profile, archiveMedication } = useAppState();
  // The medication the archive dialog is about, if any.
  const [archiving, setArchiving] = useState(null);

  const summaries = medicationSummaries({ medications, shots, repeatSchedules, profile });
  const running = summaries.filter((s) => isActiveMedication(s.medication));
  const halted = summaries.filter((s) => !isActiveMedication(s.medication) && s.totalShots > 0);

  const contact = (profile?.prescriber_contact || "").trim();
  const contactHref = contact
    ? (contact.includes("@") ? `mailto:${contact}` : `tel:${contact.replace(/[^\d+]/g, "")}`)
    : "";

  // Archiving hides the medication and keeps every record it has. The dialog has
  // already asked, so by the time this runs archiving is what was chosen.
  const confirmArchive = async () => {
    const target = archiving;
    setArchiving(null);
    if (!target) return;
    try {
      await archiveMedication(target.id);
      toast.success(`${plainBrandName(target.medication_name)} archived. Its records are kept.`);
    } catch (err) {
      toast.error("Could not archive that medication");
    }
  };

  // Nothing is running: either no medication has been added yet, or every one of
  // them has been paused, stopped or archived. The card offers the one thing that
  // helps here — adding what is being taken now — and any medication that is
  // logged but not running is shown underneath for what it is.
  if (running.length === 0) {
    return (
      <>
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 card-line mx-4 mb-4">
          <p className="text-sm text-gray-400 dark:text-[#9A9DAE] mb-2">Next dose</p>
          <div className="bg-indigo-50 dark:bg-indigo-500/10 rounded-xl p-3 flex items-start gap-2">
            <Syringe size={18} className="text-indigo-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-indigo-700 dark:text-indigo-300">No medication is scheduled right now.</p>
          </div>
          <Link to="/medications" className="btn-pill btn-secondary mt-3 w-full">
            <Pill size={16} aria-hidden="true" /> Add a medication
          </Link>
        </div>
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

  return (
    <>
      {running.map((summary) => (
        <MedicationShotCard
          key={summary.medication.id || summary.medication.medication_name}
          summary={summary}
          contact={contact}
          contactHref={contactHref}
          archiving={archiving?.id === summary.medication.id}
          onArchive={() => setArchiving(summary.medication)}
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

      {/* The same dialog My Medications shows for an archive: what happens, said
          plainly, and the medication named. */}
      <ConfirmDialog
        open={!!archiving}
        showIcon={false}
        tone="neutral"
        title={archiving ? `Archive ${archiving.medication_name}?` : ""}
        message="It will be hidden from your schedule and shot pickers. Your records stay in your history. You can restore it anytime."
        confirmLabel="Archive"
        cancelLabel="Cancel"
        onConfirm={confirmArchive}
        onCancel={() => setArchiving(null)}
      />
    </>
  );
}