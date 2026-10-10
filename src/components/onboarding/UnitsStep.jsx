import React from "react";

const GROUPS = [
  { key: "weight_unit", label: "Weight", options: [{ value: "lb", label: "Pounds (lb)" }, { value: "kg", label: "Kilograms (kg)" }] },
  { key: "height_unit", label: "Height", options: [{ value: "in", label: "Feet & Inches" }, { value: "cm", label: "Centimeters (cm)" }] },
  { key: "liquid_unit", label: "Liquids", options: [{ value: "oz", label: "Ounces (oz)" }, { value: "mL", label: "Milliliters (mL)" }] },
];

export default function UnitsStep({ units, setUnits }) {
  return (
    <div className="flex-1">
      <h1 className="text-2xl sm:text-3xl font-bold leading-tight mb-2">Measurement Preferences</h1>
      <p className="text-gray-400 text-sm mb-6">Choose the units you'd like to use throughout the app.</p>
      <div className="space-y-5">
        {GROUPS.map((group) => (
          <div key={group.key}>
            <p className="text-sm font-semibold text-gray-300 mb-2">{group.label}</p>
            <div className="grid grid-cols-2 gap-3">
              {group.options.map((opt) => {
                const isSelected = units[group.key] === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setUnits((prev) => ({ ...prev, [group.key]: opt.value }))}
                    className={`px-4 py-3 rounded-full border text-sm font-medium transition-all ${
                      isSelected
                        ? "border-teal-500 bg-teal-500/10 text-teal-400"
                        : "border-gray-700 bg-gray-900 text-white"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}