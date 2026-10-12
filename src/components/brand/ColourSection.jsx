import React from "react";
import { COLOURS } from "@/lib/storeAssets";

// A few of the palette's own values are a wash on a white page (the surface, the
// hairline, the low-opacity dark border). Each of those is drawn over the ground
// it belongs to, so the swatch shows the colour as it actually lands.
const GROUND = { "#F9FAFB": "#FFFFFF", "#E8EAF0": "#FFFFFF", "#FFFFFF17": "#15171E" };

/** The palette, grouped by what each colour is for. */
export default function ColourSection() {
  const groups = ["Core", "Support", "Night"];

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group}>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{group}</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {COLOURS.filter((c) => c.group === group).map((colour) => (
              <div key={colour.hex + colour.name} className="rounded-2xl border border-cardline bg-white p-3 dark:bg-[#0f1117]">
                <div
                  className="h-[68px] w-full rounded-xl"
                  style={{
                    background: GROUND[colour.hex]
                      ? `linear-gradient(0deg, ${colour.hex}, ${colour.hex}), ${GROUND[colour.hex]}`
                      : colour.hex,
                    boxShadow: "inset 0 0 0 1px rgba(16,24,40,0.06)",
                  }}
                />
                <div className="mt-3 flex items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold">{colour.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">{colour.hex}</p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{colour.role}</p>
              </div>
            ))}
          </div>
        </div>
      ))}

      <p className="text-xs text-muted-foreground">
        Medication dose colours are set by each manufacturer and are never adjusted to sit in this palette.
      </p>
    </div>
  );
}