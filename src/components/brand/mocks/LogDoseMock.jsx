import React from "react";
import { ChevronDown, X, Check } from "lucide-react";
import { getDoseStyle } from "@/lib/doseColors";
import { Phone, Label, FieldRow, PillButton, UI } from "@/components/brand/mocks/ui";

const MEDICATION = "Ozempic®";
const STRENGTHS = [0.25, 0.5, 1, 2];

/** Log a shot: the strength taken, the site used, and one save. */
export default function LogDoseMock() {
  return (
    <Phone>
      <div className="flex items-center justify-between pb-[14px] pt-[4px]">
        <h2 className="text-[20px] font-semibold">Log shot</h2>
        <X size={19} style={{ color: UI.faint }} />
      </div>

      <Label>Medication</Label>
      <div className="mt-[6px]">
        <FieldRow value={MEDICATION} right={<ChevronDown size={17} style={{ color: UI.muted }} />} />
      </div>

      <Label className="mt-[16px]">Form</Label>
      <div className="mt-[6px] flex gap-[8px]">
        <span
          className="inline-flex items-center gap-[6px] rounded-full px-[14px] py-[8px] text-[13px] font-medium"
          style={{ border: `1.5px solid ${UI.indigo}`, background: UI.tint, color: UI.indigo }}
        >
          <Check size={14} strokeWidth={3} /> Injection
        </span>
        <span
          className="inline-flex items-center rounded-full px-[14px] py-[8px] text-[13px] font-medium"
          style={{ border: `1px solid ${UI.line}`, background: "#FFFFFF", color: UI.body }}
        >
          Pill
        </span>
      </div>

      <Label className="mt-[16px]">Dose</Label>
      <div className="mt-[6px] grid grid-cols-3 gap-[8px]">
        {STRENGTHS.map((dose) => {
          const on = dose === 1;
          const chip = getDoseStyle(MEDICATION, dose);
          return (
            <span
              key={dose}
              className="flex h-[38px] items-center justify-center rounded-[13px] text-[13px] font-semibold"
              style={{
                background: on ? chip.background : "#FFFFFF",
                color: on ? chip.color : UI.body,
                border: on ? `1px solid ${chip.background}` : `1px solid ${UI.line}`,
              }}
            >
              {dose} mg
            </span>
          );
        })}
      </div>
      <p className="mt-[8px] text-[11px]" style={{ color: UI.muted }}>
        These are the strengths on your pen. Tap the one you took.
      </p>

      <Label className="mt-[16px]">Injection site</Label>
      <div className="mt-[6px]">
        <FieldRow value="Stomach, upper left" tag="Suggested" right={<ChevronDown size={17} style={{ color: UI.muted }} />} />
      </div>

      <div className="mt-[16px] grid grid-cols-2 gap-[10px]">
        <div>
          <Label>Date</Label>
          <div className="mt-[6px]">
            <FieldRow value="12 Oct 2026" />
          </div>
        </div>
        <div>
          <Label>Time</Label>
          <div className="mt-[6px]">
            <FieldRow value="20:15" />
          </div>
        </div>
      </div>

      <div className="mt-[18px]">
        <PillButton block>Save shot</PillButton>
      </div>
      <p className="mt-[10px] text-center text-[11px]" style={{ color: UI.muted }}>
        Log only what your prescriber has told you to take.
      </p>
    </Phone>
  );
}