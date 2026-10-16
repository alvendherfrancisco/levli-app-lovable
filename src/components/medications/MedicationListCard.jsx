import React from "react";
import { MoreHorizontal, Archive, Trash2, RotateCcw } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** "7.5 mg · once weekly" — the one line the card carries under the name. */
function regimenLine(m) {
  const dose = m.prescribed_dose != null ? `${m.prescribed_dose} ${m.dose_unit || "mg"}` : "";
  return [dose, m.frequency || ""].filter(Boolean).join(" · ");
}

/**
 * One medication in the list: its name, the dose and frequency it runs at, and
 * "Needs details" while its schedule is still to come. Being active is the
 * ordinary state, so it is not announced on the card.
 *
 * Tapping the card opens the medication. The ⋯ beside it holds the two things
 * that decide what happens to it: Archive, which hides the regimen and keeps
 * every record, and Delete, which removes it and everything belonging to it. On
 * an archived card the ⋯ holds Delete alone, and Restore sits on the card itself.
 */
export default function MedicationListCard({ medication: m, onOpen, onArchive, onDelete, onRestore }) {
  const line = regimenLine(m);
  const archived = !!onRestore;

  return (
    <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
      <button type="button" onClick={() => onOpen(m)} className="w-full text-left p-4 pr-14 rounded-2xl">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-gray-900 dark:text-white text-base break-words">{m.medication_name}</span>
          {m.needs_details && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap flex-shrink-0 bg-orange-100 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400">
              Needs details
            </span>
          )}
        </div>
        {line && <p className="text-sm text-gray-500 dark:text-[#9A9DAE] mt-1">{line}</p>}
      </button>

      <div className="absolute top-1.5 right-1.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`Archive or delete ${m.medication_name}`}
              className="w-11 h-11 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <MoreHorizontal size={20} aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            {onArchive && !archived && (
              <DropdownMenuItem onSelect={() => onArchive(m)}>
                <Archive size={16} className="mr-2" aria-hidden="true" /> Archive
              </DropdownMenuItem>
            )}
            {onDelete && (
              <DropdownMenuItem
                onSelect={() => onDelete(m)}
                className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
              >
                <Trash2 size={16} className="mr-2" aria-hidden="true" /> Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {archived && (
        <div className="px-4 pb-4">
          <button type="button" onClick={() => onRestore(m)} className="btn-pill btn-pill-sm btn-secondary w-full">
            <RotateCcw size={15} aria-hidden="true" /> Restore
          </button>
        </div>
      )}
    </div>
  );
}