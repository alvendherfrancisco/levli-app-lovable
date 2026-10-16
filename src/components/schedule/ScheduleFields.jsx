import React from "react";
import FrequencyChoices from "./FrequencyChoices";
import InjectionDays from "./InjectionDays";
import IntervalField from "./IntervalField";
import ReminderTimeField from "./ReminderTimeField";
import { FREQUENCY_INFO, SCHEDULE, withScheduleKind } from "@/lib/medicationSchedule";
import { ERROR_TEXT } from "@/lib/uiStyles";

/**
 * The whole "how often" answer in one block: the frequency itself, and then
 * exactly the controls that frequency needs.
 *
 *   daily          reminder time only
 *   weekly         one injection day, then the time
 *   twice weekly   two injection days, then the time
 *   every X days   the interval and the first dose date
 *   as directed    no day and no time unless a reminder is asked for
 *
 * A control that is not shown is cleared, so nothing hidden is ever saved, and
 * this is the same block onboarding and Add / Edit Medication both render.
 *
 * `showTime={false}` is for a screen that asks the time of day somewhere of its
 * own (Add / Edit Medication, where the reminder above the form owns it) — the
 * frequency, the day and the interval are still asked here.
 */
export default function ScheduleFields({
  medication, value, onChange, showStartDate = false, showTime = true, error, frequencyLayout,
}) {
  const info = FREQUENCY_INFO[value?.kind] || {};
  const patch = (next) => onChange({ ...value, ...next });

  return (
    <div className="space-y-4">
      <FrequencyChoices
        medication={medication}
        value={value?.kind || ""}
        onChange={(kind) => onChange(withScheduleKind(value, kind))}
        layout={frequencyLayout}
      />

      {info.days > 0 && (
        <InjectionDays
          count={info.days}
          value={value.reminderDays}
          onChange={(reminderDays) => patch({ reminderDays })}
        />
      )}

      {value?.kind === SCHEDULE.EVERY_X_DAYS && (
        <IntervalField
          intervalDays={value.intervalDays}
          onIntervalChange={(intervalDays) => patch({ intervalDays })}
          startDate={value.startDate}
          onStartDateChange={(startDate) => patch({ startDate })}
          showStartDate={showStartDate}
        />
      )}

      {/* The time of day, unless the screen asking this already asks it on its own
          (see `showTime`): it is then stated once, not twice. */}
      {showTime && (info.time || info.optionalTime) && (
        <ReminderTimeField
          value={value.reminderTime}
          onChange={(reminderTime) => patch({ reminderTime })}
          optional={!!info.optionalTime}
        />
      )}

      {error && (
        <p className={ERROR_TEXT} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}