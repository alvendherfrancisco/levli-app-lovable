import React from "react";
import { TYPE_ROWS } from "@/lib/storeAssets";

/** The type scale, each row set in the size the app actually draws it at. */
export default function TypeSection() {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-cardline bg-white dark:bg-[#0f1117]">
        {TYPE_ROWS.map((row, i) => (
          <div
            key={row.name}
            className={`flex flex-wrap items-center justify-between gap-3 p-4 ${i ? "border-t border-cardline" : ""}`}
          >
            <p className={`min-w-0 flex-1 text-foreground ${row.className}`}>{row.sample}</p>
            <div className="text-right">
              <p className="text-xs font-semibold">{row.name}</p>
              <p className="text-xs text-muted-foreground">{row.spec}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-cardline bg-white p-4 dark:bg-[#0f1117]">
        <p className="text-xs font-semibold">One family</p>
        <p className="mt-1 font-mono text-xs text-muted-foreground">ui-sans-serif, system-ui, sans-serif</p>
        <p className="mt-2 text-xs text-muted-foreground">
          The app loads no custom font: it renders in the device's own system sans, so nothing shifts between
          phones and nothing has to be licensed for the store listing.
        </p>
      </div>
    </div>
  );
}