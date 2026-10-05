import React from "react";

/** How often each side effect was logged, as simple horizontal bars. */
export default function SideEffectBars({ rows }) {
  if (!rows.length) return null;
  const max = Math.max(...rows.map((r) => r.count), 1);

  return (
    <div className="space-y-1.5">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center gap-2">
          <span className="text-xs text-gray-600 w-32 flex-shrink-0 truncate" title={row.label}>{row.label}</span>
          <div className="flex-1 h-3 rounded" style={{ background: "#EEF0F6" }}>
            <div className="h-3 rounded" style={{ width: `${(row.count / max) * 100}%`, background: "#4F46E5" }} />
          </div>
          <span className="text-xs text-gray-500 w-6 text-right flex-shrink-0">{row.count}</span>
        </div>
      ))}
    </div>
  );
}