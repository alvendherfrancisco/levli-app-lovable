import React from "react";
import { Download } from "lucide-react";
import { ICON_FILES, BRAND } from "@/lib/storeAssets";

/**
 * The icon: how it reads on the store's own grounds, and the files to hand over.
 * Every file here is the artwork that already ships with the app — the App Store
 * one is drawn flat and opaque at 1024, exactly as Apple asks.
 */
export default function IconSection() {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col items-center justify-center rounded-2xl border border-cardline bg-[#EBEBFF] p-6">
          <img src={BRAND.icon} alt="Levli app icon on a lavender store ground" className="h-[116px] w-[116px] rounded-[26px] shadow-card" />
          <p className="mt-3 text-[11px] font-medium text-[#4B5563]">On the lavender ground</p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-2xl border border-cardline bg-[#15171E] p-6">
          <img src={BRAND.icon} alt="Levli app icon on the dark surface" className="h-[116px] w-[116px] rounded-[26px]" />
          <p className="mt-3 text-[11px] font-medium text-[#9AA1B9]">On the night surface</p>
        </div>
      </div>

      <div className="rounded-2xl border border-cardline bg-white dark:bg-[#0f1117]">
        {ICON_FILES.map((file, i) => (
          <div
            key={file.path}
            className={`flex flex-wrap items-center justify-between gap-3 p-4 ${i ? "border-t border-cardline" : ""}`}
          >
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-sm font-semibold">
                {file.label}
                {file.primary ? (
                  <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                    Apple's required size
                  </span>
                ) : null}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {file.size} · PNG · {file.note}
              </p>
            </div>
            <a
              href={file.path}
              download={file.filename}
              className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400"
            >
              <Download size={15} /> Download
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}