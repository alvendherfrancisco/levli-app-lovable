import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import { useAppState } from "@/lib/AppState";

/** Dismissed once per device — a nudge, not a setting. */
const DISMISSED_KEY = "levli_add_medication_card_dismissed";

/**
 * Shown on Home while the account holds exactly one medication: the one
 * onboarding set up. Onboarding deliberately sets up the primary medication
 * only, so this is where a second one is added — through the same Add
 * Medication form, which keeps every medication on its own schedule, dose and
 * reminder.
 *
 * Dismissible, and it disappears on its own as soon as a second medication is
 * there. "+ Add medication" also stays in Medications and in the shot picker.
 */
export default function AddMedicationCard({ onAdd }) {
  const { medications } = useAppState();
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISSED_KEY) === "1";
    } catch {
      return false;
    }
  });

  const list = medications || [];
  const running = list.filter((m) => !["archived", "discontinued"].includes(m.status || "active"));
  if (dismissed || running.length !== 1) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // A device that cannot store the choice simply shows the card again.
    }
  };

  return (
    <div className="mx-3 mb-4 bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-bold text-gray-900 dark:text-white">Add another medication</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-snug">
            Taking more than one? Each medication keeps its own schedule, dose and reminder.
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="w-11 h-11 -mr-2 -mt-1 flex items-center justify-center rounded-full flex-shrink-0"
        >
          <X size={18} className="text-gray-400" />
        </button>
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="mt-3 w-full min-h-[48px] bg-indigo-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors"
      >
        <Plus size={16} /> Add medication
      </button>
    </div>
  );
}