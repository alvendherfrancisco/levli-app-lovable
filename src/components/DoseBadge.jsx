import React from "react";
import { getDoseStyle } from "@/lib/doseColors";
import { DOSE_UNIT } from "@/lib/doseOptions";

/**
 * The filled dose badge used on every card: the dose's own colour with
 * automatic white or dark text for contrast.
 */
export default function DoseBadge({ medication, dose, unit = DOSE_UNIT, className = "" }) {
  if (dose == null || dose === "") return null;
  return (
    <span
      className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-bold whitespace-nowrap flex-shrink-0 ${className}`}
      style={getDoseStyle(medication, dose)}
    >
      {dose} {unit}
    </span>
  );
}