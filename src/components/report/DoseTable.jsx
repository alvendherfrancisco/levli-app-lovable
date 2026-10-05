import React from "react";
import DoseBadge from "@/components/DoseBadge";

/**
 * Doses taken — newest first. The dose keeps its colour badge plus the dose
 * text, so it matches the same dose everywhere else in the app.
 */
export default function DoseTable({ rows, showPain, showDetail }) {
  if (!rows.length) return <p className="text-sm text-gray-500">No doses logged in this range.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-gray-50 text-gray-500">
            <th className="text-left p-2 font-medium whitespace-nowrap">Date</th>
            <th className="text-left p-2 font-medium">Time</th>
            <th className="text-left p-2 font-medium">Medication</th>
            <th className="text-left p-2 font-medium">Dose</th>
            <th className="text-left p-2 font-medium">Injection site</th>
            {showDetail && <th className="text-left p-2 font-medium">Route / concentration</th>}
            {showPain && <th className="text-left p-2 font-medium">Pain</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-gray-100 text-gray-700">
              <td className="p-2 whitespace-nowrap">{row.dayLabel}</td>
              <td className="p-2 whitespace-nowrap">{row.time}</td>
              <td className="p-2">{row.medication}</td>
              <td className="p-2"><DoseBadge medication={row.medication} dose={row.dose} unit={row.unit} /></td>
              <td className="p-2">{row.site}</td>
              {showDetail && <td className="p-2">{row.detail || "—"}</td>}
              {showPain && <td className="p-2 whitespace-nowrap">{row.pain != null ? `${row.pain}/10` : "—"}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}