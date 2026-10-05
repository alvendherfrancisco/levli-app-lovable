import React from "react";
import { AlertCircle } from "lucide-react";

/**
 * A field's error, in plain words right under the field it belongs to. It is
 * never colour alone: an icon and the text carry the same message.
 */
export default function FieldError({ message }) {
  if (!message) return null;
  return (
    <p role="alert" className="flex items-start gap-2 mt-3 text-lg font-semibold text-red-700 dark:text-red-300">
      <AlertCircle size={22} className="flex-shrink-0 mt-0.5" aria-hidden="true" />
      <span>{message}</span>
    </p>
  );
}