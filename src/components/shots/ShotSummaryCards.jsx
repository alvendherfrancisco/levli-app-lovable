import React from "react";
import { SyringeIcon, ClockIcon, CalendarCheckIcon } from "@/components/CustomIcons";
import IonIcon from "@/components/IonIcon";
import DoseBadge from "@/components/DoseBadge";
import { daysAgoLabel } from "@/lib/dateUtils";

/**
 * The Shots screen's summary, drawn as the same tile Home uses: one 2xl card on
 * the shared hairline, a round icon, a small label under it and the value at the
 * foot of the tile — so the tiles are the same width and the same height, and
 * their values line up across the row.
 *
 * Total, last dose and the next date always share one row, on a phone as well as
 * a wide screen. The tile is therefore sized for the narrowest screen the app
 * runs on — a 28px icon, an 11px label, a 13px value — so all three fit the
 * width of a phone without wrapping or overflowing.
 *
 * Adherence joins them once there is a window to measure. Four tiles then share
 * the row where four fit, and sit as a balanced pair of rows on a narrow phone
 * rather than squeezing the row past its own width.
 */
const TILE = "bg-white dark:bg-gray-900 rounded-2xl p-2 shadow-sm card-line h-full min-h-[84px] flex flex-col";
const VALUE = "text-[13px] font-bold text-gray-900 dark:text-[#E8E9F0] leading-tight tabular-nums";
const SUB = "text-[11px] leading-tight text-gray-400 dark:text-[#9A9DAE] truncate";

function Tile({ icon, tint, label, children }) {
  return (
    <div className={TILE}>
      <span className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${tint}`} aria-hidden="true">
        {icon}
      </span>
      <span className="mt-1 w-full truncate text-[11px] font-medium leading-tight text-gray-600 dark:text-[#9A9DAE]">{label}</span>
      <div className="mt-auto w-full min-w-0">{children}</div>
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
      icon: <SyringeIcon size={16} className="text-indigo-600 dark:text-indigo-400" />,
      value: <p className={VALUE}>{totalShots}</p>,
    },
    {
      key: "last",
      label: "Last Dose",
      tint: "bg-amber-100 dark:bg-amber-500/10",
      icon: <ClockIcon size={16} className="text-amber-500 dark:text-amber-400" />,
      value: last ? (
        <>
          <DoseBadge medication={last.medication} dose={last.dose} unit={last.dose_unit || "mg"} />
          <p className={`${SUB} mt-1`}>{daysAgoLabel(last.date)}</p>
        </>
      ) : <p className={`${SUB} mt-0.5`}>No {words.many} yet</p>,
    },
    {
      key: "next",
      label: nextOverdue ? `${words.One} was due` : `Next ${words.One}`,
      tint: "bg-teal-100 dark:bg-teal-500/10",
      icon: <CalendarCheckIcon size={16} className="text-teal-600 dark:text-teal-400" />,
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
      icon: <IonIcon name="clipboard" size={16} className="text-indigo-600 dark:text-indigo-400" />,
      value: (
        <>
          <p className={VALUE}>{adherence.adherencePct}%</p>
          <p className={`${SUB} mt-0.5`}>{adherence.logged} of {adherence.scheduled} doses</p>
          {adherenceRange && <p className="text-[10px] leading-tight text-gray-400 dark:text-[#9A9DAE] truncate">{adherenceRange}</p>}
        </>
      ),
    }] : []),
  ];

  return (
    <div className="mb-4 px-4">
      <div className={`grid gap-2 ${cards.length > 3 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"}`}>
        {cards.map((c) => (
          <Tile key={c.key} icon={c.icon} tint={c.tint} label={c.label}>
            {c.value}
          </Tile>
        ))}
      </div>
    </div>
  );
}