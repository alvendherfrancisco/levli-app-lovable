import React from "react";
import { OTHER_SCHEDULE } from "@/lib/medicationRegimen";
import { choiceCls, helperCls, inputCls, labelCls } from "@/components/medications/formStyles";
import FieldError from "@/components/medications/FieldError";

/**
 * How often the medication is taken. A known product starts on the schedule its
 * label states; writing your own schedule is a deliberate second choice, and a
 * product with no label list can only be given one by the user.
 */
export default function ScheduleField({ option, value, onChange, other, onOtherChange, error }) {
  const labelled = option?.schedule || "";

  return (
    <div>
      <span className={labelCls}>How often</span>

      {labelled && (
        <div className="grid grid-cols-2 gap-3">
          {[{ v: labelled, t: labelled }, { v: OTHER_SCHEDULE, t: "Other schedule" }].map((o) => (
            <button key={o.v} type="button" onClick={() => onChange(o.v)} aria-pressed={value === o.v} className={choiceCls(value === o.v)}>
              {o.t}
            </button>
          ))}
        </div>
      )}

      {(value === OTHER_SCHEDULE || !labelled) && (
        <div className={labelled ? "mt-4" : ""}>
          <label htmlFor="schedule-other" className="text-lg font-semibold text-gray-900 dark:text-white mb-2 block">
            Schedule from your prescription
          </label>
          <input
            id="schedule-other"
            type="text"
            value={other}
            autoComplete="off"
            onChange={(e) => onOtherChange(e.target.value)}
            placeholder="e.g. every 10 days"
            className={inputCls}
          />
        </div>
      )}

      {labelled && (
        <p className={`${helperCls} mt-3`}>
          {labelled} is what the medicine's own leaflet states for {option.label}. Only change this if your doctor
          told you to.
        </p>
      )}

      <FieldError message={error} />
    </div>
  );
}