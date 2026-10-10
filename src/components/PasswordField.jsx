import React, { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { AUTH_FIELD_EYE, AUTH_FIELD_ICON, AUTH_FIELD_MARK, AUTH_LABEL } from "@/lib/authStyles";

/**
 * A password field: the label above it, the lock in the field's left slot, and
 * an eye that reveals what was typed. The eye keeps its own 44pt target, so it
 * is as easy to hit as the field itself, and each field holds its own reveal
 * state — showing one password never reveals another.
 *
 * Every part comes from the flow's own tokens (see src/lib/authStyles.js), so
 * the field follows the device's light/dark setting on all the account screens
 * that share it, and is drawn the same on each of them.
 */
export default function PasswordField({
  id, label, value, onChange,
  autoComplete = "new-password",
  enterKeyHint = "next",
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="w-full">
      <label htmlFor={id} className={AUTH_LABEL}>{label}</label>
      <div className="relative w-full">
        <Lock className={AUTH_FIELD_MARK} aria-hidden="true" />
        <input
          id={id}
          type={show ? "text" : "password"}
          placeholder="••••••••"
          autoComplete={autoComplete}
          enterKeyHint={enterKeyHint}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${AUTH_FIELD_ICON} pr-14`}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          className={AUTH_FIELD_EYE}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}