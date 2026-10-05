import React from "react";
import { ClipboardList, Plus } from "lucide-react";
import { useAppState } from "@/lib/AppState";

/**
 * First-run state: shown instead of empty metric tiles when nothing has been
 * logged yet. The app starts empty — it only ever shows what the user records.
 */
export default function FirstRunCard({ onAddShot }) {
  const { shots, weightHistory, journalEntries } = useAppState();
  const hasAnything = shots.length > 0 || weightHistory.length > 0 || journalEntries.length > 0;
  if (hasAnything) return null;

  return (
    <div className="mx-4 mb-4 bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(99,102,241,0.13)" }}>
          <ClipboardList size={16} className="text-indigo-500" />
        </div>
        <h3 className="font-bold text-gray-900 dark:text-white">Nothing logged yet</h3>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Levli starts empty and only shows what you record. Log your first dose, weight or symptom and it will appear here.
      </p>
      <button
        onClick={onAddShot}
        className="mt-4 w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors"
      >
        <Plus size={16} /> Log your first shot
      </button>
      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-3">
        Nothing is pre-filled and nothing is shared. Levli is a personal logbook, not medical advice.
      </p>
    </div>
  );
}