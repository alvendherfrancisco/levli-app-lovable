import React from "react";
import useDoseColors from "@/hooks/useDoseColors";
import { DOSE_UNIT } from "@/lib/doseOptions";

/**
 * The dose badge used on every card: the dose's own colour with automatic white
 * or dark text for contrast.
 *
 * A dose typed through "+ Other" — or one that belongs to a medication with no
 * colour system at all — is drawn as a neutral outline instead of a fill, so a
 * typed amount never looks like a labelled strength.
 */
export default function DoseBadge({ medication, dose, unit = DOSE_UNIT, className = "" }) {
  const { style } = useDoseColors();
  if (dose == null || dose === "") return null;
  const chip = style(medication, dose);
  const outlined = chip.background === "transparent";
  return (
    <span
      className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-bold whitespace-nowrap flex-shrink-0 ${outlined ? "border" : ""} ${className}`}
      style={chip}
    >
      {dose} {unit}
    </span>
  );
}