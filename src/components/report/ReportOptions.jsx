import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { OPTIONAL_IDS, RANGE_OPTIONS } from "@/lib/reportOptions";
import DateInput from "@/components/DateInput";
import SectionChecklist from "@/components/report/SectionChecklist";
import RangeSelect from "@/components/report/RangeSelect";
import {
  SHEET_CHIP_OFF, SHEET_CHIP_ON, SHEET_CHIP_SM, SHEET_FIELD,
} from "@/components/modals/shot/sheetUi";
import { sound } from "@/lib/sounds";

const LABEL = "text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2";

/** One chip: the same chip the rest of the app uses, sized to its own label. */
function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`${SHEET_CHIP_SM} ${active ? SHEET_CHIP_ON : SHEET_CHIP_OFF}`}
    >
      {children}
    </button>
  );
}

/**
 * The report's setup: the four things that decide what the report says — the
 * period, the medication, the name on it and the sections — and nothing else on
 * screen until it is asked for. The section list lives under "More options",
 * collapsed, with its own two shortcuts.
 */
export default function ReportOptions({ options, onChange, medications, available }) {
  const [open, setOpen] = useState(false);

  const toggleSection = (id) => {
    const next = options.sections.includes(id)
      ? options.sections.filter((s) => s !== id)
      : [...options.sections, id];
    onChange({ sections: next });
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 card-line space-y-5">
      <div>
        <p className={LABEL}>Date range</p>
        {/* One field, the same one the name below it uses: the ranges are listed
            over the page rather than in a row that runs off the edge of it. */}
        <RangeSelect
          label="Date range"
          value={options.rangeId}
          options={RANGE_OPTIONS}
          onChange={(rangeId) => onChange({ rangeId })}
        />
        {options.rangeId === "custom" && (
          <div className="flex gap-2 mt-3">
            <DateInput
              value={options.customFrom}
              onChange={(v) => onChange({ customFrom: v })}
              ariaLabel="From date"
              className="flex-1 min-w-0"
            />
            <DateInput
              value={options.customTo}
              onChange={(v) => onChange({ customTo: v })}
              ariaLabel="To date"
              className="flex-1 min-w-0"
            />
          </div>
        )}
      </div>

      {/* One medication needs no choice: the report is about that one. */}
      {medications.length > 1 && (
        <div>
          <p className={LABEL}>Medication</p>
          <div className="flex flex-wrap gap-2">
            <Chip active={options.medication === "all"} onClick={() => onChange({ medication: "all" })}>All</Chip>
            {medications.map((med) => (
              <Chip key={med} active={options.medication === med} onClick={() => onChange({ medication: med })}>
                {med}
              </Chip>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className={LABEL}>Name for report</p>
        <input
          type="text"
          value={options.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Name shown at the top of the report"
          className={SHEET_FIELD}
        />
      </div>

      <div className="border-t border-gray-100 dark:border-white/[0.08] pt-3">
        <button
          type="button"
          onClick={() => { sound.tap(); setOpen((v) => !v); }}
          aria-expanded={open}
          className="w-full min-h-[44px] flex items-center justify-between gap-3 text-left"
        >
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">More options</span>
          <ChevronDown
            size={18}
            className={`text-gray-500 dark:text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>

        {open && (
          <div className="pt-2">
            <SectionChecklist
              selected={options.sections}
              available={available}
              onToggle={toggleSection}
              onSelectAll={() => onChange({
                sections: [
                  ...options.sections,
                  ...Object.keys(available).filter((id) => available[id] && !options.sections.includes(id)),
                ],
              })}
              onCoreOnly={() => onChange({
                sections: options.sections.filter((id) => !OPTIONAL_IDS.includes(id)),
              })}
            />
          </div>
        )}
      </div>
    </div>
  );
}