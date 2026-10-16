import React from "react";
import { medicationFacts } from "@/lib/medicationGroups";

/**
 * What is known about the medication in hand, in three short lines: how it is
 * taken, its usual schedule and the strengths its own label lists.
 *
 * A line is left out when there is nothing to say — a compounded product carries
 * no strength list, a research peptide carries no schedule — and a name Levli
 * holds nothing for shows no card at all rather than an empty one.
 */
export default function MedicationInfoCard({ name }) {
  const facts = medicationFacts(name);
  if (!facts) return null;

  const lines = [
    ["Type", facts.type],
    ["Usual schedule", facts.schedule],
    ["Strengths", facts.strengths],
  ].filter(([, value]) => value);

  if (!lines.length) return null;

  return (
    <div className="rounded-2xl border border-gray-100 px-3.5 py-3 dark:border-white/[0.08]">
      <dl className="space-y-1">
        {lines.map(([label, value]) => (
          <div key={label} className="flex gap-2 text-[13px] leading-snug">
            <dt className="shrink-0 text-gray-400 dark:text-gray-500">{label}</dt>
            <dd className="min-w-0 font-medium text-gray-900 dark:text-[#E8E9F0]">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}