import React from "react";
import { Phone, ScreenHead, Card, Label, UI } from "@/components/brand/mocks/ui";

/** Meds: the regimens in hand, how each one runs, and what is next. */
export default function MedsMock() {
  return (
    <Phone tab="More">
      <ScreenHead title="Meds" subtitle="2 active regimens" />

      <Card className="px-[14px] py-[13px]">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[15px] font-bold">Ozempic®</p>
            <p className="text-[11px]" style={{ color: UI.muted }}>Semaglutide · subcutaneous</p>
          </div>
          <span className="rounded-full px-[9px] py-[3px] text-[10px] font-semibold" style={{ background: "#ECFDF5", color: "#0F766E" }}>
            Active
          </span>
        </div>
        <div className="mt-[12px] grid grid-cols-2 gap-[10px] text-[12px]">
          <div>
            <Label>Dose</Label>
            <p className="mt-[3px] font-semibold">0.5 → 1 mg</p>
          </div>
          <div>
            <Label>Schedule</Label>
            <p className="mt-[3px] font-semibold">Weekly · Thursday</p>
          </div>
          <div>
            <Label>Reminder</Label>
            <p className="mt-[3px] font-semibold">20:00</p>
          </div>
          <div>
            <Label>Started</Label>
            <p className="mt-[3px] font-semibold">1 May 2026</p>
          </div>
        </div>
      </Card>

      <Card className="mt-[12px] px-[14px] py-[13px]">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[15px] font-bold">Wegovy® tablet</p>
            <p className="text-[11px]" style={{ color: UI.muted }}>Semaglutide · oral tablet</p>
          </div>
          <span className="rounded-full px-[9px] py-[3px] text-[10px] font-semibold" style={{ background: "#ECFDF5", color: "#0F766E" }}>
            Active
          </span>
        </div>
        <div className="mt-[12px] grid grid-cols-2 gap-[10px] text-[12px]">
          <div>
            <Label>Dose</Label>
            <p className="mt-[3px] font-semibold">4 mg</p>
          </div>
          <div>
            <Label>Schedule</Label>
            <p className="mt-[3px] font-semibold">Once daily · 08:00</p>
          </div>
        </div>
      </Card>

      <Card className="mt-[12px] px-[14px] py-[12px]" style={{ background: UI.surface }}>
        <Label>Repeat schedule</Label>
        <p className="mt-[4px] text-[12px] font-medium">1 mg every Thursday for 12 weeks</p>
        <div className="mt-[8px] h-[7px] w-full overflow-hidden rounded-full bg-white">
          <div className="h-full rounded-full" style={{ width: "58%", background: UI.indigo }} />
        </div>
        <p className="mt-[6px] text-[11px]" style={{ color: UI.muted }}>7 of 12 confirmed · next 13 Nov</p>
      </Card>

      <p className="mt-[12px] text-[11px]" style={{ color: UI.muted }}>
        Doses, schedules and reminders are yours to set, exactly as your prescriber gave them.
      </p>
    </Phone>
  );
}