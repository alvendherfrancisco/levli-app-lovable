import React from "react";
import { Plus } from "lucide-react";

/**
 * One daily metric tile. The whole tile is the tap target for the quick-add
 * sheet, and the small "+" sits in the top-right corner inside that same tap
 * area. A 36px tinted icon circle, a small grey label, and the value in medium
 * weight with the unit in small grey text beside it.
 */
export default function MetricCard({ icon, label, value, unit, color, ariaLabel, highlighted = false, onAdd, spanFull = false }) {
  return (
    <button
      type="button"
      onClick={onAdd}
      aria-label={ariaLabel || `Log ${label}`}
      className={`relative flex h-full w-full flex-col rounded-2xl border bg-white p-5 text-left shadow-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-gray-900 ${
        spanFull ? "col-span-2" : ""
      } ${
        highlighted
          ? "border-indigo-500 bg-indigo-50 dark:border-indigo-500/40 dark:bg-indigo-500/10"
          : "border-gray-200 dark:border-gray-800"
      }`}
    >
      <div className="flex items-start justify-between">
        <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${color}`} aria-hidden="true">
          {icon}
        </span>
        <span
          aria-hidden="true"
          className="-mr-2 -mt-2 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-gray-400 dark:text-white/70"
        >
          <Plus size={16} strokeWidth={1.8} />
        </span>
      </div>
      <span className="mt-2 text-[13px] text-gray-500 dark:text-[#9A9DAE]">{label}</span>
      <p className="mt-auto pt-1 text-xl font-medium tabular-nums text-gray-900 dark:text-[#E8E9F0]">
        {value} <span className="text-[13px] text-gray-400 dark:text-[#9A9DAE]">{unit}</span>
      </p>
    </button>
  );
}