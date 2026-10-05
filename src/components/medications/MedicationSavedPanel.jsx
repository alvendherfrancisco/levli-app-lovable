import React from "react";
import { CheckCircle2 } from "lucide-react";
import { helperCls } from "@/components/medications/formStyles";

/** The confirmation shown once the medication has been saved. */
export default function MedicationSavedPanel({ editing, summary, linkedCount }) {
  return (
    <div className="px-5 pb-6 pt-4 flex flex-col items-center text-center">
      <CheckCircle2 size={64} className="text-indigo-600 dark:text-indigo-400" strokeWidth={1.5} aria-hidden="true" />
      <h2 className="text-[1.625rem] font-bold text-gray-900 dark:text-white mt-4">
        {editing ? "Medication updated" : "Medication saved"}
      </h2>
      <p className="text-xl text-gray-900 dark:text-white mt-3 leading-snug">{summary}</p>
      {linkedCount > 0 && (
        <p className={`${helperCls} mt-3`}>
          {linkedCount} shot log{linkedCount === 1 ? "" : "s"} linked to this medication.
        </p>
      )}
      <p className={`${helperCls} mt-4`}>You can change any of this later from My Medications.</p>
    </div>
  );
}