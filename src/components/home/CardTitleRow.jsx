import React from "react";

/**
 * The top row of a Home card, drawn in one place so every card on the page wears
 * it identically: the icon tile, the title, and whatever sits with them on the
 * right — the row held on one vertical centre, with the same 32px tile, the same
 * 16px glyph inside it and the same 8px gap, in every card.
 *
 * The card's content follows it 12px below (`mt-3`), which is the gap every card
 * on Home keeps between its title row and what sits under it.
 *
 * `label` may be a node when a card's title carries something with it (a dose
 * badge, for instance), and `sub` is the quiet line under the title.
 */
const TILE = "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0";

export const CARD_TITLE_TEXT = "block text-sm font-semibold text-gray-700 dark:text-gray-300";
export const CARD_SUB_TEXT = "block truncate text-xs text-gray-500 dark:text-[#9A9DAE]";

export default function CardTitleRow({
  icon, label, sub, trailing,
  iconClass = "bg-indigo-50 dark:bg-indigo-500/10",
  className = "",
}) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className={`${TILE} ${iconClass}`} aria-hidden="true">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className={CARD_TITLE_TEXT}>{label}</span>
        {sub && <span className={CARD_SUB_TEXT}>{sub}</span>}
      </span>
      {trailing}
    </div>
  );
}