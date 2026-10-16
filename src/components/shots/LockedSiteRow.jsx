import React from "react";
import { ChevronRight, Lock } from "lucide-react";

/**
 * What the rotation card leaves behind once its preview has been folded away with
 * "Not now": one slim row that says what is locked and still opens the plans, so
 * the way to premium is never lost — the same shape the shots history uses for
 * the doses it is holding back.
 */
export default function LockedSiteRow({ onOpen }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-xl border border-dashed border-indigo-200 p-3 text-left dark:border-indigo-500/30"
    >
      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-500/15">
        <Lock size={15} className="text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-gray-900 dark:text-white">
          Injection sites are locked
        </span>
        <span className="block text-xs text-gray-500 dark:text-[#9A9DAE]">Unlock with Levli Premium</span>
      </span>
      <ChevronRight size={16} className="flex-shrink-0 text-gray-300 dark:text-gray-600" aria-hidden="true" />
    </button>
  );
}