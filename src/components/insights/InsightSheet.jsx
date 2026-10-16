import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import useModal from "@/hooks/useModal";

/**
 * The bottom sheet the Medication Level card opens over itself: the same shell
 * every sheet in the app uses — the grab handle, a title with a Close button, the
 * focus trap, the scroll lock and the back-button handling — drawn onto the page
 * rather than inside the card, so it is never clipped by the card's own edges.
 */
export default function InsightSheet({ open, onClose, title, children }) {
  // The page's own offset, read while the body is still scrollable: the sheet's
  // scroll lock pins the body a moment later, so a later read would only ever see
  // zero. It is put back the instant the sheet closes, because dropping the
  // sheet's own history entry is what lets the browser restore an offset of its
  // own — and that is what moved the page when a medication was chosen or the
  // sheet was dismissed. Declared before useModal, so the offset is read before
  // that lock is applied.
  const pageOffset = useRef(0);
  useEffect(() => {
    if (!open) return undefined;
    pageOffset.current = window.scrollY || 0;
    return () => {
      const restore = () => window.scrollTo(0, pageOffset.current);
      // Immediately, then once the entry drop has settled, so the reader's own
      // offset is the last word. The window is a fifth of a second: a scroll made
      // in that same instant is put back, and one made after it is left alone.
      restore();
      const frame = requestAnimationFrame(restore);
      const timer = window.setTimeout(() => { cancelAnimationFrame(frame); restore(); }, 200);
      // Neither is returned: React ignores the return value of a cleanup, and both
      // writes are harmless if the sheet is opened again before they run.
      void timer;
    };
  }, [open]);

  const sheetRef = useModal({ open, onDismiss: onClose });

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/40 overlay-lock" onClick={onClose} aria-hidden="true" />

      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="relative w-full sm:max-w-md max-h-[85dvh] overflow-y-auto overflow-x-hidden no-scrollbar sheet-lock bg-white dark:bg-[#0f1117] rounded-t-3xl sm:rounded-3xl animate-in slide-in-from-bottom outline-none"
      >
        <div className="flex justify-center pt-3 pb-1" aria-hidden="true">
          <div className="h-1 w-10 rounded-full bg-gray-300 dark:bg-white/20" />
        </div>
        <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-1">
          <h2 className="min-w-0 text-lg font-bold text-gray-900 dark:text-[#E8E9F0]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center"
          >
            <X size={22} className="text-gray-400" />
          </button>
        </div>

        <div className="px-5 pb-modal-footer">{children}</div>
      </div>
    </div>,
    document.body,
  );
}