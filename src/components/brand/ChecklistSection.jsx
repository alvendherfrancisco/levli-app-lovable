import React from "react";
import { AlertTriangle } from "lucide-react";
import { CHECKLIST } from "@/lib/storeAssets";

/** What App Store Connect asks for, and what each answer is. */
export default function ChecklistSection() {
  return (
    <div className="rounded-2xl border border-cardline bg-white dark:bg-[#0f1117]">
      {CHECKLIST.map((row, i) => (
        <div
          key={row.label}
          className={`flex flex-col gap-1 p-4 sm:flex-row sm:gap-4 ${i ? "border-t border-cardline" : ""} ${row.warn ? "bg-amber-50 dark:bg-amber-500/10" : ""}`}
        >
          <p className="w-40 shrink-0 text-sm font-semibold">{row.label}</p>
          <div className="min-w-0">
            <p className={`text-sm ${row.warn ? "text-amber-800 dark:text-amber-200" : "text-muted-foreground"}`}>{row.value}</p>
            {row.warn ? (
              <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
                <AlertTriangle size={13} /> {row.warn}
              </p>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}