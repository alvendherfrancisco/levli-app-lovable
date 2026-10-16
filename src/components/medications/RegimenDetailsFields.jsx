import React from "react";
import { X } from "lucide-react";
import OptionChips from "@/components/OptionChips";
import ClearFieldButton from "@/components/ClearFieldButton";
import ScheduleFields from "@/components/schedule/ScheduleFields";
import SheetField from "@/components/modals/shot/SheetField";
import SheetPickerRow from "@/components/modals/shot/SheetPickerRow";
import ReasonSelect from "@/components/medications/ReasonSelect";
import {
  SHEET_CHIP_OFF, SHEET_CHIP_ON, SHEET_CHIP_SM,
  SHEET_FIELD, SHEET_HINT, SHEET_LABEL_TEXT, SHEET_TEXTAREA,
} from "@/components/modals/shot/sheetUi";
import { PRESCRIBER_ONLY_NOTE, plainDateLabel, statusOptionsFor } from "@/lib/medicationRegimen";

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
 * Log shot sheet's own fields: how often the medication is taken, why it was
 * prescribed, the note the prescriber gave with the dose, when it is planned to
 * stop, the prescriber and — for a regimen that is already saved — its status.
 *
 * All of it is optional: the form saves without a single answer here. The time of
 * day is not asked again here — the reminder above the section already asks it.
 */
export default function RegimenDetailsFields({
  innerRef,
  medication, schedule, onScheduleChange, scheduleError,
  indication, onIndicationChange, indicationOther, onIndicationOtherChange, indicationError,
  doseStep, onDoseStepChange,
  prescriberName, onPrescriberNameChange, prescriberContact, onPrescriberContactChange,
  plannedEndDate, onPlannedEndDateChange, plannedEndDateError,
  notes, onNotesChange,
  showStatus, status, onStatusChange,
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

      {/* The prescriber, so they are in hand when they are needed. Both are saved
          on the profile too, which is why the form starts with them filled in. */}
      <div>
        <SheetField
          label="Prescriber name"
          htmlFor="prescriber-name"
          trailing={<ClearX show={!!prescriberName} onClear={() => onPrescriberNameChange("")} label="Clear the prescriber name" />}
        >
          <input
            id="prescriber-name"
            type="text"
            value={prescriberName}
            onChange={(e) => onPrescriberNameChange(e.target.value)}
            placeholder="Dr Patel"
            autoComplete="off"
            className={SHEET_FIELD}
          />
        </SheetField>

        <SheetField
          label="Prescriber contact"
          htmlFor="prescriber-contact"
          className="mt-4"
          trailing={<ClearX show={!!prescriberContact} onClear={() => onPrescriberContactChange("")} label="Clear the prescriber contact" />}
        >
          <input
            id="prescriber-contact"
            type="text"
            inputMode="email"
            value={prescriberContact}
            onChange={(e) => onPrescriberContactChange(e.target.value)}
            placeholder="Phone or email"
            autoComplete="off"
            className={SHEET_FIELD}
          />
        </SheetField>

        <p className={`${SHEET_HINT} mt-1.5`}>Kept on your profile too, so you only enter it once.</p>
      </div>

      <SheetField label="Notes" htmlFor="med-notes">
        <textarea
          id="med-notes"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Anything you want to remember"
          className={SHEET_TEXTAREA}
        />
      </SheetField>

      {/* Only a regimen that is already saved has a status to change: a new one
          is always added active. */}
      {showStatus && (
        <OptionChips
          label="Status"
          labelClass={SHEET_LABEL_TEXT}
          options={statusOptionsFor(status)}
          value={status}
          onChange={onStatusChange}
          required
          soundOnSelect
          chipClass={SHEET_CHIP_SM}
          selectedClass={SHEET_CHIP_ON}
          unselectedClass={SHEET_CHIP_OFF}
        />
      )}
    </div>
  );
}