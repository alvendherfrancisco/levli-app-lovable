import React from "react";
import ScheduleField from "@/components/medications/ScheduleField";
import DateQuickPick from "@/components/medications/DateQuickPick";
import StepHelp from "@/components/medications/StepHelp";
import { choiceCls, helperCls, labelCls, stepHeadingCls } from "@/components/medications/formStyles";
import { statusOptionsFor } from "@/lib/medicationRegimen";

/** Step 3 — how often, the first dose date, an optional stop date and the status. */
export default function WhenStep({
  option, schedule, onScheduleChange, scheduleOther, onScheduleOtherChange,
  startDate, onStartDateChange, endDate, onEndDateChange, status, onStatusChange, errors,
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className={stepHeadingCls}>How often and when do you start?</h2>
        <p className={`${helperCls} mt-2`}>Choose how often you take it, then the day of your first dose.</p>
        <StepHelp text="Some medicines are taken once a week and some every day — pick what your prescription says. “First dose date” is the day you started. If you already know when you'll stop, you can add that date, otherwise leave it empty." />
      </div>

      <ScheduleField
        option={option}
        value={schedule}
        onChange={onScheduleChange}
        other={scheduleOther}
        onOtherChange={onScheduleOtherChange}
        error={errors.schedule}
      />

      <DateQuickPick
        id="first-dose-date"
        label="First dose date"
        value={startDate}
        onChange={onStartDateChange}
        withNextMonday
        error={errors.startDate}
      />

      <DateQuickPick
        id="stop-date"
        label="Stop date (optional)"
        value={endDate}
        onChange={onEndDateChange}
        error={errors.plannedEndDate}
      />

      <div>
        <span className={labelCls}>Is this medication active?</span>
        <div className="grid grid-cols-3 gap-3">
          {statusOptionsFor(status).map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => onStatusChange(s.value)}
              aria-pressed={status === s.value}
              className={choiceCls(status === s.value)}
            >
              {s.label}
            </button>
          ))}
        </div>
        <p className={`${helperCls} mt-3`}>
          Active means you still take it. Paused means you've stopped for now. Stopped means you no longer take it.
        </p>
      </div>
    </div>
  );
}