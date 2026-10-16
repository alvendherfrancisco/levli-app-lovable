import React from "react";
import { Pill, Calendar, User, Activity, ChevronRight, Trash2, Package } from "lucide-react";
import { supplyLeftText } from "@/lib/supplyTracking";

// The status a medication shows, in one place: a running regimen is teal, one
// the user paused is amber, one that has been stopped or archived is neutral,
// and a switched regimen is indigo.
const STATUS_COLORS = {
  active: "bg-teal-100 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400",
  paused: "bg-orange-100 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400",
  discontinued: "bg-gray-100 dark:bg-gray-500/10 text-gray-600 dark:text-gray-400",
  switched: "bg-indigo-100 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400",
  archived: "bg-gray-100 dark:bg-gray-500/10 text-gray-600 dark:text-gray-400",
};

/**
 * One medication on the Meds list. The card opens the form that edits it; the
 * bin beside it asks what to do with it (a medication with shot logs is archived
 * rather than removed, so its history stays where it is).
 */
export default function MedicationListCard({ medication: m, onEdit, onDelete }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
      <div className="flex items-start justify-between gap-2">
        <button onClick={() => onEdit(m)} className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-bold text-gray-900 dark:text-white text-base sm:text-lg break-words">{m.medication_name}</span>
            {m.status && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap flex-shrink-0 ${STATUS_COLORS[m.status] || STATUS_COLORS.active}`}>{m.status}</span>
            )}
            {/* Saved from a shot log, so its schedule is still to come: the card
                opens the form where it can be added. */}
            {m.needs_details && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap flex-shrink-0 bg-orange-100 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400">
                Needs details
              </span>
            )}
          </div>
          <div className="space-y-1 text-sm text-gray-500 dark:text-[#9A9DAE]">
            {m.prescribed_dose != null && (
              <div className="flex items-center gap-2"><Activity size={14} className="text-indigo-500" /> {m.prescribed_dose} {m.dose_unit || "mg"} · {m.frequency || "—"}</div>
            )}
            {/* How much is left, when the medication tracks its own supply. */}
            {supplyLeftText(m) && (
              <div className="flex items-center gap-2"><Package size={14} className="text-indigo-500" /> {supplyLeftText(m)}</div>
            )}
            {m.indication && <div className="flex items-center gap-2"><Pill size={14} className="text-indigo-500" /> {m.indication}</div>}
            {m.titration_stage && <div className="flex items-center gap-2"><Calendar size={14} className="text-orange-500" /> Stage: {m.titration_stage}</div>}
            {m.prescriber_name && <div className="flex items-center gap-2"><User size={14} className="text-gray-400" /> {m.prescriber_name}</div>}
          </div>
        </button>
        <div className="flex flex-col gap-2 items-end flex-shrink-0">
          <button onClick={() => onEdit(m)} aria-label={`Open ${m.medication_name}`} className="text-gray-400 hover:text-indigo-600"><ChevronRight size={20} /></button>
          <button onClick={() => onDelete(m)} aria-label="Remove or archive this medication" className="text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
        </div>
      </div>
    </div>
  );
}