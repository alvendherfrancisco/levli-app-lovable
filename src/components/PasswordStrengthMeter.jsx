import React from "react";
import { passwordStrength } from "@/lib/accountValidation";

// One colour per level, so the four segments and the word beside them can never
// disagree. These four are the meaning of the hint — red, orange, amber, green —
// and are the same on a dark screen as on a light one.
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
 * it follows every keystroke. Every account screen draws it from here, so they
 * are all the same bar.
 *
 * The segments not yet filled and the word beside them come from the flow's own
 * tokens (see src/lib/authStyles.js): a quiet dark grey on a dark card, a light
 * grey on a light one, never a fixed value.
 */
export default function PasswordStrengthMeter({ password }) {
  const strength = passwordStrength(password);
  if (!strength) return null;

  return (
    <div className="mt-2">
      <div className="flex items-center gap-2">
        <span className="flex flex-1 gap-1">
          {[1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className={`h-1 flex-1 rounded-full ${i <= strength.score ? BAR_FILL[strength.tone] : "bg-auth-track"}`}
            />
          ))}
        </span>
        <span className="text-[12px] font-medium text-auth-muted">{strength.label}</span>
      </div>
      {strength.hint && <p className="mt-1 text-[12px] text-auth-muted">{strength.hint}</p>}
    </div>
  );
}