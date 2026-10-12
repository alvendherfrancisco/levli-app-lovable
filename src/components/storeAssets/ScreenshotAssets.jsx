import React from "react";
import { Info } from "lucide-react";
import { SCREENSHOT_SIZES, SCREENSHOT_RULES, SHOT_PLAN, CAPTURE_STEPS } from "@/lib/storeAssets";

/** The screenshot block: what Apple accepts, the shots in order, and how to take them. */
export default function ScreenshotAssets() {
  return (
    <div>
      <table className="w-full text-left">
        <thead>
          <tr className="text-[11px] uppercase text-gray-400 dark:text-gray-500">
            <th className="pb-2 font-semibold">Device</th>
            <th className="pb-2 font-semibold">Size</th>
            <th className="pb-2 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-white/[0.07]">
          {SCREENSHOT_SIZES.map((row) => (
            <tr key={row.size}>
              <td className="py-2.5 pr-2 text-sm text-gray-800 dark:text-[#E8E9F0]">{row.label}</td>
              <td className="py-2.5 pr-2 text-[13px] text-gray-600 dark:text-[#9A9DAE]">{row.size}</td>
              <td className="py-2.5 text-xs text-gray-500 dark:text-gray-400">{row.status}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="mt-4 space-y-1.5">
        {SCREENSHOT_RULES.map((rule) => (
          <li key={rule} className="flex gap-2 text-[13px] leading-relaxed text-gray-600 dark:text-[#9A9DAE]">
            <span aria-hidden="true" className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-indigo-400" />
            {rule}
          </li>
        ))}
      </ul>

      <p className="mt-6 mb-2 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
        The shots, in upload order
      </p>
      <ol className="space-y-2">
        {SHOT_PLAN.map((shot, index) => (
          <li key={shot.screen} className="rounded-2xl border border-gray-100 px-3 py-2.5 dark:border-white/[0.08]">
            <p className="text-sm font-medium text-gray-900 dark:text-[#E8E9F0]">
              <span className="mr-2 text-indigo-600 dark:text-indigo-400">{index + 1}</span>
              {shot.screen}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-[#9A9DAE]">{shot.what}</p>
            <p className="mt-1 text-xs italic text-gray-400 dark:text-gray-500">{shot.caption}</p>
          </li>
        ))}
      </ol>

      <p className="mt-6 mb-2 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
        How to capture them
      </p>
      <ol className="list-decimal space-y-1.5 pl-5">
        {CAPTURE_STEPS.map((step) => (
          <li key={step} className="text-[13px] leading-relaxed text-gray-600 dark:text-[#9A9DAE]">{step}</li>
        ))}
      </ol>

      <div className="mt-4 flex gap-2 rounded-2xl border border-indigo-100 bg-indigo-50 px-3 py-2.5 dark:border-indigo-500/25 dark:bg-indigo-500/10">
        <Info size={15} aria-hidden="true" className="mt-0.5 shrink-0 text-indigo-600 dark:text-indigo-400" />
        <p className="text-xs leading-relaxed text-indigo-900 dark:text-indigo-200">
          The shot files have to come from the running app on a 6.9-inch iPhone or the same Simulator, so each screen shows
          real data. Capture them from the list above, then upload them in that order.
        </p>
      </div>
    </div>
  );
}