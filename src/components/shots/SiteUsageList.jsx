import React from "react";
import { daysAgoLabel } from "@/lib/dateUtils";
import { siteLabel, sitePoint } from "@/lib/injectionSites";

/** "Last used 3 days ago" — today reads as a word rather than "0 days ago". */
function lastUsedLabel(date) {
  const ago = daysAgoLabel(date);
  return `Last used ${ago === "Today" ? "today" : ago}`;
}

/**
 * The sites the shots in this range went to, most used first: each row reads the
 * site, how often it was used, and when it was last used — the one thing that
 * says what to do next.
 *
 * Every row in this list has its dot on the figure above it, and tapping either
 * one marks both (see InjectionSiteCard). A site the figures have no spot for is
 * never hidden: it stays listed, with the reason it carries no dot.
 */
export default function SiteUsageList({ usage, selectedSite = null, onSelectSite }) {
  return (
    <ul className="divide-y divide-gray-100 dark:divide-white/[0.06]">
      {usage.map((u) => {
        const selected = u.id === selectedSite;
        const placed = !!sitePoint(u.id);
        return (
          <li key={u.id}>
            <button
              type="button"
              onClick={() => onSelectSite(u.id)}
              aria-current={selected ? "true" : undefined}
              className="flex min-h-[44px] w-full items-center justify-between gap-3 py-2 text-left"
            >
              <span className="min-w-0">
                <span
                  className={`block truncate text-sm ${
                    selected
                      ? "font-semibold text-indigo-700 dark:text-indigo-300"
                      : "text-gray-700 dark:text-[#E8E9F0]"
                  }`}
                >
                  {siteLabel(u.id)}{" "}
                  <span className="font-normal text-gray-400 dark:text-[#9A9DAE]">· {u.count}</span>
                </span>
                {!placed && (
                  <span className="block text-[11px] text-gray-500 dark:text-[#9A9DAE]">
                    No position on the figure
                  </span>
                )}
              </span>
              <span className="flex-shrink-0 whitespace-nowrap text-[11px] text-gray-500 dark:text-[#9A9DAE]">
                {lastUsedLabel(u.lastDate)}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}