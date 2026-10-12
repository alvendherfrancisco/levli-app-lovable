import React from "react";
import { Phone, ScreenHead, Card, Label, UI } from "@/components/brand/mocks/ui";

/**
 * The estimated-level chart: the curve the app draws from the person's own
 * logged doses. The shape is fixed artwork, so it reads the same in every export.
 */
const CURVE = "M0 92 C22 70 34 44 56 40 C78 36 84 78 108 82 C132 86 140 34 164 30 C188 26 196 72 220 78 C244 84 252 32 276 28 C300 24 312 62 336 68";

/** Insights: the estimated level between doses. */
export default function LevelsMock() {
  return (
    <Phone tab="Insights">
      <ScreenHead title="Insights" subtitle="Last 8 weeks · 12 doses" />

      <Card className="px-[14px] py-[13px]">
        <div className="flex items-baseline justify-between">
          <Label>Estimated level</Label>
          <span className="text-[12px] font-semibold" style={{ color: UI.indigo }}>1 mg weekly</span>
        </div>

        <div className="relative mt-[12px] h-[112px]">
          <svg viewBox="0 0 336 112" width="100%" height="112" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <linearGradient id="levliLevelFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#4F46E5" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={`${CURVE} L336 112 L0 112 Z`} fill="url(#levliLevelFill)" />
            <path d={CURVE} fill="none" stroke="#4F46E5" strokeWidth="2.6" strokeLinecap="round" />
            {[56, 164, 276].map((x) => (
              <g key={x}>
                <line x1={x} y1="0" x2={x} y2="112" stroke="#4F46E5" strokeWidth="1" strokeDasharray="3 4" opacity="0.35" />
                <circle cx={x} cy={x === 56 ? 40 : x === 164 ? 30 : 28} r="4" fill="#4F46E5" stroke="#FFFFFF" strokeWidth="2" />
              </g>
            ))}
          </svg>
        </div>

        <div className="mt-[10px] flex justify-between text-[10px]" style={{ color: UI.faint }}>
          <span>6 Sep</span><span>20 Sep</span><span>4 Oct</span><span>12 Oct</span>
        </div>

        <div className="mt-[12px] flex gap-[16px] text-[11px]">
          <span style={{ color: UI.body }}>Peak <span className="font-semibold" style={{ color: UI.ink }}>1.9 mg</span></span>
          <span style={{ color: UI.body }}>Trough <span className="font-semibold" style={{ color: UI.ink }}>0.4 mg</span></span>
          <span style={{ color: UI.body }}>On time <span className="font-semibold" style={{ color: UI.teal }}>96%</span></span>
        </div>
      </Card>

      <Card className="mt-[12px] px-[14px] py-[12px]">
        <p className="text-[12px] font-semibold">An estimate, never a reading</p>
        <p className="mt-[3px] text-[11px]" style={{ color: UI.muted }}>
          Drawn from the doses you logged. It is not a blood test and cannot tell you what to take.
        </p>
      </Card>

      <div className="mt-[12px] flex gap-[8px] text-[11px]" style={{ color: UI.muted }}>
        <span>Dose days are marked on the chart.</span>
      </div>
    </Phone>
  );
}