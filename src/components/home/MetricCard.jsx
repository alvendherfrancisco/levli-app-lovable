import React from "react";
import { Plus } from "lucide-react";

/**
 * One daily metric in the Home grid. The whole card is the tap target for the
 * quick-add sheet, and the "+" sits in a 44×44 box in the top-right corner —
 * inside the card's own tap area, so it is easy to hit without a competing
 * target next to it. Label and unit are 12px, the value is 20px bold.
 */
export default function MetricCard({ icon, label, value, unit, color, ariaLabel, highlighted = false, onAdd }) {
  return (
    <button
      type="button"
      onClick={onAdd}
      aria-label={ariaLabel || `Log ${label}`}
      className={`relative w-full h-full min-h-[112px] text-left bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border flex flex-col transition-colors duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
        highlighted
          ? "border-[1.5px] border-indigo-400 bg-indigo-50 dark:bg-indigo-500/10"
          : "border-cardline"
      }`}
    >
      <div className="flex items-start justify-between">
        <span className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${color}`} aria-hidden="true">
          {icon}
        </span>
        <span
          aria-hidden="true"
          className="w-11 h-11 -mr-1.5 -mt-1.5 rounded-full flex items-center justify-center flex-shrink-0 text-gray-500 dark:text-white/80"
        >
          <Plus size={18} />
        </span>
      </div>
      <span className="text-xs font-medium text-gray-600 dark:text-[#9A9DAE] leading-tight mt-1">{label}</span>
      <p className="text-xl font-bold text-gray-900 dark:text-[#E8E9F0] leading-tight tabular-nums mt-auto">
        {value} <span className="text-xs font-normal text-gray-600 dark:text-[#9A9DAE]">{unit}</span>
      </p>
    </button>
  );
}