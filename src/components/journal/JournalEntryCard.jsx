import React from "react";
import { Clock } from "lucide-react";
import { categoryMeta, moodTag } from "@/lib/journalMeta";
import { parseShotDate, formatLocaleDate } from "@/lib/dateUtils";

const MUTED = "text-xs text-gray-500 dark:text-[#9A9DAE]";

/**
 * One journal entry at a glance, and the entry itself behind it: the whole card
 * is the way in, and it opens the entry ready to change — there is no button to
 * find first.
 *
 * Read top to bottom. The category's own icon on the left, the first line of
 * what was written beside it in bold and kept to that one line, and the date on
 * the right. Under it: the time, the category and the mood, all on one row,
 * wrapping only when they no longer fit. Then, when there is more to the note
 * than its opening line, a two-line glimpse of it.
 *
 * Every line here is a summary of something the entry already holds, and nothing
 * is trimmed for good — the whole note is in the sheet this card opens. Padding
 * is even on all four sides, so the card ends where its content does.
 *
 * It carries no card of its own; the list draws the card around it.
 */
export default function JournalEntryCard({ entry, onEdit }) {
  const meta = categoryMeta(entry.category);
  // The first line with something on it is the title, wherever the writer
  // started; what follows it is the glimpse.
  const lines = (entry.text || "").split("\n");
  const titleAt = Math.max(0, lines.findIndex((line) => line.trim()));
  const firstLine = lines[titleAt].trim();
  const rest = lines.slice(titleAt + 1).join("\n").trim();
  const mood = moodTag(entry.mood);

  return (
    <button
      type="button"
      onClick={() => onEdit?.(entry)}
      aria-label={`Edit journal entry: ${firstLine}`}
      className="block w-full p-4 text-left"
    >
      <div className="flex items-start gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: meta.bg }}>
          {React.cloneElement(meta.icon, { size: 18, style: { color: meta.color } })}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="flex-1 min-w-0 truncate text-sm font-semibold text-gray-900 dark:text-[#E8E9F0]">
              {firstLine}
            </p>
            <span className={`${MUTED} flex-shrink-0 whitespace-nowrap`}>
              {formatLocaleDate(parseShotDate(entry.date)) || entry.date}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
              <Clock size={11} className="flex-shrink-0" />{entry.time}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap" style={{ background: meta.bg, color: meta.color }}>
              {meta.label}
            </span>
            {/* The mood the entry was written with, wearing the same emoji and the
                same word the picker showed when it was chosen. */}
            {mood && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap flex items-center gap-1 bg-white/10 dark:bg-white/[0.08] text-gray-600 dark:text-[#C0C3D4] border border-gray-200 dark:border-white/[0.1]">
                {mood.emoji} {mood.label}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* What is left of the note once its opening line has been read: two lines
          of it, and no more. */}
      {rest && (
        <p className="mt-2 text-sm text-gray-600 dark:text-[#9A9DAE] line-clamp-2">
          {rest}
        </p>
      )}
    </button>
  );
}