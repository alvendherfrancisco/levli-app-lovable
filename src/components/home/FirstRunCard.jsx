import React from "react";
import { ClipboardList, Plus } from "lucide-react";
import { useAppState } from "@/lib/AppState";
import { CARD, CARD_TITLE, BODY_TEXT, BTN_PRIMARY_WIDE } from "@/lib/uiStyles";

/**
 * First-run state: shown instead of empty metric tiles when nothing has been
 * logged yet. The app starts empty and only ever shows what the user records.
 */
export default function FirstRunCard({ onAddShot }) {
  const { shots, weightHistory, journalEntries } = useAppState();
  const hasAnything = shots.length > 0 || weightHistory.length > 0 || journalEntries.length > 0;
  if (hasAnything) return null;

  return (
    <div className={CARD}>
      <div className="flex items-center gap-2">
        <span
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
          style={{ background: "rgba(99,102,241,0.13)" }}
          aria-hidden="true"
        >
          <ClipboardList size={16} className="text-indigo-500" />
        </span>
        <h3 className={CARD_TITLE}>Nothing logged yet</h3>
      </div>
      <p className={`${BODY_TEXT} mt-2`}>Log your first dose to get started.</p>
      <button onClick={onAddShot} className={`${BTN_PRIMARY_WIDE} mt-4`}>
        <Plus size={18} aria-hidden="true" /> Log first dose
      </button>
    </div>
  );
}