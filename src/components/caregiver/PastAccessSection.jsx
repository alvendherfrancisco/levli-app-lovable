import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import AccessEntry from "@/components/caregiver/AccessEntry";
import { CARD_DIVIDED, SECTION_LABEL } from "@/lib/cardStyles";

/**
 * Access that has ended, folded away until it is asked for: the count and a
 * chevron on the row, and — once it is open — each address with how it ended and
 * when. Nothing here can be acted on, so the list is only ever read.
 */
export default function PastAccessSection({ entries = [] }) {
  const [open, setOpen] = useState(false);

  if (entries.length === 0) return null;

  return (
    <section className="mb-4 px-4">
      <button
        type="button"
        onClick={() => setOpen((was) => !was)}
        aria-expanded={open}
        className={`flex w-full items-center justify-between gap-2 py-2 ${SECTION_LABEL}`}
      >
        <span>Past access ({entries.length})</span>
        <ChevronDown size={16} aria-hidden="true" className={open ? "" : "-rotate-90"} />
      </button>

      {open && (
        <div className={`${CARD_DIVIDED} px-4`}>
          {entries.map((entry) => (
            <AccessEntry key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </section>
  );
}