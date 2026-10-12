import React from "react";
import { CalendarDays, FileText, X } from "lucide-react";
import { Phone, Card, Label, PillButton, UI } from "@/components/brand/mocks/ui";

const ROWS = [
  { date: "6 Nov 2026", med: "Ozempic®", dose: "1 mg", site: "Left thigh" },
  { date: "30 Oct 2026", med: "Ozempic®", dose: "1 mg", site: "Stomach, lower right" },
  { date: "23 Oct 2026", med: "Ozempic®", dose: "0.5 mg", site: "Right thigh" },
  { date: "16 Oct 2026", med: "Ozempic®", dose: "0.5 mg", site: "Stomach, upper left" },
];

/** The clinician report: what the person hands over at an appointment. */
export default function ReportMock() {
  return (
    <Phone>
      <div className="flex items-center justify-between pb-[12px] pt-[4px]">
        <h2 className="text-[20px] font-semibold">Report</h2>
        <X size={19} style={{ color: UI.faint }} />
      </div>

      <Card className="px-[14px] py-[12px]">
        <div className="flex items-center gap-[8px]">
          <CalendarDays size={15} style={{ color: UI.indigo }} />
          <p className="text-[12px] font-semibold">1 May 2026 – 12 Oct 2026</p>
        </div>
        <div className="mt-[12px] grid grid-cols-3 gap-[8px] text-center">
          <div>
            <p className="text-[18px] font-bold">26</p>
            <p className="text-[10px]" style={{ color: UI.muted }}>Doses</p>
          </div>
          <div>
            <p className="text-[18px] font-bold">7.0 d</p>
            <p className="text-[10px]" style={{ color: UI.muted }}>Avg gap</p>
          </div>
          <div>
            <p className="text-[18px] font-bold" style={{ color: UI.teal }}>-6.1 kg</p>
            <p className="text-[10px]" style={{ color: UI.muted }}>Weight</p>
          </div>
        </div>
      </Card>

      <div className="mt-[12px]">
        <Label>Dose log</Label>
        <Card className="mt-[6px] overflow-hidden">
          <div className="flex px-[12px] py-[8px] text-[10px] font-semibold uppercase tracking-wide" style={{ background: UI.surface, color: UI.faint }}>
            <span className="w-[86px]">Date</span>
            <span className="flex-1">Medication</span>
            <span className="w-[54px] text-right">Dose</span>
          </div>
          {ROWS.map((row, i) => (
            <div
              key={row.date}
              className="flex items-center px-[12px] py-[9px] text-[11px]"
              style={i ? { borderTop: `1px solid ${UI.line}` } : undefined}
            >
              <span className="w-[86px]" style={{ color: UI.muted }}>{row.date}</span>
              <span className="flex-1 font-medium">{row.med}</span>
              <span className="w-[54px] text-right font-semibold">{row.dose}</span>
            </div>
          ))}
        </Card>
      </div>

      <div className="mt-[12px]">
        <Label>Weight</Label>
        <Card className="mt-[6px] px-[12px] py-[10px]">
          <div className="flex h-[46px] items-end gap-[4px]">
            {[38, 34, 30, 32, 26, 22, 20, 24, 17, 14, 12, 9].map((h, i) => (
              <div key={i} className="flex-1 rounded-t-[4px]" style={{ height: `${h + 12}px`, background: i === 11 ? UI.indigo : "#C7D2FE" }} />
            ))}
          </div>
          <p className="mt-[6px] text-[10px]" style={{ color: UI.muted }}>May to October · 88.5 kg to 82.4 kg</p>
        </Card>
      </div>

      <div className="mt-[12px] flex items-center gap-[8px] text-[11px]" style={{ color: UI.muted }}>
        <FileText size={14} />
        <span>Exported as a PDF, with the medical disclaimer on the first page.</span>
      </div>

      <div className="mt-[12px]">
        <PillButton block>Share PDF</PillButton>
      </div>
    </Phone>
  );
}