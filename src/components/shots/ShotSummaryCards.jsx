import React from "react";
import { Syringe, Clock, CalendarCheck, ClipboardCheck } from "lucide-react";
import DoseBadge from "@/components/DoseBadge";
import { daysAgoLabel } from "@/lib/dateUtils";

/**
 * The Shots screen's summary, drawn as the same tile Home uses: one 2xl card on
 * the shared hairline, a 36px round icon, a 12px label under it and the value at
 * the foot of the tile — so every tile is the same height and the row lines up.
 *
 * Total, last dose and the next date are always shown; adherence joins them once
 * there is a window to measure. On phones the tiles sit two across and the last
 * one takes the whole width when it would otherwise be left alone on its own
 * row; from 600px — the width Home's own grid switches at — they share a single
 * row, so no tile is ever half-width by itself.
 */
const TILE = "bg-white dark:bg-gray-900 rounded-2xl p-3 shadow-sm card-line min-h-[112px] flex flex-col";
const VALUE = "text-xl font-bold text-gray-900 dark:text-[#E8E9F0] leading-tight tabular-nums";
const SUB = "text-xs text-gray-400 dark:text-[#9A9DAE]";

function Tile({ icon, tint, label, className = "", children }) {
  return (
    <div className={`${TILE} ${className}`}>
      <span className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${tint}`} aria-hidden="true">
        {icon}
      </span>
      <span className="text-xs font-medium text-gray-600 dark:text-[#9A9DAE] leading-tight mt-1">{label}</span>
      <div className="mt-auto">{children}</div>
    </div>
  );
}

export default function ShotSummaryCards({
  totalShots, last, nextDate, nextDaysLeft, nextOverdue, adherence, adherenceRange, words,
}) {
  const cards = [
    {
      key: "total",
      label: `Total ${words.many}`,
      tint: "bg-indigo-100 dark:bg-indigo-500/10",
      icon: <Syringe size={20} strokeWidth={2} className="text-indigo-600 dark:text-indigo-400" />,
      value: <p className={VALUE}>{totalShots}</p>,
    },
    {
      key: "last",
      label: "Last Dose",
      tint: "bg-amber-100 dark:bg-amber-500/10",
      icon: <Clock size={20} strokeWidth={2} className="text-amber-500 dark:text-amber-400" />,
      value: last ? (
        <>
          <DoseBadge medication={last.medication} dose={last.dose} unit={last.dose_unit || "mg"} />
          <p className={`${SUB} mt-1`}>{daysAgoLabel(last.date)}</p>
        </>
      ) : <p className="text-sm text-gray-400 dark:text-[#9A9DAE]">No {words.many} yet</p>,
    },
    {
      key: "next",
      label: `${nextOverdue ? `${words.One} was due` : `Next ${words.One}`}`,
      tint: "bg-teal-100 dark:bg-teal-500/10",
      icon: <CalendarCheck size={20} strokeWidth={2} className="text-teal-600 dark:text-teal-400" />,
      value: nextDate ? (
        <>
          <p className={VALUE}>{nextDate}</p>
          {nextOverdue && <p className={`${SUB} mt-0.5`}>{Math.abs(nextDaysLeft)} days ago</p>}
        </>
      ) : <p className={VALUE}>—</p>,
    },
    ...(adherence.adherencePct != null ? [{
      key: "adherence",
      label: "Adherence",
      tint: "bg-indigo-100 dark:bg-indigo-500/10",
      icon: <ClipboardCheck size={20} strokeWidth={2} className="text-indigo-600 dark:text-indigo-400" />,
      value: (
        <>
          <p className={VALUE}>{adherence.adherencePct}%</p>
          <p className={`${SUB} mt-0.5`}>{adherence.logged} of {adherence.scheduled} doses</p>
          {adherenceRange && <p className="text-[11px] text-gray-400 dark:text-[#9A9DAE]">{adherenceRange}</p>}
        </>
      ),
    }] : []),
  ];

  // An odd count leaves the last tile alone on its row on phones, so it takes
  // the whole width instead of half of it.
  const odd = cards.length % 2 === 1;

  return (
    <div className="mb-5 px-4">
      <div className={`grid grid-cols-2 gap-3 ${cards.length > 3 ? "min-[600px]:grid-cols-4" : "min-[600px]:grid-cols-3"}`}>
        {cards.map((c, i) => (
          <Tile
            key={c.key}
            icon={c.icon}
            tint={c.tint}
            label={c.label}
            className={odd && i === cards.length - 1 ? "col-span-2 min-[600px]:col-span-1" : ""}
          >
            {c.value}
          </Tile>
        ))}
      </div>
    </div>
  );
}