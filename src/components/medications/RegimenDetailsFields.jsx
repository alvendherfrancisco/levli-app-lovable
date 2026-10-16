import React from "react";
import { X } from "lucide-react";
import ClearFieldButton from "@/components/ClearFieldButton";
import ScheduleFields from "@/components/schedule/ScheduleFields";
import IntervalOverrideField from "@/components/medications/IntervalOverrideField";
import SheetField from "@/components/modals/shot/SheetField";
import SheetPickerRow from "@/components/modals/shot/SheetPickerRow";
import ReasonSelect from "@/components/medications/ReasonSelect";
import {
  SHEET_FIELD, SHEET_HINT, SHEET_TEXTAREA,
} from "@/components/modals/shot/sheetUi";
import { PRESCRIBER_ONLY_NOTE, plainDateLabel } from "@/lib/medicationRegimen";

/** The clear control of an optional field: one small x on the field's line. */
function ClearX({ show, onClear, label }) {
  return (
    <ClearFieldButton
      show={show}
      onClear={onClear}
      ariaLabel={label}
      label={<X size={16} aria-hidden="true" />}
    />
  );
}

/**
 * Everything the Add / Edit Medication form does not ask for on its face, in the
 * Log shot sheet's own fields: how often the medication is taken and the interval
 * a prescriber directed for it, why it was prescribed, the note the prescriber
 * gave with the dose, when it is planned to stop, and the prescriber this
 * regimen is being taken under.
 *
 * The prescriber is not entered here: name and contact are entered once, in About
 * you (src/pages/Profile.jsx), and the field below simply reads what is saved
 * there — it has a label of its own and says "Not set" until one is added.
 *
 * All of it is optional: the form saves without a single answer here. The time of
 * day is not asked again here — the reminder above the section already asks it.
 * Supply tracking is not here either: it has a folded row of its own below.
 */
export default function RegimenDetailsFields({
  innerRef,
  medication, schedule, onScheduleChange, scheduleError,
  intervalDays, onIntervalDaysChange,
  indication, onIndicationChange, indicationOther, onIndicationOtherChange, indicationError,
  doseStep, onDoseStepChange,
  prescriberLabel,
  plannedEndDate, onPlannedEndDateChange, plannedEndDateError,
  notes, onNotesChange,
}) {
  return (
    <div ref={innerRef} className="mt-3 space-y-4">
      {/* How often it is taken, and which day: the shared schedule block every
          screen in the app asks it with — so a regimen set up here and one set up
          in onboarding carry the same day and interval. Its time of day is asked
          by the reminder above, not twice. */}
      <ScheduleFields
        medication={medication}
        value={schedule}
        onChange={onScheduleChange}
        error={scheduleError}
        showTime={false}
      />

      {/* The interval a prescriber directed for this one medication, stated
          against the interval the product is actually dosed at. */}
      <IntervalOverrideField
        medication={medication}
        value={intervalDays}
        onChange={onIntervalDaysChange}
      />

      <ReasonSelect
        value={indication}
        other={indicationOther}
        onChange={onIndicationChange}
        onOtherChange={onIndicationOtherChange}
        error={indicationError}
      />

      {/* What the prescriber said about this dose — kept as it was written, never
          as advice. */}
      <SheetField
        label="Note from your prescriber (optional)"
        htmlFor="dose-step"
        trailing={<ClearX show={!!doseStep} onClear={() => onDoseStepChange("")} label="Clear the prescriber note" />}
      >
        <input
          id="dose-step"
          type="text"
          value={doseStep}
          onChange={(e) => onDoseStepChange(e.target.value)}
          placeholder="e.g. Starter dose, increase after 4 weeks"
          autoComplete="off"
          className={SHEET_FIELD}
        />
        <p className={`${SHEET_HINT} mt-1.5`}>{PRESCRIBER_ONLY_NOTE}</p>
      </SheetField>

      {/* The day the course is planned to end. The device's own picker sits over
          the sheet's row, so the field reads "Not set" until a day is chosen and
          still opens the calendar it always did. */}
      <SheetField
        label="Planned end date (optional)"
        htmlFor="end-date"
        trailing={<ClearX show={!!plannedEndDate} onClear={() => onPlannedEndDateChange("")} label="Clear the planned end date" />}
      >
        <div className="relative">
          <SheetPickerRow
            value={plannedEndDate ? plainDateLabel(plannedEndDate) : ""}
            placeholder="Not set"
          />
          <input
            id="end-date"
            type="date"
            value={plannedEndDate || ""}
            onChange={(e) => onPlannedEndDateChange(e.target.value)}
            aria-label="Planned end date"
            className="absolute inset-0 h-full w-full min-w-0 box-border cursor-pointer text-[16px] opacity-0 dark:[color-scheme:dark]"
          />
        </div>
        {plannedEndDateError && (
          <p className="mt-2 text-sm font-medium text-red-600 dark:text-red-400">{plannedEndDateError}</p>
        )}
      </SheetField>

      {/* The prescriber is entered in one place — Profile — so this form never
          asks for it again: the field reads what is saved there, and says
          "Not set" until one has been added. */}
      <SheetField label="Prescriber">
        <SheetPickerRow value={prescriberLabel} placeholder="Not set" />
        <p className={`${SHEET_HINT} mt-1.5`}>
          {prescriberLabel
            ? "Change it in Profile."
            : "Add your prescriber in Profile — the Contact prescriber button uses it when a dose is overdue."}
        </p>
      </SheetField>

      <SheetField label="Notes" htmlFor="med-notes">
        <textarea
          id="med-notes"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Anything you want to remember"
          className={SHEET_TEXTAREA}
        />
      </SheetField>

    </div>
  );
}