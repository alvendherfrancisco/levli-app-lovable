import React from "react";
import { daysAgoLabel } from "@/lib/dateUtils";
import { siteLabel } from "@/lib/injectionSites";

/** "Last used 3 days ago" — today reads as a word rather than "0 days ago". */
function lastUsedLabel(date) {
  const ago = daysAgoLabel(date);
  return `Last used ${ago === "Today" ? "today" : ago}`;
}

/**
 * The sites the shots in this range went to, most used first: each row reads the
 * site, how often it was used, and when it was last used — the one thing that
 * says what to do next. Tapping a row opens that site's dose entries.
 */
export default function SiteUsageList({ usage, onSelectSite }) {
  return (
    <ul className="divide-y divide-gray-100 dark:divide-white/[0.06]">
      {usage.map((u) => (
        <li key={u.site}>
          <button
            type="button"
            onClick={() => onSelectSite(u.site)}
            className="flex min-h-[44px] w-full items-center justify-between gap-3 py-2 text-left"
          >
            <span className="min-w-0 truncate text-sm text-gray-700 dark:text-[#E8E9F0]">
              {siteLabel(u.site)} <span className="text-gray-400 dark:text-[#9A9DAE]">· {u.count}</span>
            </span>
            <span className="flex-shrink-0 whitespace-nowrap text-[11px] text-gray-500 dark:text-[#9A9DAE]">
              {lastUsedLabel(u.lastDate)}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}