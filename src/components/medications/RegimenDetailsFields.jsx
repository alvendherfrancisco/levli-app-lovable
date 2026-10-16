import React, { useState } from "react";
import { Calendar, X } from "lucide-react";
import OptionChips from "@/components/OptionChips";
import ClearFieldButton from "@/components/ClearFieldButton";
import ConfirmDialog from "@/components/ConfirmDialog";
import ScheduleFields from "@/components/schedule/ScheduleFields";
import SheetField from "@/components/modals/shot/SheetField";
import {
  SHEET_CHIP, SHEET_CHIP_OFF, SHEET_CHIP_ON, SHEET_CHIP_SM, SHEET_DATE_FIELD_MARK,
  SHEET_FIELD, SHEET_HINT, SHEET_LABEL_TEXT, SHEET_TEXTAREA,
} from "@/components/modals/shot/sheetUi";
import { INDICATION_OPTIONS, statusOptionsFor } from "@/lib/medicationRegimen";

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
 * prescribed, the prescriber and, for a regimen that is already saved, its status.
 * All of it is optional — the form saves without a single answer here.
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
  const [confirmClearReason, setConfirmClearReason] = useState(false);

  // Clearing a typed "Other" reason asks first, because the words go with it.
  const handleReasonChange = (next) => {
    if (next === null && indication === "Other" && String(indicationOther || "").trim()) {
      setConfirmClearReason(true);
      return;
    }
    if (next === null) onIndicationOtherChange("");
    onIndicationChange(next);
  };

  return (
    <div ref={innerRef} className="mt-3 space-y-6">
      {/* How often it is taken, asked with the shared schedule block every screen
          in the app asks it with — so a regimen set up here and one set up in
          onboarding carry the same day, time and interval. */}
      <ScheduleFields
        medication={medication}
        value={schedule}
        onChange={onScheduleChange}
        error={scheduleError}
      />

      {/* Why it was prescribed: full-width chips, so a long reason never wraps. */}
      <OptionChips
        label="Reason for taking it"
        labelClass={SHEET_LABEL_TEXT}
        options={INDICATION_OPTIONS.map((o) => ({ value: o, label: o }))}
        value={indication}
        onChange={handleReasonChange}
        chipClass={SHEET_CHIP}
        selectedClass={SHEET_CHIP_ON}
        unselectedClass={SHEET_CHIP_OFF}
        wrapClass="grid grid-cols-1 gap-2"
      >
        {indication === "Other" && (
          <SheetField label="Reason from your prescription" htmlFor="indication-other" className="mt-4">
            <input
              id="indication-other"
              type="text"
              value={indicationOther}
              onChange={(e) => onIndicationOtherChange(e.target.value)}
              placeholder="e.g. Fatty liver disease"
              autoComplete="off"
              className={SHEET_FIELD}
            />
          </SheetField>
        )}
        {indicationError && <p className="mt-2 text-sm font-medium text-red-600 dark:text-red-400">{indicationError}</p>}
      </OptionChips>

      <SheetField
        label="Dose schedule note"
        htmlFor="dose-step"
        trailing={<ClearX show={!!doseStep} onClear={() => onDoseStepChange("")} label="Clear the dose schedule note" />}
      >
        <input
          id="dose-step"
          type="text"
          value={doseStep}
          onChange={(e) => onDoseStepChange(e.target.value)}
          placeholder="e.g. starter dose"
          autoComplete="off"
          className={SHEET_FIELD}
        />
      </SheetField>

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
            value={prescriberContact}
            onChange={(e) => onPrescriberContactChange(e.target.value)}
            placeholder="Phone or email"
            autoComplete="off"
            className={SHEET_FIELD}
          />
        </SheetField>

        <p className={`${SHEET_HINT} mt-1.5`}>Kept on your profile too, so you only enter it once.</p>
      </div>

      <SheetField
        label="Planned end (optional)"
        htmlFor="end-date"
        trailing={<ClearX show={!!plannedEndDate} onClear={() => onPlannedEndDateChange("")} label="Clear the planned end date" />}
      >
        <div className="relative">
          <Calendar
            size={17}
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            id="end-date"
            type="date"
            value={plannedEndDate || ""}
            onChange={(e) => onPlannedEndDateChange(e.target.value)}
            aria-label="Planned end date"
            className={SHEET_DATE_FIELD_MARK}
          />
        </div>
        {plannedEndDateError && (
          <p className="mt-2 text-sm font-medium text-red-600 dark:text-red-400">{plannedEndDateError}</p>
        )}
      </SheetField>

      <SheetField label="Notes" htmlFor="med-notes">
        <textarea
          id="med-notes"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Anything you want to remember about this medication"
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

      <ConfirmDialog
        open={confirmClearReason}
        tone="warning"
        title="Clear the reason?"
        message="The reason you typed will be removed with it."
        confirmLabel="Clear it"
        cancelLabel="Keep it"
        onConfirm={() => { setConfirmClearReason(false); onIndicationOtherChange(""); onIndicationChange(null); }}
        onCancel={() => setConfirmClearReason(false)}
      />
    </div>
  );
}