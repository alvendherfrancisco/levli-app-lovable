import React from "react";
import { Lock } from "lucide-react";
import { CORE_SECTIONS, OPTIONAL_GROUPS, PRIVACY_NOTE } from "@/lib/reportOptions";
import { sound } from "@/lib/sounds";

/** The switch the rest of the app draws, at the app's own size. */
function Toggle({ on, disabled }) {
  return (
    <span
      className={`relative h-7 w-12 flex-shrink-0 rounded-full transition-colors ${
        disabled ? "bg-gray-200 dark:bg-white/[0.08]" : on ? "bg-indigo-500" : "bg-gray-300 dark:bg-gray-600"
      }`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          on && !disabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </span>
  );
}

/** The small lock that stands where a switch would, on a section every report carries. */
function LockMark() {
  return (
    <span className="w-12 flex-shrink-0 flex justify-center">
      <span className="w-7 h-7 rounded-full bg-gray-100 dark:bg-white/[0.08] flex items-center justify-center">
        <Lock size={13} className="text-gray-500 dark:text-gray-400" aria-hidden="true" />
      </span>
    </span>
  );
}

/** The heading over one group of optional sections. */
function GroupLabel({ children }) {
  return (
    <p className="pt-3 pb-0.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
      {children}
    </p>
  );
}

/** One row of the list: its label, its hint, and the control on the right. */
function RowShell({ label, hint, children }) {
  return (
    <span className="flex w-full items-center justify-between gap-3 py-2.5 text-left">
      <span className="min-w-0">
        <span className="block text-[15px] text-gray-900 dark:text-[#E8E9F0]">{label}</span>
        {hint && (
          <span className="mt-0.5 block text-[13px] leading-snug text-gray-500 dark:text-[#9A9DAE]">{hint}</span>
        )}
      </span>
      {children}
    </span>
  );
}

/**
 * Section checklist. The three core sections are always part of the report and
 * show it with a lock; the optional ones are grouped, switched on with the app's
 * own toggle, and can only be switched on when the range holds data for them —
 * a section with nothing in it says so instead.
 */
export default function SectionChecklist({ selected, available = {}, onToggle, onSelectAll, onCoreOnly }) {
  const isOn = (id) => selected.includes(id);

  return (
    <div>
      <div className="flex items-center gap-2">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mr-auto">Sections</p>
        <button type="button" onClick={onSelectAll} className="btn-link text-xs">Select all</button>
        <span className="text-gray-300 dark:text-white/20">·</span>
        <button type="button" onClick={onCoreOnly} className="btn-link text-xs">Core only</button>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-white/[0.06]">
        {CORE_SECTIONS.map((section) => (
          <RowShell key={section.id} label={section.label} hint="Always included">
            <LockMark />
          </RowShell>
        ))}
      </div>

      {OPTIONAL_GROUPS.map((group) => (
        <div key={group.id}>
          <GroupLabel>{group.label}</GroupLabel>
          <div className="divide-y divide-gray-100 dark:divide-white/[0.06]">
            {group.sections.map((section) => {
              const hasData = !!available[section.id];
              const on = isOn(section.id);
              const hint = hasData ? (section.privacy ? PRIVACY_NOTE : "") : "No data in this range";
              return (
                <button
                  key={section.id}
                  type="button"
                  role="switch"
                  aria-checked={on && hasData}
                  disabled={!hasData}
                  onClick={() => {
                    if (!hasData) return;
                    sound.tap();
                    onToggle(section.id);
                  }}
                  className={`w-full ${hasData ? "" : "opacity-60"}`}
                >
                  <RowShell label={section.label} hint={hint}>
                    <Toggle on={on} disabled={!hasData} />
                  </RowShell>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}