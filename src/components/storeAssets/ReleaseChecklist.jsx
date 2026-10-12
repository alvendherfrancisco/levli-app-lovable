import React, { useState } from "react";
import { RELEASE_CHECKLIST, PAGE_LIMITS } from "@/lib/storeAssets";

// The ticks are kept on the device, so a release spread over a few days does not
// lose its place.
const STORAGE_KEY = "levli:store-checklist";

function readTicks() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

/** The submission checklist, with its ticks remembered on this device. */
export default function ReleaseChecklist() {
  const [done, setDone] = useState(readTicks);

  const toggle = (label) => {
    setDone((prev) => {
      const next = prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label];
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* private mode */ }
      return next;
    });
  };

  return (
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {done.length} of {RELEASE_CHECKLIST.length} done
      </p>
      <ul className="mt-2 divide-y divide-gray-100 dark:divide-white/[0.07]">
        {RELEASE_CHECKLIST.map((item) => (
          <li key={item.label}>
            <label className="flex cursor-pointer items-start gap-3 py-2.5">
              <input
                type="checkbox"
                checked={done.includes(item.label)}
                onChange={() => toggle(item.label)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-indigo-600"
              />
              <span className="min-w-0">
                <span className={`block text-sm ${done.includes(item.label) ? "text-gray-400 line-through dark:text-gray-500" : "text-gray-900 dark:text-[#E8E9F0]"}`}>
                  {item.label}
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-gray-400 dark:text-gray-500">{item.hint}</span>
              </span>
              {item.open && (
                <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                  Team
                </span>
              )}
            </label>
          </li>
        ))}
      </ul>

      <div className="mt-5 rounded-2xl border border-gray-100 bg-gray-50 px-3 py-2.5 dark:border-white/[0.08] dark:bg-white/[0.04]">
        <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Not in this pack</p>
        <ul className="mt-1.5 space-y-1.5">
          {PAGE_LIMITS.map((line) => (
            <li key={line} className="text-xs leading-relaxed text-gray-600 dark:text-[#9A9DAE]">• {line}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}