import React from "react";
import IonIcon from "@/components/IonIcon";

/**
 * An empty state inside an Insights card, drawn the way Shots and the Journal
 * draw theirs: a soft icon in a tinted circle, a bold title, one short muted
 * line saying what the section shows and how to fill it, and an optional action
 * under it.
 *
 * The icon is given by name and the whole block is spaced from here, so every
 * empty state on the page shares one icon size, one fill style and one rhythm
 * between the icon, the words and the button. The words are wrapped at a
 * comfortable measure, so a sentence never runs edge to edge or leaves a single
 * word on its last line, and the height comes from the block's own padding
 * rather than a fixed box, so nothing is clipped at the card's edge.
 */
export default function InsightEmptyState({ icon, title, description, action, className = "" }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-5 rounded-xl bg-gray-50 dark:bg-white/[0.03] px-6 py-10 text-center ${className}`}>
      {icon && (
        <span className="w-14 h-14 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center flex-shrink-0" aria-hidden="true">
          <IonIcon name={icon} size={28} className="text-indigo-500/60 dark:text-indigo-400/70" />
        </span>
      )}
      <div className="max-w-[32ch]">
        {title && <p className="text-base font-semibold text-gray-900 dark:text-white">{title}</p>}
        {description && <p className="mt-1.5 text-sm leading-relaxed text-gray-500 dark:text-[#9A9DAE]">{description}</p>}
      </div>
      {action}
    </div>
  );
}