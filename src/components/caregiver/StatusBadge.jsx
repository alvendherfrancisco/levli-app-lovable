import React from "react";

/** One small badge per state: waiting is amber, active is green, and a finished
 *  one is neutral. */
const TONE = {
  pending: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  active: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
};

const LABEL = { pending: "Pending", active: "Active" };

export default function StatusBadge({ status }) {
  const tone = TONE[status] || TONE.pending;
  return (
    <span className={`inline-flex flex-shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone}`}>
      {LABEL[status] || LABEL.pending}
    </span>
  );
}