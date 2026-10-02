import React, { useState, useEffect, useRef } from "react";
import { X, Save, MapPin, Star, ChevronDown, Trash2 } from "lucide-react";
import { useAppState } from "@/lib/AppState";
import { MEDICATIONS, DRUG_CLASS, isInvestigational, getDoseMax, getPrimaryRoute, getMolecularClass, isCompoundedGeneric } from "@/lib/medicationData";
import { ROUTE_LABELS } from "@/lib/medicationCatalogue";
import { getDeliveryMethods, getDeliveryMethodLabel, getSelectableRoutes, RETIRED_DELIVERY_METHODS } from "@/lib/deliveryMethods";
import { getCapabilityProfile, getCapabilityWarning, getMolecularClassLabel } from "@/lib/capabilityProfile";
import { detectDuplicateActiveIngredient } from "@/lib/drugSafety";
import { convertDose, doseStep, doseUnitLabel } from "@/lib/units";
import { toast } from "sonner";

// Routes that require site selection
const INJECTABLE_ROUTES = ["subcutaneous", "intramuscular", "intradermal"];

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

const DOSE_UNITS = ["mg", "mcg", "units", "IU", "mL", "sprays", "tablets", "applications"];

const pad = (n) => String(n).padStart(2, "0");
function toInputDate(d) { return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
function toInputTime(d) { return `${pad(d.getHours())}:${pad(d.getMinutes())}`; }

export default function AddShotModal({ open, onClose, editingShot }) {
  const { addShot, updateShot, deleteShot, profile, getRecommendedSite, shots, medications } = useAppState();
  const confirmedDupRef = useRef(false);
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  const defaultMed = profile?.default_medication || "Ozempic®";
  const now = new Date();

  const [pain, setPain] = useState(0);
  const [medication, setMedication] = useState(defaultMed);
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
  const [showRouteDropdown, setShowRouteDropdown] = useState(false);
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const [route, setRoute] = useState("");
  const [deviceType, setDeviceType] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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

  const medRoutes = getSelectableRoutes(medication);
  const caps = getCapabilityProfile(medication);
  const capabilityWarning = getCapabilityWarning(medication);
  const activeRoute = route || getPrimaryRoute(medication);
  const deliveryOptions = getDeliveryMethods(medication, activeRoute);
  const isLegacyDevice = RETIRED_DELIVERY_METHODS.includes(deviceType);
  // Compounded / generic products take a free-text concentration.
  const isCompounded = isCompoundedGeneric(medication);
  const isInjectable = INJECTABLE_ROUTES.includes(activeRoute);
  const siteOptions = activeRoute === "intramuscular" ? imSites : activeRoute === "intradermal" ? idSites : scSites;
  const isReconstituted = activeRoute === "reconstituted_vial" || caps?.supports_reconstitution;

  // Matching medication regimen records for the selected brand
  const matchingRegimens = medications.filter((m) =>
    m.medication_name === medication || (m.generic_name && DRUG_CLASS[medication] === m.generic_name)
  );

  const recommendedSite = getRecommendedSite();

  useEffect(() => {
    if (open) {
      if (editingShot) {
        setMedication(editingShot.medication || defaultMed);
        setMedicationId(editingShot.medication_id || "");
        setDose(String(editingShot.dose ?? "2.50"));
        setDoseUnit(editingShot.dose_unit || "mg");
        setConcentration(editingShot.concentration || "");
        setSite(editingShot.site || recommendedSite);
        setRoute(editingShot.route || getPrimaryRoute(editingShot.medication || defaultMed));
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
        setApplicationDate(editingShot.application_date || toInputDate(now));
        setBodyArea(editingShot.body_area || "");
        setApplicationNotes(editingShot.application_notes || "");
        setInsertionDate(editingShot.insertion_date || toInputDate(now));
        setPumpRate(editingShot.pump_rate != null ? String(editingShot.pump_rate) : "");
        setSiteChangeDate(editingShot.site_change_date || toInputDate(now));
        setReconstitutionDate(editingShot.reconstitution_date || "");
        setInUseExpiry(editingShot.in_use_expiry || "");
        try {
          const months = { Jan:0, Feb:1, Mar:2, Apr:3, May:4, Jun:5, Jul:6, Aug:7, Sep:8, Oct:9, Nov:10, Dec:11 };
          const parts = editingShot.date.replace(",", "").split(" ");
          const d = new Date(parseInt(parts[2]), months[parts[0]], parseInt(parts[1]));
          setDate(toInputDate(d));
        } catch { setDate(toInputDate(now)); }
        try {
          const [timePart, ampm] = editingShot.time.split(" ");
          let [h, m] = timePart.split(":").map(Number);
          if (ampm === "PM" && h !== 12) h += 12;
          if (ampm === "AM" && h === 12) h = 0;
          setTime(`${pad(h)}:${pad(m)}`);
        } catch { setTime(toInputTime(now)); }
      } else {
        const n = new Date();
        setMedication(defaultMed);
        setMedicationId("");
        setDose("2.50");
        setDoseUnit("mg");
        setConcentration("");
        setSite(recommendedSite);
        setRoute(getPrimaryRoute(defaultMed));
        setDeviceType("");
        setNotes("");
        setPain(0);
        setInfusionDuration(""); setClinicLocation(""); setPremedication(false);
        setSprayCount(""); setNostril("both"); setPriming(false);
        setTakenWithFood(null);
        setPatchSite(""); setApplicationDate(toInputDate(n)); setBodyArea(""); setApplicationNotes("");
        setInsertionDate(toInputDate(n)); setPumpRate(""); setSiteChangeDate(toInputDate(n));
        setReconstitutionDate(""); setInUseExpiry("");
        setDate(toInputDate(n)); setTime(toInputTime(n));
      }
      setError("");
      confirmedDupRef.current = false;
      setDuplicateWarning(null);
    }
  }, [open, editingShot]);

  // Delivery method: when only one is valid for this medication/route it is
  // selected automatically (and shown as a static row instead of a dropdown).
  // Legacy retired values are left untouched so old records aren't altered.
  useEffect(() => {
    if (!open) return;
    const options = getDeliveryMethods(medication, activeRoute);
    if (options.length === 1) {
      if (deviceType !== options[0].value) setDeviceType(options[0].value);
    } else if (options.length === 0 && deviceType && !RETIRED_DELIVERY_METHODS.includes(deviceType)) {
      setDeviceType("");
    }
  }, [open, medication, activeRoute, deviceType]);

  if (!open) return null;

  const handleSave = async () => {
    const doseNum = parseFloat(dose);
    if (isNaN(doseNum) || doseNum <= 0) {
      setError("Please enter a valid dose.");
      return;
    }
    // Dose-max check: convert to mg for comparison against catalogue max (which is in mg)
    const maxDoseMg = getDoseMax(medication);
    if (maxDoseMg && maxDoseMg < 100) {
      const doseInMg = convertDose(doseNum, doseUnit, "mg");
      if (doseInMg != null && doseInMg > maxDoseMg) {
        setError(`That dose exceeds the typical maximum for ${medication} (${maxDoseMg} mg). Check the label or confirm with your prescriber.`);
        return;
      }
    }
    if (!editingShot && !confirmedDupRef.current) {
      const dup = detectDuplicateActiveIngredient(medication, shots);
      if (dup.duplicate) { setDuplicateWarning(dup); return; }
    }
    setSaving(true);
    setError(""); setDuplicateWarning(null);
    const d = new Date(date + "T" + time);
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const formattedDate = `${months[d.getMonth()]} ${String(d.getDate()).padStart(2,"0")}, ${d.getFullYear()}`;
    let h = d.getHours(), m = d.getMinutes();
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    const formattedTime = `${h}:${pad(m)} ${ampm}`;
    const payload = {
      medication, medication_id: medicationId || undefined,
      dose: doseNum, dose_unit: doseUnit,
      drugClass: DRUG_CLASS[medication] || "GLP-1",
      molecularClass: getMolecularClass(medication),
      route: activeRoute, device_type: deviceType || undefined,
      concentration: isCompounded ? concentration.trim() || undefined : undefined,
      date: formattedDate, time: formattedTime,
      site: isInjectable ? site : "",
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
        toast.success("Shot added successfully!");
      }
      setSaving(false);
      setTimeout(() => onClose(), 500);
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

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white dark:bg-[#0f1117] rounded-t-3xl sm:rounded-3xl w-full sm:max-w-[520px] max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom sm:mx-4 dark:shadow-[0_-8px_40px_rgba(0,0,0,0.5)]">
        <div className="sticky top-0 z-10 bg-white dark:bg-[#0f1117]">
          <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 bg-gray-300 rounded-full" /></div>
          <div className="flex items-center justify-between px-5 pb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-[#E8E9F0]">{editingShot ? "Edit Shot Log" : "Add Shot Log"}</h2>
            <div className="flex items-center gap-3">
              {editingShot && <button onClick={handleDelete}><Trash2 size={20} className="text-red-400" /></button>}
              <button onClick={onClose}><X size={22} className="text-gray-400" /></button>
            </div>
          </div>
        </div>

        {error && <p className="mx-5 mb-3 text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded-xl px-3 py-2">{error}</p>}
        {capabilityWarning && (
          <div className="mx-5 mb-3 text-sm text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-500/10 rounded-xl px-3 py-2 border border-orange-200 dark:border-orange-500/20">
            <p className="font-semibold text-xs">⚠ {isInvestigational(medication) ? "Not an approved medicine" : "Capability notice"}</p>
            <p className="mt-1 text-xs">{capabilityWarning}</p>
          </div>
        )}

        <div className="px-5 pb-4 space-y-5">
          {/* Date & Time */}
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Date & Time</label>
            <div className="flex gap-3">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="flex-1 border border-gray-200 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-[#E8E9F0] dark:[color-scheme:dark] rounded-xl px-4 py-3 text-base outline-none focus:border-indigo-300" />
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
                className="flex-1 border border-gray-200 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-[#E8E9F0] dark:[color-scheme:dark] rounded-xl px-4 py-3 text-base outline-none focus:border-indigo-300" />
            </div>
          </div>

          {/* Medication */}
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Medication</label>
            <div className="relative">
              <button onClick={() => { setShowMedDropdown(!showMedDropdown); setShowSiteDropdown(false); setShowRouteDropdown(false); setShowUnitDropdown(false); }}
                className="w-full border border-gray-200 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-[#E8E9F0] rounded-xl px-4 py-3 flex items-center justify-between text-left">
                <div>
                  <span className="text-base block">{medication}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">{getMolecularClassLabel(medication)}</span>
                </div>
                <ChevronDown size={18} className="text-gray-400" />
              </button>
              {showMedDropdown && (
                <div className="absolute z-10 mt-1 w-full bg-white dark:bg-[#1e2130] border border-gray-200 dark:border-white/[0.08] rounded-xl shadow-lg max-h-64 overflow-y-auto">
                  {MEDICATIONS.map((m) => (
                    <button key={m} onClick={() => { setMedication(m); setRoute(getPrimaryRoute(m)); if (RETIRED_DELIVERY_METHODS.includes(deviceType)) setDeviceType(""); setShowMedDropdown(false); }}
                      className={`w-full px-4 py-3 text-left text-sm dark:text-[#E8E9F0] ${medication === m ? "bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 font-medium" : "hover:bg-gray-50 dark:hover:bg-white/[0.05]"}`}>
                      <span className="block">{m}</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500 block">{getMolecularClassLabel(m)}</span>
                      {isInvestigational(m) ? <span className="text-xs text-orange-600 dark:text-orange-400">investigational — not approved</span> : null}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Link to saved regimen */}
            {matchingRegimens.length > 0 && (
              <div className="mt-2">
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Link to saved regimen (optional)</label>
                <select value={medicationId} onChange={(e) => setMedicationId(e.target.value)}
                  className="w-full border border-gray-200 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-[#E8E9F0] rounded-xl px-3 py-2 text-sm outline-none">
                  <option value="">— none —</option>
                  {matchingRegimens.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.medication_name}{m.prescribed_dose ? ` (${m.prescribed_dose} ${m.dose_unit || "mg"})` : ""}{m.indication ? ` — ${m.indication}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Route */}
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Route</label>
            <div className="relative">
              <button onClick={() => { setShowRouteDropdown(!showRouteDropdown); setShowMedDropdown(false); setShowSiteDropdown(false); setShowUnitDropdown(false); }}
                className="w-full border border-gray-200 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-[#E8E9F0] rounded-xl px-4 py-3 flex items-center justify-between text-left">
                <span className="text-base">{ROUTE_LABELS[route] || route || "Select route"}</span>
                <ChevronDown size={18} className="text-gray-400" />
              </button>
              {showRouteDropdown && (
                <div className="absolute z-10 mt-1 w-full bg-white dark:bg-[#1e2130] border border-gray-200 dark:border-white/[0.08] rounded-xl shadow-lg">
                  {medRoutes.map((r) => (
                    <button key={r} onClick={() => { setRoute(r); setShowRouteDropdown(false); if (RETIRED_DELIVERY_METHODS.includes(deviceType)) setDeviceType(""); }}
                      className={`w-full px-4 py-3 text-left text-sm dark:text-[#E8E9F0] ${route === r ? "bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 font-medium" : "hover:bg-gray-50 dark:hover:bg-white/[0.05]"}`}>
                      {ROUTE_LABELS[r] || r}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Delivery method — hidden when the route has no delivery choice,
              and collapsed to a static row when there is only one option. */}
          {deliveryOptions.length > 0 && (
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                {deliveryOptions.length === 1 ? "Delivery method" : "Delivery method (optional)"}
              </label>
              {deliveryOptions.length === 1 ? (
                <div className="w-full border border-gray-100 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.03] rounded-xl px-4 py-3 text-base text-gray-500 dark:text-gray-400">
                  {deliveryOptions[0].label}
                </div>
              ) : (
                <select value={deviceType} onChange={(e) => setDeviceType(e.target.value)}
                  className="w-full border border-gray-200 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-[#E8E9F0] rounded-xl px-4 py-3 text-base outline-none focus:border-indigo-300">
                  <option value="">—</option>
                  {isLegacyDevice && (
                    <option value={deviceType} disabled>{getDeliveryMethodLabel(deviceType)}</option>
                  )}
                  {deliveryOptions.map((dt) => <option key={dt.value} value={dt.value}>{dt.label}</option>)}
                </select>
              )}
            </div>
          )}

          {/* Dose + Unit */}
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 block">Dose</label>
            <div className="flex gap-2">
              <div className="flex-1 border border-gray-200 dark:border-white/[0.1] dark:bg-white/[0.05] rounded-xl px-4 py-3 flex items-center">
                <input type="number" value={dose} min="0" step={doseStep(doseUnit)}
                  onChange={(e) => setDose(e.target.value)} className="flex-1 outline-none text-base bg-transparent dark:text-[#E8E9F0]" />
                <div className="relative">
                  <button onClick={() => setShowUnitDropdown(!showUnitDropdown)} className="text-gray-400 text-sm flex items-center gap-1 ml-2">
                    {doseUnitLabel(doseUnit)} <ChevronDown size={14} />
                  </button>
                  {showUnitDropdown && (
                    <div className="absolute z-10 mt-1 right-0 bg-white dark:bg-[#1e2130] border border-gray-200 dark:border-white/[0.08] rounded-xl shadow-lg">
                      {DOSE_UNITS.map((u) => (
                        <button key={u} onClick={() => { setDoseUnit(u); setShowUnitDropdown(false); }}
                          className={`block w-full px-4 py-2 text-sm text-left dark:text-[#E8E9F0] ${doseUnit === u ? "bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 font-medium" : "hover:bg-gray-50 dark:hover:bg-white/[0.05]"}`}>
                          {doseUnitLabel(u)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            {getDoseMax(medication) < 100 && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Typical max for {medication}: {getDoseMax(medication)} mg</p>
            )}
          </div>

          {/* Concentration — compounded / generic products only */}
          {isCompounded && (
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Concentration (Optional)</label>
              <input type="text" value={concentration} onChange={(e) => setConcentration(e.target.value)}
                placeholder="e.g. 2.5 mg/mL"
                className="w-full border border-gray-200 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-[#E8E9F0] rounded-xl px-4 py-3 text-base outline-none focus:border-indigo-300" />
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Compounded strengths vary by pharmacy — enter what your vial says.</p>
            </div>
          )}

          {/* Injection Site — injectable routes only */}
          {isInjectable && (
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Injection Site</label>
              <div className="rounded-xl p-3 mb-2 flex items-start gap-2 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20">
                <MapPin size={16} className="text-indigo-500 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">Recommended: {recommendedSite}</p>
                  <p className="text-xs text-indigo-500 dark:text-indigo-400/70">Based on your rotation history</p>
                </div>
                <button onClick={() => setSite(recommendedSite)} className="text-indigo-600 dark:text-indigo-400 text-sm font-semibold">Use</button>
              </div>
              <div className="relative">
                <button onClick={() => { setShowSiteDropdown(!showSiteDropdown); setShowMedDropdown(false); setShowRouteDropdown(false); }}
                  className="w-full border border-gray-200 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-[#E8E9F0] rounded-xl px-4 py-3 flex items-center justify-between text-left">
                  <div className="flex items-center gap-2"><Star size={16} className="text-orange-400" /><span className="text-base font-semibold">{site}</span></div>
                  <ChevronDown size={18} className="text-gray-400" />
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

          {/* Route-specific fields */}
          {activeRoute === "intravenous_infusion" && (
            <>
              <InputField label="Infusion duration (minutes)">
                <input type="number" min="0" step="1" value={infusionDuration} onChange={(e) => setInfusionDuration(e.target.value)}
                  className="w-full border border-gray-200 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-[#E8E9F0] rounded-xl px-4 py-3 text-base outline-none focus:border-indigo-300" />
              </InputField>
              <InputField label="Clinic / location">
                <input type="text" value={clinicLocation} onChange={(e) => setClinicLocation(e.target.value)}
                  className="w-full border border-gray-200 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-[#E8E9F0] rounded-xl px-4 py-3 text-base outline-none focus:border-indigo-300" />
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
                <input type="number" min="0" step="1" value={sprayCount} onChange={(e) => setSprayCount(e.target.value)}
                  className="w-full border border-gray-200 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-[#E8E9F0] rounded-xl px-4 py-3 text-base outline-none focus:border-indigo-300" />
              </InputField>
              <InputField label="Nostril">
                <select value={nostril} onChange={(e) => setNostril(e.target.value)}
                  className="w-full border border-gray-200 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-[#E8E9F0] rounded-xl px-4 py-3 text-base outline-none focus:border-indigo-300">
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
                <input type="text" value={patchSite} onChange={(e) => setPatchSite(e.target.value)} placeholder="e.g. Abdomen, upper arm"
                  className="w-full border border-gray-200 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-[#E8E9F0] rounded-xl px-4 py-3 text-base outline-none focus:border-indigo-300" />
              </InputField>
              <InputField label="Application date">
                <input type="date" value={applicationDate} onChange={(e) => setApplicationDate(e.target.value)}
                  className="w-full border border-gray-200 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-[#E8E9F0] dark:[color-scheme:dark] rounded-xl px-4 py-3 text-base outline-none focus:border-indigo-300" />
              </InputField>
            </>
          )}

          {(activeRoute === "topical_cream" || activeRoute === "topical_serum" || activeRoute === "topical_gel") && (
            <>
              <InputField label="Body area">
                <input type="text" value={bodyArea} onChange={(e) => setBodyArea(e.target.value)} placeholder="e.g. Face, left cheek"
                  className="w-full border border-gray-200 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-[#E8E9F0] rounded-xl px-4 py-3 text-base outline-none focus:border-indigo-300" />
              </InputField>
              <InputField label="Application notes">
                <textarea value={applicationNotes} onChange={(e) => setApplicationNotes(e.target.value)} rows={2}
                  className="w-full border border-gray-200 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-[#E8E9F0] rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-300" />
              </InputField>
            </>
          )}

          {activeRoute === "implant" && (
            <>
              <InputField label="Clinic / location">
                <input type="text" value={clinicLocation} onChange={(e) => setClinicLocation(e.target.value)}
                  className="w-full border border-gray-200 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-[#E8E9F0] rounded-xl px-4 py-3 text-base outline-none focus:border-indigo-300" />
              </InputField>
              <InputField label="Insertion date">
                <input type="date" value={insertionDate} onChange={(e) => setInsertionDate(e.target.value)}
                  className="w-full border border-gray-200 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-[#E8E9F0] dark:[color-scheme:dark] rounded-xl px-4 py-3 text-base outline-none focus:border-indigo-300" />
              </InputField>
            </>
          )}

          {activeRoute === "pump_infusion" && (
            <>
              <InputField label="Pump rate">
                <input type="number" min="0" step="0.1" value={pumpRate} onChange={(e) => setPumpRate(e.target.value)}
                  className="w-full border border-gray-200 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-[#E8E9F0] rounded-xl px-4 py-3 text-base outline-none focus:border-indigo-300" />
              </InputField>
              <InputField label="Site change date">
                <input type="date" value={siteChangeDate} onChange={(e) => setSiteChangeDate(e.target.value)}
                  className="w-full border border-gray-200 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-[#E8E9F0] dark:[color-scheme:dark] rounded-xl px-4 py-3 text-base outline-none focus:border-indigo-300" />
              </InputField>
            </>
          )}

          {/* Reconstitution fields */}
          {isReconstituted && (
            <>
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Reconstitution</div>
              <InputField label="Reconstitution date">
                <input type="date" value={reconstitutionDate} onChange={(e) => setReconstitutionDate(e.target.value)}
                  className="w-full border border-gray-200 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-[#E8E9F0] dark:[color-scheme:dark] rounded-xl px-4 py-3 text-base outline-none focus:border-indigo-300" />
              </InputField>
              <InputField label="In-use expiry date">
                <input type="date" value={inUseExpiry} onChange={(e) => setInUseExpiry(e.target.value)}
                  className="w-full border border-gray-200 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-[#E8E9F0] dark:[color-scheme:dark] rounded-xl px-4 py-3 text-base outline-none focus:border-indigo-300" />
              </InputField>
            </>
          )}

          {/* Pain Level */}
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Pain Level: <span className="text-indigo-600">{pain}/10</span></label>
            <div className="px-1">
              <input type="range" min="0" max="10" value={pain} onChange={(e) => setPain(Number(e.target.value))} className="w-full accent-indigo-600" />
              <div className="flex justify-between text-xs text-gray-400 mt-1"><span>0 – No Pain</span><span>10 – Severe</span></div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Notes (Optional)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder={isCompounded ? "e.g. pharmacy name, how you felt" : "Add any notes or side effects experienced"}
              className="w-full border border-gray-200 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-[#E8E9F0] rounded-xl px-4 py-3 text-sm resize-none h-24 outline-none focus:border-indigo-300" />
          </div>
        </div>

        {duplicateWarning && (
          <div className="mx-5 mb-3 text-sm text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-500/10 rounded-xl px-3 py-2 border border-orange-200 dark:border-orange-500/20">
            <p className="font-semibold">Possible duplicate active ingredient</p>
            <p className="mt-1">You logged {duplicateWarning.existingBrand} ({duplicateWarning.generic}) on {duplicateWarning.lastDoseDate}. Logging two forms of the same active ingredient may duplicate your dose. Confirm this is intended or contact your prescriber.</p>
            <div className="flex gap-2 mt-2">
              <button onClick={() => { confirmedDupRef.current = true; handleSave(); }} className="px-3 py-1.5 rounded-lg bg-orange-600 text-white text-xs font-semibold">Save anyway</button>
              <button onClick={() => setDuplicateWarning(null)} className="px-3 py-1.5 rounded-lg bg-white dark:bg-white/10 text-gray-600 dark:text-gray-300 text-xs font-semibold border border-gray-200 dark:border-white/10">Cancel</button>
            </div>
          </div>
        )}

        <div className="h-24" />
        <div className="sticky bottom-0 px-5 pb-modal-footer pt-2 bg-white dark:bg-[#0f1117] border-t border-gray-100 dark:border-white/[0.08]">
          <button onClick={handleSave} disabled={saving}
            className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
            <Save size={16} /> {saving ? "Saving…" : editingShot ? "Update Shot" : "Save Shot"}
          </button>
        </div>
      </div>
    </div>
  );
}