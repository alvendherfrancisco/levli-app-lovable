import React from "react";

/**
 * A section's empty state: one short line, and a small button where there is
 * something to do about it.
 *
 * Nothing is drawn around it — no box, no icon, no fixed height — so a card
 * stays one line tall until there is data to show, and only then grows.
 */
export default function InsightEmptyState({ message, action, className = "" }) {
  return (
    <div className={`flex flex-col items-center gap-3 py-3 text-center ${className}`}>
      {message && <p className="text-sm text-gray-500 dark:text-[#9A9DAE]">{message}</p>}
      {action}
    </div>
  );
}