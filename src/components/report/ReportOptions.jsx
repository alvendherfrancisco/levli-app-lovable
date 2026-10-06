import React from "react";
import { CORE_IDS, RANGE_OPTIONS } from "@/lib/reportOptions";
import SectionChecklist from "@/components/report/SectionChecklist";

const chip = (active) =>
  `px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
    active
      ? "bg-indigo-600 text-white"
      : "bg-white dark:bg-white/[0.06] text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-white/10"
  }`;

/** Options for the doctor report: range, medication, unit, name and sections. */
export default function ReportOptions({ options, onChange, medications, available }) {
  const toggleSection = (id) => {
    const next = options.sections.includes(id)
      ? options.sections.filter((s) => s !== id)
      : [...options.sections, id];
    onChange({ sections: next });
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 space-y-5">
      <div>
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Date range</p>
        <div className="flex flex-wrap gap-2">
          {RANGE_OPTIONS.map((range) => (
            <button key={range.id} type="button" onClick={() => onChange({ rangeId: range.id })} className={chip(options.rangeId === range.id)}>
              {range.label}
            </button>
          ))}
        </div>
        {options.rangeId === "custom" && (
          <div className="flex gap-2 mt-3">
            <input
              type="date" value={options.customFrom} onChange={(e) => onChange({ customFrom: e.target.value })}
              className="flex-1 min-w-0 border border-gray-200 dark:border-white/10 dark:bg-white/[0.05] dark:text-[#E8E9F0] dark:[color-scheme:dark] rounded-xl px-3 py-2 text-sm"
            />
            <input
              type="date" value={options.customTo} onChange={(e) => onChange({ customTo: e.target.value })}
              className="flex-1 min-w-0 border border-gray-200 dark:border-white/10 dark:bg-white/[0.05] dark:text-[#E8E9F0] dark:[color-scheme:dark] rounded-xl px-3 py-2 text-sm"
            />
          </div>
        )}
      </div>

      <div>
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Medication</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => onChange({ medication: "all" })} className={chip(options.medication === "all")}>All</button>
          {medications.map((med) => (
            <button key={med} type="button" onClick={() => onChange({ medication: med })} className={chip(options.medication === med)}>{med}</button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Weight unit</p>
        {/* The note wraps below the chips on a narrow screen instead of being
            squeezed onto their line. */}
        <div className="flex flex-wrap items-center gap-2">
          {["lb", "kg"].map((unitOption) => (
            <button key={unitOption} type="button" onClick={() => onChange({ weightUnit: unitOption })} className={chip(options.weightUnit === unitOption)}>
              {unitOption}
            </button>
          ))}
          <span className="text-[11px] text-gray-400 dark:text-gray-500 self-center ml-1">Follows Profile unless changed here</span>
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Name for report (optional)</p>
        <input
          type="text" value={options.name} onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Name shown at the top of the report"
          className="w-full border border-gray-200 dark:border-white/10 dark:bg-white/[0.05] dark:text-[#E8E9F0] rounded-xl px-4 py-2.5 text-sm"
        />
      </div>

      <SectionChecklist
        selected={options.sections}
        available={available}
        onToggle={toggleSection}
        onSelectAll={() => onChange({ sections: [...options.sections, ...Object.keys(available).filter((id) => available[id] && !options.sections.includes(id))] })}
        onCoreOnly={() => onChange({ sections: options.sections.filter((id) => CORE_IDS.includes(id)) })}
      />
    </div>
  );
}