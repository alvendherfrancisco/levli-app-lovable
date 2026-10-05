import React from "react";
import { Plus } from "lucide-react";

/**
 * One daily metric. The label is 12px, the value 20px, and the add button has a
 * 44×44pt hit area with its own screen-reader name.
 */
export default function MetricCard({ icon, label, value, unit, color, onAdd }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-3 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col">
      <div className="flex items-start justify-between gap-1 mb-1">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${color}`}>
          {icon}
        </div>
        <button
          onClick={onAdd}
          aria-label={`Log ${label}`}
          className="w-11 h-11 -mr-1.5 -mt-1.5 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/[0.07] transition-colors flex-shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          <Plus size={18} className="text-gray-600 dark:text-white/80" aria-hidden="true" />
        </button>
      </div>
      <span className="text-xs font-medium text-gray-600 dark:text-[#9A9DAE] leading-tight break-words">{label}</span>
      <p className="text-xl font-bold text-gray-900 dark:text-[#E8E9F0] leading-tight mt-0.5 tabular-nums">
        {value} <span className="text-xs font-normal text-gray-500 dark:text-[#9A9DAE]">{unit}</span>
      </p>
    </div>
  );
}