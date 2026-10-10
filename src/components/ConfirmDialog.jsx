import React, { useEffect, useId, useState } from "react";
import { AlertTriangle, HelpCircle, Loader2, Trash2 } from "lucide-react";
import useModal from "@/hooks/useModal";
import { sound } from "@/lib/sounds";

/** Keep in step with the .confirm-card timings in index.css. */
const ANIM_MS = 180;

/**
 * One tone per kind of question — what the badge and the primary button look
 * like. Red asks before something goes, amber flags a caution, indigo asks a
 * plain yes/no. Every colour is a themeable utility, so both modes follow the
 * app's own tokens rather than a fixed palette.
 */
const TONES = {
  destructive: {
    badge: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
    primary: "btn-danger-solid",
    Icon: Trash2,
  },
  warning: {
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
    primary: "bg-amber-500 hover:bg-amber-600 text-amber-900",
    Icon: AlertTriangle,
  },
  neutral: {
    badge: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400",
    primary: "btn-primary",
    Icon: HelpCircle,
  },
};

/**
 * The app's confirmation dialog, in place of window.confirm — which is blocked
 * inside a native webview, cannot be themed, and reads as the browser's voice
 * rather than the app's.
 *
 * A centered card over a dimmed, lightly blurred backdrop: a tinted icon badge,
 * a short bold title, the message, then the two actions stacked full width —
 * the action itself on top, the safe way out beneath it. The safe button is
 * named for what it does ("Keep repeat"), never "Cancel", which reads wrong
 * when the action on offer is itself a cancellation.
 *
 * It takes part in the shared dialog behaviour (background scroll lock, focus
 * trap, Escape and the back button, focus returned to the trigger), so one
 * opened inside a sheet keeps the page behind locked until both are closed.
 *
 * `onConfirm` may return a promise: a spinner then sits on the action while it
 * settles and both buttons stay locked, and the caller closes on success.
 */
export default function ConfirmDialog({
  open, title, message,
  confirmLabel = "Confirm", cancelLabel = "Keep it",
  tone, destructive = false, icon: IconProp, busy = false,
  onConfirm, onCancel, children,
}) {
  const resolved = TONES[tone] ? tone : (destructive ? "destructive" : "neutral");
  const { badge, primary, Icon: ToneIcon } = TONES[resolved];
  const Icon = IconProp || ToneIcon;

  const [running, setRunning] = useState(false);
  // Stays true through the exit animation, so the card is seen to leave.
  const [mounted, setMounted] = useState(open);
  const isBusy = busy || running;

  useEffect(() => {
    if (open) { setMounted(true); setRunning(false); return undefined; }
    if (!mounted) return undefined;
    const timer = setTimeout(() => setMounted(false), ANIM_MS);
    return () => clearTimeout(timer);
  }, [open, mounted]);

  const sheetRef = useModal({
    open: mounted,
    // Mid-action nothing dismisses it — not the backdrop, not Escape.
    onDismiss: open && !isBusy ? onCancel : undefined,
    openSound: resolved === "neutral" ? "open" : "warning",
  });

  const uid = useId();

  if (!mounted) return null;

  const state = open ? "open" : "closed";

  const handleConfirm = async () => {
    if (isBusy) return;
    if (resolved === "destructive") sound.delete(); else sound.tap();
    const result = onConfirm?.();
    // Work that takes a moment keeps its spinner and both buttons locked until
    // it settles; the caller closes the dialog once it has succeeded.
    if (result && typeof result.then === "function") {
      setRunning(true);
      try { await result; } catch { /* the caller reports the failure */ }
      setRunning(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center px-6"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div
        data-state={state}
        onClick={open && !isBusy ? onCancel : undefined}
        aria-hidden="true"
        className="confirm-backdrop absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-[2px] overlay-lock"
      />
      <div
        ref={sheetRef}
        data-state={state}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={`${uid}-title`}
        aria-describedby={message ? `${uid}-message` : undefined}
        tabIndex={-1}
        className="confirm-card relative w-full min-w-0 max-w-[360px] overflow-x-hidden sheet-lock rounded-[20px] border border-gray-200 bg-white p-6 shadow-2xl outline-none dark:border-white/10 dark:bg-[#16181f] dark:shadow-[0_24px_60px_rgba(0,0,0,0.6)]"
      >
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${badge}`}>
          <Icon size={24} aria-hidden="true" />
        </div>

        <h2 id={`${uid}-title`} className="text-lg font-bold text-gray-900 dark:text-white mt-4 break-words">
          {title}
        </h2>
        {message && (
          <p id={`${uid}-message`} className="text-sm text-gray-600 dark:text-gray-300 mt-2 leading-relaxed break-words">
            {message}
          </p>
        )}
        {children}

        <div className="flex flex-col gap-3 mt-6">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isBusy}
            className={`btn-pill w-full ${primary}`}
          >
            {isBusy && <Loader2 size={18} className="animate-spin" aria-hidden="true" />}
            {confirmLabel}
          </button>
          {/* The safe way out holds the initial focus: it is the button that
              leaves without doing anything. */}
          <button
            type="button"
            onClick={onCancel}
            disabled={isBusy}
            autoFocus
            className="btn-pill btn-secondary w-full"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}