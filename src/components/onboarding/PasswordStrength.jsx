import React from "react";

const BARS = {
  weak: "bg-red-500",
  fair: "bg-orange-400",
  good: "bg-amber-400",
  strong: "bg-teal-500",
};

/**
 * How much the password being typed has going for it — a hint, never a gate.
 * Anything that passes the length rule is accepted, and the label says in words
 * what the coloured bar says, so it never depends on colour alone.
 */
export default function PasswordStrength({ strength }) {
  if (!strength) return null;

  return (
    <div className="w-full">
      <div className="flex items-center gap-2">
        <span className="flex-1 flex gap-1" aria-hidden="true">
          {[1, 2, 3, 4].map((step) => (
            <span
              key={step}
              className={`h-1 flex-1 rounded-full ${step <= strength.score ? BARS[strength.tone] : "bg-gray-200"}`}
            />
          ))}
        </span>
        <span className="text-[12.5px] font-semibold text-gray-600">{strength.label}</span>
      </div>
      {strength.hint && <p className="text-[12.5px] text-gray-500 mt-1 leading-snug">{strength.hint}</p>}
    </div>
  );
}