import React, { useState } from "react";
import { AlertTriangle, Check, Undo2, X } from "lucide-react";
import { useAppState } from "@/lib/AppState";
import useModal from "@/hooks/useModal";
import { toast } from "@/lib/toast";

/**
 * One-time check raised when entries kept in pounds read as a believable weight
 * in kilograms (which usually means the unit was mixed up). The user chooses;
 * nothing is converted silently, and a conversion can be undone in one tap.
 */
export default function UnitCheckPrompt() {
  const { unitCheck, convertAssumedKg, undoUnitConversion, keepWeightsAsLogged } = useAppState();
  const [busy, setBusy] = useState(false);
  const [converted, setConverted] = useState(0);

  const sheetRef = useModal({
    open: !!(unitCheck?.needsPrompt || converted),
    onDismiss: () => { if (!converted) keepWeightsAsLogged(); },
  });

  if (!unitCheck?.needsPrompt && !converted) return null;

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
      <div className="absolute inset-0 bg-black/40 overlay-lock" onClick={() => !converted && keepWeightsAsLogged()} aria-hidden="true" />
      <div ref={sheetRef} role="dialog" aria-modal="true" aria-label="Please check your weight unit" tabIndex={-1} className="relative bg-white dark:bg-[#0f1117] rounded-t-3xl sm:rounded-3xl w-full sm:max-w-[480px] max-h-[92dvh] overflow-y-auto overflow-x-hidden no-scrollbar sheet-lock p-5 outline-none" style={{ paddingBottom: "calc(24px + env(safe-area-inset-bottom, 0px))" }}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-orange-500 flex-shrink-0" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-[#E8E9F0]">Please check your weight unit</h2>
          </div>
          {!converted && (
            <button onClick={keepWeightsAsLogged} aria-label="Close">
              <X size={20} className="text-gray-400" />
            </button>
          )}
        </div>

        {converted ? (
          <>
            <p className="text-sm text-gray-600 dark:text-[#9A9DAE] mt-3">
              {converted} {converted === 1 ? "entry is" : "entries are"} now stored as kilograms. You can undo this at any time.
            </p>
            <button
              onClick={() => run(async () => { const n = await undoUnitConversion(); setConverted(0); return n; }, (n) => `Undone. ${n} entries back to pounds`)}
              disabled={busy}
              className="mt-5 w-full py-3 rounded-xl font-semibold border border-gray-200 dark:border-white/10 text-gray-700 dark:text-[#E8E9F0] flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Undo2 size={16} /> Undo
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-600 dark:text-[#9A9DAE] mt-3">
              {unitCheck.count} of your weight {unitCheck.count === 1 ? "entry is" : "entries are"} recorded in pounds ({unitCheck.low && unitCheck.high ? `${unitCheck.low}–${unitCheck.high} lb` : ""}).
              Read together with your height, that gives a body mass index below 15, which is not a plausible value for an adult, so we have not shown it.
            </p>
            <p className="text-sm text-gray-600 dark:text-[#9A9DAE] mt-3">
              Were these weights entered in kilograms instead? We will not change anything until you choose.
            </p>
            <div className="mt-5 space-y-2">
              <button
                onClick={() => run(async () => { const n = await convertAssumedKg(); setConverted(n); return n; }, (n) => `${n} entries updated`)}
                disabled={busy}
                className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <Check size={16} /> Yes, they are kilograms
              </button>
              <button
                onClick={keepWeightsAsLogged}
                disabled={busy}
                className="w-full py-3 rounded-xl font-semibold border border-gray-200 dark:border-white/10 text-gray-700 dark:text-[#E8E9F0] disabled:opacity-60"
              >
                No, they are pounds
              </button>
            </div>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-3">
              This is an input check on your own entries, not medical advice.
            </p>
          </>
        )}
      </div>
    </div>
  );
}