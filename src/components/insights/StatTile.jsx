import React from "react";
import IonIcon from "@/components/IonIcon";

/**
 * One stat tile inside an Insights card — "Weight Loss", "Journey Days",
 * "Steady state reached".
 *
 * Every tile is drawn the same way: a soft tinted surface on the shared
 * hairline, then one filled icon, a small label, and the value. The icon sits in
 * a fixed box of its own and the label and value carry fixed spacing, so four
 * tiles side by side always line up — whatever the icon, and whatever the length
 * of the value — instead of each tile finding its own vertical rhythm.
 *
 * The tint is chosen by name from the map below, so no caller writes colours of
 * its own and a new tile cannot drift from the others.
 */
const TONES = {
  teal: {
    box: "bg-teal-50 dark:bg-teal-500/10 border-teal-100 dark:border-teal-500/15",
    icon: "text-teal-500 dark:text-teal-400",
    value: "text-teal-600 dark:text-teal-400",
  },
  indigo: {
    box: "bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/15",
    icon: "text-indigo-500 dark:text-indigo-400",
    value: "text-indigo-600 dark:text-indigo-400",
  },
  purple: {
    box: "bg-purple-50 dark:bg-purple-500/10 border-purple-100 dark:border-purple-500/15",
    icon: "text-purple-500 dark:text-purple-400",
    value: "text-purple-600 dark:text-purple-400",
  },
  orange: {
    box: "bg-orange-50 dark:bg-orange-500/10 border-orange-100 dark:border-orange-500/15",
    icon: "text-orange-500 dark:text-orange-400",
    value: "text-orange-600 dark:text-orange-400",
  },
};

export default function StatTile({ icon, label, value, note, tone = "indigo" }) {
  const t = TONES[tone] || TONES.indigo;
  return (
    <div className={`min-w-0 rounded-2xl border p-3 text-center ${t.box}`}>
      {icon && (
        <span className="mx-auto mb-1.5 flex h-5 items-center justify-center">
          <IonIcon name={icon} size={16} className={t.icon} />
        </span>
      )}
      {label && <p className="text-[11px] leading-tight text-gray-500 dark:text-[#9A9DAE]">{label}</p>}
      <p className={`mt-0.5 text-sm font-bold ${t.value}`}>{value}</p>
      {note && <p className="mt-0.5 text-[11px] leading-snug text-gray-500 dark:text-[#9A9DAE]">{note}</p>}
    </div>
  );
}