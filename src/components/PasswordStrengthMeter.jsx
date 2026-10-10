import React from "react";
import { passwordStrength } from "@/lib/accountValidation";

// One colour per level, so the four segments and the word beside them can never
// disagree.
const BAR_FILL = {
  weak: "bg-red-500",
  fair: "bg-orange-400",
  good: "bg-amber-400",
  strong: "bg-teal-500",
};

/**
 * The live password hint: four equal segments and one word, with a single short
 * line beneath them while the password still has something to gain.
 *
 * It is guidance only and never blocks anything — see passwordStrength in
 * src/lib/accountValidation.js. Nothing is drawn until something is typed, and
 * it follows every keystroke. Both account screens draw it from here, so the
 * two bars are the same bar.
 */
export default function PasswordStrengthMeter({ password, themed = false }) {
  const strength = passwordStrength(password);
  if (!strength) return null;
  // On the sign-in screens (see src/lib/authStyles.js) the empty segments and the
  // word beside them come from the theme's tokens, so both are readable on a dark
  // card as much as on a light one.
  const trackClass = themed ? "bg-auth-track" : "bg-gray-200";
  const textClass = themed ? "text-auth-muted" : "text-gray-500";

  return (
    <div className="mt-2">
      <div className="flex items-center gap-2">
        <span className="flex flex-1 gap-1">
          {[1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className={`h-1 flex-1 rounded-full ${i <= strength.score ? BAR_FILL[strength.tone] : trackClass}`}
            />
          ))}
        </span>
        <span className={`text-[12px] font-medium ${textClass}`}>{strength.label}</span>
      </div>
      {strength.hint && <p className={`mt-1 text-[12px] ${textClass}`}>{strength.hint}</p>}
    </div>
  );
}