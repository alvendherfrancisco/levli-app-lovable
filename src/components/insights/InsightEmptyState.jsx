import React from "react";

/**
 * An empty state inside an Insights card, drawn the way Shots and the Journal
 * draw theirs: centred, one muted line of explanation, and — where the space
 * allows — a soft icon in a tinted circle above it. An optional action (a
 * primary button, or a link) sits under the message.
 *
 * Its height comes from its own padding rather than a fixed box, so a longer
 * message or a button is never clipped at the card's edge.
 */
export default function InsightEmptyState({ icon, action, children, className = "" }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] px-6 py-8 text-center ${className}`}>
      {icon && (
        <span className="w-14 h-14 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center flex-shrink-0" aria-hidden="true">
          {icon}
        </span>
      )}
      <p className="text-sm leading-snug text-gray-500 dark:text-[#9A9DAE]">{children}</p>
      {action}
    </div>
  );
}