import React from "react";
import { AlertTriangle } from "lucide-react";
import { useAppState } from "@/lib/AppState";
import { supplyAlerts } from "@/lib/supplyTracking";
import { sound } from "@/lib/sounds";

/**
 * The supply reminder, on Home and on Shots.
 *
 * It shows the one reminder in hand — a low count, an approaching expiry date or
 * an expiry date already gone — for a medication that is tracking its supply.
 * The wording is neutral and points at the pharmacist: the app never says
 * whether a product is safe to use, and nothing here stops a dose being logged.
 *
 * Dismissing writes the alert's own signature on the medication, so that exact
 * reminder stays away; a count that moves or a different date raises it again.
 * With nothing to raise, the banner draws nothing at all.
 */
const TONE = {
  expired: "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300",
  expiring: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300",
  low: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300",
};

export default function SupplyAlertBanner({ className = "" }) {
  const { medications, updateMedication } = useAppState();
  const [alert] = supplyAlerts(medications);
  if (!alert) return null;

  const dismiss = () => {
    sound.tap();
    updateMedication(alert.medication.id, { supply_alert_dismissed: alert.signature });
  };

  return (
    <div
      role="status"
      className={`flex items-start gap-3 rounded-2xl border p-4 ${TONE[alert.kind] || TONE.low} ${className}`}
    >
      <AlertTriangle size={18} aria-hidden="true" className="mt-0.5 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-snug">{alert.title}</p>
        <p className="mt-0.5 text-xs leading-snug opacity-90">
          {alert.medication.medication_name}
          {alert.detail ? ` · ${alert.detail}` : ""}
        </p>
      </div>
      <button
        type="button"
        onClick={dismiss}
        className="-mr-1 flex min-h-[44px] flex-shrink-0 items-center px-1 text-xs font-semibold underline underline-offset-2 active:opacity-70"
      >
        Dismiss
      </button>
    </div>
  );
}