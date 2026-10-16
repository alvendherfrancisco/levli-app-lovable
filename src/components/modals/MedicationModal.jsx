import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { useAppState } from "@/lib/AppState";
import useModal from "@/hooks/useModal";
import useDiscardConfirm from "@/hooks/useDiscardConfirm";
import { hasChanged } from "@/lib/formValidity";
import { toast } from "@/lib/toast";
import { sound } from "@/lib/sounds";
import { logWords } from "@/lib/medicationForm";
import { ROUTE_CHOICES, getRouteChoices } from "@/lib/shotDefaults";
import {
  findMedicationOption, isLabelStrength, plainDateLabel, validateRegimenForm,
} from "@/lib/medicationRegimen";
import {
  FREQUENCY_INFO, MULTIPLE_GLP1_NOTE, emptySchedule, hasSecondGlp1Gip,
  medicationScheduleFields, scheduleStateFromRecord,
} from "@/lib/medicationSchedule";
import SheetField from "@/components/modals/shot/SheetField";
import SheetPickerRow from "@/components/modals/shot/SheetPickerRow";
import SheetSelect from "@/components/modals/shot/SheetSelect";
import { SHEET_DIVIDER, SHEET_HINT, SHEET_LABEL_TEXT } from "@/components/modals/shot/sheetUi";
import MedicationSelect from "@/components/medications/MedicationSelect";
import MedicationInfoCard from "@/components/medications/MedicationInfoCard";
import RegimenDoseField from "@/components/medications/RegimenDoseField";
import RegimenStartDate from "@/components/medications/RegimenStartDate";
import RegimenDetailsFields from "@/components/medications/RegimenDetailsFields";
import ReminderField from "@/components/medications/ReminderField";
import SupplyFields from "@/components/medications/SupplyFields";
import { defaultSupplyUnit, supplyUnitOr } from "@/lib/supplyTracking";

const pad = (n) => String(n).padStart(2, "0");
function todayInput() { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }

/** The single line shown under the save button. */
const FOOTER_NOTE = "This app is a tracker, not medical advice.";

/**
 * Add / Edit Medication — one sheet, in the Add shot sheet's own style.
 *
 * The medication is asked for first: a searchable, grouped list that folds away
 * to a single row once one is chosen, with a small card stating what is known
 * about it (how it is taken, its usual schedule, the strengths its label lists).
 * With a medication in hand the basics follow — starting dose, route, start date —
 * and everything else waits behind "More details", so the form stays short.
 *
 * Nothing here suggests or adjusts a dose: every strength offered is one the
 * product's label lists, and anything else is only ever typed from the
 * prescription and checked against it.
 */
export default function MedicationModal({ open, onClose, editing }) {
  const {
    addMedication, updateMedication, linkShotsToMedication, medications, shots, profile,
  } = useAppState();

  const [selectedName, setSelectedName] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customGeneric, setCustomGeneric] = useState("");
  const [route, setRoute] = useState("");
  const [dose, setDose] = useState("");
  const [doseSuggested, setDoseSuggested] = useState(false);
  const [doseConfirmed, setDoseConfirmed] = useState(false);
  const [unit, setUnit] = useState("mg");
  const [schedule, setSchedule] = useState(() => emptySchedule("", todayInput()));
  const [startDate, setStartDate] = useState(todayInput());
  const [showDetails, setShowDetails] = useState(false);
  const [indication, setIndication] = useState("");
  const [indicationOther, setIndicationOther] = useState("");
  const [plannedEndDate, setPlannedEndDate] = useState("");
  const [doseStep, setDoseStep] = useState("");
  // The interval a prescriber directed for this one medication, if any. Empty
  // means the medication's own interval, or its label's, decides the next dose.
  const [intervalOverride, setIntervalOverride] = useState("");
  const [status, setStatus] = useState("active");
  const [notes, setNotes] = useState("");
  // Supply tracking: off unless it is turned on, and its three numbers are only
  // asked for while it is on (see src/components/medications/SupplyFields.jsx).
  const [trackSupply, setTrackSupply] = useState(false);
  const [dosesLeft, setDosesLeft] = useState("");
  const [supplyUnit, setSupplyUnit] = useState("doses");
  const [supplyExpiry, setSupplyExpiry] = useState("");
  const [supplyLot, setSupplyLot] = useState("");
  // Strengths typed through "+ Other" and kept, so they are offered as chips next
  // time (they are saved on the record with the rest of the regimen).
  const [rememberedDoses, setRememberedDoses] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  // The reason the save button is dimmed, said only once it has been tapped.
  const [saveHint, setSaveHint] = useState("");
  const [dupOpen, setDupOpen] = useState(false);
  // True while a keyboard-raising field holds focus, so the form gets the tail
  // space it needs to keep that field clear of the keyboard and the Save button.
  const [typing, setTyping] = useState(false);
  // The form as the record was loaded, so an untouched edit has nothing to save.
  const [savedFields, setSavedFields] = useState({});
  const dupCardRef = useRef(null);
  const detailsRef = useRef(null);
  const bodyRef = useRef(null);

  /** The dose last saved for this medication, if the user has one. */
  const lastSavedDose = (name) => {
    const regimen = medications.find((m) => m.medication_name === name && m.prescribed_dose != null);
    if (regimen) return Number(regimen.prescribed_dose);
    const shot = shots.find((s) => s.medication === name && s.dose != null);
    return shot ? Number(shot.dose) : null;
  };

  useEffect(() => {
    if (!open) return;
    const today = todayInput();

    setErrors({});
    setSaveHint("");
    setDupOpen(false);
    setDoseSuggested(false);
    setDoseConfirmed(false);
    setShowDetails(false);
    setRememberedDoses([]);
    setTrackSupply(false); setDosesLeft(""); setSupplyUnit("doses"); setSupplyExpiry(""); setSupplyLot("");
    setIntervalOverride("");

    if (editing) {
      const stored = editing.medication_name || "";
      const option = findMedicationOption(stored);
      const storedIndication = String(editing.indication || "").trim();
      const storedSchedule = scheduleStateFromRecord(editing, option ? option.value : stored, today);
      const storedStart = editing.start_date || today;
      const storedIndicationValue = ["Type 2 diabetes", "Weight management", "Heart health"].includes(storedIndication)
        ? storedIndication : storedIndication ? "Other" : "";
      const storedIndicationOther = ["Type 2 diabetes", "Weight management", "Heart health"].includes(storedIndication)
        ? "" : storedIndication;
      const storedRoute = editing.route || option?.route || "";

      setSelectedName(option ? option.value : "");
      setIsCustom(!option);
      setCustomName(option ? "" : stored);
      setDose(editing.prescribed_dose != null ? String(editing.prescribed_dose) : "");
      setUnit(editing.dose_unit || option?.unit || "mg");
      setRoute(storedRoute);
      setSchedule(storedSchedule);
      setIndication(storedIndicationValue);
      setIndicationOther(storedIndicationOther);
      setStartDate(storedStart);
      setPlannedEndDate(editing.planned_end_date || "");
      setDoseStep(editing.titration_stage || "");
      setIntervalOverride(editing.custom_interval_days != null ? String(editing.custom_interval_days) : "");
      setStatus(editing.status || "active");
      setNotes(editing.notes || "");
      setTrackSupply(!!editing.track_supply);
      setDosesLeft(editing.doses_left != null ? String(editing.doses_left) : "");
      setSupplyUnit(supplyUnitOr(editing.supply_unit, stored));
      setSupplyExpiry(editing.supply_expiry_date || "");
      setSupplyLot(editing.lot_number || "");
      // A regimen that already carries details opens with them visible.
      setShowDetails(!!(editing.indication || editing.planned_end_date || editing.titration_stage
        || editing.prescriber_name || editing.prescriber_contact || editing.notes));
      // The same values as they were loaded, for "has anything changed?".
      setSavedFields({
        selectedName: option ? option.value : "", isCustom: !option, customName: option ? "" : stored,
        route: storedRoute, dose: editing.prescribed_dose != null ? String(editing.prescribed_dose) : "",
        unit: editing.dose_unit || option?.unit || "mg", schedule: storedSchedule, startDate: storedStart,
        plannedEndDate: editing.planned_end_date || "", doseStep: editing.titration_stage || "",
        indication: storedIndicationValue, indicationOther: storedIndicationOther,
        intervalOverride: editing.custom_interval_days != null ? String(editing.custom_interval_days) : "",
        status: editing.status || "active", notes: editing.notes || "",
        trackSupply: !!editing.track_supply,
        dosesLeft: editing.doses_left != null ? String(editing.doses_left) : "",
        supplyUnit: supplyUnitOr(editing.supply_unit, stored),
        supplyExpiry: editing.supply_expiry_date || "",
        supplyLot: editing.lot_number || "",
      });
    } else {
      setSelectedName(""); setIsCustom(false); setCustomName(""); setCustomGeneric("");
      setDose(""); setUnit("mg"); setRoute(""); setSchedule(emptySchedule("", today));
      setIndication(""); setIndicationOther("");
      setStartDate(today); setPlannedEndDate(""); setDoseStep("");
      setIntervalOverride("");
      setStatus("active"); setNotes("");
      setSavedFields({
        selectedName: "", isCustom: false, customName: "", route: "", dose: "", unit: "mg",
        schedule: emptySchedule("", today), startDate: today, plannedEndDate: "", doseStep: "",
        indication: "", indicationOther: "", status: "active", notes: "",
        intervalOverride: "",
        trackSupply: false, dosesLeft: "", supplyUnit: "doses", supplyExpiry: "", supplyLot: "",
      });
    }
  }, [open, editing]);

  // The medication in hand, as the form reads it: a listed product, a name typed
  // by hand, or nothing yet.
  const option = isCustom ? null : findMedicationOption(selectedName);
  const labelStrengths = option?.strengths || [];
  const chosenName = isCustom ? customName.trim() : selectedName;
  const ready = !!chosenName;

  // What the prescriber line under More details names: the prescriber saved in
  // Profile, which is the one place it is entered.
  const prescriberLabel = [profile?.prescriber_name, profile?.prescriber_contact]
    .map((v) => String(v || "").trim())
    .filter(Boolean)
    .join(" · ");

  /** The strengths offered as chips: the label's own, plus any kept from "Other". */
  const doseValues = useMemo(() => {
    const values = [
      ...labelStrengths.map((s) => s.value),
      ...(editing?.custom_doses || []),
      ...rememberedDoses,
    ].map(Number).filter(Number.isFinite);
    return [...new Set(values)].sort((a, b) => a - b);
  }, [option, editing, rememberedDoses]);

  // A dose the label does not list is never blocked — it only has to be checked
  // against the prescription. A product with no strength list (a compounded or
  // research one) has nothing to check, so it is never asked for.
  const needsDoseConfirm = !isCustom && labelStrengths.length > 0
    && String(dose).trim() !== "" && !isLabelStrength(selectedName, dose);

  const routeOptions = isCustom ? ROUTE_CHOICES : getRouteChoices(selectedName);
  const routeLabel = route
    ? ROUTE_CHOICES.concat(routeOptions).find((o) => o.value === route)?.label || route
    : "";

  // A second GLP-1 / GIP medicine: a neutral note, never a block.
  const secondGlp1 = !!chosenName && hasSecondGlp1Gip(medications, chosenName);

  /**
   * The first thing missing or wrong in the regimen form, or null. Run live to
   * gate the save and again by the save itself, so a dimmed button and a refused
   * save can never disagree.
   */
  const problem = validateRegimenForm({
    selectedName, isCustom, customName, dose, doseConfirmed,
    isStandardDose: !isCustom && (!labelStrengths.length || isLabelStrength(selectedName, String(dose ?? "").trim())),
    startDate, plannedEndDate,
  });

  // Everything the form holds, against what the record was loaded with.
  const currentFields = {
    selectedName, isCustom, customName, route, dose, unit, schedule, startDate,
    plannedEndDate, doseStep, indication, indicationOther,
    status, notes, intervalOverride,
    trackSupply, dosesLeft, supplyUnit, supplyExpiry, supplyLot,
  };
  const edited = hasChanged(currentFields, savedFields);
  const canSave = !saving && !problem && (!editing || edited);

  const { requestClose, dialog } = useDiscardConfirm({ dirty: () => (!editing || edited), onClose });
  const sheetRef = useModal({ open, onDismiss: requestClose });

  // The card the duplicate question is asked on is brought into view the moment
  // it appears, so the tap that raised it is answered where the eye already is.
  useEffect(() => {
    if (!dupOpen) return;
    const card = dupCardRef.current;
    const scroller = bodyRef.current;
    if (!card || !scroller) return;
    card.focus({ preventScroll: true });
    const raf = requestAnimationFrame(() => {
      const cardRect = card.getBoundingClientRect();
      const scrollerRect = scroller.getBoundingClientRect();
      scroller.scrollTo({
        top: Math.max(0, scroller.scrollTop + (cardRect.top - scrollerRect.top)
          - (scroller.clientHeight - cardRect.height) / 2),
        behavior: "smooth",
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [dupOpen]);

  // A hint belongs to the answer it was about: changing anything clears it, and
  // the field it named with it.
  useEffect(() => {
    setSaveHint("");
    setErrors((prev) => (Object.keys(prev).length ? {} : prev));
  }, [selectedName, customName, isCustom, dose, startDate, plannedEndDate]);

  if (!open) return null;

  const filledDetails = [indication, indicationOther, plannedEndDate, doseStep,
    intervalOverride, notes].filter(Boolean).length;

  const clearError = (field) => setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));

  /** A listed product is chosen: its own strengths, unit and route take over. */
  const chooseProduct = (name) => {
    // Tapping the one already chosen only keeps it: nothing is reset.
    if (!isCustom && name === selectedName) return;
    setErrors({});
    setSaveHint("");
    setDupOpen(false);
    setDoseConfirmed(false);
    // A strength kept from "+ Other" belongs to the medication it was typed for.
    setRememberedDoses([]);
    const picked = findMedicationOption(name);
    setSelectedName(name);
    setIsCustom(false);
    setCustomName("");
    setCustomGeneric("");
    setRoute(picked?.route || "");
    setUnit(picked?.unit || "mg");
    // A supply count is counted in the new product's own terms.
    setSupplyUnit(defaultSupplyUnit(name));
    // The label's lowest strength is only pre-filled when nothing was saved for
    // this medication before — an existing dose is never silently changed.
    const lowest = picked?.strengths?.[0]?.value;
    if (lastSavedDose(name) == null && lowest != null) {
      setDose(String(lowest));
      setDoseSuggested(true);
    } else {
      setDose("");
      setDoseSuggested(false);
    }
    // The new product's own schedule: nothing carries over from the last one.
    setSchedule(emptySchedule(name, todayInput()));
  };

  /** A name typed by hand: nothing is known about it, so nothing is assumed. */
  const changeCustomName = (value) => {
    setErrors({});
    setSaveHint("");
    if (!isCustom) {
      setIsCustom(true);
      setSelectedName("");
      setDose("");
      setDoseSuggested(false);
      setUnit("mg");
      setSupplyUnit(defaultSupplyUnit(""));
      setRoute("");
      setRememberedDoses([]);
      setSchedule(emptySchedule("", todayInput()));
    }
    setCustomName(value);
  };

  const changeDose = (value) => {
    setDose(value === "" || value == null ? "" : String(value));
    setDoseSuggested(false);
    setDoseConfirmed(false);
    clearError("dose");
  };

  /** A strength typed through "+ Other": kept, so it is a chip next time. */
  const addCustomDose = (value) => {
    const number = Number(value);
    if (!Number.isFinite(number) || number <= 0) return;
    setRememberedDoses((prev) => (prev.includes(number) ? prev : [...prev, number]));
    changeDose(number);
  };

  const activeDuplicate = (name) =>
    medications.some((m) => m.medication_name === name && (!m.status || m.status === "active"));

  const save = async (confirmedDuplicate = false) => {
    const finalName = isCustom ? customName.trim() : selectedName;
    const doseNum = Number(String(dose ?? "").trim());

    // The medication is required, and the one thing most often tapped too early:
    // the reason is said beside the button and again on the field itself.
    if (problem) {
      sound.warning();
      setSaveHint(problem.message);
      setErrors({ [problem.field]: problem.message });
      if (problem.field === "plannedEndDate") setShowDetails(true);
      return;
    }
    // A medication already running is asked about once, before it is added again.
    if (!editing && !confirmedDuplicate && activeDuplicate(finalName)) {
      sound.warning();
      setDupOpen(true);
      return;
    }
    // An edit with nothing changed has nothing to save.
    if (editing && !edited) {
      sound.tap();
      setSaveHint("Nothing has changed yet.");
      return;
    }

    setSaving(true);
    setSaveHint("");
    setDupOpen(false);
    const payload = {
      medication_name: finalName,
      generic_name: option?.generic || (isCustom ? customGeneric.trim() : ""),
      route,
      prescribed_dose: doseNum,
      dose_unit: unit || "mg",
      ...medicationScheduleFields(schedule),
      // A cleared indication is saved empty, never as the word "undefined".
      indication: (indication === "Other" ? indicationOther.trim() : indication) || "",
      start_date: startDate,
      planned_end_date: plannedEndDate || null,
      titration_stage: doseStep,
      // The prescriber is read from Profile — the one place it is entered.
      prescriber_name: profile?.prescriber_name || editing?.prescriber_name || "",
      prescriber_contact: profile?.prescriber_contact || editing?.prescriber_contact || "",
      // The interval a prescriber directed for this medication, when one is set.
      custom_interval_days: intervalOverride !== "" && Number.isFinite(Number(intervalOverride))
        ? Math.max(1, Number(intervalOverride))
        : null,
      status,
      notes,
      // Supply tracking. With the toggle off the three numbers are written back
      // exactly as they were loaded, so turning it off never wipes a count.
      track_supply: trackSupply,
      doses_left: dosesLeft !== "" && Number.isFinite(Number(dosesLeft))
        ? Math.max(0, Number(dosesLeft))
        : null,
      supply_unit: supplyUnit || "doses",
      supply_expiry_date: supplyExpiry || null,
      lot_number: supplyLot.trim(),
      regimen_source: "user-entered",
      // Filling in the form is what completes a regimen that was created from a
      // log, so its "needs details" mark is cleared here.
      needs_details: false,
    };
    // A regimen marked stopped ends today, so its schedule pauses with it.
    if (status === "discontinued" && !editing?.discontinued_date) payload.discontinued_date = todayInput();
    if (rememberedDoses.length) {
      payload.custom_doses = [...new Set([...(editing?.custom_doses || []), ...rememberedDoses])];
    }

    const words = logWords(finalName, { custom: isCustom, route });
    try {
      if (editing) {
        await updateMedication(editing.id, payload);
        await linkShotsToMedication(payload.medication_name, editing.id);
        toast.success("Medication updated");
      } else {
        const rec = await addMedication(payload);
        // Every log for this medication is linked to the new record.
        const linked = await linkShotsToMedication(payload.medication_name, rec.id);
        toast.success(linked
          ? `Medication added — ${linked} ${words.one} log${linked === 1 ? "" : "s"} linked`
          : "Medication added");
      }
      sound.success();
      setSaving(false);
      setTimeout(() => onClose(), 300);
    } catch (err) {
      console.error("Could not save the medication:", err);
      toast.error("Couldn't save. Please try again.", { actionLabel: "Retry", onAction: () => save(true) });
      setSaving(false);
    }
  };

  /** A field that raises the on-screen keyboard. A date or a time never does. */
  const isTypingField = (el) => {
    if (!el) return false;
    if (el.tagName === "TEXTAREA") return true;
    if (el.tagName !== "INPUT") return false;
    return !["date", "time", "range", "checkbox", "radio", "file", "color", "button", "submit"].includes(el.type);
  };

  // The field in hand is brought to the middle of what is left of the sheet once
  // the keyboard has risen, so it is never sitting behind the Save button.
  const handleFieldFocus = (e) => {
    const el = e.target;
    setTyping(isTypingField(el));
    setTimeout(() => {
      try { el.scrollIntoView({ block: "center", behavior: "smooth" }); } catch { /* ignore */ }
    }, 180);
  };

  const handleFieldBlur = () => {
    // Let the next focus land first, then see who holds focus now.
    setTimeout(() => {
      const el = document.activeElement;
      setTyping(isTypingField(el) && !!bodyRef.current?.contains(el));
    }, 0);
  };

  const toggleDetails = () => {
    const next = !showDetails;
    if (next) sound.open(); else sound.close();
    setShowDetails(next);
    if (!next) return;
    requestAnimationFrame(() => {
      const node = detailsRef.current;
      const scroller = bodyRef.current;
      if (!node || !scroller) return;
      const offset = node.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
      scroller.scrollTo({ top: Math.max(0, scroller.scrollTop + offset - 16), behavior: "smooth" });
    });
  };

  return (
    <>
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 overlay-lock" onClick={requestClose} aria-hidden="true" />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="medication-modal-title"
        tabIndex={-1}
        className="relative flex flex-col w-full sm:max-w-[520px] max-h-[92dvh] overflow-hidden sheet-lock bg-white dark:bg-[#0f1117] rounded-t-3xl sm:rounded-3xl animate-in slide-in-from-bottom sm:mx-4 dark:shadow-[0_-8px_40px_rgba(0,0,0,0.5)] outline-none"
      >
        <div className="shrink-0 bg-white dark:bg-[#0f1117]">
          <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-white/20" /></div>
          <div className="flex items-center justify-between gap-3 px-5 pb-4 pt-1">
            <h2 id="medication-modal-title" className="min-w-0 truncate text-[20px] font-semibold leading-tight text-gray-900 dark:text-[#E8E9F0]">
              {editing ? "Edit Medication" : "Add Medication"}
            </h2>
            <button onClick={requestClose} aria-label="Close" className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center">
              <X size={22} className="text-gray-400" />
            </button>
          </div>
          {/* The day this regimen starts, said at the top — the same line the Log
              shot sheet opens with. */}
          {plainDateLabel(startDate) && (
            <p className="px-5 pb-3 text-[13px] font-medium text-indigo-600 dark:text-indigo-400">
              Starting {plainDateLabel(startDate)}
            </p>
          )}
        </div>

        <div
          ref={bodyRef}
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden no-scrollbar overscroll-contain"
          onFocusCapture={handleFieldFocus}
          onBlurCapture={handleFieldBlur}
        >
          <div className="px-5 pb-6 space-y-4">
            <MedicationSelect
              name={selectedName}
              isCustom={isCustom}
              customName={customName}
              customGeneric={customGeneric}
              onChoose={chooseProduct}
              onCustomName={changeCustomName}
              onCustomGeneric={setCustomGeneric}
              error={errors.name}
            />

            {option && <MedicationInfoCard name={option.value} />}

            {/* Two GLP-1 / GIP medicines at once: a neutral note only. Nothing is
                blocked here and no advice is given. */}
            {secondGlp1 && (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm leading-snug text-amber-800 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-200">
                {MULTIPLE_GLP1_NOTE}
              </p>
            )}

            {/* Only once there is a medication to describe: the dose, the route and
                the start date. Everything else waits behind More details. */}
            {ready && (
              <>
                <RegimenDoseField
                  medication={chosenName}
                  options={doseValues}
                  value={dose}
                  unit={unit}
                  onChange={changeDose}
                  onUnitChange={setUnit}
                  onAddCustom={addCustomDose}
                  confirmed={doseConfirmed}
                  onConfirmedChange={(v) => { setDoseConfirmed(v); clearError("dose"); }}
                  needsConfirm={needsDoseConfirm}
                  suggested={doseSuggested}
                  error={errors.dose}
                />

                {/* A pen or a tablet is a fact about the product, so the route is
                    shown rather than asked for. A name typed by hand has no such
                    fact, so there the route is chosen. */}
                {isCustom ? (
                  <SheetSelect
                    id="regimen-route"
                    label="Route"
                    value={route}
                    onChange={setRoute}
                    options={ROUTE_CHOICES}
                  />
                ) : (
                  <SheetField label="Route">
                    <SheetPickerRow value={routeLabel} placeholder="Not set" />
                  </SheetField>
                )}

                <RegimenStartDate
                  value={startDate}
                  onChange={(v) => { setStartDate(v); clearError("startDate"); }}
                  error={errors.startDate}
                />

                {/* The reminder for a dose day: on to begin with, off in one tap,
                    and asked only where there is a schedule for it to remind
                    about — its frequency and day are under More details. */}
                {FREQUENCY_INFO[schedule.kind] && (
                  <ReminderField
                    value={schedule.reminderTime}
                    onChange={(reminderTime) => setSchedule((prev) => ({ ...prev, reminderTime }))}
                  />
                )}

                <div className={`${SHEET_DIVIDER} pt-2`}>
                  <button
                    type="button"
                    onClick={toggleDetails}
                    aria-expanded={showDetails}
                    className="flex w-full items-center justify-between gap-2 py-3"
                  >
                    <span className="flex items-center gap-2">
                      <span className={SHEET_LABEL_TEXT}>
                        More details (optional)
                      </span>
                      {!showDetails && filledDetails > 0 && (
                        <span className="text-[11px] font-medium text-indigo-500 dark:text-indigo-400">
                          · {filledDetails} filled in
                        </span>
                      )}
                    </span>
                    <ChevronDown
                      size={18}
                      aria-hidden="true"
                      className={`text-gray-400 transition-transform ${showDetails ? "rotate-180" : ""}`}
                    />
                  </button>

                  {showDetails && (
                    <RegimenDetailsFields
                      innerRef={detailsRef}
                      medication={chosenName}
                      schedule={schedule}
                      onScheduleChange={(next) => { setSchedule(next); clearError("schedule"); }}
                      scheduleError={errors.schedule}
                      indication={indication}
                      onIndicationChange={setIndication}
                      indicationOther={indicationOther}
                      onIndicationOtherChange={setIndicationOther}
                      indicationError={errors.indication}
                      doseStep={doseStep}
                      onDoseStepChange={setDoseStep}
                      intervalDays={intervalOverride}
                      onIntervalDaysChange={setIntervalOverride}
                      prescriberLabel={prescriberLabel}
                      plannedEndDate={plannedEndDate}
                      onPlannedEndDateChange={(v) => { setPlannedEndDate(v); clearError("plannedEndDate"); }}
                      plannedEndDateError={errors.plannedEndDate}
                      notes={notes}
                      onNotesChange={setNotes}
                      // A status belongs to a regimen that is already running, so
                      // it is only offered while editing one.
                      showStatus={!!editing}
                      status={status}
                      onStatusChange={setStatus}
                    >
                      {/* How much is left, when it expires and which lot it is —
                          off by default, and only ever what the user chooses to
                          keep. */}
                      <SupplyFields
                        trackSupply={trackSupply}
                        onTrackSupplyChange={(next) => {
                          setTrackSupply(next);
                          // Turning it on starts the count in the unit this
                          // medication is counted in.
                          if (next) setSupplyUnit((prev) => supplyUnitOr(prev, chosenName));
                        }}
                        dosesLeft={dosesLeft}
                        onDosesLeftChange={setDosesLeft}
                        unit={supplyUnit}
                        onUnitChange={setSupplyUnit}
                        expiryDate={supplyExpiry}
                        onExpiryDateChange={setSupplyExpiry}
                        lotNumber={supplyLot}
                        onLotNumberChange={setSupplyLot}
                      />
                    </RegimenDetailsFields>
                  )}
                </div>
              </>
            )}

            {/* A medication that is already running: asked about once. */}
            {dupOpen && (
              <div
                ref={dupCardRef}
                tabIndex={-1}
                role="alert"
                aria-live="assertive"
                className="rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-700 outline-none animate-duplicate-glow dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-300"
              >
                <p className="font-semibold">You already have {chosenName} active.</p>
                <p className="mt-1">Add another?</p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => save(true)}
                    className="btn-pill btn-pill-sm bg-orange-600 text-white"
                  >
                    Add another
                  </button>
                  <button type="button" onClick={() => setDupOpen(false)} className="btn-pill btn-pill-sm btn-secondary">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* With the keyboard up, this tail space is what lets the last field in
              the form scroll clear of it instead of sitting behind it. */}
          {typing && <div className="h-28" aria-hidden="true" />}
        </div>

        <div
          className="shrink-0 border-t border-gray-100 bg-white px-5 pt-4 dark:border-white/[0.08] dark:bg-[#0f1117]"
          style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))" }}
        >
          {saveHint && (
            <p role="status" className={`${SHEET_HINT} mb-2 text-center`}>{saveHint}</p>
          )}
          <button
            type="button"
            onClick={() => save()}
            aria-disabled={!canSave || undefined}
            className="w-full btn-pill btn-primary"
          >
            {saving ? "Saving…" : editing ? "Update" : "Save"}
          </button>
          <p className="mt-2.5 text-center text-xs leading-snug text-gray-500 dark:text-[#9A9DAE]">{FOOTER_NOTE}</p>
        </div>
      </div>
    </div>
    {dialog}
    </>
  );
}