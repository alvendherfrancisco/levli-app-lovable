import React from "react";
import { X } from "lucide-react";
import { PK_CALCULATION_VERSION, MODEL_WINDOW_HALF_LIVES } from "@/lib/pkCalculations";
import useModal from "@/hooks/useModal";

/** Label half-lives for the products Levli models, from each US prescribing information. */
export const HALF_LIFE_SOURCE = [
  { name: "Semaglutide (Ozempic®, Wegovy®, Rybelsus®)", value: "≈ 7 days (1 week)" },
  { name: "Tirzepatide (Mounjaro®, Zepbound®)", value: "≈ 5 days" },
  { name: "Liraglutide (Victoza®, Saxenda®)", value: "≈ 13 hours" },
  { name: "Dulaglutide (Trulicity®)", value: "≈ 5 days" },
];

/**
 * "How this works" — the assumptions behind the modelled exposure chart, the
 * source of the half-life, and the model version.
 */
export default function ExposureHowItWorks({ open, onClose, medication, halfLifeDays, intervalDays }) {
  const sheetRef = useModal({ open, onDismiss: onClose });

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 overlay-lock" onClick={onClose} aria-hidden="true" />
      <div ref={sheetRef} role="dialog" aria-modal="true" aria-label="How this works" tabIndex={-1} className="relative bg-white dark:bg-[#0f1117] rounded-t-3xl sm:rounded-3xl w-full sm:max-w-[520px] max-h-[92dvh] overflow-y-auto overflow-x-hidden no-scrollbar sheet-lock animate-in slide-in-from-bottom sm:mx-4 dark:shadow-[0_-8px_40px_rgba(0,0,0,0.5)] outline-none">
        <div className="sticky top-0 z-10 bg-white dark:bg-[#0f1117]">
          <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 bg-gray-300 rounded-full" /></div>
          <div className="flex items-center justify-between px-5 pb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-[#E8E9F0]">How this works</h2>
            <button onClick={onClose}><X size={22} className="text-gray-400" /></button>
          </div>
        </div>

        <div className="px-5 pb-6 space-y-4 text-sm text-gray-700 dark:text-[#E8E9F0]">
          <div>
            <h3 className="font-semibold mb-1">What the chart is</h3>
            <p className="text-[13px] leading-relaxed">
              An illustrative relative-exposure estimate built from the doses you have logged. It is not a
              blood-level measurement, and not something to adjust your dose by.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-1">The model</h3>
            <ul className="text-[13px] leading-relaxed space-y-1 list-disc pl-4">
              <li>One compartment with first-order elimination: each dose contributes <span className="font-medium">dose × 0.5^(days since ÷ half-life)</span>, and the contributions are added together.</li>
              <li>Absorption is treated as instantaneous, though real injections peak over one to three days.</li>
              <li>One fixed volume of distribution is assumed, so the summed amount is proportional to the concentration the half-life describes.</li>
              <li>A bigger dose raises the curve in proportion to its size.</li>
              <li>Only doses inside the last {MODEL_WINDOW_HALF_LIVES} half-lives are used; anything older contributes less than 3% and is left out.</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-1">"Steady state reached"</h3>
            <p className="text-[13px] leading-relaxed">
              The modelled amount right now as a percentage of the amount your current dose reaches once dosing has
              settled at the interval in the label. It is calculated from the doses actually logged inside the last{" "}
              {MODEL_WINDOW_HALF_LIVES} half-lives, so it falls when a dose is missed and returns to 0% when nothing
              recent is left to model. A dose step-up starts the climb again.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-1">Where the half-life comes from</h3>
            <p className="text-[13px] leading-relaxed mb-2">
              Each product's own US prescribing information (Clinical Pharmacology, elimination).
            </p>
            <div className="rounded-xl bg-gray-50 dark:bg-white/[0.05] border border-gray-100 dark:border-white/[0.08] p-3 space-y-1">
              {HALF_LIFE_SOURCE.map((row) => (
                <div key={row.name} className="flex items-start justify-between gap-3">
                  <span className="text-[12px] text-gray-600 dark:text-[#9A9DAE]">{row.name}</span>
                  <span className="text-[12px] font-medium whitespace-nowrap">{row.value}</span>
                </div>
              ))}
            </div>
            {medication && halfLifeDays && (
              <p className="text-[12px] mt-2 text-indigo-600 dark:text-indigo-400">
                Using for this chart: {medication} · half-life {halfLifeDays} day{halfLifeDays === 1 ? "" : "s"}
                {intervalDays ? ` · dosing every ${intervalDays} day${intervalDays === 1 ? "" : "s"}` : ""}
              </p>
            )}
          </div>

          <div>
            <h3 className="font-semibold mb-1">What it does not account for</h3>
            <p className="text-[13px] leading-relaxed">
              How quickly your body absorbs an injection, your body weight and blood volume, antibodies to the
              medication, and differences between products or batches. It follows the label's half-life, so it is an
              estimate of a typical person on the same dose. Your own levels may differ.
            </p>
          </div>

          <p className="text-[11px] text-gray-400 dark:text-gray-500">
            Model version {PK_CALCULATION_VERSION} · doses older than {MODEL_WINDOW_HALF_LIVES} half-lives are outside the window ·
            illustrative estimate, not a blood-level measurement.
          </p>
        </div>

        <div className="sticky bottom-0 px-5 pt-3 bg-white dark:bg-[#0f1117] border-t border-gray-100 dark:border-white/[0.08]" style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))" }}>
          <button onClick={onClose} className="w-full py-3.5 btn-pill btn-primary font-semibold">Got it</button>
        </div>
      </div>
    </div>
  );
}