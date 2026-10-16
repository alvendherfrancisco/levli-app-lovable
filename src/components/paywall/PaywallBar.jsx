import React from "react";
import { Loader2 } from "lucide-react";
import {
  HELP_ON_SCREEN, LINK, LINK_UNDERLINE, NOTICE,
  PRIMARY_BTN, PRIMARY_BTN_OFF, PRIMARY_BTN_ON,
} from "@/lib/uiStyles";

/**
 * The paywall's foot — the flow's own CTA footer (the same padding, the same pill
 * and the same button as every onboarding step), holding the one action, the terms
 * of the plan in hand, and the legal row.
 *
 * It is pinned across the foot of the panel, over the slides and the plans that
 * scroll behind it: the button is always exactly where it is, on the smallest
 * phone as much as the largest, and the scrolling content keeps the bar's own
 * height as its last padding (see PaywallModal), so the last plan row always
 * comes to rest above it. Its spacing is the screen's own — 16px above the
 * button, 8px under it for the plan note, 16px above the legal row, and only the
 * home indicator's inset below that (see .paywall-bar in src/index.css).
 *
 * A failure is reported here, in the one place the action is, in the flow's own
 * notice, with the way to try again beside it.
 */
export default function PaywallBar({
  label, terms, busy, disabled, error,
  onSubscribe, onRetry, onRestore, restoring,
}) {
  const off = busy || disabled;

  return (
    <div className="paywall-bar border-t border-auth-border px-4 pt-4">
      <div className="mx-auto w-full max-w-[400px]">
        {error && (
          <div role="alert" className={`${NOTICE} mb-4`}>
            {error}{" "}
            <button type="button" onClick={onRetry} className={LINK}>Retry</button>
          </div>
        )}

        <button
          type="button"
          onClick={onSubscribe}
          disabled={off}
          className={`${PRIMARY_BTN} ${off ? PRIMARY_BTN_OFF : PRIMARY_BTN_ON}`}
        >
          {busy ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> {label}
            </span>
          ) : label}
        </button>

        {terms && <p className={`${HELP_ON_SCREEN} mt-2`}>{terms}</p>}

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[12.5px] text-auth-muted">
          <a href="/terms" className={LINK_UNDERLINE}>Terms</a>
          <span aria-hidden="true">·</span>
          <button
            type="button"
            onClick={onRestore}
            disabled={restoring}
            className="hover:text-auth-link"
          >
            {restoring ? "Restoring…" : "Restore purchases"}
          </button>
          <span aria-hidden="true">·</span>
          <a href="/privacy" className={LINK_UNDERLINE}>Privacy</a>
        </div>
      </div>
    </div>
  );
}