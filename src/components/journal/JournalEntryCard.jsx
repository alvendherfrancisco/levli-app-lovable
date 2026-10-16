import React, { useState } from "react";
import { Clock, Heart, Pencil } from "lucide-react";
import { categoryMeta } from "@/lib/journalMeta";
import { parseShotDate, formatLocaleDate } from "@/lib/dateUtils";

/**
 * One journal entry, kept short: the first line of what was written, the time,
 * and the category it was filed under. The whole note is one tap away — tapping
 * the row opens it, and the entry can be edited from there. Nothing is trimmed
 * away permanently: the note is the same note, simply not all of it on screen at
 * once.
 *
 * It carries no card of its own; the list draws the card around it.
 */
export default function JournalEntryCard({ entry, onEdit }) {
  const [open, setOpen] = useState(false);
  const meta = categoryMeta(entry.category);
  const text = entry.text || "";
  const firstLine = text.split("\n")[0];
  const mood = entry.mood || "";

  return (
    <div className="px-4 py-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full text-left"
      >
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: meta.bg }}>
            {React.cloneElement(meta.icon, { size: 18, style: { color: meta.color } })}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start gap-2">
              <p className={`text-sm text-gray-700 dark:text-gray-300 min-w-0 ${open ? "whitespace-pre-wrap break-words" : "truncate"}`}>
                {open ? text : firstLine}
              </p>
              <span className="text-xs text-gray-500 dark:text-[#9A9DAE] flex-shrink-0 whitespace-nowrap">
                {formatLocaleDate(parseShotDate(entry.date)) || entry.date}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Clock size={11} className="flex-shrink-0" />{entry.time}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap" style={{ background: meta.bg, color: meta.color }}>
                {meta.label}
              </span>
              {open && mood && (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap flex items-center gap-1 bg-white/10 dark:bg-white/[0.08] text-gray-600 dark:text-[#C0C3D4] border border-gray-200 dark:border-white/[0.1]">
                  <Heart size={10} /> {mood}
                </span>
              )}
            </div>
          </div>
        </div>
      </button>

      {open && (
        <div className="flex justify-end mt-2">
          <button type="button" onClick={() => onEdit(entry)} className="btn-link text-xs">
            <Pencil size={12} /> Edit entry
          </button>
        </div>
      )}
    </div>
  );
}