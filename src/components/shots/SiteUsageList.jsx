import React from "react";
import { daysAgoLabel } from "@/lib/dateUtils";
import { siteDisplayName } from "@/lib/injectionSites";

/** "Last used 3 days ago" — today reads as a word rather than "0 days ago". */
function lastUsedLabel(date) {
  const ago = daysAgoLabel(date);
  return `Last used ${ago === "Today" ? "today" : ago}`;
}

/**
 * The sites the shots in this range were given at, most used first: each row is
 * the site and how often it was used, and the site used most recently also says
 * when. Tapping a row opens that site's dose entries.
 */
export default function SiteUsageList({ usage, recentSite, onSelectSite }) {
  return (
    <ul className="divide-y divide-gray-100 dark:divide-white/[0.06]">
      {usage.map((u) => (
        <li key={u.site}>
          <button
            type="button"
            onClick={() => onSelectSite(u.site)}
            className="flex min-h-[44px] w-full items-center justify-between gap-3 text-left"
          >
            <span className="min-w-0 truncate text-sm text-gray-700 dark:text-[#E8E9F0]">
              {siteDisplayName(u.site)} <span className="text-gray-400 dark:text-[#9A9DAE]">· {u.count}</span>
            </span>
            {u.site === recentSite && (
              <span className="flex-shrink-0 text-[11px] text-gray-500 dark:text-[#9A9DAE]">
                {lastUsedLabel(u.lastDate)}
              </span>
            )}
          </button>
        </li>
      ))}
    </ul>
  );
}