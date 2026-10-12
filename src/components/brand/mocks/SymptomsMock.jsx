import React from "react";
import { Check } from "lucide-react";
import { Phone, ScreenHead, Card, Label, PillButton, UI } from "@/components/brand/mocks/ui";

const SYMPTOMS = ["Nausea", "Bloating", "Constipation", "Heartburn", "Fatigue", "Headache", "Injection site"];
const SEVERITY = ["Mild", "Moderate", "Severe"];

/** Journal: a structured symptom entry, with severity and a date. */
export default function SymptomsMock() {
  return (
    <Phone tab="Journal">
      <ScreenHead title="How are you feeling?" subtitle="Monday, 12 October · 20:40" />

      <Label>What are you feeling?</Label>
      <div className="mt-[8px] flex flex-wrap gap-[7px]">
        {SYMPTOMS.map((s) => (
          <span
            key={s}
            className="inline-flex items-center gap-[5px] rounded-full px-[12px] py-[7px] text-[12px] font-medium"
            style={
              s === "Nausea"
                ? { border: `1.5px solid ${UI.indigo}`, background: UI.tint, color: UI.indigo }
                : { border: `1px solid ${UI.line}`, background: "#FFFFFF", color: UI.body }
            }
          >
            {s === "Nausea" ? <Check size={13} strokeWidth={3} /> : null}
            {s}
          </span>
        ))}
      </div>

      <Label className="mt-[16px]">Severity</Label>
      <div className="mt-[8px] flex gap-[8px]">
        {SEVERITY.map((s) => (
          <span
            key={s}
            className="flex-1 rounded-[13px] py-[9px] text-center text-[12px] font-medium"
            style={
              s === "Mild"
                ? { border: `1.5px solid ${UI.indigo}`, background: UI.tint, color: UI.indigo }
                : { border: `1px solid ${UI.line}`, background: "#FFFFFF", color: UI.body }
            }
          >
            {s}
          </span>
        ))}
      </div>

      <div className="mt-[16px] grid grid-cols-2 gap-[10px]">
        <div>
          <Label>Date</Label>
          <div className="mt-[6px] flex h-[46px] items-center rounded-full px-[14px] text-[13px]" style={{ border: `1px solid ${UI.line}` }}>
            12 Oct 2026
          </div>
        </div>
        <div>
          <Label>Time</Label>
          <div className="mt-[6px] flex h-[46px] items-center rounded-full px-[14px] text-[13px]" style={{ border: `1px solid ${UI.line}` }}>
            20:40
          </div>
        </div>
      </div>

      <Label className="mt-[16px]">Note</Label>
      <div
        className="mt-[6px] flex h-[62px] rounded-[18px] px-[14px] py-[10px] text-[12px]"
        style={{ border: `1px solid ${UI.line}`, color: UI.ink }}
      >
        Mild nausea about six hours after the shot. Passed by the morning.
      </div>

      <Card className="mt-[14px] px-[13px] py-[10px]" style={{ background: "#FFFBEB", borderColor: "#FDE68A" }}>
        <p className="text-[11px] font-semibold" style={{ color: "#92400E" }}>Feeling much worse?</p>
        <p className="mt-[2px] text-[11px]" style={{ color: "#92400E" }}>
          Severe or worsening symptoms need a clinician, not an app. Reporting routes are listed in the entry.
        </p>
      </Card>

      <div className="mt-[16px]">
        <PillButton block>Save entry</PillButton>
      </div>
    </Phone>
  );
}