import React, { useState } from "react";
import MetricCard from "@/components/home/MetricCard";
import IonIcon from "@/components/IonIcon";
import { WeightFilledIcon } from "@/components/FilledIcons";
import { useAppState } from "@/lib/AppState";
import AddNutritionModal from "@/components/modals/AddNutritionModal";
import AddMetricModal from "@/components/modals/AddMetricModal";
import { todayKey } from "@/lib/dateUtils";
import { checkWeight } from "@/lib/measure";
import { useToast } from "@/hooks/useToast";
import { toast } from "sonner";

export default function MetricsGrid({ dayKey }) {
  const dk = dayKey || todayKey();
  const {
    getNutrition, saveNutrition,
    getWeight, saveWeight,
    getExercise, saveExercise,
    getProgressPhoto, addProgressPhotoRecord, deleteLatestProgressPhoto,
    profile,
  } = useAppState();

  const [showNutrition, setShowNutrition] = useState(false);
  const [metricModal, setMetricModal] = useState(null);

  const nutrition = getNutrition(dk);
  const weight = getWeight(dk);
  const exercise = getExercise(dk);
  const photo = getProgressPhoto(dk);
  const weightUnit = profile?.weight_unit || "lb";
  const liquidUnit = profile?.liquid_unit || "oz";

  const allMetrics = [
    {
      icon: <WeightFilledIcon size={20} className="text-amber-500 dark:text-amber-400" />, label: "Weight",
      value: weight != null ? String(weight) : "–", unit: weightUnit, color: "bg-amber-50 dark:bg-amber-500/10",
      // The unit is shown next to the input, and a value outside the plausible
      // adult range is not saved.
      onAdd: () => setMetricModal({
        label: "Weight",
        unit: weightUnit,
        current: weight != null ? String(weight) : "",
        validate: (v) => { const check = checkWeight(v, weightUnit); return check.ok ? "" : check.message; },
        onSave: async (v) => { await saveWeight(dk, v); weight != null ? toast.success("Weight updated successfully!") : toast.success("Weight added successfully!"); },
      }),
    },
    {
      icon: <IonIcon name="flame" size={20} className="text-orange-500 dark:text-orange-400" />, label: "Calories",
      value: nutrition.calories, unit: "kcal", color: "bg-orange-100 dark:bg-orange-500/10",
      onAdd: () => setShowNutrition(true),
    },
    {
      icon: <IonIcon name="fish" size={20} className="text-teal-600 dark:text-teal-400" />, label: "Protein",
      value: nutrition.protein, unit: "g", color: "bg-teal-100 dark:bg-teal-500/10",
      onAdd: () => setShowNutrition(true),
    },
    {
      icon: <IonIcon name="nutrition" size={20} className="text-green-500 dark:text-green-400" />, label: "Fiber",
      value: nutrition.fiber, unit: "g", color: "bg-green-100 dark:bg-green-500/10",
      onAdd: () => setShowNutrition(true),
    },
    {
      icon: <IonIcon name="fast-food" size={20} className="text-orange-500 dark:text-orange-400" />, label: "Carbs",
      value: nutrition.carbs, unit: "g", color: "bg-orange-100 dark:bg-orange-500/10",
      onAdd: () => setShowNutrition(true),
    },
    {
      icon: <IonIcon name="water" size={20} className="text-blue-500 dark:text-blue-400" />, label: "Water",
      value: nutrition.water, unit: liquidUnit, color: "bg-blue-100 dark:bg-blue-500/10",
      onAdd: () => setShowNutrition(true),
    },
    {
      icon: <IonIcon name="barbell" size={20} className="text-red-500 dark:text-red-400" />, label: "Exercise",
      value: exercise != null ? String(exercise) : "0", unit: "min", color: "bg-red-100 dark:bg-red-500/10",
      onAdd: () => setMetricModal({ label: "Exercise", unit: "min", current: exercise != null ? String(exercise) : "", onSave: async (v) => { await saveExercise(dk, v); exercise != null ? toast.success("Exercise updated successfully!") : toast.success("Exercise added successfully!"); } }),
    },
    {
      icon: <IonIcon name="camera" size={20} className="text-purple-500 dark:text-purple-400" />, label: "Progress",
      value: photo ? "✓" : "–", unit: "pic", color: "bg-purple-100 dark:bg-purple-500/10",
      onAdd: () => setMetricModal({ label: "Progress", unit: "pic", current: photo || "–", dayKey: dk, onSave: async (v, newDayKey) => { await addProgressPhotoRecord(newDayKey || dk, v); toast.success("Progress photo added successfully!"); }, onDelete: async () => { await deleteLatestProgressPhoto(dk); toast.success("Progress photo deleted successfully!"); } }),
    },
  ];

  return (
    <>
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-8 gap-2 px-3 mb-4">
        {allMetrics.map((m) => (
          <MetricCard key={m.label} {...m} onAdd={m.onAdd} />
        ))}
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
          onSave={metricModal.onSave}
          onDelete={metricModal.onDelete}
          validate={metricModal.validate}
        />
      )}
    </>
  );
}