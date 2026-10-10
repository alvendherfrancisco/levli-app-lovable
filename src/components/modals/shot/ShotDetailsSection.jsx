import React from "react";
import DateInput from "@/components/DateInput";
import OptionChips from "@/components/OptionChips";
import ClearFieldButton from "@/components/ClearFieldButton";
import SheetField from "@/components/modals/shot/SheetField";
import SheetSelect from "@/components/modals/shot/SheetSelect";
import ShotRouteDeviceFields from "@/components/modals/ShotRouteDeviceFields";
import RepeatOptionsField from "@/components/modals/RepeatOptionsField";
import {
  SHEET_CHIP_OFF, SHEET_CHIP_ON, SHEET_DATE_FIELD, SHEET_FIELD, SHEET_HINT,
  SHEET_LABEL_TEXT, SHEET_TEXTAREA,
} from "@/components/modals/shot/sheetUi";

/**
 * Everything optional in the log sheet, behind "More details": the route and the
 * device, the concentration a compounded product carries, the fields that belong
 * to a route nobody logs every day (an infusion, a spray, a patch, a pump), the
 * weekly repeat, the pain level and the notes.
 *
 * The route and the device are not offered for a tablet — there is no injection
 * to place — so a pill's log keeps only the fields that apply to it.
 *
 * It holds no state of its own: every value and every setter comes from the sheet
 * that owns the log, so the form the person is filling in stays one form.
 */
export default function ShotDetailsSection({
  innerRef,
  tabletForm = false,
  activeRoute, routeOptions, onRouteChange, deviceType, deviceOptions, onDeviceChange,
  isCompounded, concentration, setConcentration,
  infusionDuration, setInfusionDuration, clinicLocation, setClinicLocation,
  premedication, setPremedication,
  sprayCount, setSprayCount, nostril, setNostril, priming, setPriming,
  takenWithFood, setTakenWithFood,
  patchSite, setPatchSite, applicationDate, setApplicationDate,
  bodyArea, setBodyArea, applicationNotes, setApplicationNotes,
  insertionDate, setInsertionDate,
  pumpRate, setPumpRate, siteChangeDate, setSiteChangeDate,
  reconstitutionDate, setReconstitutionDate, inUseExpiry, setInUseExpiry,
  isReconstituted,
  editingShot, isWeeklyMedication, repeatOn, setRepeatOn, repeatMode, setRepeatMode,
  repeatWeeks, setRepeatWeeks, schedule, date, time, medication, dose, doseUnit,
  pain, setPain, notes, setNotes,
}) {
  return (
    <div
      ref={innerRef}
      className="mt-3 space-y-6 animate-in fade-in slide-in-from-top-1"
    >
      {/* Route and Device type — optional. Route arrives pre-filled from the
          medication, Device type is empty. A tablet asks for neither. */}
      {!tabletForm && (
        <ShotRouteDeviceFields
          route={activeRoute}
          routeOptions={routeOptions}
          onRouteChange={onRouteChange}
          deviceType={deviceType}
          deviceOptions={deviceOptions}
          onDeviceChange={onDeviceChange}
        />
      )}

      {/* Concentration: compounded / generic products only */}
      {isCompounded && (
        <SheetField label="Concentration">
          <input
            type="text" value={concentration} onChange={(e) => setConcentration(e.target.value)}
            placeholder="e.g. 2.5 mg/mL" className={SHEET_FIELD}
          />
          <p className={`${SHEET_HINT} mt-2`}>
            Compounded strengths vary by pharmacy. Enter what your vial says.
          </p>
        </SheetField>
      )}

      {/* Route-specific fields */}
      {activeRoute === "intravenous_infusion" && (
        <>
          <SheetField label="Infusion duration (minutes)">
            <input type="number" min="0" step="1" value={infusionDuration} onChange={(e) => setInfusionDuration(e.target.value)} className={SHEET_FIELD} />
          </SheetField>
          <SheetField label="Clinic or location">
            <input type="text" value={clinicLocation} onChange={(e) => setClinicLocation(e.target.value)} className={SHEET_FIELD} />
          </SheetField>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={premedication} onChange={(e) => setPremedication(e.target.checked)} className="w-5 h-5 accent-indigo-600" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Premedication administered</span>
          </label>
        </>
      )}

      {activeRoute === "nasal" && (
        <>
          <SheetField label="Spray count">
            <input type="number" min="0" step="1" value={sprayCount} onChange={(e) => setSprayCount(e.target.value)} className={SHEET_FIELD} />
          </SheetField>
          <SheetSelect
            id="shot-nostril"
            label="Nostril"
            value={nostril}
            onChange={setNostril}
            options={[
              { value: "both", label: "Both" },
              { value: "left", label: "Left" },
              { value: "right", label: "Right" },
            ]}
          />
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={priming} onChange={(e) => setPriming(e.target.checked)} className="w-5 h-5 accent-indigo-600" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Device primed before use</span>
          </label>
        </>
      )}

      {(activeRoute === "oral_tablet" || activeRoute === "oral_capsule") && (
        <OptionChips
          label="Taken with food?"
          options={[
            { value: true, label: "Yes" },
            { value: false, label: "No" },
            { value: null, label: "Not recorded" },
          ]}
          value={takenWithFood}
          onChange={setTakenWithFood}
          labelClass={SHEET_LABEL_TEXT}
          chipClass="inline-flex min-h-[52px] flex-1 min-w-0 items-center justify-center gap-1.5 rounded-full px-3 text-center text-[15px]"
          selectedClass={SHEET_CHIP_ON}
          unselectedClass={SHEET_CHIP_OFF}
          wrapClass="flex gap-2"
        />
      )}

      {activeRoute === "transdermal" && (
        <>
          <SheetField label="Patch site">
            <input type="text" value={patchSite} onChange={(e) => setPatchSite(e.target.value)} placeholder="e.g. Abdomen, upper arm" className={SHEET_FIELD} />
          </SheetField>
          <SheetField label="Application date">
            <DateInput value={applicationDate} onChange={setApplicationDate} ariaLabel="Application date" fieldClass={SHEET_DATE_FIELD} />
          </SheetField>
        </>
      )}

      {(activeRoute === "topical_cream" || activeRoute === "topical_serum" || activeRoute === "topical_gel") && (
        <>
          <SheetField label="Body area">
            <input type="text" value={bodyArea} onChange={(e) => setBodyArea(e.target.value)} placeholder="e.g. Face, left cheek" className={SHEET_FIELD} />
          </SheetField>
          <SheetField label="Application notes">
            <textarea value={applicationNotes} onChange={(e) => setApplicationNotes(e.target.value)} className={SHEET_TEXTAREA} />
          </SheetField>
        </>
      )}

      {activeRoute === "implant" && (
        <>
          <SheetField label="Clinic or location">
            <input type="text" value={clinicLocation} onChange={(e) => setClinicLocation(e.target.value)} className={SHEET_FIELD} />
          </SheetField>
          <SheetField label="Insertion date">
            <DateInput value={insertionDate} onChange={setInsertionDate} ariaLabel="Insertion date" fieldClass={SHEET_DATE_FIELD} />
          </SheetField>
        </>
      )}

      {activeRoute === "pump_infusion" && (
        <>
          <SheetField label="Pump rate">
            <input type="number" min="0" step="0.1" value={pumpRate} onChange={(e) => setPumpRate(e.target.value)} className={SHEET_FIELD} />
          </SheetField>
          <SheetField label="Site change date">
            <DateInput value={siteChangeDate} onChange={setSiteChangeDate} ariaLabel="Site change date" fieldClass={SHEET_DATE_FIELD} />
          </SheetField>
        </>
      )}

      {/* Reconstitution fields */}
      {isReconstituted && (
        <>
          <p className={SHEET_LABEL_TEXT}>Reconstitution</p>
          <SheetField label="Reconstitution date">
            <DateInput value={reconstitutionDate} onChange={setReconstitutionDate} ariaLabel="Reconstitution date" fieldClass={SHEET_DATE_FIELD} />
          </SheetField>
          <SheetField label="In-use expiry date">
            <DateInput value={inUseExpiry} onChange={setInUseExpiry} ariaLabel="In-use expiry date" fieldClass={SHEET_DATE_FIELD} />
          </SheetField>
        </>
      )}

      {/* Repeat this dose — weekly repeat schedule. A daily product has no weekly
          repeat, so the option is not offered. */}
      {!editingShot && !isWeeklyMedication && (
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Repeats run on a weekly cycle, so they are not offered for a daily medication. Log each daily dose from the dose card.
        </p>
      )}
      {!editingShot && isWeeklyMedication && (
        <RepeatOptionsField
          enabled={repeatOn}
          onToggle={setRepeatOn}
          mode={repeatMode}
          onModeChange={setRepeatMode}
          weeks={repeatWeeks}
          onWeeksChange={setRepeatWeeks}
          schedule={schedule}
          dayKey={date}
          time={time}
          medication={medication}
          dose={dose}
          doseUnit={doseUnit}
        />
      )}

      {/* Pain level: optional, and empty until it is moved */}
      <div>
        <div className="flex items-baseline justify-between gap-2 mb-2">
          <label htmlFor="shot-pain" className={SHEET_LABEL_TEXT}>Pain level</label>
          <span className="flex items-center gap-1">
            <span className={pain == null
              ? SHEET_HINT
              : "text-sm font-medium text-indigo-600 dark:text-indigo-400"}>
              {pain == null ? "Not set" : `${pain} of 10`}
            </span>
            <ClearFieldButton show={pain != null} onClear={() => setPain(null)} />
          </span>
        </div>
        <input
          id="shot-pain"
          type="range" min="0" max="10"
          value={pain ?? 0}
          onChange={(e) => setPain(Number(e.target.value))}
          className="pain-slider w-full"
          style={{ "--pain-fill": `${Math.round(((pain ?? 0) / 10) * 100)}%` }}
          aria-label="Pain level"
          aria-valuetext={pain == null ? "Not set" : `${pain} out of 10`}
        />
        <div className="mt-1 flex justify-between">
          <span className={SHEET_HINT}>No pain</span>
          <span className={SHEET_HINT}>Severe</span>
        </div>
      </div>

      {/* Notes */}
      <SheetField label="Notes">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add a note"
          className={SHEET_TEXTAREA}
        />
      </SheetField>
    </div>
  );
}