import React from "react";

/**
 * Small legend of the dose colours plotted in a chart. The dose text always
 * sits beside its swatch, so the colour is never the only signal.
 * The optional style props let the doctor report paint it with its own tokens.
 */
export default function DoseLegend({
  items = [], title = "", labelClassName = "text-xs text-gray-500 dark:text-[#9A9DAE]",
  align = "center", titleClassName = "text-xs font-medium text-gray-700 dark:text-gray-300",
  titleStyle, labelStyle,
}) {
  if (!items.length) return null;
  return (
    <div className={`flex items-center ${align === "center" ? "justify-center" : "justify-start"} gap-3 mt-2 flex-wrap`}>
      {title && <span className={titleClassName} style={titleStyle}>{title}</span>}
      {items.map((it) => (
        <div key={it.key} className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: it.color }} />
          <span className={labelClassName} style={labelStyle}>{it.dose} {it.unit}</span>
        </div>
      ))}
    </div>
  );
}