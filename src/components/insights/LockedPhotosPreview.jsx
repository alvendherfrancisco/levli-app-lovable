import React from "react";

/**
 * What the Progress Pictures card's locked block draws instead of the thumbnails:
 * four empty tiles at the strip's own size, each with its date lines under it.
 *
 * No photo is loaded and none is drawn — the tiles are a soft gradient shape, so
 * nothing of the person's own pictures can be read through the blur, on screen or
 * through an accessibility tool, and the card stands the height the real strip
 * does.
 */
export default function LockedPhotosPreview() {
  return (
    <div className="flex gap-2.5 overflow-hidden pb-1">
      {[0, 1, 2, 3].map((index) => (
        <div key={index} className="flex w-20 flex-shrink-0 flex-col items-center sm:w-[140px]">
          <span className="block aspect-square w-full rounded-xl border border-cardline bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-white/[0.10] dark:to-white/[0.03]" />
          <span className="mt-1.5 h-3 w-14 rounded-full bg-gray-200 dark:bg-white/10" />
          <span className="mt-1 h-2.5 w-9 rounded-full bg-gray-100 dark:bg-white/[0.08]" />
        </div>
      ))}
    </div>
  );
}