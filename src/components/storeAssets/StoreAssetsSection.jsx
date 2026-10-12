import React from "react";

const CARD = "bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800";

/** One titled block of the release page: an eyebrow, a heading, a hint, then its card. */
export default function StoreAssetsSection({ eyebrow, title, hint, children }) {
  return (
    <section className="px-4 mb-6">
      {eyebrow && (
        <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase mb-1 px-1">{eyebrow}</p>
      )}
      <h2 className="text-lg font-bold text-gray-900 dark:text-white px-1">{title}</h2>
      {hint && <p className="text-xs text-gray-500 dark:text-[#9A9DAE] mt-1 px-1 leading-relaxed">{hint}</p>}
      <div className={`${CARD} mt-3 p-4`}>{children}</div>
    </section>
  );
}