import React, { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { FIELD, FIELD_EYE, FIELD_MARK, LABEL } from "@/lib/uiStyles";
import { AUTH_FIELD, AUTH_FIELD_EYE, AUTH_FIELD_MARK, AUTH_LABEL } from "@/lib/authStyles";

/**
 * A password field: the label above it, the lock in the field's left slot, and
 * an eye that reveals what was typed. The eye keeps its own 44pt target, so it
 * is as easy to hit as the field itself, and each field holds its own reveal
 * state — showing one password never reveals another.
 *
 * `themed` draws it for the sign-in screens, which follow the device's light and
 * dark setting; the onboarding screen that shares this field leaves it off and
 * keeps exactly the light styling it has always had.
 */
export default function PasswordField({
  id, label, value, onChange,
  autoComplete = "new-password",
  enterKeyHint = "next",
  themed = false,
}) {
  const [show, setShow] = useState(false);
  const labelClass = themed ? AUTH_LABEL : LABEL;
  const fieldClass = themed ? AUTH_FIELD : FIELD;
  const markClass = themed ? AUTH_FIELD_MARK : FIELD_MARK;
  const eyeClass = themed ? AUTH_FIELD_EYE : FIELD_EYE;

  return (
    <div className="w-full">
      <label htmlFor={id} className={labelClass}>{label}</label>
      <div className="relative w-full">
        <Lock className={markClass} aria-hidden="true" />
        <input
          id={id}
          type={show ? "text" : "password"}
          placeholder="••••••••"
          autoComplete={autoComplete}
          enterKeyHint={enterKeyHint}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${fieldClass} pr-14`}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          className={eyeClass}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}