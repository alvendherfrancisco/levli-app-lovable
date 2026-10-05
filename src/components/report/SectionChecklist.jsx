import React from "react";
import { Check, Lock } from "lucide-react";
import { CORE_SECTIONS, OPTIONAL_SECTIONS } from "@/lib/reportOptions";

/**
 * Section checklist. Core sections are always part of the report; optional
 * sections can be switched on, and only when the range holds data for them.
 */
export default function SectionChecklist({ selected, available = {}, onToggle, onSelectAll, onCoreOnly }) {
  const rows = [...CORE_SECTIONS, ...OPTIONAL_SECTIONS];

  const Row = ({ section, optional }) => {
    const isSelected = selected.includes(section.id);
    const hasData = !optional || available[section.id];
    const disabled = !optional || !hasData;
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && onToggle(section.id)}
        className={`w-full flex items-center gap-3 py-2.5 text-left ${optional && !hasData ? "opacity-60" : ""}`}
      >
        <span className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 ${
          isSelected ? "bg-indigo-600 border-indigo-600" : "border-gray-300 dark:border-white/20"
        }`}>
          {isSelected && !optional ? <Lock size={11} className="text-white" /> : isSelected ? <Check size={13} className="text-white" /> : null}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm text-gray-800 dark:text-[#E8E9F0]">{section.label}</span>
          <span className="block text-[11px] text-gray-400 dark:text-gray-500">
            {optional
              ? (hasData ? "Optional" : "No data in this range")
              : "Always included"}
          </span>
        </span>
      </button>
    );
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mr-auto">Sections</p>
        <button type="button" onClick={onSelectAll} className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
          Select all
        </button>
        <span className="text-gray-300 dark:text-white/20">·</span>
        <button type="button" onClick={onCoreOnly} className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
          Core only
        </button>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-white/[0.06]">
        {rows.map((section) => (
          <Row key={section.id} section={section} optional={OPTIONAL_SECTIONS.some((s) => s.id === section.id)} />
        ))}
      </div>
    </div>
  );
}