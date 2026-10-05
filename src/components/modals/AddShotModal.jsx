import React, { useState, useEffect, useRef } from "react";
import { X, Save, Star, ChevronDown, Trash2 } from "lucide-react";
import CustomMedicationFields from "@/components/modals/CustomMedicationFields";
import {
  CUSTOM_MEDICATION_NAME, getIntervalDays, getMedicationConfig, getMedicationPickerNames,
  describeAllowedDoses, validateDosePair,
} from "@/lib/medicationConfig";
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
import { getDoseChips, withCustomDose } from "@/lib/doseOptions";
import ShotSuccessPanel from "@/components/modals/ShotSuccessPanel";
import SideEffectsModal from "@/components/modals/SideEffectsModal";
import ConfirmDialog from "@/components/ConfirmDialog";
import useModal from "@/hooks/useModal";
import { toast } from "sonner";

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

export default function AddShotModal({ open, onClose, editingShot, initialValues }) {
  const { addShot, updateShot, deleteShot, profile, setProfile, getRecommendedSite, shots, medications,
    repeatSchedules, addRepeatSchedule, updateRepeatSchedule } = useAppState();
  const confirmedDupRef = useRef(false);

  const defaultMed = profile?.default_medication || "Ozempic®";
  const now = new Date();

  const [pain, setPain] = useState(0);
  const [medication, setMedication] = useState(defaultMed);
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
  const [duplicatePrompt, setDuplicatePrompt] = useState(null);
  const [reporting, setReporting] = useState(false);

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

  // "Other / custom (prescriber-directed)": the user types the drug and dose,
  // and nothing about it can be checked against a label.
  const isCustomProduct = medication === CUSTOM_MEDICATION_NAME;
  // Only once-weekly products can use the weekly repeat; a daily product cannot.
  const isWeeklyMedication = getIntervalDays(medication) === 7;
  const caps = getCapabilityProfile(medication);
  const capabilityWarning = getCapabilityWarning(medication);
  const activeRoute = route || getDefaultRoute(medication);
  const deliveryOptions = getDeliveryMethods(medication, activeRoute);
  const isLegacyDevice = RETIRED_DELIVERY_METHODS.includes(deviceType);
  // Compounded / generic products take a free-text concentration and a simple
  // delivery toggle instead of the full device list.
  const isCompounded = isCompoundedGeneric(medication);
  const isInjectable = !isCustomProduct && INJECTABLE_ROUTES.includes(activeRoute);
  const siteOptions = activeRoute === "intramuscular" ? imSites : activeRoute === "intradermal" ? idSites : scSites;
  const isReconstituted = activeRoute === "reconstituted_vial" || caps?.supports_reconstitution;
  const brandPen = isBrandPen(medication);

  // Route field: hidden for brand pens (their device fixes the route), shown
  // when there is a genuine choice — always for compounded / generic products.
  const routeChoices = getRouteChoices(medication);
  const showRouteField =
    (brandPen && editingShot && activeRoute !== getDefaultRoute(medication)) ||
    (!brandPen && routeChoices.length > 1);
  // Delivery method: hidden for brand pens, a two-option toggle for generics,
  // and the existing list for other products.
  const showDeliveryToggle = isCompounded && isInjectable;
  const showDeliveryField = !brandPen && !isCompounded && deliveryOptions.length > 0;

  const recommendedSite = getRecommendedSite();
  const scheduleFor = (med) => repeatSchedules.find((s) => s.status === "active" && s.medication === med) || null;

  // Silently link the log to the user's active regimen for this medication.
  const regimensForMed = activeRegimensFor(medications, medication);
  // Only ask when two active regimens exist for the SAME medication.
  const needsRegimenChoice = regimensForMed.length > 1;

  // Medication selector is prominent only when more than one medication is in play.
  const medsInPlay = new Set([
    ...medications.filter((m) => m.status === "active").map((m) => m.medication_name),
    ...shots.map((s) => s.medication),
  ].filter(Boolean));
  const showMedSelector = medsInPlay.size > 1;

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
  const doseChips = getDoseChips(medication, profile?.custom_doses || []);
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
      const customEntry = editingShot.dose_source === "custom";
      setMedication(customEntry ? CUSTOM_MEDICATION_NAME : (editingShot.medication || defaultMed));
      setCustomName(customEntry ? (editingShot.medication || "") : "");
      setMedicationId(editingShot.medication_id || "");
      setDose(String(editingShot.dose ?? "2.50"));
      setDoseUnit(editingShot.dose_unit || "mg");
      setConcentration(editingShot.concentration || "");
      setSite(editingShot.site || recommendedSite);
      setRoute(editingShot.route || getDefaultRoute(editingShot.medication || defaultMed));
      setDeviceType(editingShot.device_type || "");
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
      if (initialValues) {
        setMedication(initialValues.medication || smart.medication);
        setMedicationId(initialValues.medication_id || smart.medicationId);
        setDose(String(initialValues.dose ?? smart.dose));
        setDoseUnit(initialValues.dose_unit || smart.doseUnit);
        setConcentration(initialValues.concentration || "");
        setRoute(initialValues.route || smart.route);
        setDeviceType(initialValues.device_type || smart.deviceType);
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

  // Delivery method: when only one is valid for this medication/route it is
  // selected automatically. Legacy retired values are left untouched so old
  // records aren't altered.
  useEffect(() => {
    if (!open) return;
    const options = getDeliveryMethods(medication, activeRoute);
    if (options.length === 1) {
      if (deviceType !== options[0].value) setDeviceType(options[0].value);
    } else if (options.length === 0 && deviceType && !RETIRED_DELIVERY_METHODS.includes(deviceType)) {
      setDeviceType("");
    }
  }, [open, medication, activeRoute, deviceType]);

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

  // Switching medication re-applies that product's defaults (dose, route,
  // device and its active regimen).
  const selectMedication = (med) => {
    // "Other / custom" has no label data — the user types the name and dose.
    if (med === CUSTOM_MEDICATION_NAME) {
      setMedication(med);
      setCustomName("");
      setDose("");
      setDoseUnit("mg");
      setMedicationId("");
      setRoute("");
      setDeviceType("");
      setRepeatOn(false);
      setShowMedDropdown(false);
      return;
    }
    const { dose: nextDose, unit } = getDoseDefault({ medication: med, medications, shots });
    setMedication(med);
    setDose(String(nextDose));
    setDoseUnit(unit);
    setMedicationId(activeRegimensFor(medications, med)[0]?.id || "");
    setRoute(getDefaultRoute(med));
    if (RETIRED_DELIVERY_METHODS.includes(deviceType)) setDeviceType("");
    else if (isCompoundedGeneric(med) && !INJECTABLE_ROUTES.includes(getDefaultRoute(med))) setDeviceType("");
    setRepeatOn(!!scheduleFor(med));
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
      medication_id: medicationId || "",
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

  // Saves a custom dose on the profile so it becomes a chip next time.
  const addCustomDose = async (value) => {
    // A strength the label does not list is never offered as a chip for this
    // medication — the same message the save path shows.
    const check = validateDosePair(medication, value);
    if (!check.valid) {
      setError(check.message);
      return;
    }
    await setProfile({ ...profile, custom_doses: withCustomDose(profile?.custom_doses || [], medication, value) });
    setDose(String(value));
  };

  const handleSave = async () => {
    const doseNum = parseFloat(dose);
    const isCustom = medication === CUSTOM_MEDICATION_NAME;
    const finalMedication = isCustom ? customName.trim() : medication;
    if (isCustom && !finalMedication) {
      setError("Enter the medication name your prescriber gave you.");
      return;
    }
    if (isNaN(doseNum) || doseNum <= 0) {
      setError("Please enter a valid dose.");
      return;
    }
    if (!isCustom) {
      // Only a strength the label lists for this medication can be saved.
      const check = validateDosePair(medication, doseNum);
      if (!check.valid) {
        setError(check.message);
        return;
      }
    }
    if (!editingShot && repeatOn && repeatMode === "weeks" && !(parseInt(repeatWeeks, 10) >= 1)) {
      setError("Enter how many weeks to repeat this dose for.");
      return;
    }
    if (!editingShot && !confirmedDupRef.current) {
      const dup = recentSameMedication();
      if (dup) { setError(""); setDuplicatePrompt(dup); return; }
    }
    setSaving(true);
    setError(""); setDuplicatePrompt(null);
    const d = new Date(date + "T" + time);
    const payload = {
      medication: finalMedication,
      dose_source: isCustom ? "custom" : "label",
      medication_id: isCustom ? undefined : (medicationId || undefined),
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
        toast.success("Shot updated successfully!");
      } else {
        await addShot(payload);
        await syncRepeatSchedule(doseNum);
        toast.success("Shot added successfully!");
      }
      setSaving(false);
      setSaved(true);
    } catch (err) {
      console.error("Error saving shot:", err);
      toast.error("Failed to save shot");
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingShot) return;
    if (!confirm("Delete this shot?")) return;
    await deleteShot(editingShot.id);
    toast.success("Shot deleted successfully!");
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
            className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden no-scrollbar overscroll-contain"
            style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-y" }}
            onFocusCapture={(e) => {
              // With the keyboard open the focused field scrolls into view.
              const el = e.target;
              setTimeout(() => { try { el.scrollIntoView({ block: "center", behavior: "smooth" }); } catch { /* ignore */ } }, 180);
            }}
          >

          {saved ? (
            <ShotSuccessPanel
              title={editingShot ? "Shot updated" : "Shot logged"}
              detail={`${dose} ${doseUnitLabel(doseUnit)} · ${medication === CUSTOM_MEDICATION_NAME ? customName : medication}`}
              onReportSideEffect={() => setReporting(true)}
            />
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
                        {getMedicationPickerNames().map((m) => {
                          const entry = getMedicationConfig(m);
                          const custom = m === CUSTOM_MEDICATION_NAME;
                          return (
                            <button key={m} onClick={() => selectMedication(m)}
                              className={`w-full px-4 py-3 text-left text-sm dark:text-[#E8E9F0] ${medication === m ? "bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 font-medium" : "hover:bg-gray-50 dark:hover:bg-white/[0.05]"}`}>
                              <span className="block">{m}</span>
                              {!custom && (
                                <span className="text-xs text-gray-400 dark:text-gray-500 block">
                                  {entry?.genericName ? `${entry.genericName} · ` : ""}
                                  {entry?.allowedDoses?.length ? describeAllowedDoses(m) : "dose typed by you"}
                                </span>
                              )}
                              {entry?.indicationNote && !custom && (
                                <span className="text-[11px] text-gray-400 dark:text-gray-500 block mt-0.5">{entry.indicationNote}</span>
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

                {/* Route — hidden for brand pens; fixed choices for generics */}
                {showRouteField && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Route</label>
                    <div className="flex flex-wrap gap-2">
                      {routeChoices.map((rc) => (
                        <button key={rc.value} onClick={() => setRoute(rc.value)}
                          className={`px-3.5 py-2 rounded-xl border text-sm font-medium ${activeRoute === rc.value ? "bg-indigo-600 text-white border-indigo-600" : "bg-white dark:bg-white/[0.05] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-white/[0.1]"}`}>
                          {rc.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Delivery — a simple toggle for generics only */}
                {showDeliveryToggle && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Delivery</label>
                    <div className="flex gap-2">
                      {COMPOUNDED_DEVICES.map((d) => (
                        <button key={d.value} onClick={() => setDeviceType(d.value)}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-medium border ${deviceType === d.value ? "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-500/30" : "bg-white dark:bg-white/[0.05] text-gray-500 dark:text-[#9A9DAE] border-gray-200 dark:border-white/[0.1]"}`}>
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dose — the strengths the label lists for the chosen product.
                    An "Other / custom" entry instead asks for the drug name and dose. */}
                <div>
                  {isCustomProduct ? (
                    <CustomMedicationFields
                      name={customName}
                      onNameChange={setCustomName}
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
                            <button key={s} onClick={() => { setSite(s); setShowSiteDropdown(false); }}
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
                  <button onClick={() => setShowDetails(!showDetails)} data-skip-dirty className="w-full flex items-center justify-between gap-2 py-1">
                    <span className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Add details (optional)
                      {repeatOn && <span className="text-[11px] font-medium text-indigo-500 dark:text-indigo-400">· repeat active</span>}
                    </span>
                    <ChevronDown size={18} className={`text-gray-400 transition-transform ${showDetails ? "rotate-180" : ""}`} />
                  </button>

                  {showDetails && (
                    <div className="mt-4 space-y-4">
                      {/* Concentration — compounded / generic products only */}
                      {isCompounded && (
                        <InputField label="Concentration (optional)">
                          <input type="text" value={concentration} onChange={(e) => setConcentration(e.target.value)}
                            placeholder="e.g. 2.5 mg/mL" className={inputClass} />
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Compounded strengths vary by pharmacy — enter what your vial says.</p>
                        </InputField>
                      )}

                      {/* Delivery method — other products only (pens hide it) */}
                      {showDeliveryField && (
                        <div>
                          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Delivery method (optional)</label>
                          {deliveryOptions.length === 1 ? (
                            <div className="w-full border border-gray-100 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.03] rounded-xl px-4 py-3 text-base text-gray-500 dark:text-gray-400">
                              {deliveryOptions[0].label}
                            </div>
                          ) : (
                            <select value={deviceType} onChange={(e) => setDeviceType(e.target.value)} className={inputClass}>
                              <option value="">—</option>
                              {isLegacyDevice && (
                                <option value={deviceType} disabled>{getDeliveryMethodLabel(deviceType)}</option>
                              )}
                              {deliveryOptions.map((dt) => <option key={dt.value} value={dt.value}>{dt.label}</option>)}
                            </select>
                          )}
                        </div>
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
                <div className="mx-5 mb-3 text-sm text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-500/10 rounded-xl px-3 py-2 border border-orange-200 dark:border-orange-500/20">
                  <p className="font-semibold">Possible duplicate</p>
                  <p className="mt-1">Your last {duplicatePrompt.medication} shot was {duplicatePrompt.label} ago. Is this a duplicate?</p>
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => { confirmedDupRef.current = true; handleSave(); }} className="px-3 py-1.5 rounded-lg bg-orange-600 text-white text-xs font-semibold">Save anyway</button>
                    <button onClick={() => setDuplicatePrompt(null)} className="px-3 py-1.5 rounded-lg bg-white dark:bg-white/10 text-gray-600 dark:text-gray-300 text-xs font-semibold border border-gray-200 dark:border-white/10">Cancel</button>
                  </div>
                </div>
              )}
            </>
          )}

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
              <button onClick={handleSave} disabled={saving}
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
    </>
  );
}