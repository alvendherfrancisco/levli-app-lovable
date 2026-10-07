import React from "react";

/**
 * A product name with its registered-trademark mark shown as a small raised
 * sign — "Ozempic" with a superscript ®.
 *
 * The mark is only ever a display detail: the name a record stores, the name
 * that is matched and searched, and the name a report prints are all the stored
 * name itself (see src/lib/medicationConfig.js — displayBrandName vs
 * plainBrandName). Nothing here changes what is saved or found, only how it
 * reads on screen. A name with no mark, or a name the user typed themselves,
 * renders exactly as it was given.
 */
export default function MedicationName({ name = "", className = "" }) {
  const text = String(name ?? "");
  const match = text.match(/^(.*?)\s*([®™])\s*$/);
  if (!match) return <span className={className}>{text}</span>;
  return (
    <span className={className}>
      {match[1]}
      <sup className="ml-[0.1em] align-super text-[0.6em] font-semibold">{match[2]}</sup>
    </span>
  );
}