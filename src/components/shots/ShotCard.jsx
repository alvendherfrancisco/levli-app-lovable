import React from "react";
import { Syringe, MapPin, Calendar, Activity, AlertTriangle } from "lucide-react";
import DoseBadge from "@/components/DoseBadge";
import { needsDoseCheck, plainBrandName } from "@/lib/medicationConfig";

export default function ShotCard({ medication, dose, dose_unit, dose_source, drugClass, drug_class, date, time, site, pain }) {
  const dc = drugClass || drug_class || "GLP-1";
  const unit = dose_unit || "mg";
  // A dose the label does not list for this medication is flagged, never hidden
  // or deleted: the entry stays exactly as logged and the user can fix the
  // medication or the dose (the card is tapped to open the editor).
  const doseNotListed = needsDoseCheck({ medication, dose, dose_source });
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden w-full box-border">
      <div className="flex items-start gap-3 w-full min-w-0">
        {/* Icon */}
        <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-transparent flex items-center justify-center flex-shrink-0"
          style={{ minWidth: 40, background: "rgba(20,184,166,0.13)" }}
        >
          <Syringe size={18} className="text-teal-500 dark:text-teal-400" />
        </div>
        {/* Text content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900 dark:text-[#E8E9F0] truncate min-w-0">{medication}</span>
            <DoseBadge medication={medication} dose={dose} unit={unit} />
            {doseNotListed && (
              <span className="text-xs px-2 py-0.5 rounded-lg font-semibold whitespace-nowrap flex-shrink-0 bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300 flex items-center gap-1">
                <AlertTriangle size={11} className="flex-shrink-0" /> Check this entry
              </span>
            )}
            {/* Drug class badge: solid teal in light, low-opacity tint in dark */}
            <span className="text-xs px-2 py-0.5 rounded-lg font-medium whitespace-nowrap flex-shrink-0 bg-teal-100 text-teal-700 dark:text-teal-400 dark:border dark:border-teal-500/20 dark:bg-transparent">
              {dc}
            </span>
          </div>
          <div className="flex items-center gap-1 mt-1 text-sm text-gray-400 min-w-0">
            <Calendar size={12} className="flex-shrink-0" />
            <span className="truncate">{date} · {time}</span>
          </div>
          <div className="flex items-center gap-3 mt-1 min-w-0">
            <div className="flex items-center gap-1 text-sm text-gray-400 min-w-0">
              <MapPin size={12} className="flex-shrink-0" />
              <span className="truncate">{site}</span>
            </div>
            {pain > 0 && (
              <span className={`text-xs font-medium flex-shrink-0 flex items-center gap-0.5 ${pain >= 5 ? "text-red-500" : "text-yellow-600"}`}>
                <Activity size={11} className="flex-shrink-0" /> Pain: {pain}
              </span>
            )}
          </div>
          {doseNotListed && (
            <p className="text-[11px] text-orange-600 dark:text-orange-300 mt-1.5">
              This dose isn't listed for {plainBrandName(medication)}. Tap to change the medication or the dose.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}