import React, { useState } from "react";
import { Download, Upload, Loader2 } from "lucide-react";
import ScreenHeader from "@/components/ScreenHeader";
import SettingsRow from "@/components/SettingsRow";
import { ICON_SIZE_ROW } from "@/lib/iconConstants";
import { useAppState } from "@/lib/AppState";
import { base44 } from "@/api/base44Client";
import { toast } from "@/lib/toast";

/** Backup and restore of the account's own log, in one place. */
export default function BackupRestorePage() {
  const { profile, setProfile, shots, journalEntries, dayMetrics } = useAppState();
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);

  const handleBackup = () => {
    setBackupLoading(true);
    const data = { shots, journalEntries, dayMetrics, profile, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `levli-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click(); URL.revokeObjectURL(url);
    setBackupLoading(false);
  };

  const handleRestore = async () => {
    const input = document.createElement("input");
    input.type = "file"; input.accept = ".json";
    input.onchange = async (e) => {
      setRestoreLoading(true);
      const file = e.target.files[0];
      if (!file) { setRestoreLoading(false); return; }
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (data.profile) await setProfile({ ...profile, ...data.profile });
        // Restore shots
        if (data.shots && Array.isArray(data.shots) && data.shots.length) {
          await base44.entities.Shot.bulkCreate(data.shots.map((s) => ({
            medication: s.medication, dose: s.dose, drug_class: s.drug_class, molecular_class: s.molecular_class,
            route: s.route, device_type: s.device_type, dose_unit: s.dose_unit, medication_id: s.medication_id,
            concentration: s.concentration,
            date: s.date, time: s.time, site: s.site, pain: s.pain, notes: s.notes,
            reconstitution_date: s.reconstitution_date, in_use_expiry: s.in_use_expiry,
          })));
        }
        // Restore journal entries
        if (data.journalEntries && Array.isArray(data.journalEntries) && data.journalEntries.length) {
          await base44.entities.JournalEntry.bulkCreate(data.journalEntries.map((j) => ({
            text: j.text, date: j.date, time: j.time, mood: j.mood, mood_color: j.mood_color, category: j.category,
          })));
        }
        toast.success("Restore complete. Please reload the app to see your restored data.");
      } catch (err) {
        toast.error("Restore failed: " + (err.message || "invalid file"));
      }
      setRestoreLoading(false);
    };
    input.click();
  };

  return (
    <div className="bg-white dark:bg-gray-950 min-h-screen w-full">
      <ScreenHeader title="Backup &amp; restore" />

      <div className="max-w-lg mx-auto pt-4">
        <div className="px-4 mb-4">
          <p className="text-xs text-gray-500 dark:text-[#9A9DAE] leading-relaxed px-1 mb-3">
            A backup is a file holding your doses, daily metrics, journal entries and profile. Keep it
            somewhere safe and you can put everything back later.
          </p>
          <div className="bg-white dark:bg-gray-900 rounded-2xl px-4 shadow-sm border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-white/[0.07]">
            <SettingsRow
              icon={backupLoading
                ? <Loader2 size={ICON_SIZE_ROW} className="animate-spin text-gray-400" />
                : <Download size={ICON_SIZE_ROW} className="text-gray-500 dark:text-gray-400" />}
              label="Backup data"
              hint="A file you can restore later"
              onPress={handleBackup}
            />
            <SettingsRow
              icon={restoreLoading
                ? <Loader2 size={ICON_SIZE_ROW} className="animate-spin text-gray-400" />
                : <Upload size={ICON_SIZE_ROW} className="text-gray-500 dark:text-gray-400" />}
              label="Restore data"
              hint="Load a backup file you saved earlier"
              onPress={handleRestore}
            />
          </div>
        </div>
      </div>
    </div>
  );
}