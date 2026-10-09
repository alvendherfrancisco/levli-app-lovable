import React, { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { FIELD, LABEL } from "@/lib/authFormStyles";

/**
 * A password field: the label above it, the lock in the field's left slot, and
 * an eye that reveals what was typed. The eye keeps its own 44pt target, so it
 * is as easy to hit as the field itself, and each field holds its own reveal
 * state — showing one password never reveals another.
 */
export default function PasswordField({
  id, label, value, onChange,
  autoComplete = "new-password",
  enterKeyHint = "next",
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="w-full">
      <label htmlFor={id} className={LABEL}>{label}</label>
      <div className="relative w-full">
        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
        <input
          id={id}
          type={show ? "text" : "password"}
          placeholder="••••••••"
          autoComplete={autoComplete}
          enterKeyHint={enterKeyHint}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${FIELD} pr-14`}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          className="absolute right-1.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 hover:text-gray-600"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}