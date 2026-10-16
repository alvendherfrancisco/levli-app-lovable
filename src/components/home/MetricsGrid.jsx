import React, { useState, useEffect, useRef } from "react";
import MetricCard from "@/components/home/MetricCard";
import IonIcon from "@/components/IonIcon";
import { WeightFilledIcon } from "@/components/FilledIcons";
import { useAppState } from "@/lib/AppState";
import AddNutritionModal from "@/components/modals/AddNutritionModal";
import AddMetricModal from "@/components/modals/AddMetricModal";
import { todayKey } from "@/lib/dateUtils";
import { weightEntry } from "@/lib/weightEntry";
import { toast } from "@/lib/toast";

// Card order — also the order of the value signature used for the saved flash.
const METRIC_LABELS = ["Weight", "Calories", "Protein", "Fiber", "Carbs", "Water", "Exercise", "Progress"];

export default function MetricsGrid({ dayKey }) {
  const dk = dayKey || todayKey();
  const {
    getNutrition, saveNutrition,
    getWeight, saveWeight,
    getExercise, saveExercise,
    getProgressPhoto, addProgressPhotoRecord, deleteLatestProgressPhoto,
    profile,
    weightHistory,
  } = useAppState();

  const [showNutrition, setShowNutrition] = useState(false);
  const [metricModal, setMetricModal] = useState(null);

  const nutrition = getNutrition(dk);
  const weight = getWeight(dk);
  const exercise = getExercise(dk);
  const photo = getProgressPhoto(dk);
  const weightUnit = profile?.weight_unit || "lb";
  const liquidUnit = profile?.liquid_unit || "oz";
  // The weight last put on record, offered as the field's placeholder only —
  // the app never fills a measurement in as a value the person could save.
  const lastLoggedWeight = weightHistory[weightHistory.length - 1]?.weight;

  // Number formatting for a narrow card: whole numbers for nutrients and
  // exercise, at most one decimal for weight and water.
  const whole = (v) => String(Math.round(Number(v) || 0));
  const oneDec = (v) => String(Math.round((Number(v) || 0) * 10) / 10);
  const addLabel = (label, valueText) => `${label}, ${valueText}, add entry`;

  // A logged entry updates in place, and the card that changed briefly
  // highlights so the save is acknowledged on the card itself.
  const [flash, setFlash] = useState("");
  const flashTimer = useRef(null);
  const signature = [
    weight ?? "-",
    nutrition.calories ?? "-", nutrition.protein ?? "-", nutrition.fiber ?? "-",
    nutrition.carbs ?? "-", nutrition.water ?? "-",
    exercise ?? "-", photo ? "y" : "n",
  ].join("|");
  const lastLogged = useRef({ dk, signature });
  useEffect(() => {
    const last = lastLogged.current;
    if (last.dk === dk && last.signature !== signature) {
      const before = last.signature.split("|");
      const index = signature.split("|").findIndex((v, i) => v !== before[i]);
      const label = METRIC_LABELS[index];
      if (label) {
        setFlash(label);
        clearTimeout(flashTimer.current);
        flashTimer.current = setTimeout(() => setFlash(""), 1400);
      }
    }
    lastLogged.current = { dk, signature };
  }, [dk, signature]);
  useEffect(() => () => clearTimeout(flashTimer.current), []);

  const allMetrics = [
    {
      icon: <WeightFilledIcon size={20} className="text-amber-500 dark:text-amber-400" />, label: "Weight",
      value: weight != null ? oneDec(weight) : "–", unit: weightUnit, color: "bg-amber-50 dark:bg-amber-500/10",
      ariaLabel: addLabel("Weight", weight != null ? `${oneDec(weight)} ${weightUnit}` : "no entry today"),
      // The entry sheet is the app's one weight sheet, shared with the Weight
      // Progress card (src/lib/weightEntry.js).
      onAdd: () => setMetricModal(weightEntry({ dayKey: dk, weight, unit: weightUnit, lastLogged: lastLoggedWeight, saveWeight })),
    },
    {
      icon: <IonIcon name="flame" size={20} className="text-orange-500 dark:text-orange-400" />, label: "Calories",
      value: whole(nutrition.calories), unit: "kcal", color: "bg-orange-100 dark:bg-orange-500/10",
      ariaLabel: addLabel("Calories", `${whole(nutrition.calories)} kcal`),
      onAdd: () => setShowNutrition(true),
    },
    {
      icon: <IonIcon name="fish" size={20} className="text-teal-600 dark:text-teal-400" />, label: "Protein",
      value: whole(nutrition.protein), unit: "g", color: "bg-teal-100 dark:bg-teal-500/10",
      ariaLabel: addLabel("Protein", `${whole(nutrition.protein)} g`),
      onAdd: () => setShowNutrition(true),
    },
    {
      icon: <IonIcon name="nutrition" size={20} className="text-green-500 dark:text-green-400" />, label: "Fiber",
      value: whole(nutrition.fiber), unit: "g", color: "bg-green-100 dark:bg-green-500/10",
      ariaLabel: addLabel("Fiber", `${whole(nutrition.fiber)} g`),
      onAdd: () => setShowNutrition(true),
    },
    {
      icon: <IonIcon name="fast-food" size={20} className="text-orange-500 dark:text-orange-400" />, label: "Carbs",
      value: whole(nutrition.carbs), unit: "g", color: "bg-orange-100 dark:bg-orange-500/10",
      ariaLabel: addLabel("Carbs", `${whole(nutrition.carbs)} g`),
      onAdd: () => setShowNutrition(true),
    },
    {
      icon: <IonIcon name="water" size={20} className="text-blue-500 dark:text-blue-400" />, label: "Water",
      value: oneDec(nutrition.water), unit: liquidUnit, color: "bg-blue-100 dark:bg-blue-500/10",
      ariaLabel: addLabel("Water", `${oneDec(nutrition.water)} ${liquidUnit}`),
      onAdd: () => setShowNutrition(true),
    },
    {
      icon: <IonIcon name="barbell" size={20} className="text-red-500 dark:text-red-400" />, label: "Exercise",
      value: whole(exercise), unit: "min", color: "bg-red-100 dark:bg-red-500/10",
      ariaLabel: addLabel("Exercise", `${whole(exercise)} min`),
      onAdd: () => setMetricModal({ label: "Exercise", unit: "min", current: exercise != null ? String(exercise) : "", onSave: async (v) => { await saveExercise(dk, v); exercise != null ? toast.success("Exercise updated") : toast.success("Exercise added"); }, onDelete: Number(exercise) > 0 ? async () => { await saveExercise(dk, "0"); toast.deleted("Exercise entry deleted"); } : undefined }),
    },
    {
      icon: <IonIcon name="camera" size={20} className="text-purple-500 dark:text-purple-400" />, label: "Progress",
      value: photo ? "✓" : "–", unit: "pic", color: "bg-purple-100 dark:bg-purple-500/10",
      ariaLabel: addLabel("Progress", photo ? "photo logged today" : "no photo today"),
      onAdd: () => setMetricModal({ label: "Progress", unit: "pic", current: photo || "–", dayKey: dk, onSave: async (v, newDayKey) => { await addProgressPhotoRecord(newDayKey || dk, v); toast.success("Progress photo added"); },         onDelete: async () => { await deleteLatestProgressPhoto(dk); toast.deleted("Progress photo deleted"); } }),
    },
  ];

  return (
    <>
      {/* One compact grid, no horizontal scrolling: 3 columns on phones
          (3 + 3 + 2, the empty slot stays empty), 4 columns from 600px. Every
          card is always here: nothing on this grid is switched off. */}
      <div className="mb-4 px-4">
        <div className="grid grid-cols-3 min-[600px]:grid-cols-4 gap-3">
          {allMetrics.map((m) => (
            <MetricCard key={m.label} {...m} highlighted={flash === m.label} />
          ))}
        </div>
      </div>
      <AddNutritionModal open={showNutrition} onClose={() => setShowNutrition(false)} dayKey={dk} />
      {metricModal && (
        <AddMetricModal
          open={!!metricModal}
          onClose={() => setMetricModal(null)}
          label={metricModal.label}
          unit={metricModal.unit}
          value={metricModal.current}
          dayKey={metricModal.dayKey}
          placeholder={metricModal.placeholder}
          onSave={metricModal.onSave}
          onDelete={metricModal.onDelete}
          validate={metricModal.validate}
        />
      )}
    </>
  );
}