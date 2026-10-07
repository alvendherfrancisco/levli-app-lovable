import React from "react";
import { controlsFor } from "@/lib/medicationSchedule";
import InjectionDaysField from "@/components/onboarding/InjectionDaysField";
import IntervalFields from "@/components/onboarding/IntervalFields";
import ReminderTimeField from "@/components/onboarding/ReminderTimeField";

/**
 * Exactly the controls the chosen frequency asks for, and nothing else: a day
 * picker only for a once-a-week or twice-a-week schedule, an interval and start
 * date only for an every-N-days one, a reminder time where one makes sense.
 *
 * Which controls apply is decided in one place (src/lib/medicationSchedule.js),
 * together with the rule that a control which is not shown has its stored value
 * cleared.
 */
export default function ScheduleTimingFields({ medication, schedule, onChange }) {
  const controls = controlsFor(schedule.frequency);

  return (
    <div className="space-y-4">
      {controls.days !== "none" && (
        <InjectionDaysField medication={medication} schedule={schedule} onChange={onChange} />
      )}
      {controls.interval && (
        <IntervalFields medication={medication} schedule={schedule} onChange={onChange} />
      )}
      {controls.time !== "none" && (
        <ReminderTimeField
          schedule={schedule}
          onChange={onChange}
          optional={controls.time === "optional"}
        />
      )}
    </div>
  );
}