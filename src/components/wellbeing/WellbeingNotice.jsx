import React from "react";
import { Info } from "lucide-react";

/**
 * The gentle check-in shown when a wellbeing safeguard is active — a low BMI, a
 * fast rate of loss, or a goal weight below a BMI of 18.5. Deliberately calm and
 * never framed as an achievement.
 */
export default function WellbeingNotice({ message, className = "" }) {
  if (!message) return null;
  return (
    <div className={`rounded-2xl p-3 border bg-teal-50 dark:bg-teal-500/10 border-teal-200 dark:border-teal-500/25 ${className}`}>
      <div className="flex items-start gap-2">
        <Info size={16} className="flex-shrink-0 mt-0.5 text-teal-700 dark:text-teal-300" />
        <p className="text-xs leading-relaxed text-teal-900 dark:text-teal-200">{message}</p>
      </div>
    </div>
  );
}