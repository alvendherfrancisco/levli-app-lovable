import React from "react";

/** Label/value pairs on the report's white paper. */
export default function PaperPairs({ pairs }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
      {pairs.map(([label, value]) => (
        <div key={label} className="flex items-baseline justify-between gap-2 min-w-0">
          <span className="text-xs text-gray-500 truncate">{label}</span>
          <span className="text-xs font-bold text-gray-900 whitespace-nowrap">{value}</span>
        </div>
      ))}
    </div>
  );
}