import React, { useState } from "react";
import { Link2, Pill } from "lucide-react";
import { useAppState } from "@/lib/AppState";
import { getMedicationConfig, getIntervalDays, plainBrandName } from "@/lib/medicationConfig";
import { toast } from "@/lib/toast";

/**
 * When shot logs exist but Meds is empty, the medication is drafted from the
 * most recent shot and the user is asked to confirm it. Confirming creates the
 * Medication record and links every matching shot log to it.
 */
export default function LinkShotsToMedsCard() {
  const { shots, medications, addMedication, linkShotsToMedication } = useAppState();
  const [saving, setSaving] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const latest = shots[0] || null;
  if (dismissed || medications.length > 0 || !latest?.medication) return null;

  const entry = getMedicationConfig(latest.medication);
  const interval = getIntervalDays(latest.medication);
  const frequency = interval === 7 ? "once weekly" : interval === 1 ? "once daily" : "";
  const logCount = shots.filter((s) => s.medication === latest.medication).length;

  const confirm = async () => {
    setSaving(true);
    try {
      const rec = await addMedication({
        medication_name: latest.medication,
        prescribed_dose: latest.dose ?? null,
        dose_unit: latest.dose_unit || "mg",
        frequency,
        status: "active",
        regimen_source: "user-entered",
      });
      const linked = await linkShotsToMedication(latest.medication, rec.id);
      toast.success(
        linked
          ? `${plainBrandName(latest.medication)} added — ${linked} shot log${linked === 1 ? "" : "s"} linked`
          : `${plainBrandName(latest.medication)} added to your medications`
      );
    } catch (err) {
      toast.error("Could not add the medication");
    }
    setSaving(false);
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-indigo-100 dark:border-indigo-500/20 mb-5">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-500/15 flex items-center justify-center flex-shrink-0">
          <Link2 size={16} className="text-indigo-600 dark:text-indigo-400" />
        </div>
        <h3 className="font-bold text-gray-900 dark:text-white text-base">Add your medication</h3>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
        You have {logCount} shot log{logCount === 1 ? "" : "s"} but no saved medication. Add{" "}
        <span className="font-semibold">{plainBrandName(latest.medication)}</span>
        {latest.dose != null ? ` ${latest.dose} ${latest.dose_unit || "mg"}` : ""} to Meds?
        {" "}Levli will link your existing logs to it.
      </p>
      {entry?.indicationNote && (
        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2 flex items-start gap-1.5">
          <Pill size={12} className="mt-0.5 flex-shrink-0" />
          <span>{plainBrandName(latest.medication)} is used for: {entry.indicationNote}</span>
        </p>
      )}
      <div className="flex gap-2 mt-3">
        <button onClick={confirm} disabled={saving}
          className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm disabled:opacity-60">
          {saving ? "Adding…" : "Add to Meds"}
        </button>
        <button onClick={() => setDismissed(true)} disabled={saving}
          className="px-4 py-2.5 bg-gray-100 dark:bg-white/[0.07] text-gray-600 dark:text-gray-300 rounded-xl font-semibold text-sm">
          Not now
        </button>
      </div>
    </div>
  );
}