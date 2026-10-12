import React from "react";
import { SECTIONS } from "@/lib/storeAssets";

/** The pills that jump to each part of the page. One bar, always in reach. */
export default function SectionNav() {
  return (
    <nav className="sticky top-0 z-20 -mx-4 border-b border-cardline bg-background px-4 py-3">
      <div className="no-scrollbar mx-auto flex max-w-5xl gap-2 overflow-x-auto">
        {SECTIONS.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className="shrink-0 rounded-full border border-cardline px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {section.label}
          </a>
        ))}
      </div>
    </nav>
  );
}