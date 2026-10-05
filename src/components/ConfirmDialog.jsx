import React from "react";
import useModal from "@/hooks/useModal";

/**
 * An in-app confirmation dialog. Used instead of window.confirm, which is
 * blocked or unhelpful inside a native webview.
 *
 * It takes part in the shared dialog behaviour (scroll lock, focus trap,
 * Escape / back button), so opening it inside another sheet keeps the page
 * behind locked until both are closed.
 */
export default function ConfirmDialog({
  open, title, message, confirmLabel = "Confirm", cancelLabel = "Cancel",
  destructive = false, busy = false, onConfirm, onCancel, children,
}) {
  const sheetRef = useModal({ open, onDismiss: busy ? undefined : onCancel });

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-6" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/50 overlay-lock" onClick={busy ? undefined : onCancel} aria-hidden="true" />
      <div
        ref={sheetRef}
        tabIndex={-1}
        className="relative bg-white dark:bg-[#16181f] rounded-2xl p-5 w-full max-w-sm min-w-0 overflow-x-hidden sheet-lock shadow-xl outline-none"
      >
        <h2 className="text-lg font-bold text-gray-900 dark:text-white break-words">{title}</h2>
        {message && <p className="text-sm text-gray-600 dark:text-[#9A9DAE] mt-2 leading-relaxed break-words">{message}</p>}
        {children}
        <div className="flex flex-col-reverse sm:flex-row gap-2 mt-5">
          <button
            onClick={onCancel}
            disabled={busy}
            className="flex-1 min-w-0 min-h-[48px] py-3 rounded-xl font-semibold text-base bg-gray-100 dark:bg-white/[0.07] text-gray-700 dark:text-[#E8E9F0] disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className={`flex-1 min-w-0 min-h-[48px] py-3 rounded-xl font-semibold text-base text-white disabled:opacity-60 ${destructive ? "bg-red-600" : "bg-indigo-600"}`}
          >
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}