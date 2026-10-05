import React, { useState, useEffect } from "react";
import { X, RotateCcw, Save } from "lucide-react";
import { useAppState } from "@/lib/AppState";
import { todayKey } from "@/lib/dateUtils";
import useModal from "@/hooks/useModal";
import { toast } from "sonner";

const EMPTY = { calories: "", protein: "", water: "", fiber: "", carbs: "" };

function numericOnly(value) {
  let v = value.replace(/[^0-9.]/g, "");
  const parts = v.split(".");
  if (parts.length > 2) v = parts[0] + "." + parts.slice(1).join("");
  return v;
}

function isValidNum(v) {
  return v === "" || (!isNaN(parseFloat(v)) && parseFloat(v) >= 0);
}

export default function AddNutritionModal({ open, onClose, dayKey }) {
  const dk = dayKey || todayKey();
  const { getNutrition, saveNutrition, profile } = useAppState();
  const liquidUnit = profile?.liquid_unit || "oz";

  const fields = [
    { key: "calories", label: "Calories", unit: "kcal" },
    { key: "protein", label: "Protein", unit: "g" },
    { key: "water", label: "Water", unit: liquidUnit },
    { key: "fiber", label: "Fiber", unit: "g" },
    { key: "carbs", label: "Carbohydrates", unit: "g" },
  ];

  const [values, setValues] = useState({ ...EMPTY });
  const [errors, setErrors] = useState({});
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    if (open) { 
      const current = getNutrition(dk);
      setValues(current);
      setErrors({});
      setIsNew(!current.calories || current.calories === "0.0");
    }
  }, [open, dk]);

  const sheetRef = useModal({ open, onDismiss: onClose });

  if (!open) return null;

  const handleChange = (key, raw) => {
    const v = numericOnly(raw);
    setValues((p) => ({ ...p, [key]: v }));
    setErrors((p) => ({ ...p, [key]: v !== "" && !isValidNum(v) ? "Invalid number" : null }));
  };

  const handleSave = () => {
    const newErrors = {};
    Object.entries(values).forEach(([k, v]) => {
      if (!isValidNum(v)) newErrors[k] = "Invalid number";
    });
    if (Object.values(newErrors).some(Boolean)) { setErrors(newErrors); return; }
    try {
      saveNutrition(dk, values);
      toast.success(isNew ? "Nutrition data added successfully!" : "Nutrition data updated successfully!");
      setTimeout(() => onClose(), 500);
    } catch (err) {
      toast.error("Failed to save nutrition data");
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 overlay-lock" onClick={onClose} aria-hidden="true" />
      <div ref={sheetRef} role="dialog" aria-modal="true" aria-label="Add Nutrition Data" tabIndex={-1} className="relative bg-white dark:bg-[#0f1117] rounded-t-3xl sm:rounded-3xl w-full sm:max-w-[480px] max-h-[92dvh] flex flex-col overflow-hidden sheet-lock animate-in slide-in-from-bottom sm:mx-4 dark:shadow-[0_-8px_40px_rgba(0,0,0,0.5)] outline-none">
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>
        <div className="flex items-center justify-between px-5 pb-4 shrink-0">
          <h2 className="text-xl font-bold dark:text-[#E8E9F0]">Add Nutrition Data</h2>
          <button onClick={onClose} aria-label="Close" className="w-11 h-11 flex items-center justify-center rounded-full"><X size={22} className="text-gray-400" /></button>
        </div>
        <div className="px-5 pb-4 space-y-4 min-h-0 overflow-y-auto overflow-x-hidden no-scrollbar overscroll-contain" style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-y" }}>
          {fields.map((f) => (
            <div key={f.key}>
              <label className="text-sm font-semibold text-gray-700 dark:text-[#9A9DAE] mb-1 block">{f.label}</label>
              <div className={`flex items-center border rounded-xl px-4 py-3 dark:bg-white/[0.05] ${errors[f.key] ? "border-red-400" : "border-gray-200 dark:border-white/[0.1]"}`}>
                <input type="text" inputMode="decimal" value={values[f.key]} placeholder="0"
                  onChange={(e) => handleChange(f.key, e.target.value)}
                  onFocus={(e) => e.target.select()}
                  className="flex-1 outline-none text-base bg-transparent dark:text-[#E8E9F0]" />
                <span className="text-gray-400 text-sm ml-2">{f.unit}</span>
              </div>
              {errors[f.key] && <p className="text-xs text-red-500 mt-0.5">Please enter a valid number.</p>}
            </div>
          ))}
        </div>
        <div className="flex gap-3 px-5 pt-3 shrink-0 border-t border-gray-100 dark:border-white/[0.08]" style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))" }}>
          <button onClick={() => setValues({ ...EMPTY })} className="flex-1 py-3.5 bg-gray-100 dark:bg-white/[0.07] text-gray-600 dark:text-[#9A9DAE] rounded-xl font-semibold flex items-center justify-center gap-2">
            <RotateCcw size={16} /> Reset
          </button>
          <button onClick={handleSave} className="flex-1 py-3.5 bg-indigo-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2">
            <Save size={16} /> Save
          </button>
        </div>
      </div>
    </div>
  );
}