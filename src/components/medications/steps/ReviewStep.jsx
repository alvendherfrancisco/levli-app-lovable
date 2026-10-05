import React from "react";
import { ClipboardCheck } from "lucide-react";
import StepHelp from "@/components/medications/StepHelp";
import { helperCls, stepHeadingCls } from "@/components/medications/formStyles";
import { summariseRegimen, plainDateLabel, statusOptionsFor } from "@/lib/medicationRegimen";

/** Step 5 — the plain-language summary, then Save or Go back and change. */
export default function ReviewStep({
  option, isCustom, customName, dose, unit, schedule, scheduleOther, startDate, endDate,
  status, indication, indicationOther, prescriberName, prescriberContact, doseStep, notes,
}) {
  const summary = summariseRegimen({ option, isCustom, customName, dose, unit, schedule, scheduleOther, startDate });
  const statusLabel = statusOptionsFor(status).find((s) => s.value === status)?.label || "";

  const rows = [
    { label: "First dose date", value: plainDateLabel(startDate) },
    { label: "Stop date", value: plainDateLabel(endDate) },
    { label: "Status", value: statusLabel },
    { label: "Why you take it", value: indication === "Other" ? indicationOther.trim() : indication },
    { label: "Doctor", value: [prescriberName, prescriberContact].filter(Boolean).join(" · ") },
    { label: "Dose step", value: doseStep },
    { label: "Notes", value: notes },
  ].filter((r) => r.value);

  return (
    <div>
      <h2 className={stepHeadingCls}>Check and save</h2>
      <p className={`${helperCls} mt-2`}>Here's what will be saved.</p>
      <StepHelp text="Look at the card below. If something is wrong, tap “Go back and change” and fix it. If it all looks right, tap “Save medication”." />

      <div className="mt-5 flex items-start gap-3 rounded-2xl border-2 border-indigo-300 dark:border-indigo-400/50 bg-indigo-50 dark:bg-indigo-500/15 px-4 py-5">
        <ClipboardCheck size={28} className="flex-shrink-0 text-indigo-700 dark:text-indigo-300" aria-hidden="true" />
        <p className="text-xl font-bold text-gray-900 dark:text-white leading-snug">{summary}</p>
      </div>

      {rows.length > 0 && (
        <dl className="mt-5 space-y-4">
          {rows.map((r) => (
            <div key={r.label} className="rounded-2xl bg-gray-100 dark:bg-white/[0.08] px-4 py-3.5">
              <dt className="text-lg font-semibold text-gray-700 dark:text-gray-200">{r.label}</dt>
              <dd className="text-xl text-gray-900 dark:text-white mt-1 [overflow-wrap:anywhere]">{r.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}