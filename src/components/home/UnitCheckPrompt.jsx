import React, { useRef, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { useAppState } from "@/lib/AppState";
import useModal from "@/hooks/useModal";
import { toast } from "@/lib/toast";

/**
 * One-time check raised when entries kept in pounds read as a believable weight
 * in kilograms (which usually means the unit was mixed up). The user chooses;
 * nothing is converted silently, and a conversion can be undone in one tap here —
 * or later from Settings, under Units.
 *
 * It can be put away without answering anything: the X at the top right, a tap
 * outside, a swipe down on the sheet or the grip at its top all close it, and
 * closing never changes a weight. An answer that has already been given ("they
 * are pounds") is remembered, and a conversion that has happened simply stops
 * being announced — the entries stay exactly as they are either way.
 */
export default function UnitCheckPrompt() {
  const { unitCheck, convertAssumedKg, undoUnitConversion, keepWeightsAsLogged } = useAppState();
  const [busy, setBusy] = useState(false);
  const [converted, setConverted] = useState(0);
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragFrom = useRef(null);

  const open = !!(unitCheck?.needsPrompt || converted);

  // Closing keeps the unit and every entry as they are: a notice that has already
  // been shown is simply put away (the conversion itself stands, and Settings
  // still offers to undo it), and an answer that has not been given yet is
  // recorded as "they are pounds", so the prompt is not raised again for the same
  // change.
  const dismiss = () => {
    if (converted) setConverted(0);
    else keepWeightsAsLogged();
  };

  const sheetRef = useModal({ open, onDismiss: dismiss });

  // A swipe down from anywhere on a sheet that is scrolled to its top, and from
  // the grip at the top in any case. Past 80px the sheet is put away.
  const dragStart = (clientY) => {
    const el = sheetRef.current;
    if (!el || el.scrollTop > 0) return;
    dragFrom.current = clientY;
    setDragging(true);
  };
  const dragMove = (clientY) => {
    if (dragFrom.current == null) return;
    const dy = clientY - dragFrom.current;
    setDragY(dy > 0 ? dy : 0);
  };
  const dragEnd = () => {
    if (dragFrom.current == null) return;
    const dy = dragY;
    dragFrom.current = null;
    setDragging(false);
    setDragY(0);
    if (dy > 80) dismiss();
  };

  if (!open) return null;

  const run = async (fn, message) => {
    setBusy(true);
    try {
      const count = await fn();
      if (message) toast.success(message(count));
    } catch (err) {
      console.error("Unit check failed:", err);
      toast.error("Could not update those entries. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 overlay-lock" onClick={dismiss} aria-hidden="true" />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label="Check your weight unit"
        tabIndex={-1}
        onTouchStart={(e) => dragStart(e.touches[0].clientY)}
        onTouchMove={(e) => dragMove(e.touches[0].clientY)}
        onTouchEnd={dragEnd}
        onTouchCancel={dragEnd}
        className={`relative bg-white dark:bg-[#0f1117] rounded-t-3xl sm:rounded-3xl w-full sm:max-w-[480px] max-h-[92dvh] overflow-y-auto overflow-x-hidden no-scrollbar sheet-lock px-4 pt-3 outline-none ${
          dragging ? "" : "transition-transform duration-200"
        }`}
        style={{
          transform: dragY ? `translateY(${dragY}px)` : undefined,
          paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))",
        }}
      >
        {/* The grip: the sheet can be swiped down from here, or from anywhere on
            it while it is scrolled to its top. */}
        <div className="flex justify-center pb-4">
          <div className="h-1 w-10 rounded-full bg-gray-300 dark:bg-white/20" />
        </div>

        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <AlertTriangle size={18} className="text-orange-500 flex-shrink-0" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-[#E8E9F0]">Check your weight unit</h2>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Close"
            className="-mr-2 -mt-2 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-gray-400 hover:text-gray-600 active:scale-95 dark:text-gray-500 dark:hover:text-gray-300"
          >
            <X size={24} aria-hidden="true" />
          </button>
        </div>

        {converted ? (
          <>
            <p className="text-sm text-gray-600 dark:text-[#9A9DAE] mt-4">
              {converted} {converted === 1 ? "entry is" : "entries are"} now stored as kilograms. You can undo this at any time.
            </p>
            <button
              onClick={() => run(async () => { const n = await undoUnitConversion(); setConverted(0); return n; }, (n) => `Undone. ${n} entries back to pounds`)}
              disabled={busy}
              className="mt-4 w-full py-3 rounded-xl font-semibold border border-gray-200 dark:border-white/10 text-gray-700 dark:text-[#E8E9F0] disabled:opacity-60"
            >
              Undo
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-600 dark:text-[#9A9DAE] mt-4">
              {unitCheck.count} of your weight {unitCheck.count === 1 ? "entry is" : "entries are"} recorded in pounds ({unitCheck.low && unitCheck.high ? `${unitCheck.low}–${unitCheck.high} lb` : ""}).
              Read together with your height, that gives a body mass index below 15, which is not a plausible value for an adult, so we have not shown it.
            </p>
            <p className="text-sm text-gray-600 dark:text-[#9A9DAE] mt-4">
              Were these weights entered in kilograms instead? We will not change anything until you choose.
            </p>
            <div className="mt-4 space-y-2">
              <button
                onClick={() => run(async () => { const n = await convertAssumedKg(); setConverted(n); return n; }, (n) => `${n} entries updated`)}
                disabled={busy}
                className="w-full py-3.5 btn-pill btn-primary font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
              >
                Yes, they are kilograms
              </button>
              <button
                onClick={keepWeightsAsLogged}
                disabled={busy}
                className="btn-pill btn-secondary w-full"
              >
                No, they are pounds
              </button>
            </div>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-4">
              This is an input check on your own entries, not medical advice.
            </p>
          </>
        )}
      </div>
    </div>
  );
}