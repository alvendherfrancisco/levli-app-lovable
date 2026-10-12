import React from "react";
import { Phone, ScreenHead, Card, Label, UI } from "@/components/brand/mocks/ui";

const SITES = [
  { name: "Left thigh", share: 38, count: 16 },
  { name: "Right thigh", share: 31, count: 13 },
  { name: "Stomach", share: 21, count: 9 },
  { name: "Upper arm", share: 10, count: 4 },
];

/** Insights: how the injection sites have been shared out, and which is next. */
export default function RotationMock() {
  return (
    <Phone tab="Insights">
      <ScreenHead title="Site rotation" subtitle="42 shots · 8 sites in rotation" />

      <Card className="px-[14px] py-[13px]">
        <Label>Next suggested</Label>
        <p className="mt-[5px] text-[17px] font-bold">Right thigh</p>
        <p className="text-[11px]" style={{ color: UI.muted }}>
          Chosen because your last three shots were elsewhere.
        </p>

        <div className="mt-[14px] space-y-[10px]">
          {SITES.map((site) => (
            <div key={site.name}>
              <div className="flex items-baseline justify-between text-[12px]">
                <span className="font-medium">{site.name}</span>
                <span style={{ color: UI.muted }}>{site.count} shots · {site.share}%</span>
              </div>
              <div className="mt-[5px] h-[7px] w-full overflow-hidden rounded-full" style={{ background: UI.surface }}>
                <div className="h-full rounded-full" style={{ width: `${site.share}%`, background: UI.indigo }} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-[12px] px-[14px] py-[12px]">
        <p className="text-[12px] font-semibold">Why it matters</p>
        <p className="mt-[3px] text-[11px]" style={{ color: UI.muted }}>
          Rotating the site keeps each injection comfortable and easy to record. Levli suggests one each
          time, and never overrides the site you choose.
        </p>
      </Card>

      <p className="mt-[12px] text-[11px]" style={{ color: UI.muted }}>
        Guidance on rotation comes from your medication's own prescribing information.
      </p>
    </Phone>
  );
}