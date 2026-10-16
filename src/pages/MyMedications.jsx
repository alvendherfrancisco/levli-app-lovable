import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Settings, Pill, Archive, ChevronDown } from "lucide-react";
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
import { toast } from "@/lib/toast";

export default function MyMedications() {
  const { medications, deleteMedication, archiveMedication, shots, repeatSchedules } = useAppState();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  // { medication, archive, count } — what the confirmation is about to do.
  const [confirming, setConfirming] = useState(null);
  // The regimens that have finished stay out of the way until they are asked for.
  const [showPast, setShowPast] = useState(false);

  const openNew = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (m) => { setEditing(m); setModalOpen(true); };

  // What is being taken now comes first; paused, stopped and archived regimens
  // sit together underneath. A regimen saved before statuses existed counts as
  // active.
  const activeMeds = useMemo(
    () => medications.filter((m) => (m.status || "active") === "active"),
    [medications]
  );
  const pastMeds = useMemo(
    () => medications.filter((m) => (m.status || "active") !== "active"),
    [medications]
  );

  // A medication that has shot logs is archived, never removed: the history it
  // belongs to stays exactly where it is. Only a medication with no logs can be
  // deleted for good.
  const requestDelete = (m) => {
    const count = shotsOfMedication(shots, m).length;
    setConfirming({ medication: m, archive: count > 0, count });
  };

  // The dialog keeps its spinner up while the change is written, then closes on
  // success — the toast is the confirmation that it landed.
  const handleConfirm = async () => {
    const target = confirming;
    if (!target) return;
    if (target.archive) {
      await archiveMedication(target.medication.id);
      toast.success(`${target.medication.medication_name} archived — your shot history is kept`);
    } else {
      await deleteMedication(target.medication.id);
      toast.deleted("Medication removed");
    }
    setConfirming(null);
  };

  return (
    <PageContainer bottomInset="fab" disclaimer>
      <div className="sticky top-0 z-30 bg-white dark:bg-gray-950 w-full flex items-center justify-between px-5 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Medications</h1>
        <Link to="/settings" aria-label="Settings" className={HEADER_ICON}>
          <Settings size={HEADER_GLYPH} aria-hidden="true" />
        </Link>
      </div>

      <div className="max-w-3xl mx-auto pt-4 px-4">
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
                <MedicationListCard key={m.id} medication={m} onEdit={openEdit} onDelete={requestDelete} />
              ))}
              {activeMeds.length === 0 && (
                <p className="text-sm text-gray-400 dark:text-gray-500 px-1">
                  Nothing active right now — everything below has been paused or stopped.
                </p>
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
                      <MedicationListCard key={m.id} medication={m} onEdit={openEdit} onDelete={requestDelete} />
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
        tone={confirming?.archive ? "neutral" : "destructive"}
        icon={confirming?.archive ? Archive : undefined}
        title={confirming?.archive ? "Archive this medication?" : "Delete this medication?"}
        message={confirming
          ? (confirming.archive
            ? <><strong className="font-semibold text-gray-900 dark:text-white">{confirming.medication.medication_name}</strong> will stop appearing on your schedule and in your shot pickers. Your {confirming.count} shot log{confirming.count === 1 ? "" : "s"} stay in your history.</>
            : <><strong className="font-semibold text-gray-900 dark:text-white">{confirming.medication.medication_name}</strong> has no shot logs, so nothing else is affected.</>)
          : undefined}
        confirmLabel={confirming?.archive ? "Archive" : "Delete"}
        cancelLabel={confirming?.archive ? "Keep active" : "Keep it"}
        onConfirm={handleConfirm}
        onCancel={() => setConfirming(null)}
      />
    </PageContainer>
  );
}