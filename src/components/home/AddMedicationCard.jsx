import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import { useAppState } from "@/lib/AppState";
import { CARD, CARD_TITLE, BTN_TEXT } from "@/lib/uiStyles";

/** Dismissed once per device: a nudge, not a setting. */
const DISMISSED_KEY = "levli_add_medication_card_dismissed";

/**
 * Shown on Home while the account holds exactly one medication: the one
 * onboarding set up. Onboarding deliberately sets up the primary medication
 * only, so this is where a second one is added, through the same Add Medication
 * form, which keeps every medication on its own schedule, dose and reminder.
 *
 * One slim row: what the card is for on the left, the action on the right. It
 * disappears on its own as soon as a second medication is there.
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
    <div className={`${CARD} flex items-center gap-3`}>
      <h3 className={`${CARD_TITLE} min-w-0 flex-1`}>Add another medication</h3>
      <button type="button" onClick={onAdd} className={BTN_TEXT}>
        <Plus size={16} aria-hidden="true" /> Add
      </button>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="-mr-2 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full"
      >
        <X size={18} className="text-gray-400" />
      </button>
    </div>
  );
}