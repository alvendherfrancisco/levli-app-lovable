import React from "react";
import { getDoseStyle } from "@/lib/doseColors";
import { Phone, ScreenHead, Card, Stat, UI } from "@/components/brand/mocks/ui";

const SHOTS = [
  { date: "Thu 6 Nov", med: "Ozempic®", dose: 1, site: "Left thigh", time: "20:10" },
  { date: "Thu 30 Oct", med: "Ozempic®", dose: 1, site: "Stomach, lower right", time: "19:45" },
  { date: "Thu 23 Oct", med: "Ozempic®", dose: 0.5, site: "Right thigh", time: "20:20" },
  { date: "Thu 16 Oct", med: "Ozempic®", dose: 0.5, site: "Stomach, upper left", time: "18:55" },
  { date: "Thu 9 Oct", med: "Ozempic®", dose: 0.25, site: "Left upper arm", time: "20:05" },
];

/** Shots: the dose history, with the strength taken on every row. */
export default function ShotsMock() {
  return (
    <Phone tab="Shots">
      <ScreenHead title="Shots" subtitle="42 logged since 1 May" />

      <div className="grid grid-cols-3 gap-[8px]">
        <Stat label="On time" value="96%" />
        <Stat label="This month" value="4" />
        <Stat label="Avg gap" value="7.0 d" />
      </div>

      <Card className="mt-[14px] overflow-hidden">
        {SHOTS.map((shot, i) => {
          const chip = getDoseStyle(shot.med, shot.dose);
          return (
            <div
              key={shot.date}
              className="flex items-center justify-between px-[14px] py-[11px]"
              style={i ? { borderTop: `1px solid ${UI.line}` } : undefined}
            >
              <div className="min-w-0">
                <p className="text-[13px] font-semibold">{shot.date}</p>
                <p className="truncate text-[11px]" style={{ color: UI.muted }}>
                  {shot.med} · {shot.site} · {shot.time}
                </p>
              </div>
              <span
                className="rounded-[9px] px-[9px] py-[4px] text-[12px] font-bold"
                style={{ background: chip.background, color: chip.color }}
              >
                {shot.dose} mg
              </span>
            </div>
          );
        })}
      </Card>

      <p className="mt-[12px] text-[11px]" style={{ color: UI.muted }}>
        Every dose is kept, with its site and its notes — export it all whenever you like.
      </p>
    </Phone>
  );
}