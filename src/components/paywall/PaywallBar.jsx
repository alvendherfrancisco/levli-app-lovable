import React from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

/**
 * The paywall's foot: the one action, the trial and renewal terms that belong to
 * the plan in hand, and the legal row. It sits in the sheet's own column rather
 * than over the content, so it can never cover a plan card — the sheet scrolls
 * above it and the bar keeps its own height.
 *
 * A failure is reported here, in the one place the action is, with the way to try
 * again beside it.
 */
export default function PaywallBar({
  label, terms, busy, disabled, error,
  onSubscribe, onRetry, onRestore, restoring,
}) {
  return (
    <div className="border-t border-cardline bg-white px-4 pt-4 pb-modal-footer dark:bg-gray-950">
      {error && (
        <div className="mb-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-500/30 dark:bg-red-500/10">
          <AlertTriangle size={15} className="mt-0.5 flex-shrink-0 text-red-600 dark:text-red-400" aria-hidden="true" />
          <p className="min-w-0 flex-1 text-xs leading-snug text-red-700 dark:text-red-300">{error}</p>
          <button type="button" onClick={onRetry} className="btn-link flex-shrink-0 text-xs">
            Retry
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={onSubscribe}
        disabled={busy || disabled}
        className="btn-pill btn-primary w-full"
      >
        {busy && <Loader2 size={18} className="animate-spin" aria-hidden="true" />}
        {busy ? "Connecting to the App Store…" : label}
      </button>

      {terms && (
        <p className="mt-3 text-center text-[11px] leading-relaxed text-gray-500 dark:text-[#9A9DAE]">{terms}</p>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-[11px] text-gray-500 dark:text-[#9A9DAE]">
        <a href="/terms" className="underline-offset-2 hover:text-indigo-600 hover:underline dark:hover:text-indigo-400">
          Terms of Service
        </a>
        <span aria-hidden="true">·</span>
        <button type="button" onClick={onRestore} disabled={restoring} className="hover:text-indigo-600 dark:hover:text-indigo-400">
          {restoring ? "Restoring…" : "Restore purchases"}
        </button>
        <span aria-hidden="true">·</span>
        <a href="/privacy" className="underline-offset-2 hover:text-indigo-600 hover:underline dark:hover:text-indigo-400">
          Privacy Policy
        </a>
      </div>
    </div>
  );
}