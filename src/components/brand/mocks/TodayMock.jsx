import React from "react";
import { ChevronRight, Plus } from "lucide-react";
import { Phone, ScreenHead, Card, Label, PillButton, Stat, UI } from "@/components/brand/mocks/ui";

const DAYS = [
  { d: "S", n: 11 },
  { d: "M", n: 12 },
  { d: "T", n: 13 },
  { d: "W", n: 14 },
  { d: "T", n: 15 },
  { d: "F", n: 16 },
  { d: "S", n: 17 },
];

/** Home: today's date strip, the next dose, and the day's numbers. */
export default function TodayMock() {
  return (
    <Phone tab="Home">
      <ScreenHead title="Good morning, Amer" subtitle="Monday, 12 October" />

      <div className="flex justify-between">
        {DAYS.map((day) => {
          const on = day.n === 12;
          return (
            <div key={day.n} className="flex flex-col items-center gap-[4px]">
              <span className="text-[10px] font-medium" style={{ color: on ? UI.indigo : UI.faint }}>{day.d}</span>
              <span
                className="flex h-[38px] w-[38px] items-center justify-center rounded-[14px] text-[14px] font-semibold"
                style={on
                  ? { background: UI.indigo, color: "#FFFFFF", boxShadow: "0 8px 18px -8px rgba(79,70,229,0.7)" }
                  : { background: "#FFFFFF", border: `1px solid ${UI.line}`, color: UI.ink }}
              >
                {day.n}
              </span>
              {day.n === 13 ? <span className="h-[5px] w-[5px] rounded-full" style={{ background: UI.indigo }} /> : <span className="h-[5px]" />}
            </div>
          );
        })}
      </div>

      <Card className="mt-[14px] p-[14px]" style={{ background: UI.tint, borderColor: "#DCE1FB" }}>
        <div className="flex items-center justify-between">
          <Label>Next dose</Label>
          <span className="text-[11px] font-semibold" style={{ color: UI.indigo }}>In 2 days</span>
        </div>
        <p className="mt-[6px] text-[17px] font-bold">Ozempic® 1 mg</p>
        <p className="text-[12px]" style={{ color: UI.body }}>Thursday 13 November · suggested site: right thigh</p>
        <div className="mt-[12px]">
          <PillButton block>Log shot</PillButton>
        </div>
      </Card>

      <div className="mt-[14px] grid grid-cols-2 gap-[10px]">
        <Stat label="Weight" value="82.4 kg" hint="-6.1 kg since May" />
        <Stat label="Calories" value="1,480" hint="of 2,000 today" />
        <Stat label="Protein" value="96 g" hint="target 120 g" />
        <Stat label="Water" value="1.6 L" hint="of 2.5 L" />
      </div>

      <Card className="mt-[14px] flex items-center justify-between px-[14px] py-[12px]">
        <div>
          <p className="text-[13px] font-semibold">8 doses logged</p>
          <p className="text-[11px]" style={{ color: UI.muted }}>100% on time · next repeat in 12 weeks</p>
        </div>
        <ChevronRight size={18} style={{ color: UI.faint }} />
      </Card>

      <div className="mt-[12px] flex items-center gap-[8px] text-[12px]" style={{ color: UI.indigo }}>
        <Plus size={15} strokeWidth={2.6} />
        <span className="font-medium">Add weight, food or a symptom</span>
      </div>
    </Phone>
  );
}