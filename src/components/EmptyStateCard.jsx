import React from "react";

/**
 * The one empty state the app shows on a page with nothing in it yet: a card
 * with the icon in a soft circle, a bold title and a muted line of explanation —
 * the shape Shots and Journal have always drawn inline, now in one place so
 * every page that has nothing to show yet looks identical. A page passes only
 * its own icon, its own title and its own sentence; the card, the circle, the
 * type and the spacing belong to this component.
 */
export default function EmptyStateCard({ icon: Icon, title, description, className = "" }) {
  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl p-6 text-center text-gray-400 dark:text-[#9A9DAE] border border-gray-100 dark:border-gray-800 ${className}`}>
      <div className="w-14 h-14 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mx-auto mb-3">
        {Icon && <Icon size={32} className="opacity-30" aria-hidden="true" />}
      </div>
      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
      <p className="text-sm">{description}</p>
    </div>
  );
}