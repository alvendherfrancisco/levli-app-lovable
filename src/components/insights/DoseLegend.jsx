import React from "react";

/** Small legend of the dose colours plotted in a chart. */
export default function DoseLegend({ items = [], labelClassName = "text-xs text-gray-500 dark:text-[#9A9DAE]", align = "center" }) {
  if (!items.length) return null;
  return (
    <div className={`flex items-center ${align === "center" ? "justify-center" : "justify-start"} gap-3 mt-2 flex-wrap`}>
      {items.map((it) => (
        <div key={it.key} className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: it.color }} />
          <span className={labelClassName}>{it.dose} {it.unit}</span>
        </div>
      ))}
    </div>
  );
}