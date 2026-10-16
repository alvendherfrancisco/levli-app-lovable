import React from "react";
import { Syringe, Pill, MapPin, AlertTriangle } from "lucide-react";
import DoseBadge from "@/components/DoseBadge";
import { needsDoseCheck } from "@/lib/medicationConfig";
import { logsAsDose } from "@/lib/medicationForm";

/**
 * A dose in the full history list: compact, one line of medication and dose,
 * the date under it, and where it was given below that.
 *
 * It carries no card of its own — the month it belongs to is the card (see
 * MonthSectionList) — so it is drawn as a row: nothing is dropped from a logged
 * entry, a dose the label does not list is still flagged, and a tablet still
 * says "Oral" rather than showing a site it never had.
 */
export default function ShotListRow({ shot, onOpen }) {
  const { medication, dose, dose_unit, route, date, time, site } = shot;
  const oral = logsAsDose(medication, { route });
  const Icon = oral ? Pill : Syringe;
  const flagged = needsDoseCheck({ medication, dose, dose_source: shot.dose_source });

  return (
    <button type="button" onClick={() => onOpen?.(shot)} className="w-full text-left px-4 py-3">
      <div className="flex items-start gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(20,184,166,0.13)" }}>
          <Icon size={16} className="text-teal-500 dark:text-teal-400" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="font-semibold text-gray-900 dark:text-[#E8E9F0] truncate min-w-0">{medication}</span>
            <DoseBadge medication={medication} dose={dose} unit={dose_unit || "mg"} />
            {oral && (
              <span className="text-xs px-2 py-0.5 rounded-lg font-medium whitespace-nowrap flex-shrink-0 bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                Oral
              </span>
            )}
            {flagged && (
              <AlertTriangle size={13} className="text-orange-500 flex-shrink-0" aria-label="Check this entry" />
            )}
          </div>

          <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">
            {date}{time ? ` · ${time}` : ""}
          </div>

          {!oral && (
            <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 mt-0.5 min-w-0">
              <MapPin size={11} className="flex-shrink-0" />
              <span className="truncate">{site || "No site logged"}</span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}