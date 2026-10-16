import React from "react";

/**
 * The shell every read-only section of a shared record sits in — the app's usual
 * card, with the section's name and an optional count beside it. Kept in one
 * place so the four sections on the caregiver's screen line up.
 */
export default function ReadOnlySection({ title, meta, children }) {
  return (
    <div className="mx-3 mb-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="font-semibold text-gray-700 dark:text-gray-300">{title}</h2>
        {meta && <span className="text-xs text-gray-400 dark:text-gray-500">{meta}</span>}
      </div>
      {children}
    </div>
  );
}