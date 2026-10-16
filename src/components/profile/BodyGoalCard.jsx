import React, { useEffect, useMemo, useState } from "react";
import { Ruler } from "lucide-react";
import { useAppState } from "@/lib/AppState";
import WellbeingNotice from "@/components/wellbeing/WellbeingNotice";
import ProfileCard from "@/components/profile/ProfileCard";
import { FIELD_ERROR, HINT, LABEL } from "@/components/profile/profileFields";
import {
  heightCmOf, heightCmFromParts, heightPartsFromCm,
  checkHeight, checkGoal, fromKg, weightUnitLabel, shownBmi,
} from "@/lib/measure";
import { goalBmiSafeguard, wellbeingMessage } from "@/lib/wellbeing";

/**
 * The person's body and their goal: height, the weight they are aiming for, the
 * weight they started from, and the BMI those make today.
 *
 * Height and goal are shown in the units chosen in Settings and stored
 * canonically, so switching a unit changes what is displayed, never what is
 * saved. Height and goal each write themselves when the field is left; the
 * starting weight and the BMI are read from what has already been logged, so
 * neither is ever asked for twice. A goal weight that would put BMI below 18.5
 * brings up the same gentle notice the Insights page shows.
 */

/** The measurement fields take digits (and a decimal point for weight). */
function numericOnly(value, { allowDecimal = true, max = null } = {}) {
  let v = allowDecimal ? value.replace(/[^0-9.]/g, "") : value.replace(/[^0-9]/g, "");
  const parts = v.split(".");
  if (parts.length > 2) v = parts[0] + "." + parts.slice(1).join("");
  if (max !== null && parseFloat(v) > max) v = String(max);
  return v;
}

/** The bordered box a measurement is typed in, red while it is refused. */
function boxClass(bad, extra = "") {
  return `flex items-center gap-1 ${extra} border rounded-xl px-3 py-2.5 bg-white dark:bg-gray-800 ${
    bad ? "border-red-400" : "border-gray-200 dark:border-gray-700"
  }`;
}

export default function BodyGoalCard() {
  const { profile, setProfile, weightHistory } = useAppState();

  const heightUnit = profile?.height_unit === "cm" ? "cm" : "in";
  const weightUnit = profile?.weight_unit === "kg" ? "kg" : "lb";

  const [heightInput, setHeightInput] = useState({ cm: "", ft: "", inch: "" });
  const [goalInput, setGoalInput] = useState("");
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(false);

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
  }, [profile?.height_cm, profile?.height_ft, profile?.height_in,
      profile?.goal_weight_kg, heightUnit, weightUnit]);

  const flashSaved = () => {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
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
    flashSaved();
  };

  const commitGoal = async () => {
    if (goalInput.trim() === "") {
      setErrors((p) => ({ ...p, goal_weight: null }));
      if (profile?.goal_weight_kg != null) {
        await setProfile({ ...profile, goal_weight_kg: null });
        flashSaved();
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
    flashSaved();
  };

  // The latest weight that has been logged, and the BMI it makes with the saved
  // height (null when that cannot be a real adult value — never a stand-in).
  const heightCm = heightCmOf(profile);
  // The logged weights, already in date order and reduced to kilograms by the
  // app state — the first one is where the person started.
  const weightsKg = useMemo(
    () => (weightHistory || []).filter((p) => p?.kg != null),
    [weightHistory],
  );
  const latestWeightKg = weightsKg.length ? weightsKg[weightsKg.length - 1].kg : null;
  const currentBmi = shownBmi(latestWeightKg, heightCm);
  const startWeight = weightsKg.length ? fromKg(weightsKg[0].kg, weightUnit) : null;

  // The same gentle notice Insights shows, in the same words, and only for the
  // goal: a goal weight that would put BMI below 18.5.
  const goalNotice = useMemo(() => {
    const goalKg = Number(profile?.goal_weight_kg);
    if (!Number.isFinite(goalKg) || goalKg <= 0) return "";
    return wellbeingMessage({ goalBmi: goalBmiSafeguard(goalKg, heightCm) });
  }, [profile?.goal_weight_kg, heightCm]);

  return (
    <ProfileCard icon={Ruler} title="Body and goal" saved={saved}>
      <label className={LABEL} htmlFor={heightUnit === "cm" ? "height-cm" : "height-ft"}>Height</label>
      <div className="flex items-center gap-2 flex-wrap">
        {heightUnit === "cm" ? (
          <div className={boxClass(errors.height, "flex-1 min-w-[120px]")}>
            <input id="height-cm" type="text" inputMode="decimal" value={heightInput.cm} placeholder="0"
              onChange={(e) => { setHeightInput({ ...heightInput, cm: numericOnly(e.target.value) }); setErrors((p) => ({ ...p, height: null })); }}
              onBlur={commitHeight}
              className="w-full outline-none text-base bg-transparent text-gray-900 dark:text-white min-w-0" />
            <span className="text-gray-400 text-sm">cm</span>
          </div>
        ) : (
          <>
            <div className={boxClass(errors.height, "flex-1 min-w-[80px]")}>
              <input id="height-ft" type="text" inputMode="numeric" value={heightInput.ft} placeholder="0"
                onChange={(e) => { setHeightInput({ ...heightInput, ft: numericOnly(e.target.value, { allowDecimal: false }) }); setErrors((p) => ({ ...p, height: null })); }}
                onBlur={commitHeight}
                className="w-full outline-none text-base bg-transparent text-gray-900 dark:text-white min-w-0" />
              <span className="text-gray-400 text-sm">ft</span>
            </div>
            <div className={boxClass(errors.height, "flex-1 min-w-[80px]")}>
              <input type="text" inputMode="decimal" value={heightInput.inch} placeholder="0"
                onChange={(e) => { setHeightInput({ ...heightInput, inch: numericOnly(e.target.value, { max: 11.9 }) }); setErrors((p) => ({ ...p, height: null })); }}
                onBlur={commitHeight}
                className="w-full outline-none text-base bg-transparent text-gray-900 dark:text-white min-w-0" />
              <span className="text-gray-400 text-sm">in</span>
            </div>
          </>
        )}
      </div>
      {errors.height && <p className={FIELD_ERROR}>{errors.height}</p>}

      <label className={`${LABEL} mt-5`} htmlFor="goal-weight">Goal weight</label>
      <div className={boxClass(errors.goal_weight)}>
        <input id="goal-weight" type="text" inputMode="decimal" value={goalInput} placeholder="0.0"
          onChange={(e) => { setGoalInput(numericOnly(e.target.value)); setErrors((p) => ({ ...p, goal_weight: null })); }}
          onBlur={commitGoal}
          className="w-full outline-none text-base bg-transparent text-gray-900 dark:text-white min-w-0" />
        <span className="text-gray-400 text-sm">{weightUnitLabel(weightUnit)}</span>
      </div>
      {errors.goal_weight && <p className={FIELD_ERROR}>{errors.goal_weight}</p>}

      {/* What has already been logged: where the person started, and the BMI that
          their height and latest weight make today. Nothing is asked for twice. */}
      {startWeight != null && (
        <>
          <p className="mt-5 text-sm text-gray-700 dark:text-gray-300">
            Starting weight <span className="font-semibold">{startWeight} {weightUnitLabel(weightUnit)}</span>
          </p>
          <p className={HINT}>Your first logged weight.</p>
        </>
      )}

      <div className="mt-5">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {currentBmi != null
            ? `Current BMI ${currentBmi.toFixed(1)}`
            : "Your BMI appears once your height and a logged weight are saved."}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">A screening measure, not a diagnosis.</p>
      </div>

      {goalNotice && <WellbeingNotice message={goalNotice} className="mt-3" />}
    </ProfileCard>
  );
}