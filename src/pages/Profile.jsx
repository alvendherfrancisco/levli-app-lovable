import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Settings, Check } from "lucide-react";
import { HEADER_ICON, HEADER_GLYPH } from "@/components/longlist/HeaderIconButton";
import IonIcon from "@/components/IonIcon";
import { useAppState } from "@/lib/AppState";
import PageContainer from "@/components/PageContainer";
import WellbeingNotice from "@/components/wellbeing/WellbeingNotice";
import {
  heightCmOf, heightCmFromParts, heightPartsFromCm,
  checkHeight, checkGoal, fromKg, weightUnitLabel, kgOfEntry, shownBmi,
} from "@/lib/measure";
import { goalBmiSafeguard, wellbeingMessage } from "@/lib/wellbeing";

/**
 * About you: the two things Levli needs to know about the person — their body
 * and their goal, and who prescribes for them.
 *
 * Every field saves itself. There is no Save button to remember: the value is
 * written when the field is left (or Done is tapped on the keyboard), a small
 * "Saved" says it landed, and a value that cannot be right is refused with a
 * short line under the field rather than written. Height and goal are shown in
 * the units chosen in Settings and stored canonically, so switching a unit
 * changes what is displayed, never what is saved.
 *
 * The prescriber is entered here and nowhere else — the Add Medication form
 * reads it from here — and the same gentle prescriber notice the Insights page
 * shows appears when the goal weight would put BMI below 18.5.
 */

// The measurement fields take digits (and a decimal point for weight).
function numericOnly(value, { allowDecimal = true, max = null } = {}) {
  let v = allowDecimal ? value.replace(/[^0-9.]/g, "") : value.replace(/[^0-9]/g, "");
  const parts = v.split(".");
  if (parts.length > 2) v = parts[0] + "." + parts.slice(1).join("");
  if (max !== null && parseFloat(v) > max) v = String(max);
  return v;
}

const FIELD =
  "w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white " +
  "rounded-xl px-3 py-2.5 text-base outline-none focus:border-indigo-300";

const LABEL = "text-sm text-gray-700 dark:text-gray-300 font-medium block mb-2";

/** A small "Saved" beside a card's heading, for the couple of seconds after a save. */
function SavedFlag({ show }) {
  if (!show) return null;
  return (
    <span className="flex items-center gap-1 text-xs font-medium text-teal-600 dark:text-teal-400">
      <Check size={14} aria-hidden="true" /> Saved
    </span>
  );
}

export default function Profile() {
  const { profile, setProfile, dayMetrics } = useAppState();

  const heightUnit = profile?.height_unit === "cm" ? "cm" : "in";
  const weightUnit = profile?.weight_unit === "kg" ? "kg" : "lb";

  const [heightInput, setHeightInput] = useState({ cm: "", ft: "", inch: "" });
  const [goalInput, setGoalInput] = useState("");
  const [prescriberName, setPrescriberName] = useState("");
  const [prescriberContact, setPrescriberContact] = useState("");
  const [errors, setErrors] = useState({});
  const [flash, setFlash] = useState("");

  // Each field is re-derived whenever the profile or the chosen unit changes, so
  // switching kg↔lb re-reads the same stored weight in the other unit.
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
    setPrescriberName(profile?.prescriber_name || "");
    setPrescriberContact(profile?.prescriber_contact || "");
  }, [profile?.height_cm, profile?.height_ft, profile?.height_in,
      profile?.goal_weight_kg, profile?.prescriber_name, profile?.prescriber_contact,
      heightUnit, weightUnit]);

  const flashSaved = (field) => {
    setFlash(field);
    window.setTimeout(() => setFlash(""), 2000);
  };

  const commitHeight = async () => {
    const blank = heightUnit === "cm"
      ? heightInput.cm.trim() === ""
      : heightInput.ft.trim() === "" && heightInput.inch.trim() === "";
    if (blank) { setErrors((p) => ({ ...p, height: null })); return; }

    const cm = heightUnit === "cm"
      ? parseFloat(heightInput.cm)
      : heightCmFromParts(heightInput.ft, heightInput.inch);
    const check = checkHeight(cm);
    if (!check.ok) { setErrors((p) => ({ ...p, height: check.message })); return; }
    setErrors((p) => ({ ...p, height: null }));
    if (Math.abs((heightCmOf(profile) || 0) - check.cm) < 0.05) return;
    await setProfile({ ...profile, height_cm: check.cm });
    flashSaved("height");
  };

  const commitGoal = async () => {
    if (goalInput.trim() === "") {
      setErrors((p) => ({ ...p, goal_weight: null }));
      if (profile?.goal_weight_kg != null) {
        await setProfile({ ...profile, goal_weight_kg: null });
        flashSaved("goal");
      }
      return;
    }
    const check = checkGoal(goalInput, weightUnit);
    if (!check.ok) {
      setErrors((p) => ({ ...p, goal_weight: check.message || "Please check this value and the unit." }));
      return;
    }
    setErrors((p) => ({ ...p, goal_weight: null }));
    if (Number(profile?.goal_weight_kg) === check.kg) return;
    await setProfile({ ...profile, goal_weight_kg: check.kg });
    flashSaved("goal");
  };

  const commitPrescriber = async () => {
    const name = prescriberName.trim();
    const contact = prescriberContact.trim();
    if (name === (profile?.prescriber_name || "") && contact === (profile?.prescriber_contact || "")) return;
    await setProfile({ ...profile, prescriber_name: name, prescriber_contact: contact });
    flashSaved("prescriber");
  };

  // The latest weight that has been logged, and the BMI it makes with the saved
  // height (null when that cannot be a real adult value — never a stand-in).
  const heightCm = heightCmOf(profile);
  const latestWeightKg = useMemo(() => {
    const rows = (dayMetrics || [])
      .filter((m) => m?.weight != null)
      .slice()
      .sort((a, b) => String(a.day_key).localeCompare(String(b.day_key)));
    return rows.length ? kgOfEntry(rows[rows.length - 1]) : null;
  }, [dayMetrics]);
  const currentBmi = shownBmi(latestWeightKg, heightCm);

  // The same gentle notice Insights shows, in the same words, and only for the
  // goal: a goal weight that would put BMI below 18.5.
  const goalNotice = useMemo(() => {
    const goalKg = Number(profile?.goal_weight_kg);
    if (!Number.isFinite(goalKg) || goalKg <= 0) return "";
    return wellbeingMessage({ goalBmi: goalBmiSafeguard(goalKg, heightCm) });
  }, [profile?.goal_weight_kg, heightCm]);

  return (
    <PageContainer bottomInset="default" className="bg-white dark:bg-gray-950" disclaimer>
      <div className="sticky top-0 z-30 bg-white dark:bg-gray-950 w-full flex items-center justify-between px-5 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">About you</h1>
        <Link to="/settings" aria-label="Settings" className={HEADER_ICON}>
          <Settings size={HEADER_GLYPH} aria-hidden="true" />
        </Link>
      </div>

      <div className="max-w-3xl mx-auto pt-4">
        {/* Body and goal */}
        <div className="mx-4 mb-4 bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
              <IonIcon name="person" size={18} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white text-lg flex-1">Body and goal</h3>
            <SavedFlag show={flash === "height" || flash === "goal"} />
          </div>

          <label className={LABEL} htmlFor={heightUnit === "cm" ? "height-cm" : "height-ft"}>Height</label>
          <div className="flex items-center gap-2 flex-wrap">
            {heightUnit === "cm" ? (
              <div className={`flex-1 min-w-[120px] flex items-center gap-1 border rounded-xl px-3 py-2.5 bg-white dark:bg-gray-800 ${errors.height ? "border-red-400" : "border-gray-200 dark:border-gray-700"}`}>
                <input id="height-cm" type="text" inputMode="decimal" value={heightInput.cm} placeholder="0"
                  onChange={(e) => { setHeightInput({ ...heightInput, cm: numericOnly(e.target.value) }); setErrors((p) => ({ ...p, height: null })); }}
                  onBlur={commitHeight}
                  className="w-full outline-none text-base bg-transparent text-gray-900 dark:text-white min-w-0" />
                <span className="text-gray-400 text-sm">cm</span>
              </div>
            ) : (
              <>
                <div className={`flex-1 min-w-[80px] flex items-center gap-1 border rounded-xl px-3 py-2.5 bg-white dark:bg-gray-800 ${errors.height ? "border-red-400" : "border-gray-200 dark:border-gray-700"}`}>
                  <input id="height-ft" type="text" inputMode="numeric" value={heightInput.ft} placeholder="0"
                    onChange={(e) => { setHeightInput({ ...heightInput, ft: numericOnly(e.target.value, { allowDecimal: false }) }); setErrors((p) => ({ ...p, height: null })); }}
                    onBlur={commitHeight}
                    className="w-full outline-none text-base bg-transparent text-gray-900 dark:text-white min-w-0" />
                  <span className="text-gray-400 text-sm">ft</span>
                </div>
                <div className={`flex-1 min-w-[80px] flex items-center gap-1 border rounded-xl px-3 py-2.5 bg-white dark:bg-gray-800 ${errors.height ? "border-red-400" : "border-gray-200 dark:border-gray-700"}`}>
                  <input type="text" inputMode="decimal" value={heightInput.inch} placeholder="0"
                    onChange={(e) => { setHeightInput({ ...heightInput, inch: numericOnly(e.target.value, { max: 11.9 }) }); setErrors((p) => ({ ...p, height: null })); }}
                    onBlur={commitHeight}
                    className="w-full outline-none text-base bg-transparent text-gray-900 dark:text-white min-w-0" />
                  <span className="text-gray-400 text-sm">in</span>
                </div>
              </>
            )}
          </div>
          {errors.height && <p className="text-xs text-orange-500 dark:text-orange-400 mt-2">{errors.height}</p>}

          <label className={`${LABEL} mt-5`} htmlFor="goal-weight">Goal weight</label>
          <div className={`flex items-center gap-1 border rounded-xl px-3 py-2.5 bg-white dark:bg-gray-800 ${errors.goal_weight ? "border-red-400" : "border-gray-200 dark:border-gray-700"}`}>
            <input id="goal-weight" type="text" inputMode="decimal" value={goalInput} placeholder="0.0"
              onChange={(e) => { setGoalInput(numericOnly(e.target.value)); setErrors((p) => ({ ...p, goal_weight: null })); }}
              onBlur={commitGoal}
              className="w-full outline-none text-base bg-transparent text-gray-900 dark:text-white min-w-0" />
            <span className="text-gray-400 text-sm">{weightUnitLabel(weightUnit)}</span>
          </div>
          {errors.goal_weight && <p className="text-xs text-orange-500 dark:text-orange-400 mt-2">{errors.goal_weight}</p>}

          <div className="mt-5">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {currentBmi != null
                ? `Current BMI ${currentBmi.toFixed(1)}`
                : "Your BMI appears once your height and a logged weight are saved."}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">A screening measure, not a diagnosis.</p>
          </div>

          {goalNotice && <WellbeingNotice message={goalNotice} className="mt-3" />}
        </div>

        {/* Prescriber */}
        <div className="mx-4 mb-8 bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
              <IonIcon name="person" size={18} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white text-lg flex-1">Prescriber</h3>
            <SavedFlag show={flash === "prescriber"} />
          </div>

          <label className={LABEL} htmlFor="prescriber-name">Name (optional)</label>
          <input
            id="prescriber-name"
            type="text"
            value={prescriberName}
            placeholder="Dr Patel"
            autoComplete="off"
            onChange={(e) => setPrescriberName(e.target.value)}
            onBlur={commitPrescriber}
            className={FIELD}
          />

          <label className={`${LABEL} mt-4`} htmlFor="prescriber-contact">Phone or email (optional)</label>
          <input
            id="prescriber-contact"
            type="text"
            inputMode="email"
            value={prescriberContact}
            placeholder="Phone or email"
            autoComplete="off"
            onChange={(e) => setPrescriberContact(e.target.value)}
            onBlur={commitPrescriber}
            className={FIELD}
          />

          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            Used by the "Contact prescriber" button when a dose is overdue or you've had a longer break.
          </p>
        </div>
      </div>
    </PageContainer>
  );
}