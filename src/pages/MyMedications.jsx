import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Settings, Pill, ChevronDown } from "lucide-react";
import { HEADER_ICON, HEADER_GLYPH } from "@/components/longlist/HeaderIconButton";
import PageContainer from "@/components/PageContainer";
import Fab from "@/components/Fab";
import EmptyStateCard from "@/components/EmptyStateCard";
import { useAppState } from "@/lib/AppState";
import MedicationModal from "@/components/modals/MedicationModal";
import MedicationListCard from "@/components/medications/MedicationListCard";
import RepeatScheduleCard from "@/components/medications/RepeatScheduleCard";
import RepeatScheduleModal from "@/components/modals/RepeatScheduleModal";
import LinkShotsToMedsCard from "@/components/medications/LinkShotsToMedsCard";
import ConfirmDialog from "@/components/ConfirmDialog";
import { shotsOfMedication } from "@/lib/medicationLink";
import { plainBrandName } from "@/lib/medicationConfig";
import { logWords } from "@/lib/medicationForm";
import { toast } from "@/lib/toast";

/** A regimen saved before statuses existed counts as the ordinary active one. */
const medStatus = (m) => m.status || "active";

/**
 * My Medications — the regimens themselves, in three parts: what is being taken
 * now, what has been paused or stopped, and what has been archived.
 *
 * The ⋯ menu on a card is where the two decisions live, and they never mix:
 *
 *   Archive  hides the regimen — off Home, out of the shot pickers, out of
 *            Insights — and keeps every record it has. It can be restored from
 *            the Archived section, which is folded away at the bottom.
 *   Delete   removes the regimen and everything that belongs to it: its logged
 *            doses, its reminders and the side effects logged against it.
 *
 * Each one is confirmed in a dialog that names the medication and says exactly
 * what will happen; the delete dialog offers the archive in its place.
 */
export default function MyMedications() {
  const { medications, deleteMedication, archiveMedication, restoreMedication, shots, repeatSchedules } = useAppState();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  // { kind: "archive" | "delete", medication, count } — what the dialog is about.
  const [confirming, setConfirming] = useState(null);
  // The regimens that have finished stay out of the way until they are asked for.
  const [showPast, setShowPast] = useState(false);
  // So do the archived ones.
  const [showArchived, setShowArchived] = useState(false);

  const openNew = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (m) => { setEditing(m); setModalOpen(true); };

  const activeMeds = useMemo(() => medications.filter((m) => medStatus(m) === "active"), [medications]);
  const pastMeds = useMemo(
    () => medications.filter((m) => !["active", "archived"].includes(medStatus(m))),
    [medications]
  );
  const archivedMeds = useMemo(() => medications.filter((m) => medStatus(m) === "archived"), [medications]);

  const askArchive = (m) => setConfirming({ kind: "archive", medication: m });
  // How much history a deletion would take with it, counted from the logs the
  // medication actually owns.
  const askDelete = (m) => setConfirming({ kind: "delete", medication: m, count: shotsOfMedication(shots, m).length });

  const handleConfirm = async () => {
    const target = confirming;
    if (!target) return;
    try {
      if (target.kind === "archive") {
        await archiveMedication(target.medication.id);
        toast.success(`${plainBrandName(target.medication.medication_name)} archived. Its records are kept.`);
      } else {
        await deleteMedication(target.medication.id);
        toast.deleted("Medication and its records deleted");
      }
      setConfirming(null);
    } catch (err) {
      toast.error(target.kind === "archive" ? "Could not archive that medication" : "Could not delete that medication");
    }
  };

  const handleRestore = async (m) => {
    try {
      await restoreMedication(m.id);
      toast.success(`${plainBrandName(m.medication_name)} is back on your schedule`);
    } catch (err) {
      toast.error("Could not restore that medication");
    }
  };

  // The dialog's own words, built from the medication in hand.
  const deleting = confirming?.kind === "delete";
  const words = confirming ? logWords(confirming.medication.medication_name, { route: confirming.medication.route }) : null;
  const dialogMessage = !confirming ? "" : deleting
    ? (confirming.count === 0
      ? "This permanently deletes the medication. This can't be undone."
      : `This permanently deletes the medication and its ${confirming.count} logged ${words.many}. This can't be undone.`)
    : "It will be hidden from your schedule and shot pickers. Your records stay in your history. You can restore it anytime.";

  return (
    <PageContainer bottomInset="fab" disclaimer>
      <div className="sticky top-0 z-30 bg-white dark:bg-gray-950 w-full flex items-center justify-between px-5 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Medications</h1>
        <Link to="/settings" aria-label="Settings" className={HEADER_ICON}>
          <Settings size={HEADER_GLYPH} aria-hidden="true" />
        </Link>
      </div>

      <div className="w-full max-w-3xl mx-auto pt-4 px-4">
        <LinkShotsToMedsCard />
        {repeatSchedules.filter((s) => s.status !== "cancelled").length > 0 && (
          <div className="mb-5">
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase mb-2 px-1">Repeat schedules</p>
            <div className="space-y-3">
              {repeatSchedules
                .filter((s) => s.status !== "cancelled")
                .map((s) => (
                  <RepeatScheduleCard
                    key={s.id}
                    schedule={s}
                    onEdit={(sched) => { setEditingSchedule(sched); setScheduleOpen(true); }}
                  />
                ))}
            </div>
          </div>
        )}

        {medications.length === 0 ? (
          <EmptyStateCard
            icon={Pill}
            title="No Medications Saved"
            description="Add your prescribed regimen to link your shot logs. Levli never generates a schedule for you."
          />
        ) : (
          <>
            {/* What is being taken now. */}
            <div className="space-y-3">
              {activeMeds.map((m) => (
                <MedicationListCard
                  key={m.id}
                  medication={m}
                  onOpen={openEdit}
                  onArchive={askArchive}
                  onDelete={askDelete}
                />
              ))}
              {activeMeds.length === 0 && (
                <p className="text-sm text-gray-400 dark:text-gray-500 px-1">Nothing active right now.</p>
              )}
            </div>

            {/* What has finished, folded away until it is asked for. */}
            {pastMeds.length > 0 && (
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => setShowPast((v) => !v)}
                  aria-expanded={showPast}
                  className="w-full flex items-center justify-between gap-2 py-2 text-[13px] font-semibold uppercase tracking-wide text-gray-500 dark:text-[#9A9DAE]"
                >
                  <span>Past medications ({pastMeds.length})</span>
                  <ChevronDown size={16} aria-hidden="true" className={showPast ? "" : "-rotate-90"} />
                </button>
                {showPast && (
                  <div className="space-y-3 mt-2">
                    {pastMeds.map((m) => (
                      <MedicationListCard
                        key={m.id}
                        medication={m}
                        onOpen={openEdit}
                        onArchive={askArchive}
                        onDelete={askDelete}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Archived: hidden from the schedule and the pickers, kept in full.
                Every one of them can be put back with Restore. */}
            {archivedMeds.length > 0 && (
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => setShowArchived((v) => !v)}
                  aria-expanded={showArchived}
                  className="w-full flex items-center justify-between gap-2 py-2 text-[13px] font-semibold uppercase tracking-wide text-gray-500 dark:text-[#9A9DAE]"
                >
                  <span>Archived ({archivedMeds.length})</span>
                  <ChevronDown size={16} aria-hidden="true" className={showArchived ? "" : "-rotate-90"} />
                </button>
                {showArchived && (
                  <div className="space-y-3 mt-2">
                    {archivedMeds.map((m) => (
                      <MedicationListCard
                        key={m.id}
                        medication={m}
                        onOpen={openEdit}
                        onDelete={askDelete}
                        onRestore={handleRestore}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <Fab onClick={openNew} label="Add Medication" icon={null} />

      <MedicationModal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} editing={editing} />
      <RepeatScheduleModal
        open={scheduleOpen}
        onClose={() => { setScheduleOpen(false); setEditingSchedule(null); }}
        schedule={editingSchedule}
      />

      <ConfirmDialog
        open={!!confirming}
        showIcon={false}
        tone={deleting ? "destructive" : "neutral"}
        title={confirming ? `${deleting ? "Delete" : "Archive"} ${confirming.medication.medication_name}?` : ""}
        message={dialogMessage}
        confirmLabel={deleting ? "Delete" : "Archive"}
        cancelLabel="Cancel"
        onConfirm={handleConfirm}
        onCancel={() => setConfirming(null)}
      >
        {/* Removing a medication for good is a big thing to do on purpose; the
            archive does the same job without losing a single record. */}
        {deleting && (
          <button
            type="button"
            onClick={() => setConfirming((c) => ({ ...c, kind: "archive" }))}
            className="mt-3 text-sm font-semibold text-indigo-600 underline dark:text-indigo-400"
          >
            Archive instead
          </button>
        )}
      </ConfirmDialog>
    </PageContainer>
  );
}