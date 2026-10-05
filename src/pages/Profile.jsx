import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Settings, Check, Loader2 } from "lucide-react";
import IonIcon from "@/components/IonIcon";
import { SyringeIcon, ScaleIcon } from "@/components/CustomIcons";
import { useAppState } from "@/lib/AppState";
import { toast } from "sonner";
import {
  heightCmOf, heightCmFromParts, heightPartsFromCm,
  checkHeight, checkGoal, fromKg, weightUnitLabel,
} from "@/lib/measure";
import {
  getIntervalDays, effectiveDaysBetween, intervalWarning, plainBrandName,
} from "@/lib/medicationConfig";
import { goalBmiSafeguard } from "@/lib/wellbeing";
import PageContainer from "@/components/PageContainer";

// Only allow digits, one leading decimal, and basic numeric chars
function numericOnly(value, { allowDecimal = true, max = null, min = 0 } = {}) {
  let v = allowDecimal ? value.replace(/[^0-9.]/g, "") : value.replace(/[^0-9]/g, "");
  // Prevent multiple decimal points
  const parts = v.split(".");
  if (parts.length > 2) v = parts[0] + "." + parts.slice(1).join("");
  if (max !== null && parseFloat(v) > max) v = String(max);
  return v;
}

export default function Profile() {
  const { profile, setProfile, shots } = useAppState();
  const [local, setLocal] = useState({ ...profile });
  const [saved, setSaved] = useState({});
  const [saving, setSaving] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setLocal({ ...profile });
  }, [profile]);

  const heightUnit = local.height_unit || "in";
  const weightUnit = local.weight_unit || "lb";

  // The days between shots come from the medication itself. A prescriber's
  // override replaces it, and is flagged when it is shorter than the label allows.
  const [overrideOn, setOverrideOn] = useState(!!profile?.days_between_override);
  const [goalWarning, setGoalWarning] = useState("");
  const currentMedication = shots?.[0]?.medication || local.default_medication || "";
  const labelInterval = getIntervalDays(currentMedication);
  const effectiveInterval = effectiveDaysBetween(local, currentMedication);
  const overrideWarning = intervalWarning(currentMedication, local.days_between_override);

  const toggleOverride = async () => {
    if (overrideOn) {
      setLocal((p) => ({ ...p, days_between_override: "" }));
      try {
        await setProfile({ ...profile, days_between_override: "" });
        toast.success("Profile updated successfully!");
      } catch (err) {
        toast.error("Failed to update profile");
      }
    }
    setOverrideOn((v) => !v);
  };

  // Height and goal are edited in the display unit and stored canonically
  // (cm / kg). These inputs are re-derived whenever the profile or the chosen
  // unit changes, so switching kg↔lb re-renders every screen in that unit.
  const [heightInput, setHeightInput] = useState({ cm: "", ft: "", inch: "" });
  const [goalInput, setGoalInput] = useState("");
  const [savingHeight, setSavingHeight] = useState(false);
  const [savingGoal, setSavingGoal] = useState(false);
  const [heightSaved, setHeightSaved] = useState(false);
  const [goalSaved, setGoalSaved] = useState(false);

  useEffect(() => {
    const cm = heightCmOf(profile);
    const parts = cm ? heightPartsFromCm(cm) : { ft: "", inch: "" };
    setHeightInput({
      cm: cm ? String(Math.round(cm)) : "",
      ft: cm ? String(parts.ft) : "",
      inch: cm ? String(parts.inch) : "",
    });
    const goal = fromKg(profile?.goal_weight_kg, weightUnit);
    setGoalInput(goal == null ? "" : String(goal));
  }, [profile?.height_cm, profile?.height_ft, profile?.height_in,
      profile?.goal_weight_kg, profile?.goal_weight, heightUnit, weightUnit]);

  const flashSaved = (setter) => {
    setter(true);
    setTimeout(() => setter(false), 1500);
  };

  const saveHeight = async () => {
    const cm = heightUnit === "cm"
      ? parseFloat(heightInput.cm)
      : heightCmFromParts(heightInput.ft, heightInput.inch);
    const check = checkHeight(cm);
    if (!check.ok) {
      setErrors((p) => ({ ...p, height: check.message }));
      return;
    }
    setErrors((p) => ({ ...p, height: null }));
    setSavingHeight(true);
    try {
      await setProfile({ ...profile, height_cm: check.cm });
      toast.success("Profile updated successfully!");
      flashSaved(setHeightSaved);
    } catch (err) {
      toast.error("Failed to update profile");
    }
    setSavingHeight(false);
  };

  const saveGoal = async () => {
    if (goalInput === "") {
      setErrors((p) => ({ ...p, goal_weight: null }));
      setSavingGoal(true);
      await setProfile({ ...profile, goal_weight_kg: null });
      setSavingGoal(false);
      flashSaved(setGoalSaved);
      return;
    }
    const check = checkGoal(goalInput, weightUnit);
    if (!check.ok) {
      setErrors((p) => ({ ...p, goal_weight: check.message }));
      return;
    }
    setErrors((p) => ({ ...p, goal_weight: null }));
    const goalCheck = goalBmiSafeguard(check.kg, heightCmOf(profile));
    setGoalWarning(
      goalCheck.flagged
        ? `A goal of ${Math.round(check.kg)} kg works out to a BMI of ${goalCheck.bmi.toFixed(1)}, below 18.5. Worth talking to your prescriber before aiming for it — this isn't a diagnosis.`
        : ""
    );
    setSavingGoal(true);
    try {
      await setProfile({ ...profile, goal_weight_kg: check.kg });
      toast.success("Profile updated successfully!");
      flashSaved(setGoalSaved);
    } catch (err) {
      toast.error("Failed to update profile");
    }
    setSavingGoal(false);
  };

  const handleSave = async (fields) => {
    const updates = Array.isArray(fields) ? fields : [fields];
    const key = updates.join("+");
    // Validate numeric fields before saving
    const numericFields = ["height_ft", "height_in", "goal_weight", "days_between", "days_between_override"];
    let hasError = false;
    updates.forEach((f) => {
      if (numericFields.includes(f)) {
        const v = local[f];
        if (v !== "" && v !== undefined && (isNaN(parseFloat(v)) || parseFloat(v) < 0)) {
          setErrors((p) => ({ ...p, [f]: "Must be a valid number" }));
          hasError = true;
        } else {
          setErrors((p) => ({ ...p, [f]: null }));
        }
      }
    });
    if (hasError) return;
    setSaving((p) => ({ ...p, [key]: true }));
    const partial = {};
    updates.forEach((f) => { partial[f] = local[f]; });
    try {
      await setProfile({ ...profile, ...partial });
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error("Failed to update profile");
    }
    setSaving((p) => ({ ...p, [key]: false }));
    setSaved((p) => ({ ...p, [key]: true }));
    setTimeout(() => setSaved((p) => ({ ...p, [key]: false })), 1500);
  };

  const SaveBtn = ({ fields }) => {
    const key = Array.isArray(fields) ? fields.join("+") : fields;
    return (
      <button onClick={() => handleSave(fields)}
      disabled={saving[key]}
      className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-all min-w-[60px] flex items-center justify-center ${
      saved[key] ? "bg-teal-500 text-white" : "bg-indigo-600 text-white"} disabled:opacity-60`
      }>
        {saving[key] ? <Loader2 size={14} className="animate-spin" /> : saved[key] ? <Check size={16} /> : "Save"}
      </button>);

  };

  const UnitToggle = ({ label, opt1, opt2, field }) =>
  <div className="flex items-center justify-between py-2">
      <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{label}</span>
      <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600">
        {[opt1, opt2].map((opt) =>
      <button key={opt}
      onClick={async () => {
        const next = { ...local, [field]: opt };
        setLocal(next);
        try {
          await setProfile({ ...profile, [field]: opt });
          toast.success("Profile updated successfully!");
        } catch (err) {
          toast.error("Failed to update profile");
        }
      }}
      className={`px-5 py-2 text-sm font-medium transition-colors ${
      local[field] === opt ?
      "bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300" :
      "bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400"}`
      }>
            {opt}
          </button>
      )}
      </div>
    </div>;


  return (
    <PageContainer bottomInset="default" className="bg-white dark:bg-gray-950">
      <div className="sticky top-0 z-30 bg-white dark:bg-gray-950 w-full flex items-center justify-between px-5 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile</h1>
        <Link to="/settings" aria-label="Settings"><Settings size={22} className="text-gray-600 dark:text-gray-400" /></Link>
      </div>

      <div className="max-w-3xl mx-auto pt-4">
        {/* Profile Info */}
        <div className="mx-4 mb-4 bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
              <IonIcon name="person" size={18} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white text-lg">Profile Info</h3>
          </div>
          <div className="border-b-2 border-indigo-500 w-10 mb-4" />

          <label className="text-sm text-gray-700 dark:text-gray-300 font-medium block mb-2">Height</label>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {heightUnit === "cm" ?
            <div className={`flex-1 border rounded-xl px-3 py-2.5 flex items-center bg-white dark:bg-gray-800 min-w-[120px] ${errors.height ? "border-red-400" : "border-gray-200 dark:border-gray-700"}`}>
                <input type="text" inputMode="decimal" value={heightInput.cm} placeholder="0"
              onChange={(e) => { setHeightInput({ ...heightInput, cm: numericOnly(e.target.value) }); setErrors((p) => ({ ...p, height: null })); }}
              className="w-full outline-none text-base bg-transparent text-gray-900 dark:text-white min-w-0" />
                <span className="text-gray-400 text-sm ml-1">cm</span>
              </div> :
            <>
                <div className={`flex-1 border rounded-xl px-3 py-2.5 flex items-center bg-white dark:bg-gray-800 min-w-[80px] ${errors.height ? "border-red-400" : "border-gray-200 dark:border-gray-700"}`}>
                  <input type="text" inputMode="decimal" value={heightInput.ft} placeholder="0"
                onChange={(e) => { setHeightInput({ ...heightInput, ft: numericOnly(e.target.value, { allowDecimal: false }) }); setErrors((p) => ({ ...p, height: null })); }}
                className="w-full outline-none text-base bg-transparent text-gray-900 dark:text-white min-w-0" />
                  <span className="text-gray-400 text-sm ml-1">ft</span>
                </div>
                <div className={`flex-1 border rounded-xl px-3 py-2.5 flex items-center bg-white dark:bg-gray-800 min-w-[80px] ${errors.height ? "border-red-400" : "border-gray-200 dark:border-gray-700"}`}>
                  <input type="text" inputMode="decimal" value={heightInput.inch} placeholder="0"
                onChange={(e) => { setHeightInput({ ...heightInput, inch: numericOnly(e.target.value, { max: 11.9 }) }); setErrors((p) => ({ ...p, height: null })); }}
                className="w-full outline-none text-base bg-transparent text-gray-900 dark:text-white min-w-0" />
                  <span className="text-gray-400 text-sm ml-1">in</span>
                </div>
              </>
            }
            <button onClick={saveHeight} disabled={savingHeight}
              className="px-4 py-2.5 rounded-xl font-semibold text-sm bg-indigo-600 text-white min-w-[60px] flex items-center justify-center disabled:opacity-60">
              {savingHeight ? <Loader2 size={14} className="animate-spin" /> : heightSaved ? <Check size={16} /> : "Save"}
            </button>
          </div>
          {errors.height && <p className="text-xs text-orange-500 mt-1">{errors.height}</p>}
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">Stored as centimetres.</p>

          <label className="text-sm text-gray-700 dark:text-gray-300 font-medium block mb-2">Goal Weight</label>
          <div className="flex items-center gap-2">
            <div className={`flex-1 border rounded-xl px-3 py-2.5 flex items-center bg-white dark:bg-gray-800 ${errors.goal_weight ? "border-red-400" : "border-gray-200 dark:border-gray-700"}`}>
              <input type="text" inputMode="decimal" value={goalInput} placeholder="0.0"
              onChange={(e) => { setGoalInput(numericOnly(e.target.value)); setErrors((p) => ({ ...p, goal_weight: null })); }}
              className="w-full outline-none text-base bg-transparent text-gray-900 dark:text-white" />
              <span className="text-gray-400 text-sm ml-1">{weightUnitLabel(weightUnit)}</span>
            </div>
            <button onClick={saveGoal} disabled={savingGoal}
              className="px-4 py-2.5 rounded-xl font-semibold text-sm bg-indigo-600 text-white min-w-[60px] flex items-center justify-center disabled:opacity-60">
              {savingGoal ? <Loader2 size={14} className="animate-spin" /> : goalSaved ? <Check size={16} /> : "Save"}
            </button>
          </div>
          {errors.goal_weight && <p className="text-xs text-orange-500 mt-1">{errors.goal_weight}</p>}
          {goalWarning && (
            <p className="text-xs text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-500/25 rounded-xl px-3 py-2 mt-2 leading-relaxed">{goalWarning}</p>
          )}
          <p className="text-xs text-gray-400 dark:text-gray-500">Stored as kilograms.</p>
        </div>

        {/* Shot Preferences */}
        <div className="mx-4 mb-4 bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
              <SyringeIcon size={18} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white text-lg">Shot Preferences</h3>
          </div>
          <div className="border-b-2 border-indigo-500 w-10 mb-4" />

          <label className="text-sm text-gray-700 dark:text-gray-300 font-medium block mb-1">Days Between Shots</label>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
            {labelInterval
              ? <>From <span className="font-medium text-gray-600 dark:text-gray-300">{plainBrandName(currentMedication)}</span> — this product is dosed every {labelInterval} day{labelInterval === 1 ? "" : "s"}.</>
              : "Log a shot and Levli will use that medication's own interval."}
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
            Your next shot date is worked out {effectiveInterval} day{effectiveInterval === 1 ? "" : "s"} after the last one
            {profile?.days_between_override ? " (your prescriber's override)" : ""}.
          </p>
          <button onClick={toggleOverride} className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-2">
            {overrideOn ? "Use the label interval instead" : "Override with my prescriber's interval"}
          </button>
          {overrideOn && (
            <>
              <div className="flex items-center gap-2 mb-1">
                <div className={`flex-1 border rounded-xl px-3 py-2.5 flex items-center bg-white dark:bg-gray-800 ${errors.days_between_override ? "border-red-400" : "border-gray-200 dark:border-gray-700"}`}>
                  <input type="text" inputMode="numeric" value={local.days_between_override || ""} placeholder={String(labelInterval || 7)}
                  onChange={(e) => setLocal({ ...local, days_between_override: numericOnly(e.target.value, { allowDecimal: false, max: 90 }) })}
                  className="w-full outline-none text-base bg-transparent text-gray-900 dark:text-white" />
                  <span className="text-gray-400 text-sm ml-1">days</span>
                </div>
                <SaveBtn fields={["days_between_override"]} />
              </div>
              {errors.days_between_override ? <p className="text-xs text-red-500 mb-1">Please enter a whole number (1–90).</p> : null}
              {overrideWarning ? (
                <p className="text-xs font-medium text-orange-600 dark:text-orange-400">{overrideWarning}</p>
              ) : (
                <p className="text-xs text-gray-400 dark:text-gray-500">Only set this if your prescriber told you to use a different interval.</p>
              )}
            </>
          )}
        </div>

        {/* Prescriber contact */}
        <div className="mx-4 mb-4 bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
              <IonIcon name="person" size={18} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white text-lg">Prescriber</h3>
          </div>
          <div className="border-b-2 border-indigo-500 w-10 mb-4" />
          <label className="text-sm text-gray-700 dark:text-gray-300 font-medium block mb-2">Name (optional)</label>
          <input type="text" value={local.prescriber_name || ""} placeholder="e.g. Dr Patel"
          onChange={(e) => setLocal({ ...local, prescriber_name: e.target.value })}
          className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl px-3 py-2.5 text-base outline-none focus:border-indigo-300 mb-3" />
          <label className="text-sm text-gray-700 dark:text-gray-300 font-medium block mb-2">Phone or email (optional)</label>
          <div className="flex items-center gap-2">
            <input type="text" value={local.prescriber_contact || ""} placeholder="Phone or email"
            onChange={(e) => setLocal({ ...local, prescriber_contact: e.target.value })}
            className="flex-1 min-w-0 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl px-3 py-2.5 text-base outline-none focus:border-indigo-300" />
            <SaveBtn fields={["prescriber_name", "prescriber_contact"]} />
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Used by the "Contact prescriber" button when a dose is overdue or you've had a longer break.</p>
        </div>

        {/* Measurement Units */}
        <div className="mx-4 mb-4 bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
              <ScaleIcon size={18} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white text-lg">Measurement Units</h3>
          </div>
          <div className="border-b-2 border-indigo-500 w-10 mb-4" />
          <UnitToggle label="Liquid Unit" opt1="mL" opt2="oz" field="liquid_unit" />
          <UnitToggle label="Height Unit" opt1="cm" opt2="in" field="height_unit" />
          <UnitToggle label="Weight Unit" opt1="kg" opt2="lb" field="weight_unit" />
        </div>

        <div className="mx-4 mb-8 bg-gray-100 dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
          <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-1">Important</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            This application is not intended as a substitute for professional medical care. Only your doctor can diagnose and treat medical problems.
          </p>
        </div>
        </div>
        </PageContainer>);
        }