import React, { useState, useEffect, useRef } from "react";
import { X, ChevronDown, Check, AlertTriangle } from "lucide-react";
import CustomMedicationFields from "@/components/modals/CustomMedicationFields";
import MedicationPickerSheet from "@/components/modals/MedicationPickerSheet";
import {
  CUSTOM_MEDICATION_NAME,
  getIntervalDays, getMedicationConfig, isFreeDoseMedication, validateDosePair,
} from "@/lib/medicationConfig";
import {
  FORM_INJECTION, FORM_PILL, ORAL_ROUTES,
  formForRoute, formLabel, formRoute, medicationFormChoice,
} from "@/lib/medicationForm";
import { regimenFromShot, saveShotWithMedication } from "@/lib/shotMedication";
import { useAppState } from "@/lib/AppState";
import { DRUG_CLASS, isInvestigational, getDoseMax, getMolecularClass, isCompoundedGeneric } from "@/lib/medicationData";
import { getShotDeviceOptions, getDeliveryMethodLabel, RETIRED_DELIVERY_METHODS } from "@/lib/deliveryMethods";
import { getCapabilityProfile, getCapabilityWarning } from "@/lib/capabilityProfile";
import { detectDuplicateActiveIngredient } from "@/lib/drugSafety";
import { convertDose, doseUnitLabel } from "@/lib/units";
import { parseShotDate, formatShotDate, calendarDaysBetween } from "@/lib/dateUtils";
import {
  INJECTABLE_ROUTES, ROUTE_CHOICES, getRouteChoices, getDefaultRoute,
  activeRegimensFor, getDoseDefault, getSmartShotDefaults,
} from "@/lib/shotDefaults";
import { addDaysToKey } from "@/lib/repeatSchedule";
import DoseChips from "@/components/modals/DoseChips";
import { chipsForMedication, withCustomDose } from "@/lib/doseOptions";
import { isAboveZero } from "@/lib/formValidity";
import ShotSuccessPanel from "@/components/modals/ShotSuccessPanel";
import SideEffectsModal from "@/components/modals/SideEffectsModal";
import ConfirmDialog from "@/components/ConfirmDialog";
import SaveDeleteFooter from "@/components/SaveDeleteFooter";
import SheetField from "@/components/modals/shot/SheetField";
import SheetPickerRow from "@/components/modals/shot/SheetPickerRow";
import SheetDoseField from "@/components/modals/shot/SheetDoseField";
import ShotDateTimeFields from "@/components/modals/shot/ShotDateTimeFields";
import ShotDetailsSection from "@/components/modals/shot/ShotDetailsSection";
import {
  SHEET_CHIP, SHEET_CHIP_OFF, SHEET_CHIP_ON, SHEET_DIVIDER,
  SHEET_HINT, SHEET_LABEL, SHEET_LABEL_TEXT, siteLabel,
} from "@/components/modals/shot/sheetUi";
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
/** The time a new log opens on: now, to the nearest five minutes. */
function toInputTime(d) {
  const rounded = new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), 0);
  rounded.setMinutes(Math.round(d.getMinutes() / 5) * 5);
  return `${pad(rounded.getHours())}:${pad(rounded.getMinutes())}`;
}
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
    repeatSchedules, addRepeatSchedule, updateRepeatSchedule, addMedicationCustomDose,
    addMedication, deleteMedication, linkShotsToMedication } = useAppState();
  const confirmedDupRef = useRef(false);
  // The "Possible duplicate" card and the modal's own scroll container.
  const dupCardRef = useRef(null);
  const scrollRef = useRef(null);
  // The optional fields, so opening their section can bring them into view.
  const detailsRef = useRef(null);

  const defaultMed = profile?.default_medication || "Ozempic®";
  const now = new Date();

  // Not set until it is moved: 0 is then a deliberate "no pain" rather than
  // the untouched state of an optional field.
  const [pain, setPain] = useState(null);
  // Starts empty: what is offered comes from the user's own medications, which
  // the opening effect resolves before anything is shown as selected.
  const [medication, setMedication] = useState("");
  // Drug name for an "Other / custom (prescriber-directed)" entry.
  const [customName, setCustomName] = useState("");
  const [customGeneric, setCustomGeneric] = useState("");
  const [medicationId, setMedicationId] = useState("");
  // The form being logged: an injection, a pill, or the user's own route. Empty
  // until the product in hand settles it (see src/lib/medicationForm.js).
  const [form, setForm] = useState("");
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
  // Bumped every time the warning shows, so its highlight replays each time.
  const [dupNonce, setDupNonce] = useState(0);
  const [reporting, setReporting] = useState(false);
  // True while the entry is an "Other / custom" one: its name and dose are
  // typed by the user, and nothing is checked against a label.
  const [customChosen, setCustomChosen] = useState(false);
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
  const [nostril, setNostril] = useState("");
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
  // A catalogue product — or one of the user's own records — is logged from its
  // label strengths; only an explicit "Other / custom" entry is typed free-hand.
  const isCustomProduct = customChosen;
  // Only once-weekly products can use the weekly repeat; a daily product cannot.
  const isWeeklyMedication = getIntervalDays(medication) === 7;
  const caps = getCapabilityProfile(medication);
  const capabilityWarning = getCapabilityWarning(medication);
  // How this product is logged, from the one shared table in
  // src/lib/medicationForm.js: a product sold in more than one form offers the
  // choice here, one sold in a single form sets it silently, and a product the
  // app knows nothing about leaves it to the route on its own record.
  const formChoice = medicationFormChoice(
    isCustomProduct ? CUSTOM_MEDICATION_NAME : medication,
    { custom: isCustomProduct, shots },
  );
  const offeredForms = formChoice.options;
  const activeForm = form || formChoice.default;
  const activeRoute = route || formRoute(activeForm) || getDefaultRoute(medication);
  // Compounded / generic products take a free-text concentration.
  const isCompounded = isCompoundedGeneric(medication);
  // A product with no strengths to choose from (a compounded or research
  // product) is logged by typing the dose with its unit, never from a chip.
  const freeDose = !isCustomProduct && isFreeDoseMedication(medication);
  // An injection places a site; a tablet places none.
  const isInjectable = INJECTABLE_ROUTES.includes(activeRoute);
  // The action is named for the form in hand: a dose is taken, a shot is given.
  const isShot = activeForm ? activeForm === FORM_INJECTION : INJECTABLE_ROUTES.includes(activeRoute);
  // A tablet has no injection to place, so its route and device are not asked for.
  const tabletForm = activeForm ? activeForm === FORM_PILL : ORAL_ROUTES.includes(activeRoute);
  const siteOptions = activeRoute === "intramuscular" ? imSites : activeRoute === "intradermal" ? idSites : scSites;
  const isReconstituted = activeRoute === "reconstituted_vial" || caps?.supports_reconstitution;

  // Route and Device type sit inside "More details" and are always offered — the
  // main form keeps only what is logged every time. Route is pre-filled from the
  // medication (a pen is subcutaneous, Rybelsus is oral) and stays changeable;
  // Device type starts empty. A product with no catalogue routes (an
  // "Other / custom" entry) gets the generic route choices.
  const routeChoices = getRouteChoices(medication);
  // The product's own routes, plus the form its picker offers when that is not
  // already one of them (Wegovy® logs as a pen or as a tablet), so this dropdown
  // always shows the form that is actually being logged.
  const routeOptions = (() => {
    const base = routeChoices.length ? routeChoices : ROUTE_CHOICES;
    const formR = formRoute(activeForm);
    if (!formR || base.some((o) => o.value === formR)) return base;
    return [...base, { value: formR, label: formLabel(activeForm) }];
  })();
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
  const recommendedSite = getRecommendedSite();
  // A new log opens on the site the rotation suggests, and the row says so.
  const displayedSite = site || recommendedSite;
  const siteIsSuggested = !editingShot && !!recommendedSite && displayedSite === recommendedSite;
  const scheduleFor = (med) => repeatSchedules.find((s) => s.status === "active" && s.medication === med) || null;

  // Silently link the log to the user's active regimen for this medication.
  const regimensForMed = activeRegimensFor(medications, medication);
  // Only ask when two active regimens exist for the SAME medication.
  const needsRegimenChoice = regimensForMed.length > 1;

  // What the medication field shows: the chosen product, the typed custom name,
  // or a plain prompt before anything is chosen. The row always opens the picker,
  // whether the user has one medication saved or none.
  const medLabel = isCustomProduct ? (customName.trim() || "Others") : medication;

  // ── Gentle, non-blocking safety readouts ──────────────────────────────────
  const doseNum = parseFloat(dose) || 0;
  const maxDoseMg = getDoseMax(medication);
  const doseInMg = convertDose(doseNum, doseUnit, "mg");
  // Never for a product with no label strengths: its dose is the prescriber's
  // own number, so no maximum is ever read back to the user as guidance.
  const aboveMax = !freeDose && maxDoseMg < 100 && doseInMg != null && doseInMg > maxDoseMg;
  const previousShot = shots.find((s) => s.medication === medication && s.id !== editingShot?.id) || null;
  const doseChanged = !!(
    previousShot && previousShot.dose != null && doseNum > 0 &&
    (previousShot.dose_unit || "mg") === doseUnit &&
    Number(previousShot.dose) !== doseNum
  );
  // The chips follow the medication and the form in hand: a pen strength is never
  // offered as a tablet's dose.
  const doseChips = chipsForMedication(
    ownMed || { medication_name: medication },
    profile?.custom_doses || [],
    activeForm || undefined,
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
    setCustomChosen(false);
    setConcentration(""); setNotes(""); setPain(null);
    setInfusionDuration(""); setClinicLocation(""); setPremedication(false);
    setSprayCount(""); setNostril(""); setPriming(false);
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
      // An entry with no record and no catalogue product is a typed custom one.
      setCustomChosen(!editingShot.medication_id && !getMedicationConfig(stored));
      setDose(String(editingShot.dose ?? "2.50"));
      setDoseUnit(editingShot.dose_unit || "mg");
      setConcentration(editingShot.concentration || "");
      setSite(editingShot.site || recommendedSite);
      const editMedication = editingShot.medication || defaultMed;
      const editRoute = editingShot.route || getDefaultRoute(editMedication);
      setRoute(editRoute);
      // The form the entry was logged as, read back from its own route.
      setForm(formForRoute(editRoute) || "");
      setDeviceType(editingShot.device_type || "");
      setNotes(editingShot.notes || "");
      setPain(editingShot.pain ?? null);
      setInfusionDuration(editingShot.infusion_duration != null ? String(editingShot.infusion_duration) : "");
      setClinicLocation(editingShot.clinic_location || "");
      setPremedication(!!editingShot.premedication);
      setSprayCount(editingShot.spray_count != null ? String(editingShot.spray_count) : "");
      setNostril(editingShot.nostril || "");
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
      setForm(smart.form || "");
      setDeviceType(smart.deviceType);
      if (initialValues) {
        setMedication(initialValues.medication || smart.medication);
        setMedicationId(initialValues.medication_id || smart.medicationId);
        setDose(String(initialValues.dose ?? smart.dose));
        setDoseUnit(initialValues.dose_unit || smart.doseUnit);
        setConcentration(initialValues.concentration || "");
        setRoute(initialValues.route || smart.route);
        setForm(formForRoute(initialValues.route || smart.route) || smart.form || "");
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
  // `picked` is a row from the picker: one of the user's own medications, or a
  // catalogue entry they have never saved. Nothing is written here — the record
  // for a catalogue choice is created when the shot is saved.
  const selectMedication = (picked) => {
    const name = picked.name;
    // The medication is required: tapping the one already chosen keeps it as it
    // is (and only closes the list) rather than resetting the dose.
    if (name === medication) { setShowMedDropdown(false); return; }
    // How the new product is logged decides its route and which strengths are
    // offered. The date, the time and the notes already typed are left as they
    // are — only the dose follows the product, and it is cleared when it is not
    // one of the new product's own strengths.
    const nextForm = medicationFormChoice(name, { shots }).default;
    const nextRoute = formRoute(nextForm) || picked.route || getDefaultRoute(name);
    const { dose: nextDose, unit } = getDoseDefault({
      medication: name, medications, shots, legacyCustomDoses: profile?.custom_doses || [],
      form: nextForm || undefined,
    });
    setMedication(name);
    setCustomName(name);
    setCustomChosen(false);
    setMedicationId(picked.id || "");
    setForm(nextForm);
    setDose(nextDose === "" ? "" : String(nextDose));
    setDoseUnit(unit || picked.unit || "mg");
    setRoute(nextRoute);
    if (RETIRED_DELIVERY_METHODS.includes(deviceType)) setDeviceType("");
    else if (!INJECTABLE_ROUTES.includes(nextRoute)) setDeviceType("");
    else if (isCompoundedGeneric(name)) setDeviceType("");
    setRepeatOn(!!scheduleFor(name));
    setShowMedDropdown(false);
  };

  // "Other / custom": the name is typed in the picker itself, the dose and its
  // unit on the form. The entry stays out of the catalogue's verified dose lists,
  // and its name is kept as one of the user's own medications once the shot is
  // saved, so it is offered under "Your medications" next time.
  const chooseCustom = (name = "") => {
    setCustomChosen(true);
    setMedication(name);
    setCustomName(name);
    setMedicationId("");
    // Nothing is known about a product the user names, so the Form choice is
    // shown and starts on an injection — the form it is most often given in.
    setForm(FORM_INJECTION);
    setRoute(formRoute(FORM_INJECTION));
    setDeviceType("");
    setDose("");
    setDoseUnit("mg");
    setShowMedDropdown(false);
  };

  // Choosing a form re-applies that form's own route and strengths: the dose is
  // cleared when it is not one of the new form's chips, so a pen strength can
  // never be saved as a tablet's dose. The date, the time and the notes already
  // typed are kept exactly as they are.
  const chooseForm = (next) => {
    if (next === activeForm) return;
    sound.tap();
    setForm(next);
    setRoute(formRoute(next) || "");
    if (next !== FORM_INJECTION) setDeviceType("");
    const chips = chipsForMedication(
      ownMed || { medication_name: medication },
      profile?.custom_doses || [],
      next,
    );
    if (!chips.includes(parseFloat(dose))) setDose("");
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

  // What the footer's Save needs before it may act: a medication (the name typed
  // for a custom product counts), a real dose that its label lists, a date and a
  // time. While editing an existing log, something has to have actually changed
  // from it. A brand-new log is a different case: the medication and dose it
  // opens with are the record being logged, so they are ready to save as they
  // are — that one-tap log is the point of this sheet.
  const shotMedication = isCustomProduct ? (customName.trim() || medication) : medication;
  const doseNumber = parseFloat(dose);
  const doseReady = isAboveZero(dose) && (isCustomProduct || validateDosePair(medication, doseNumber).valid);
  // An injection also needs a site: the rotation's suggestion counts, so a new
  // log is ready as it opens, and the button dims only when the site is emptied.
  const siteReady = !isInjectable || !!(site || recommendedSite);
  const canSave = !saving && !!shotMedication && doseReady && !!date && !!time
    && siteReady && (!editingShot || dirtyRef.current);

  const handleSave = async () => {
    // Saving puts the keyboard away.
    if (isTypingField(document.activeElement)) document.activeElement.blur();
    const doseNum = parseFloat(dose);
    const finalMedication = isCustomProduct ? (customName.trim() || medication) : medication;
    if (isCustomProduct && !customName.trim()) {
      sound.warning();
      setError("Enter the medication name your prescriber gave you.");
      return;
    }
    if (!finalMedication) {
      sound.warning();
      setError("Choose the medication first.");
      return;
    }
    if (isNaN(doseNum) || doseNum <= 0) {
      sound.warning();
      setError("Please enter a valid dose.");
      return;
    }
    if (!isCustomProduct) {
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
    // One save, two writes — see saveShotWithMedication: a medication the user
    // has not saved yet is created from the row the picker offered, and the shot
    // is written against it. Nothing is written before this point.
    const payload = {
      medication: finalMedication,
      dose_source: isCustomProduct ? "custom" : "label",
      medication_id: isCustomProduct ? undefined : (ownMed?.id || medicationId || undefined),
      dose: doseNum, dose_unit: doseUnit,
      drugClass: isCustomProduct ? (DRUG_CLASS[finalMedication] || "") : (DRUG_CLASS[medication] || "GLP-1"),
      molecularClass: getMolecularClass(finalMedication),
      route: route || "", device_type: deviceType || undefined,
      concentration: isCompounded ? concentration.trim() || undefined : undefined,
      date: formatShotDate(d), time: toShotTime(d),
      site: isInjectable ? (site || recommendedSite) : "",
      pain: pain == null ? undefined : pain, notes,
    };
    // Route-specific fields
    if (activeRoute === "intravenous_infusion") {
      payload.infusion_duration = parseFloat(infusionDuration) || undefined;
      payload.clinic_location = clinicLocation || undefined;
      payload.premedication = premedication;
    }
    if (activeRoute === "nasal") {
      payload.spray_count = parseInt(sprayCount) || undefined;
      payload.nostril = nostril || undefined;
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
      // The medication is created here — never on selection — so choosing a row
      // in the picker on its own leaves nothing behind in Meds.
      await saveShotWithMedication({
        payload,
        regimen: ownMed ? null : regimenFromShot({
          name: finalMedication,
          // A generic name typed in the "Others" entry is kept with the medication.
          genericName: isCustomProduct ? customGeneric.trim() : "",
          dose: doseNum,
          doseUnit,
          route: route || "",
          shots,
          // The shot's own date counts, so a backdated shot sets the start date.
          dateKey: date,
          // A strength the label does not list is remembered as a chip next time.
          customDoses: doseChips.includes(doseNum) ? [] : [doseNum],
        }),
        // The record already exists: the shot links to it, and a strength the
        // label does not list is added to it once the shot is safely written.
        doseToRemember: ownMed && !doseChips.includes(doseNum) ? { id: ownMed.id, dose: doseNum } : null,
        editingShotId: editingShot?.id || "",
        afterWrite: () => syncRepeatSchedule(doseNum),
        writers: {
          addMedication, deleteMedication, addShot, updateShot,
          addMedicationCustomDose, linkShotsToMedication,
        },
      });
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

  // Deleting asks first, in the app's own dialog. The log is held whole in
  // memory so Undo can put it straight back.
  const handleDelete = async () => {
    if (!editingShot) return;
    const removed = editingShot;
    await deleteShot(removed.id);
    toast.deleted(isShot ? "Shot deleted" : "Dose deleted", {
      actionLabel: "Undo", actionTtlMs: 5000, onAction: () => restoreShot(removed),
    });
    onClose();
  };

  // What the sheet calls what it is logging, in the form's own words: a dose is
  // taken, a shot is given.
  const word = isShot ? "shot" : "dose";
  const Word = isShot ? "Shot" : "Dose";
  const title = editingShot ? `Edit ${word}` : `Log ${word}`;
  const saveLabel = editingShot ? `Update ${word}` : `Save ${word}`;

  // Opening "More details" brings the fields it has just added into view: the
  // sheet's own scroller is moved, so the page behind the sheet never moves.
  const toggleDetails = () => {
    const next = !showDetails;
    if (next) sound.open(); else sound.close();
    setShowDetails(next);
    if (!next) return;
    requestAnimationFrame(() => {
      const node = detailsRef.current;
      const scroller = scrollRef.current;
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
          aria-labelledby="add-shot-title"
          tabIndex={-1}
          onChangeCapture={markEdited}
          onInputCapture={markEdited}
          onClickCapture={(e) => { if (!e.target.closest("[data-skip-dirty]")) markEdited(); }}
          className="relative flex flex-col w-full sm:max-w-[520px] max-h-[92dvh] overflow-hidden sheet-lock bg-white dark:bg-[#0f1117] rounded-t-3xl sm:rounded-3xl animate-in slide-in-from-bottom sm:mx-4 dark:shadow-[0_-8px_40px_rgba(0,0,0,0.5)] outline-none"
        >
          <div className="shrink-0 bg-white dark:bg-[#0f1117]">
            <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-white/20" /></div>
            <div className="flex items-center justify-between gap-3 px-5 pb-4 pt-1">
              <h2 id="add-shot-title" className="min-w-0 truncate text-[20px] font-semibold leading-tight text-gray-900 dark:text-[#E8E9F0]">{title}</h2>
              <button onClick={requestClose} data-skip-dirty aria-label="Close" className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center">
                <X size={22} className="text-gray-400" />
              </button>
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
              title={editingShot ? `${Word} updated` : `${Word} logged`}
              detail={`${dose} ${doseUnitLabel(doseUnit)} · ${medication}`}
              onReportSideEffect={() => setReporting(true)}
            />
          ) : (
            <>
              {error && <p className="mx-5 mb-6 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-500 dark:bg-red-500/10 dark:text-red-400">{error}</p>}
              {capabilityWarning && (
                <div className="mx-5 mb-6 rounded-xl border border-orange-200 bg-orange-50 px-3.5 py-2.5 text-sm text-orange-700 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-300">
                  <p className="font-semibold text-xs">⚠ {isInvestigational(medication) ? "Not an approved medicine" : "Capability notice"}</p>
                  <p className="mt-1 text-xs">{capabilityWarning}</p>
                </div>
              )}

              <div className="px-5 pb-6 space-y-6">
                {/* Medication: one row, always tappable — however many products
                    the user has saved — with the chevron that says so. */}
                <SheetField label="Medication">
                  {/* The row itself changes nothing, so a tap on it does not mark
                      the log as edited. */}
                  <div data-skip-dirty>
                    <SheetPickerRow
                      value={medLabel}
                      tappable
                      onClick={() => setShowMedDropdown(true)}
                      ariaExpanded={showMedDropdown}
                      ariaLabel="Choose medication"
                    />
                  </div>
                  {/* Choosing one opens a sheet of its own, over this one. */}
                  <MedicationPickerSheet
                    open={showMedDropdown}
                    onClose={() => setShowMedDropdown(false)}
                    medications={medications}
                    current={medication}
                    isCustom={isCustomProduct}
                    onChoose={selectMedication}
                    onChooseCustom={chooseCustom}
                  />
                  {/* A compounded or research product carries the one note that
                      belongs with its name, in the sheet's own small grey. */}
                  {freeDose && (
                    <p className={`mt-2 ${SHEET_HINT}`}>
                      Not an approved treatment in all regions. Log only what your prescriber told you.
                    </p>
                  )}

                  {/* Two active regimens for the same medication: one question */}
                  {needsRegimenChoice && (
                    <div className="mt-6">
                      <p className={SHEET_LABEL}>Which regimen is this dose part of?</p>
                      <div className="flex flex-wrap gap-2">
                        {regimensForMed.map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setMedicationId(m.id)}
                            aria-pressed={medicationId === m.id}
                            className={`${SHEET_CHIP} ${medicationId === m.id ? SHEET_CHIP_ON : SHEET_CHIP_OFF}`}
                          >
                            {m.prescribed_dose ? `${m.prescribed_dose} ${m.dose_unit || "mg"}` : m.medication_name}
                            {m.indication ? ` · ${m.indication}` : ""}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </SheetField>

                {/* A product sold in two forms — or one the user named, about
                    which nothing is known: which form is being logged. A product
                    sold in a single form sets it silently and asks nothing. */}
                {offeredForms.length > 0 && (
                  <SheetField label="Form">
                    <div className="flex flex-wrap gap-2">
                      {offeredForms.map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => chooseForm(f)}
                          aria-pressed={activeForm === f}
                          className={`${SHEET_CHIP} ${activeForm === f ? SHEET_CHIP_ON : SHEET_CHIP_OFF}`}
                        >
                          {activeForm === f && <Check size={15} strokeWidth={3} aria-hidden="true" />}
                          {formLabel(f)}
                        </button>
                      ))}
                    </div>
                  </SheetField>
                )}

                {/* Dose: the strengths the label lists for the chosen product, as
                    neutral pills carrying the dose's own colour in a small dot. A
                    compounded or research product has no list to choose from, so
                    its amount and unit are typed instead. An "Others" entry asks
                    for the drug name and dose on the form itself. */}
                <div>
                  {/* Nothing chosen yet: the picker above is the way in, and no
                      dose is offered until a medication is chosen. */}
                  {!medication && !isCustomProduct ? (
                    <p className="text-sm text-gray-500 dark:text-[#9A9DAE]">
                      {isShot
                        ? "Choose the medication you injected to log your shot."
                        : "Choose the medication to log your dose."}
                    </p>
                  ) : isCustomProduct ? (
                    <CustomMedicationFields
                      name={customName || medication}
                      onNameChange={(v) => { setCustomName(v); setMedication(v); }}
                      generic={customGeneric}
                      onGenericChange={setCustomGeneric}
                      dose={dose}
                      onDoseChange={setDose}
                      unit={doseUnit}
                      onUnitChange={setDoseUnit}
                    />
                  ) : (
                    <>
                      {freeDose ? (
                        /* Nothing to choose from: the amount and its unit are
                           typed, exactly as the prescriber or the label states. */
                        <SheetField label="Dose">
                          <SheetDoseField
                            value={dose}
                            onChange={setDose}
                            unit={doseUnit}
                            onUnitChange={setDoseUnit}
                            units={["mcg", "mg"]}
                          />
                        </SheetField>
                      ) : (
                        <DoseChips
                          key={medication}
                          medication={medication}
                          options={doseChips}
                          value={doseNum}
                          unit={doseUnit}
                          onSelect={(v) => setDose(String(v))}
                          onAddCustom={addCustomDose}
                          variant="neutral"
                        />
                      )}
                      {doseChanged && (
                        <p className="mt-2 text-[13px] font-medium leading-snug text-amber-600 dark:text-amber-400">
                          Dose changed from {previousShot.dose} {doseUnitLabel(previousShot.dose_unit || "mg")} to {dose} {doseUnitLabel(doseUnit)}.
                        </p>
                      )}
                      {ownMed?.prescribed_dose != null && doseNum > 0
                        && Number(ownMed.prescribed_dose) !== doseNum && (
                        <p className="mt-2 text-[13px] leading-snug text-gray-500 dark:text-[#9A9DAE]">
                          Different from your prescribed dose ({ownMed.prescribed_dose} {doseUnitLabel(ownMed.dose_unit || "mg")}).
                        </p>
                      )}
                      {aboveMax && (
                        <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">
                          Above the typical maximum of {maxDoseMg} mg. Please confirm with your prescriber.
                        </p>
                      )}
                      {ingredientDup.duplicate && (
                        <p className="mt-2 text-xs text-orange-600 dark:text-orange-400">
                          You also logged {ingredientDup.existingBrand} ({ingredientDup.generic}) on {ingredientDup.lastDoseDate}. Two forms of the same active ingredient can duplicate your dose.
                        </p>
                      )}
                    </>
                  )}
                </div>

                {/* Injection site: one row, with the rotation's suggestion
                    already chosen. */}
                {isInjectable && (
                  <SheetField label="Injection site">
                    <div className="relative">
                      <div data-skip-dirty>
                        <SheetPickerRow
                          value={siteLabel(displayedSite)}
                          tappable
                          onClick={() => setShowSiteDropdown((v) => !v)}
                          ariaExpanded={showSiteDropdown}
                          ariaLabel="Injection site"
                          tag={siteIsSuggested ? (
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-500 dark:bg-white/[0.06] dark:text-gray-400">
                              Suggested
                            </span>
                          ) : null}
                        />
                      </div>
                      {showSiteDropdown && (
                        <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto overscroll-contain rounded-2xl border border-gray-200 bg-white shadow-lg dark:border-white/[0.08] dark:bg-[#1e2130]">
                          {siteOptions.map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => { sound.tap(); setSite(s); setShowSiteDropdown(false); }}
                              aria-pressed={site === s}
                              className={`w-full min-h-[52px] px-4 py-3 text-left text-sm dark:text-[#E8E9F0] ${site === s ? "bg-indigo-50 font-medium text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300" : "hover:bg-gray-50 dark:hover:bg-white/[0.05]"}`}
                            >
                              {siteLabel(s)}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </SheetField>
                )}

                {/* The shot's date and time, side by side and equal width, each
                    with its own mark on the left and the width reset a native
                    control needs (see src/lib/dateTimeField.js), so neither runs
                    past the same px-5 gutter as the fields above it. */}
                <ShotDateTimeFields
                  date={date}
                  time={time}
                  onDateChange={setDate}
                  onTimeChange={setTime}
                />

                {/* Everything optional lives behind one row, closed by default.
                    Opening it scrolls the fields it adds into view. */}
                <div className={`${SHEET_DIVIDER} pt-2`}>
                  <button
                    type="button"
                    onClick={toggleDetails}
                    data-skip-dirty
                    aria-expanded={showDetails}
                    className="flex w-full items-center justify-between gap-2 py-3"
                  >
                    <span className={SHEET_LABEL_TEXT}>More details</span>
                    <ChevronDown
                      size={18}
                      aria-hidden="true"
                      className={`text-gray-400 transition-transform ${showDetails ? "rotate-180" : ""}`}
                    />
                  </button>

                  {showDetails && (
                    <ShotDetailsSection
                      innerRef={detailsRef}
                      tabletForm={tabletForm}
                      activeRoute={activeRoute}
                      routeOptions={routeOptions}
                      onRouteChange={setRoute}
                      deviceType={deviceType}
                      deviceOptions={deviceChoices}
                      onDeviceChange={setDeviceType}
                      isCompounded={isCompounded}
                      concentration={concentration}
                      setConcentration={setConcentration}
                      infusionDuration={infusionDuration}
                      setInfusionDuration={setInfusionDuration}
                      clinicLocation={clinicLocation}
                      setClinicLocation={setClinicLocation}
                      premedication={premedication}
                      setPremedication={setPremedication}
                      sprayCount={sprayCount}
                      setSprayCount={setSprayCount}
                      nostril={nostril}
                      setNostril={setNostril}
                      priming={priming}
                      setPriming={setPriming}
                      takenWithFood={takenWithFood}
                      setTakenWithFood={setTakenWithFood}
                      patchSite={patchSite}
                      setPatchSite={setPatchSite}
                      applicationDate={applicationDate}
                      setApplicationDate={setApplicationDate}
                      bodyArea={bodyArea}
                      setBodyArea={setBodyArea}
                      applicationNotes={applicationNotes}
                      setApplicationNotes={setApplicationNotes}
                      insertionDate={insertionDate}
                      setInsertionDate={setInsertionDate}
                      pumpRate={pumpRate}
                      setPumpRate={setPumpRate}
                      siteChangeDate={siteChangeDate}
                      setSiteChangeDate={setSiteChangeDate}
                      reconstitutionDate={reconstitutionDate}
                      setReconstitutionDate={setReconstitutionDate}
                      inUseExpiry={inUseExpiry}
                      setInUseExpiry={setInUseExpiry}
                      isReconstituted={isReconstituted}
                      editingShot={editingShot}
                      isWeeklyMedication={isWeeklyMedication}
                      repeatOn={repeatOn}
                      setRepeatOn={setRepeatOn}
                      repeatMode={repeatMode}
                      setRepeatMode={setRepeatMode}
                      repeatWeeks={repeatWeeks}
                      setRepeatWeeks={setRepeatWeeks}
                      schedule={scheduleFor(medication)}
                      date={date}
                      time={time}
                      medication={medication}
                      dose={dose}
                      doseUnit={doseUnit}
                      pain={pain}
                      setPain={setPain}
                      notes={notes}
                      setNotes={setNotes}
                    />
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
                    <p className="mt-1">Your last {duplicatePrompt.medication} {word} was {duplicatePrompt.label} ago. Is this a duplicate?</p>
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => { confirmedDupRef.current = true; handleSave(); }} className="btn-pill btn-pill-sm bg-orange-600 text-white">Save anyway</button>
                      <button onClick={() => setDuplicatePrompt(null)} className="btn-pill btn-pill-sm btn-secondary">Cancel</button>
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
            className="shrink-0 border-t border-gray-100 bg-white px-5 pt-4 dark:border-white/[0.08] dark:bg-[#0f1117]"
            style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))" }}
          >
            {saved ? (
              <button onClick={onClose} className="btn-pill btn-primary w-full">
                Done
              </button>
            ) : (
              <SaveDeleteFooter
                saveLabel={saveLabel}
                onSave={handleSave}
                saveDisabled={!canSave}
                saveBusy={saving}
                // Only an entry that is already saved has something to remove.
                onDelete={editingShot ? handleDelete : undefined}
                deleteTitle={`Delete this ${word}?`}
                deleteAriaLabel={`Delete ${word}`}
              />
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDiscard}
        title={`Discard this ${word}?`}
        message="This log has unsaved changes. Closing it now will lose them."
        tone="warning"
        icon={AlertTriangle}
        confirmLabel="Discard changes"
        cancelLabel="Keep editing"
        onConfirm={() => { setConfirmDiscard(false); dirtyRef.current = false; onClose(); }}
        onCancel={() => setConfirmDiscard(false)}
      />

      <SideEffectsModal open={reporting} onClose={() => setReporting(false)} dayKey={date} />
    </>
  );
}