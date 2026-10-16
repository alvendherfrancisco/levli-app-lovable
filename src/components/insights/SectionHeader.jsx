import React from "react";

/**
 * One header for every Insights card: a filled icon in a soft tinted circle
 * beside a bold title — the same lockup Home's and Shots' cards use — with an
 * optional subtitle and an optional action on the right.
 *
 * The icon and the title share one row and are centred against each other, so a
 * title that wraps keeps the icon level with the title itself rather than
 * dropping below it. The subtitle is one short line under that row, with room
 * under it before the card's own content begins.
 */
export default function SectionHeader({ icon, title, subtitle, action, compact = false, titleClass }) {
  return (
    <div className={compact ? "mb-3" : "mb-5"}>
      <div className={`flex items-center justify-between ${compact ? "gap-2" : "gap-3"}`}>
        <div className={`flex min-w-0 items-center ${compact ? "gap-2" : "gap-3"}`}>
          <span className={`${compact ? "w-7 h-7" : "w-9 h-9"} rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center flex-shrink-0`} aria-hidden="true">
            {icon}
          </span>
          {/* `titleClass` lets one card set its title's size and weight — for a
              title that must hold on a single line beside its action — without
              changing the shared type for every other card. */}
          <h3 className={`min-w-0 font-bold text-gray-900 dark:text-white leading-tight ${titleClass || (compact ? "text-base" : "text-lg")}`}>{title}</h3>
        </div>
        {action}
      </div>
      {subtitle && (
        <p className="mt-2 text-xs leading-snug text-indigo-500 dark:text-indigo-400">{subtitle}</p>
      )}
    </div>
  );
}