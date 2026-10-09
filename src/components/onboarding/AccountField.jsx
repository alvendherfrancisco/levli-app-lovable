import React from "react";
import { FIELD, LABEL, MESSAGE } from "@/components/onboarding/formStyles";

/**
 * One field of the account form: its name, the control, and a line under it
 * saying what to type or what went wrong.
 *
 * The name stays visible once the placeholder has gone, which is what tells the
 * person where they are when they come back to the form. The message is written
 * out, never a colour on its own, and is tied to the field with aria-describedby
 * so it is read with it.
 */
export default function AccountField({
  id, label, hint, error, extra, trailing, inputRef, ...input
}) {
  const message = error || hint;

  return (
    <div className="w-full">
      <label htmlFor={id} className={LABEL}>{label}</label>
      <div className="relative">
        <input
          {...input}
          id={id}
          ref={inputRef}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={message ? `${id}-message` : undefined}
          className={`${FIELD} ${trailing ? "pr-14" : ""} ${error ? "border-red-400 focus:border-red-500" : ""}`}
        />
        {trailing}
      </div>
      {message && (
        <p
          id={`${id}-message`}
          className={`${MESSAGE} ${error ? "text-red-600 font-medium" : "text-gray-500"}`}
        >
          {message}
        </p>
      )}
      {extra && !error ? <div className="mt-1.5">{extra}</div> : null}
    </div>
  );
}