import React from "react";

/**
 * One header for every Insights card: a filled icon in a soft tinted circle
 * beside a bold title — the same lockup Home's and Shots' cards use — with an
 * optional subtitle and an optional action on the right.
 *
 * The icon and the title share one row and are centred against each other, so a
 * title that wraps keeps the icon level with the title itself rather than
 * dropping below it. The subtitle sits under the title, indented to the same
 * line, so the two never drift apart.
 */
export default function SectionHeader({ icon, title, subtitle, action }) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center flex-shrink-0" aria-hidden="true">
            {icon}
          </span>
          <h3 className="min-w-0 font-bold text-gray-900 dark:text-white text-lg leading-tight">{title}</h3>
        </div>
        {action}
      </div>
      {subtitle && (
        <p className="pl-12 mt-1.5 text-xs leading-snug text-indigo-500 dark:text-indigo-400">{subtitle}</p>
      )}
    </div>
  );
}