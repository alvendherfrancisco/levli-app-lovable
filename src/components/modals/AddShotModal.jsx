import React, { useState, useEffect, useRef } from "react";
import { X, Save, Star, ChevronDown, Trash2, Plus, Pill } from "lucide-react";
import CustomMedicationFields from "@/components/modals/CustomMedicationFields";
import MedicationModal from "@/components/modals/MedicationModal";
import { getIntervalDays, getMedicationConfig, validateDosePair } from "@/lib/medicationConfig";
import { pickerMedications } from "@/lib/medicationLink";
import { useAppState } from "@/lib/AppState";
import { MEDICATIONS, DRUG_CLASS, isInvestigational, getDoseMax, getMolecularClass, isCompoundedGeneric } from "@/lib/medicationData";
import { getShotDeviceOptions, getDeliveryMethodLabel, RETIRED_DELIVERY_METHODS } from "@/lib/deliveryMethods";
import { getCapabilityProfile, getCapabilityWarning, getMolecularClassLabel } from "@/lib/capabilityProfile";
import { detectDuplicateActiveIngredient } from "@/lib/drugSafety";
import { convertDose, doseUnitLabel } from "@/lib/units";
import { parseShotDate, formatShotDate, calendarDaysBetween } from "@/lib/dateUtils";
import {
  INJECTABLE_ROUTES, ROUTE_CHOICES, getRouteChoices, getDefaultRoute,
  getDefaultDeviceType, activeRegimensFor, getDoseDefault, getSmartShotDefaults,
} from "@/lib/shotDefaults";
import { addDaysToKey } from "@/lib/repeatSchedule";
import ShotRouteDeviceFields from "@/components/modals/ShotRouteDeviceFields";
import RepeatOptionsField from "@/components/modals/RepeatOptionsField";
import DoseChips from "@/components/modals/DoseChips";
import { chipsForMedication, withCustomDose } from "@/lib/doseOptions";
import ShotSuccessPanel from "@/components/modals/ShotSuccessPanel";
import SideEffectsModal from "@/components/modals/SideEffectsModal";
import ConfirmDialog from "@/components/ConfirmDialog";
import useModal from "@/hooks/useModal";
import { toast } from "@/lib/toast";
import { sound } from "@/lib/sounds";

// SC injection sites
const scSites = [
  "Stomach – Upper Left", "Stomach – Upper Right", "Stomach – Lower Left", "Stomach – Lower Right",
  "Thigh – Left", "Thigh – Right", "Upper Arm – Left", "Upper Arm – Right",
];
// IM injection sites
const imSites = [
  "Deltoid – Left", "Deltoid – Right", "Vastus Lateralis – Left", "Vastus Lateralis – Right",
  "Gluindigo – Left", "Gluindigo – Right",
];
// Intradermal sites
const idSites = [
  "Inner Forearm – Left", "Inner Forearm – Right",
  "Upper Arm – Left", "Upper Arm – Right",
  "Upper Back – Left", "Upper Back – Right",
];

const pad = (n) => String(n).padStart(2, "0");
function toInputDate(d) { return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
function toInputTime(d) { return `${pad(d.getHours())}:${pad(d.getMinutes())}`; }
function toShotTime(d) {
  const h = d.getHours(), m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${pad(m)} ${ampm}`;
}

/**
 * Whether an element is one that raises the on-screen keyboard. Only these
 * matter for scrolling clear of it and for putting it away again — a date,
 * time, slider or checkbox field never opens a keyboard.
 */
function isTypingField(el) {
  if (!el) return false;
  if (el.tagName === "TEXTAREA") return true;
  if (el.tagName !== "INPUT") return false;
  return !["range", "checkbox", "radio", "date", "time", "file", "color", "button", "submit"].includes(el.type);
}

export default function AddShotModal({ open, onClose, editingShot, initialValues }) {
  const { addShot, updateShot, deleteShot, profile, setProfile, getRecommendedSite, shots, medications,
    repeatSchedules, addRepeatSchedule, updateRepeatSchedule, addMedicationCustomDose } = useAppState();
  const confirmedDupRef = useRef(false);
  // The "Possible duplicate" card and the modal's own scroll container.
  const dupCardRef = useRef(null);
  const scrollRef = useRef(null);

  const defaultMed = profile?.default_medication || "Ozempic®";
  const now = new Date();

  const [pain, setPain] = useState(0);
  // Starts empty: what is offered comes from the user's own medications, which
  // the opening effect resolves before anything is shown as selected.
  const [medication, setMedication] = useState("");
  // Drug name for an "Other / custom (prescriber-directed)" entry.
  const [customName, setCustomName] = useState("");
  const [medicationId, setMedicationId] = useState("");
  const [dose, setDose] = useState("2.50");
  const [doseUnit, setDoseUnit] = useState("mg");
  const [concentration, setConcentration] = useState("");
  const [site, setSite] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(toInputDate(now));
  const [time, setTime] = useState(toInputTime(now));
  const [showMedDropdown, setShowMedDropdown] = useState(false);
  const [showSiteDropdown, setShowSiteDropdown] = useState(false);
  const [route, setRoute] = useState("");
  const [deviceType, setDeviceType] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  // Route and Device type as the app pre-filled them, so the "Add details
  // (optional)" label can show a short summary once either is changed.
  const [defaults, setDefaults] = useState({ route: "", device: "" });
  const [duplicatePrompt, setDuplicatePrompt] = useState(null);
  // Bumped every time the warning shows, so its highlight replays each time.
  const [dupNonce, setDupNonce] = useState(0);
  const [reporting, setReporting] = useState(false);
  // The Add Medication form, opened from the picker when Meds is empty.
  const [addMedOpen, setAddMedOpen] = useState(false);
  // True while a keyboard-raising field holds focus, so the content gets tail
  // space to be scrolled clear of the keyboard.
  const [typing, setTyping] = useState(false);

  // Repeat schedule (weekly repeat of the dose being logged)
  const [repeatOn, setRepeatOn] = useState(false);
  const [repeatMode, setRepeatMode] = useState("weeks");
  const [repeatWeeks, setRepeatWeeks] = useState("12");

  // Route-specific fields
  const [infusionDuration, setInfusionDuration] = useState("");
  const [clinicLocation, setClinicLocation] = useState("");
  const [premedication, setPremedication] = useState(false);
  const [sprayCount, setSprayCount] = useState("");
  const [nostril, setNostril] = useState("both");
  const [priming, setPriming] = useState(false);
  const [takenWithFood, setTakenWithFood] = useState(null);
  const [patchSite, setPatchSite] = useState("");
  const [applicationDate, setApplicationDate] = useState(toInputDate(now));
  const [bodyArea, setBodyArea] = useState("");
  const [applicationNotes, setApplicationNotes] = useState("");
  const [insertionDate, setInsertionDate] = useState(toInputDate(now));
  const [pumpRate, setPumpRate] = useState("");
  const [siteChangeDate, setSiteChangeDate] = useState(toInputDate(now));
  const [reconstitutionDate, setReconstitutionDate] = useState("");
  const [inUseExpiry, setInUseExpiry] = useState("");

  // The medication record this log belongs to. A logged name with no record
  // (an entry that predates Meds) falls back to typing the medication and dose.
  const ownMed = medications.find((m) => m.id === medicationId)
    || medications.find((m) => m.medication_name === medication)
    || null;
  const isCustomProduct = !ownMed;
  // The picker offers the user's own active medications — plus this log's own
  // medication, so an old entry stays editable after it was paused.
  const pickerMeds = pickerMedications(medications, { medication_name: medication });
  // Only once-weekly products can use the weekly repeat; a daily product cannot.
  const isWeeklyMedication = getIntervalDays(medication) === 7;
  const caps = getCapabilityProfile(medication);
  const capabilityWarning = getCapabilityWarning(medication);
  const activeRoute = route || getDefaultRoute(medication);
  // Compounded / generic products take a free-text concentration.
  const isCompounded = isCompoundedGeneric(medication);
  const isInjectable = !isCustomProduct && INJECTABLE_ROUTES.includes(activeRoute);
  const siteOptions = activeRoute === "intramuscular" ? imSites : activeRoute === "intradermal" ? idSites : scSites;
  const isReconstituted = activeRoute === "reconstituted_vial" || caps?.supports_reconstitution;

  // Route and Device type sit inside "Add details (optional)" and are always
  // offered — the main form keeps only what is logged every time. Route is
  // pre-filled from the medication (a pen is subcutaneous, Rybelsus is oral) and
  // stays changeable; Device type starts empty. A product with no catalogue
  // routes (an "Other / custom" entry) gets the generic route choices.
  const routeChoices = getRouteChoices(medication);
  const routeOptions = routeChoices.length ? routeChoices : ROUTE_CHOICES;
  const routeLabel = routeOptions.find((r) => r.value === activeRoute)?.label || activeRoute;
  // A device already on a record stays selectable even if it is no longer
  // offered, so an old log is never silently rewritten.
  const deviceOptions = getShotDeviceOptions(medication, activeRoute);
  const deviceChoices = deviceType && !deviceOptions.some((d) => d.value === deviceType)
    ? [...deviceOptions, {
        value: deviceType,
        label: getDeliveryMethodLabel(deviceType),
        retired: RETIRED_DELIVERY_METHODS.includes(deviceType),
      }]
    : deviceOptions;
  // What is set inside the optional section, shown beside its label.
  const detailSummary = [
    activeRoute !== defaults.route ? routeLabel : "",
    deviceType && deviceType !== defaults.device
      ? (deviceChoices.find((d) => d.value === deviceType)?.label || deviceType)
      : "",
  ].filter(Boolean);

  const recommendedSite = getRecommendedSite();
  const scheduleFor = (med) => repeatSchedules.find((s) => s.status === "active" && s.medication === med) || null;

  // Silently link the log to the user's active regimen for this medication.
  const regimensForMed = activeRegimensFor(medications, medication);
  // Only ask when two active regimens exist for the SAME medication.
  const needsRegimenChoice = regimensForMed.length > 1;

  // Medication selector is prominent only when more than one medication is in play.
  const showMedSelector = pickerMeds.length > 1;

  // ── Gentle, non-blocking safety readouts ──────────────────────────────────
  const doseNum = parseFloat(dose) || 0;
  const maxDoseMg = getDoseMax(medication);
  const doseInMg = convertDose(doseNum, doseUnit, "mg");
  const aboveMax = maxDoseMg < 100 && doseInMg != null && doseInMg > maxDoseMg;
  const previousShot = shots.find((s) => s.medication === medication && s.id !== editingShot?.id) || null;
  const doseChanged = !!(
    previousShot && previousShot.dose != null && doseNum > 0 &&
    (previousShot.dose_unit || "mg") === doseUnit &&
    Number(previousShot.dose) !== doseNum
  );
  const doseChips = chipsForMedication(
    ownMed || { medication_name: medication },
    profile?.custom_doses || [],
  );
  const ingredientDup = editingShot ? { duplicate: false } : detectDuplicateActiveIngredient(medication, shots);

  useEffect(() => {
    if (!open) return;
    const n = new Date();
    setError(""); setSaved(false); setReporting(false); setDuplicatePrompt(null);
    confirmedDupRef.current = false;
    dirtyRef.current = false;
    setConfirmDiscard(false);
    setMedicationId("");
    setCustomName("");
    setConcentration(""); setNotes(""); setPain(0);
    setInfusionDuration(""); setClinicLocation(""); setPremedication(false);
    setSprayCount(""); setNostril("both"); setPriming(false);
    setTakenWithFood(null);
    setPatchSite(""); setApplicationDate(toInputDate(n)); setBodyArea(""); setApplicationNotes("");
    setInsertionDate(toInputDate(n)); setPumpRate(""); setSiteChangeDate(toInputDate(n));
    setReconstitutionDate(""); setInUseExpiry("");
    setDate(toInputDate(n)); setTime(toInputTime(n));
    setShowMedDropdown(false); setShowSiteDropdown(false);
    setShowDetails(false);

    if (editingShot) {
      // The log keeps the name it was recorded with; its medication record is
      // resolved from the link, or from the name when it predates Meds.
      const stored = editingShot.medication || "";
      setMedication(stored);
      setCustomName(stored);
      setMedicationId(editingShot.medication_id || "");
      setDose(String(editingShot.dose ?? "2.50"));
      setDoseUnit(editingShot.dose_unit || "mg");
      setConcentration(editingShot.concentration || "");
      setSite(editingShot.site || recommendedSite);
      const editMedication = editingShot.medication || defaultMed;
      const editRoute = editingShot.route || getDefaultRoute(editMedication);
      setRoute(editRoute);
      setDeviceType(editingShot.device_type || "");
      setDefaults({ route: getDefaultRoute(editMedication), device: getDefaultDeviceType(editMedication, editRoute) });
      setNotes(editingShot.notes || "");
      setPain(editingShot.pain ?? 0);
      setInfusionDuration(editingShot.infusion_duration != null ? String(editingShot.infusion_duration) : "");
      setClinicLocation(editingShot.clinic_location || "");
      setPremedication(!!editingShot.premedication);
      setSprayCount(editingShot.spray_count != null ? String(editingShot.spray_count) : "");
      setNostril(editingShot.nostril || "both");
      setPriming(!!editingShot.priming);
      setTakenWithFood(editingShot.taken_with_food);
      setPatchSite(editingShot.patch_site || "");
      setApplicationDate(editingShot.application_date || toInputDate(n));
      setBodyArea(editingShot.body_area || "");
      setApplicationNotes(editingShot.application_notes || "");
      setInsertionDate(editingShot.insertion_date || toInputDate(n));
      setPumpRate(editingShot.pump_rate != null ? String(editingShot.pump_rate) : "");
      setSiteChangeDate(editingShot.site_change_date || toInputDate(n));
      setReconstitutionDate(editingShot.reconstitution_date || "");
      setInUseExpiry(editingShot.in_use_expiry || "");
      const parsedDate = parseShotDate(editingShot.date);
      setDate(parsedDate ? toInputDate(parsedDate) : toInputDate(n));
      try {
        const [timePart, ampm] = editingShot.time.split(" ");
        let [h, m] = timePart.split(":").map(Number);
        if (ampm === "PM" && h !== 12) h += 12;
        if (ampm === "AM" && h === 12) h = 0;
        setTime(`${pad(h)}:${pad(m)}`);
      } catch { setTime(toInputTime(n)); }
      setShowDetails(!!editingShot.notes || (editingShot.pain || 0) > 0);
    } else {
      const smart = getSmartShotDefaults({ medications, shots, profile, recommendedSite });
      setMedication(smart.medication);
      setMedicationId(smart.medicationId);
      setDose(String(smart.dose));
      setDoseUnit(smart.doseUnit);
      setSite(smart.site);
      setRoute(smart.route);
      setDeviceType(smart.deviceType);
      setDefaults({ route: smart.route, device: smart.deviceType });
      if (initialValues) {
        setMedication(initialValues.medication || smart.medication);
        setMedicationId(initialValues.medication_id || smart.medicationId);
        setDose(String(initialValues.dose ?? smart.dose));
        setDoseUnit(initialValues.dose_unit || smart.doseUnit);
        setConcentration(initialValues.concentration || "");
        setRoute(initialValues.route || smart.route);
        setDeviceType(initialValues.device_type || smart.deviceType);
        setDefaults({ route: initialValues.route || smart.route, device: initialValues.device_type || smart.deviceType });
        setNotes(initialValues.notes || "");
        setDate(initialValues.date || toInputDate(n));
        setTime(initialValues.time || toInputTime(n));
        setShowDetails(!!initialValues.notes);
      }
      setRepeatOn(!!scheduleFor(initialValues?.medication || smart.medication));
    }
    if (editingShot) setRepeatOn(!!scheduleFor(editingShot.medication || defaultMed));
    setRepeatMode("weeks");
    setRepeatWeeks("12");
  }, [open, editingShot]);

  // The "Possible duplicate" warning is brought into view the moment it appears.
  // Focus moves onto the card (so it is announced, and its two buttons are the
  // next thing reached), then the modal's own scroll container centres it. The
  // container is scrolled directly, so the page behind the overlay never moves,
  // and this runs on every appearance — including a second one after the card
  // has been dismissed.
  useEffect(() => {
    if (!duplicatePrompt) return;
    sound.warning();
    const card = dupCardRef.current;
    const scroller = scrollRef.current;
    if (!card || !scroller) return;
    // preventScroll keeps focus from jumping the container before we centre it.
    card.focus({ preventScroll: true });
    const raf = requestAnimationFrame(() => {
      const cardRect = card.getBoundingClientRect();
      const scrollerRect = scroller.getBoundingClientRect();
      const centered = scroller.scrollTop + (cardRect.top - scrollerRect.top)
        - (scroller.clientHeight - cardRect.height) / 2;
      scroller.scrollTo({ top: Math.max(0, centered), behavior: "smooth" });
    });
    return () => cancelAnimationFrame(raf);
  }, [duplicatePrompt, dupNonce]);

  // The warning belongs to the entry that produced it: changing the date, time,
  // medication or dose makes it stale, so it is cleared rather than left on
  // screen above a different entry.
  useEffect(() => {
    setDuplicatePrompt((current) => (current ? null : current));
  }, [date, time, medication, dose]);

  // Unsaved-input guard, plus the shared dialog behaviour (background scroll
  // lock, focus trap, Escape and the hardware back button).
  const dirtyRef = useRef(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const markEdited = () => { dirtyRef.current = true; };
  const requestClose = () => {
    if (!saved && dirtyRef.current) { setConfirmDiscard(true); return; }
    onClose();
  };
  const sheetRef = useModal({ open, onDismiss: requestClose });

  if (!open) return null;

  // Switching medication re-applies that medication's own defaults: its
  // prescribed dose when that is one of its chips (otherwise no dose is
  // selected), its unit and its route. All of them stay editable.
  const selectMedication = (picked) => {
    const name = picked.medication_name;
    const { dose: nextDose, unit } = getDoseDefault({
      medication: name, medications, shots, legacyCustomDoses: profile?.custom_doses || [],
    });
    const nextRoute = picked.route || getDefaultRoute(name);
    setMedication(name);
    setCustomName(name);
    setMedicationId(picked.id || "");
    setDose(nextDose === "" ? "" : String(nextDose));
    setDoseUnit(unit || picked.dose_unit || "mg");
    setRoute(nextRoute);
    setDefaults({ route: nextRoute, device: getDefaultDeviceType(name, nextRoute) });
    if (RETIRED_DELIVERY_METHODS.includes(deviceType)) setDeviceType("");
    else if (isCompoundedGeneric(name) && !INJECTABLE_ROUTES.includes(nextRoute)) setDeviceType("");
    setRepeatOn(!!scheduleFor(name));
    setShowMedDropdown(false);
  };

  // Creates, updates, or ends the weekly repeat for the dose being logged.
  const syncRepeatSchedule = async (doseNum) => {
    const existing = scheduleFor(medication);
    if (!repeatOn) {
      if (existing) await updateRepeatSchedule(existing.id, { status: "cancelled" });
      return;
    }
    const weeks = Math.max(1, parseInt(repeatWeeks, 10) || 12);
    const startKey = addDaysToKey(date, 7);
    const base = {
      medication,
      medication_id: ownMed?.id || medicationId || "",
      dose: doseNum,
      dose_unit: doseUnit,
      concentration: isCompounded ? concentration.trim() : "",
      drug_class: DRUG_CLASS[medication] || "GLP-1",
      molecular_class: getMolecularClass(medication),
      route: activeRoute,
      device_type: deviceType || "",
      site: isInjectable ? site : "",
      notes: notes || "",
      time,
      start_date: startKey,
      repeat_mode: repeatMode,
      repeat_weeks: repeatMode === "weeks" ? weeks : 0,
      end_date: repeatMode === "weeks" ? addDaysToKey(startKey, (weeks - 1) * 7) : "",
      status: "active",
      skipped_dates: [],
    };
    if (existing) await updateRepeatSchedule(existing.id, base);
    else await addRepeatSchedule(base);
  };

  // Same medication logged less than 3 days after the previous shot.
  const recentSameMedication = () => {
    if (!previousShot?.date) return null;
    const days = calendarDaysBetween(previousShot.date, date);
    if (days < 0 || days >= 3) return null;
    const label = days === 0 ? "less than a day" : days === 1 ? "1 day" : `${days} days`;
    return { label, medication: previousShot.medication };
  };

  // Saves a typed dose on the medication so it is a chip the next time that
  // medication is logged (a log with no medication record keeps it on the
  // profile instead).
  const addCustomDose = async (value) => {
    // A strength the label does not list is never offered as a chip for this
    // medication — the same message the save path shows.
    const check = validateDosePair(medication, value);
    if (!check.valid) {
      sound.warning();
      setError(check.message);
      return;
    }
    // Saved on the medication itself, so it is offered as a chip next time.
    if (ownMed) await addMedicationCustomDose(ownMed.id, value);
    else await setProfile({ ...profile, custom_doses: withCustomDose(profile?.custom_doses || [], medication, value) });
    setDose(String(value));
  };

  const handleSave = async () => {
    // Saving puts the keyboard away.
    if (isTypingField(document.activeElement)) document.activeElement.blur();
    const doseNum = parseFloat(dose);
    const isCustom = !ownMed;
    const finalMedication = isCustom ? (customName.trim() || medication) : medication;
    if (isCustom && !finalMedication) {
      sound.warning();
      setError("Enter the medication name your prescriber gave you.");
      return;
    }
    if (isNaN(doseNum) || doseNum <= 0) {
      sound.warning();
      setError("Please enter a valid dose.");
      return;
    }
    if (!isCustom) {
      // Only a strength the label lists for this medication can be saved.
      const check = validateDosePair(medication, doseNum);
      if (!check.valid) {
        sound.warning();
        setError(check.message);
        return;
      }
    }
    if (!editingShot && repeatOn && repeatMode === "weeks" && !(parseInt(repeatWeeks, 10) >= 1)) {
      sound.warning();
      setError("Enter how many weeks to repeat this dose for.");
      return;
    }
    if (!editingShot && !confirmedDupRef.current) {
      const dup = recentSameMedication();
      if (dup) { setError(""); setDupNonce((n) => n + 1); setDuplicatePrompt(dup); return; }
    }
    setSaving(true);
    setError(""); setDuplicatePrompt(null);
    const d = new Date(date + "T" + time);
    const payload = {
      medication: finalMedication,
      dose_source: isCustom ? "custom" : "label",
      medication_id: isCustom ? undefined : (ownMed?.id || medicationId || undefined),
      dose: doseNum, dose_unit: doseUnit,
      drugClass: isCustom ? (DRUG_CLASS[finalMedication] || "") : (DRUG_CLASS[medication] || "GLP-1"),
      molecularClass: getMolecularClass(finalMedication),
      route: activeRoute, device_type: deviceType || undefined,
      concentration: isCompounded ? concentration.trim() || undefined : undefined,
      date: formatShotDate(d), time: toShotTime(d),
      site: isInjectable ? (site || recommendedSite) : "",
      pain: pain || 0, notes,
    };
    // Route-specific fields
    if (activeRoute === "intravenous_infusion") {
      payload.infusion_duration = parseFloat(infusionDuration) || undefined;
      payload.clinic_location = clinicLocation || undefined;
      payload.premedication = premedication;
    }
    if (activeRoute === "nasal") {
      payload.spray_count = parseInt(sprayCount) || undefined;
      payload.nostril = nostril;
      payload.priming = priming;
    }
    if (activeRoute === "oral_tablet" || activeRoute === "oral_capsule") {
      payload.taken_with_food = takenWithFood;
    }
    if (activeRoute === "transdermal") {
      payload.patch_site = patchSite || undefined;
      payload.application_date = applicationDate || undefined;
    }
    if (activeRoute === "topical_cream" || activeRoute === "topical_serum" || activeRoute === "topical_gel") {
      payload.body_area = bodyArea || undefined;
      payload.application_notes = applicationNotes || undefined;
      payload.application_date = applicationDate || undefined;
    }
    if (activeRoute === "implant") {
      payload.clinic_location = clinicLocation || undefined;
      payload.insertion_date = insertionDate || undefined;
    }
    if (activeRoute === "pump_infusion") {
      payload.pump_rate = parseFloat(pumpRate) || undefined;
      payload.site_change_date = siteChangeDate || undefined;
    }
    if (isReconstituted) {
      payload.reconstitution_date = reconstitutionDate || undefined;
      payload.in_use_expiry = inUseExpiry || undefined;
    }
    try {
      if (editingShot) {
        await updateShot(editingShot.id, payload);
      } else {
        await addShot(payload);
        await syncRepeatSchedule(doseNum);
      }
      // No toast here: the confirmation screen in the sheet is the confirmation.
      sound.success();
      setSaving(false);
      setSaved(true);
    } catch (err) {
      console.error("Error saving shot:", err);
      toast.error("Couldn't save. Please try again.", { actionLabel: "Retry", onAction: handleSave });
      setSaving(false);
    }
  };

  // Undo re-logs the removed shot from the record itself: the new entry gets a
  // fresh id and every logged detail is carried over.
  const restoreShot = async (shot) => {
    try {
      await addShot(shot);
      sound.success();
    } catch (err) {
      console.error("Error restoring shot:", err);
      toast.error("Couldn't save. Please try again.");
    }
  };

  const handleDelete = async () => {
    if (!editingShot) return;
    if (!confirm("Delete this shot?")) return;
    sound.delete();
    const removed = editingShot;
    await deleteShot(removed.id);
    toast.deleted("Shot deleted", { actionLabel: "Undo", actionTtlMs: 5000, onAction: () => restoreShot(removed) });
    onClose();
  };

  const InputField = ({ label, children }) => (
    <div>
      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">{label}</label>
      {children}
    </div>
  );

  const inputClass = "w-full border border-gray-200 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-[#E8E9F0] rounded-xl px-4 py-3 text-base outline-none focus:border-indigo-300";

  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
        <div className="absolute inset-0 bg-black/40 overlay-lock" onClick={requestClose} aria-hidden="true" />
        <div
          ref={sheetRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-shot-title"
          tabIndex={-1}
          onChangeCapture={markEdited}
          onInputCapture={markEdited}
          onClickCapture={(e) => { if (!e.target.closest("[data-skip-dirty]")) markEdited(); }}
          className="relative flex flex-col w-full sm:max-w-[520px] max-h-[92dvh] overflow-hidden sheet-lock bg-white dark:bg-[#0f1117] rounded-t-3xl sm:rounded-3xl animate-in slide-in-from-bottom sm:mx-4 dark:shadow-[0_-8px_40px_rgba(0,0,0,0.5)] outline-none"
        >
          <div className="shrink-0 bg-white dark:bg-[#0f1117]">
            <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 bg-gray-300 rounded-full" /></div>
            <div className="flex items-center justify-between gap-2 px-5 pb-4">
              <h2 id="add-shot-title" className="text-xl font-bold text-gray-900 dark:text-[#E8E9F0] min-w-0 break-words">{editingShot ? "Edit Shot Log" : "Add Shot Log"}</h2>
              <div className="flex items-center gap-1 shrink-0">
                {editingShot && !saved && <button onClick={handleDelete} data-skip-dirty aria-label="Delete this shot" className="w-11 h-11 flex items-center justify-center rounded-full"><Trash2 size={20} className="text-red-400" /></button>}
                <button onClick={requestClose} data-skip-dirty aria-label="Close" className="w-11 h-11 flex items-center justify-center rounded-full"><X size={22} className="text-gray-400" /></button>
              </div>
            </div>
          </div>

          <div
            ref={scrollRef}
            className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden no-scrollbar overscroll-contain"
            style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-y" }}
            onFocusCapture={(e) => {
              // With the keyboard open the focused field scrolls into view.
              const el = e.target;
              setTyping(isTypingField(el));
              setTimeout(() => { try { el.scrollIntoView({ block: "center", behavior: "smooth" }); } catch { /* ignore */ } }, 180);
            }}
            onBlurCapture={() => {
              // Let the next focus land first, then see who holds focus now.
              setTimeout(() => {
                const el = document.activeElement;
                setTyping(isTypingField(el) && !!scrollRef.current?.contains(el));
              }, 0);
            }}
            onPointerDownCapture={(e) => {
              // A tap anywhere that is not a field puts the keyboard away.
              const active = document.activeElement;
              if (!isTypingField(active)) return;
              if (e.target?.closest?.("input, textarea, select")) return;
              active.blur();
            }}
          >

          {saved ? (
            <ShotSuccessPanel
              title={editingShot ? "Shot updated" : "Shot logged"}
              detail={`${dose} ${doseUnitLabel(doseUnit)} · ${medication}`}
              onReportSideEffect={() => setReporting(true)}
            />
          ) : pickerMeds.length === 0 ? (
            <div className="px-5 pb-4">
              <div className="rounded-2xl border border-gray-200 dark:border-white/[0.12] bg-gray-50 dark:bg-white/[0.04] p-5 text-center">
                <Pill size={30} className="mx-auto mb-3 text-gray-300 dark:text-white/20" />
                <p className="text-sm font-semibold text-gray-700 dark:text-[#E8E9F0]">Add a medication first</p>
                <p className="text-xs text-gray-500 dark:text-[#9A9DAE] mt-1">
                  Your shot logs belong to a medication, so the right dose and schedule can be shown with them.
                </p>
                <button onClick={() => { sound.open(); setAddMedOpen(true); }} data-skip-dirty
                  className="mt-4 px-5 py-3 bg-indigo-600 text-white rounded-xl font-semibold text-sm inline-flex items-center gap-2">
                  <Plus size={16} /> Add Medication
                </button>
              </div>
            </div>
          ) : (
            <>
              {error && <p className="mx-5 mb-3 text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded-xl px-3 py-2">{error}</p>}
              {capabilityWarning && (
                <div className="mx-5 mb-3 text-sm text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-500/10 rounded-xl px-3 py-2 border border-orange-200 dark:border-orange-500/20">
                  <p className="font-semibold text-xs">⚠ {isInvestigational(medication) ? "Not an approved medicine" : "Capability notice"}</p>
                  <p className="mt-1 text-xs">{capabilityWarning}</p>
                </div>
              )}

              <div className="px-5 pb-4 space-y-3">
                {/* Medication — prominent only when more than one is in play */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Medication</label>
                  <div className="relative">
                    {showMedSelector ? (
                      <button onClick={() => setShowMedDropdown(!showMedDropdown)} data-skip-dirty
                        className={`${inputClass} flex items-center justify-between gap-2 text-left min-w-0`}>
                        <div>
                          <span className="text-base block">{medication}</span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">{getMolecularClassLabel(medication)}</span>
                        </div>
                        <ChevronDown size={18} className="text-gray-400" />
                      </button>
                    ) : (
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <span className="text-lg font-semibold text-gray-900 dark:text-[#E8E9F0] block break-words [overflow-wrap:anywhere]">{medication}</span>
                          <span className="text-xs text-gray-400 dark:text-gray-500 block break-words">{getMolecularClassLabel(medication)}</span>
                        </div>
                        <button onClick={() => setShowMedDropdown(!showMedDropdown)} data-skip-dirty className="flex items-center gap-1 text-sm font-semibold text-indigo-600 dark:text-indigo-400 flex-shrink-0 min-h-[44px] px-2">
                          Change <ChevronDown size={14} />
                        </button>
                      </div>
                    )}
                    {showMedDropdown && (
                      <div className="absolute z-10 mt-1 w-full bg-white dark:bg-[#1e2130] border border-gray-200 dark:border-white/[0.08] rounded-xl shadow-lg max-h-64 overflow-y-auto">
                        {pickerMeds.map((m) => {
                          const entry = getMedicationConfig(m.medication_name);
                          const generic = m.generic_name || entry?.genericName || entry?.generic || "";
                          return (
                            <button key={m.id || m.medication_name} onClick={() => { sound.tap(); selectMedication(m); }}
                              className={`w-full px-4 py-3 text-left text-sm dark:text-[#E8E9F0] ${m.medication_name === medication ? "bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 font-medium" : "hover:bg-gray-50 dark:hover:bg-white/[0.05]"}`}>
                              <span className="block">{m.medication_name}</span>
                              {generic && (
                                <span className="text-xs text-gray-400 dark:text-gray-500 block">{generic}</span>
                              )}
                              {m.status && m.status !== "active" && (
                                <span className="text-[11px] text-gray-400 dark:text-gray-500 block mt-0.5">{m.status}</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  {/* Two active regimens for the same medication — one question */}
                  {needsRegimenChoice && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">Which regimen is this dose part of?</p>
                      <div className="flex flex-wrap gap-2">
                        {regimensForMed.map((m) => (
                          <button key={m.id} onClick={() => setMedicationId(m.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${medicationId === m.id ? "bg-indigo-600 text-white border-indigo-600" : "bg-white dark:bg-white/[0.05] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-white/[0.1]"}`}>
                            {m.prescribed_dose ? `${m.prescribed_dose} ${m.dose_unit || "mg"}` : m.medication_name}
                            {m.indication ? ` — ${m.indication}` : ""}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Dose — the strengths the label lists for the chosen product.
                    An "Other / custom" entry instead asks for the drug name and dose. */}
                <div>
                  {isCustomProduct ? (
                    <CustomMedicationFields
                      name={customName || medication}
                      onNameChange={(v) => { setCustomName(v); setMedication(v); }}
                      dose={dose}
                      onDoseChange={setDose}
                      unit={doseUnit}
                      onUnitChange={setDoseUnit}
                      inputClass={inputClass}
                    />
                  ) : (
                    <>
                  <DoseChips
                    key={medication}
                    medication={medication}
                    options={doseChips}
                    value={doseNum}
                    unit={doseUnit}
                    onSelect={(v) => setDose(String(v))}
                    onAddCustom={addCustomDose}
                  />
                  {doseChanged && (
                    <p className="text-[13px] font-medium text-amber-600 dark:text-amber-400 mt-1.5 leading-snug">
                      Dose changed from {previousShot.dose} {doseUnitLabel(previousShot.dose_unit || "mg")} to {dose} {doseUnitLabel(doseUnit)}.
                    </p>
                  )}
                  {ownMed?.prescribed_dose != null && doseNum > 0
                    && Number(ownMed.prescribed_dose) !== doseNum && (
                    <p className="text-[13px] text-gray-500 dark:text-[#9A9DAE] mt-1.5 leading-snug">
                      Different from your prescribed dose ({ownMed.prescribed_dose} {doseUnitLabel(ownMed.dose_unit || "mg")}).
                    </p>
                  )}
                  {aboveMax && (
                    <p className="text-xs font-medium text-red-600 dark:text-red-400 mt-2">
                      Above the typical maximum of {maxDoseMg} mg. Please confirm with your prescriber.
                    </p>
                  )}
                  {ingredientDup.duplicate && (
                    <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                      You also logged {ingredientDup.existingBrand} ({ingredientDup.generic}) on {ingredientDup.lastDoseDate}. Two forms of the same active ingredient can duplicate your dose.
                    </p>
                  )}
                    </>
                  )}
                </div>

                {/* Injection site — one row, recommended site already selected */}
                {isInjectable && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Injection site</label>
                    <div className="relative">
                      <button onClick={() => setShowSiteDropdown(!showSiteDropdown)} data-skip-dirty
                        className={`${inputClass} flex items-center justify-between gap-2 text-left min-w-0`}>
                        <span className="flex items-center gap-2 min-w-0">
                          <Star size={16} className="text-orange-400 flex-shrink-0" />
                          <span className="text-base font-semibold truncate">{site || recommendedSite}</span>
                        </span>
                        <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 flex-shrink-0">Change</span>
                      </button>
                      {showSiteDropdown && (
                        <div className="absolute z-10 mt-1 w-full bg-white dark:bg-[#1e2130] border border-gray-200 dark:border-white/[0.08] rounded-xl shadow-lg max-h-48 overflow-y-auto">
                          {siteOptions.map((s) => (
                            <button key={s} onClick={() => { sound.tap(); setSite(s); setShowSiteDropdown(false); }}
                              className={`w-full px-4 py-3 text-left text-sm dark:text-[#E8E9F0] ${site === s ? "bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 font-medium" : "hover:bg-gray-50 dark:hover:bg-white/[0.05]"}`}>{s}</button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Date & Time */}
                {/* flex row, 12px gap, each field flex-1 / min-width:0 with an
                    explicit border-box so a native date/time input can never add
                    its padding+border on top of its width and spill out of the
                    sheet — the row stays inside the same px-5 gutter as the
                    Medication, Dose and Injection site sections above it. */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Date & time</label>
                  <div className="flex w-full gap-3">
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Shot date"
                      className="flex-1 basis-0 w-full min-w-0 box-border h-12 text-center border border-gray-200 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-[#E8E9F0] dark:[color-scheme:dark] rounded-xl px-2 text-base outline-none focus:border-indigo-300" />
                    <input type="time" value={time} onChange={(e) => setTime(e.target.value)} aria-label="Shot time"
                      className="flex-1 basis-0 w-full min-w-0 box-border h-12 text-center border border-gray-200 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-[#E8E9F0] dark:[color-scheme:dark] rounded-xl px-2 text-base outline-none focus:border-indigo-300" />
                  </div>
                </div>

                {/* Optional details, collapsed by default */}
                <div className="border-t border-gray-100 dark:border-white/[0.08] pt-3">
                  <button onClick={() => { if (showDetails) sound.close(); else sound.open(); setShowDetails(!showDetails); }} data-skip-dirty className="w-full flex items-center justify-between gap-2 py-1">
                    <span className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Add details (optional)
                      {detailSummary.length > 0 && (
                        <span className="text-[11px] font-medium text-indigo-500 dark:text-indigo-400">· {detailSummary.join(" · ")}</span>
                      )}
                      {repeatOn && <span className="text-[11px] font-medium text-indigo-500 dark:text-indigo-400">· repeat active</span>}
                    </span>
                    <ChevronDown size={18} className={`text-gray-400 transition-transform ${showDetails ? "rotate-180" : ""}`} />
                  </button>

                  {showDetails && (
                    <div className="mt-4 space-y-4">
                      {/* Route and Device type — optional. Route arrives
                          pre-filled from the medication, Device type is empty. */}
                      <ShotRouteDeviceFields
                        route={activeRoute}
                        routeOptions={routeOptions}
                        onRouteChange={setRoute}
                        deviceType={deviceType}
                        deviceOptions={deviceChoices}
                        onDeviceChange={setDeviceType}
                        inputClass={inputClass}
                      />

                      {/* Concentration — compounded / generic products only */}
                      {isCompounded && (
                        <InputField label="Concentration (optional)">
                          <input type="text" value={concentration} onChange={(e) => setConcentration(e.target.value)}
                            placeholder="e.g. 2.5 mg/mL" className={inputClass} />
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Compounded strengths vary by pharmacy — enter what your vial says.</p>
                        </InputField>
                      )}

                      {/* Route-specific fields */}
                      {activeRoute === "intravenous_infusion" && (
                        <>
                          <InputField label="Infusion duration (minutes)">
                            <input type="number" min="0" step="1" value={infusionDuration} onChange={(e) => setInfusionDuration(e.target.value)} className={inputClass} />
                          </InputField>
                          <InputField label="Clinic / location">
                            <input type="text" value={clinicLocation} onChange={(e) => setClinicLocation(e.target.value)} className={inputClass} />
                          </InputField>
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" checked={premedication} onChange={(e) => setPremedication(e.target.checked)} className="w-5 h-5 accent-indigo-600" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Premedication administered</span>
                          </label>
                        </>
                      )}

                      {activeRoute === "nasal" && (
                        <>
                          <InputField label="Spray count">
                            <input type="number" min="0" step="1" value={sprayCount} onChange={(e) => setSprayCount(e.target.value)} className={inputClass} />
                          </InputField>
                          <InputField label="Nostril">
                            <select value={nostril} onChange={(e) => setNostril(e.target.value)} className={inputClass}>
                              <option value="both">Both</option><option value="left">Left</option><option value="right">Right</option>
                            </select>
                          </InputField>
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" checked={priming} onChange={(e) => setPriming(e.target.checked)} className="w-5 h-5 accent-indigo-600" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Device primed before use</span>
                          </label>
                        </>
                      )}

                      {(activeRoute === "oral_tablet" || activeRoute === "oral_capsule") && (
                        <InputField label="Taken with food?">
                          <div className="flex gap-2">
                            {[
                              { v: true, label: "Yes" },
                              { v: false, label: "No" },
                              { v: null, label: "Not recorded" },
                            ].map((opt) => (
                              <button key={String(opt.v)} onClick={() => setTakenWithFood(opt.v)}
                                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border ${takenWithFood === opt.v ? "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-500/30" : "bg-white dark:bg-white/[0.05] text-gray-500 dark:text-[#9A9DAE] border-gray-200 dark:border-white/[0.1]"}`}>
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </InputField>
                      )}

                      {activeRoute === "transdermal" && (
                        <>
                          <InputField label="Patch site">
                            <input type="text" value={patchSite} onChange={(e) => setPatchSite(e.target.value)} placeholder="e.g. Abdomen, upper arm" className={inputClass} />
                          </InputField>
                          <InputField label="Application date">
                            <input type="date" value={applicationDate} onChange={(e) => setApplicationDate(e.target.value)} className={`${inputClass} dark:[color-scheme:dark]`} />
                          </InputField>
                        </>
                      )}

                      {(activeRoute === "topical_cream" || activeRoute === "topical_serum" || activeRoute === "topical_gel") && (
                        <>
                          <InputField label="Body area">
                            <input type="text" value={bodyArea} onChange={(e) => setBodyArea(e.target.value)} placeholder="e.g. Face, left cheek" className={inputClass} />
                          </InputField>
                          <InputField label="Application notes">
                            <textarea value={applicationNotes} onChange={(e) => setApplicationNotes(e.target.value)} rows={2} className={inputClass} />
                          </InputField>
                        </>
                      )}

                      {activeRoute === "implant" && (
                        <>
                          <InputField label="Clinic / location">
                            <input type="text" value={clinicLocation} onChange={(e) => setClinicLocation(e.target.value)} className={inputClass} />
                          </InputField>
                          <InputField label="Insertion date">
                            <input type="date" value={insertionDate} onChange={(e) => setInsertionDate(e.target.value)} className={`${inputClass} dark:[color-scheme:dark]`} />
                          </InputField>
                        </>
                      )}

                      {activeRoute === "pump_infusion" && (
                        <>
                          <InputField label="Pump rate">
                            <input type="number" min="0" step="0.1" value={pumpRate} onChange={(e) => setPumpRate(e.target.value)} className={inputClass} />
                          </InputField>
                          <InputField label="Site change date">
                            <input type="date" value={siteChangeDate} onChange={(e) => setSiteChangeDate(e.target.value)} className={`${inputClass} dark:[color-scheme:dark]`} />
                          </InputField>
                        </>
                      )}

                      {/* Reconstitution fields */}
                      {isReconstituted && (
                        <>
                          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Reconstitution</div>
                          <InputField label="Reconstitution date">
                            <input type="date" value={reconstitutionDate} onChange={(e) => setReconstitutionDate(e.target.value)} className={`${inputClass} dark:[color-scheme:dark]`} />
                          </InputField>
                          <InputField label="In-use expiry date">
                            <input type="date" value={inUseExpiry} onChange={(e) => setInUseExpiry(e.target.value)} className={`${inputClass} dark:[color-scheme:dark]`} />
                          </InputField>
                        </>
                      )}

                      {/* Repeat this dose — weekly repeat schedule. A daily product
                          has no weekly repeat, so the option is not offered. */}
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
                          schedule={scheduleFor(medication)}
                          dayKey={date}
                          time={time}
                          medication={medication}
                          dose={dose}
                          doseUnit={doseUnit}
                        />
                      )}

                      {/* Pain Level */}
                      <div>
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Pain Level: <span className="text-indigo-600">{pain}/10</span></label>
                        <div className="px-1">
                          <input
                            type="range" min="0" max="10"
                            value={pain}
                            onChange={(e) => setPain(Number(e.target.value))}
                            className="pain-slider w-full"
                            style={{ "--pain-fill": `${Math.round((pain / 10) * 100)}%` }}
                            aria-label="Pain level"
                            aria-valuetext={`${pain} out of 10`}
                          />
                          <div className="flex justify-between text-xs text-gray-400 mt-1"><span>0 – No Pain</span><span>10 – Severe</span></div>
                        </div>
                      </div>

                      {/* Notes */}
                      <div>
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Notes (optional)</label>
                        <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                          placeholder={isCompounded ? "e.g. pharmacy name, how you felt" : "Add any notes or side effects experienced"}
                          className="w-full border border-gray-200 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-[#E8E9F0] rounded-xl px-4 py-3 text-base resize-none h-24 outline-none focus:border-indigo-300" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {duplicatePrompt && (
                <>
                  <div
                    key={dupNonce}
                    ref={dupCardRef}
                    tabIndex={-1}
                    role="alert"
                    aria-live="assertive"
                    className="mx-5 mb-3 scroll-mb-[100px] rounded-xl border border-orange-200 dark:border-orange-500/20 bg-orange-50 dark:bg-orange-500/10 px-3 py-2 text-sm text-orange-700 dark:text-orange-300 animate-duplicate-glow outline-none"
                  >
                    <p className="font-semibold">Possible duplicate</p>
                    <p className="mt-1">Your last {duplicatePrompt.medication} shot was {duplicatePrompt.label} ago. Is this a duplicate?</p>
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => { confirmedDupRef.current = true; handleSave(); }} className="px-3 py-1.5 rounded-lg bg-orange-600 text-white text-xs font-semibold">Save anyway</button>
                      <button onClick={() => setDuplicatePrompt(null)} className="px-3 py-1.5 rounded-lg bg-white dark:bg-white/10 text-gray-600 dark:text-gray-300 text-xs font-semibold border border-gray-200 dark:border-white/10">Cancel</button>
                    </div>
                  </div>
                  {/* Trailing space, so the card can be centred clear of the
                      fixed Save Shot footer instead of pinned to the bottom. */}
                  <div className="h-24" aria-hidden="true" />
                </>
              )}
            </>
          )}

          {/* While the keyboard is up, this tail space lets the focused field
              scroll clear of it instead of sitting behind it. */}
          {typing && <div className="h-28" aria-hidden="true" />}

          </div>

          <div
            className="shrink-0 px-5 pt-3 bg-white dark:bg-[#0f1117] border-t border-gray-100 dark:border-white/[0.08]"
            style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))" }}
          >
            {saved ? (
              <button onClick={onClose}
                className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2">
                Done
              </button>
            ) : (
              <button onClick={handleSave} disabled={saving || pickerMeds.length === 0}
                className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
                <Save size={16} /> {saving ? "Saving…" : editingShot ? "Update Shot" : "Save Shot"}
              </button>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDiscard}
        title="Discard this shot?"
        message="This log has unsaved changes. Closing it now will lose them."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        destructive
        onConfirm={() => { setConfirmDiscard(false); dirtyRef.current = false; onClose(); }}
        onCancel={() => setConfirmDiscard(false)}
      />

      <SideEffectsModal open={reporting} onClose={() => setReporting(false)} dayKey={date} />

      {/* The Add Medication form, reachable from the picker's empty state. */}
      <MedicationModal open={addMedOpen} onClose={() => setAddMedOpen(false)} />
    </>
  );
}