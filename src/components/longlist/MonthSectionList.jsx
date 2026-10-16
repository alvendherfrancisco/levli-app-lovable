import React, { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { monthHeading } from "@/lib/monthGroups";

// ─────────────────────────────────────────────────────────────────────────────
// A long list, told in months.
//
// Every list in the app that runs long — shots, journal entries, side effects,
// photos — is the same list: the entries newest first, split into months, each
// month announced by a header that stays at the top of the screen while its own
// entries go by ("October 2026 · 4 entries"), and a tap on that header folds the
// month away.
//
// The card, the row divider and the type are the app's own, so a month here
// looks like every other list in the app. What a row looks like is the caller's:
// it hands in `renderItem`.
//
// `jumpTo` is the month a jump should land on (from the header's month picker).
// The month opens if it was folded, and the screen scrolls to it once it is
// there — the caller keeps feeding pages in until that month has arrived.
// ─────────────────────────────────────────────────────────────────────────────

const HEADER =
  "sticky z-20 flex w-full items-center justify-between gap-2 py-2 " +
  "text-sm font-semibold text-gray-600 dark:text-[#9A9DAE]";

const CARD =
  "bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden " +
  "divide-y divide-gray-100 dark:divide-white/[0.06]";

export default function MonthSectionList({
  groups,
  renderItem,
  countSingular = "entry",
  countPlural = "",
  stickyTopClass = "month-heading",
  headerBgClass = "bg-white dark:bg-gray-950",
  jumpTo = null,
  className = "",
}) {
  // A month with entries in it is open; tapping its header folds it away.
  const [folded, setFolded] = useState({});
  const groupRefs = useRef({});
  const jumpedRef = useRef(null);

  useEffect(() => {
    if (!jumpTo || jumpedRef.current === jumpTo) return;
    const el = groupRefs.current[jumpTo];
    if (!el) return;
    jumpedRef.current = jumpTo;
    setFolded((f) => (f[jumpTo] ? { ...f, [jumpTo]: false } : f));
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [jumpTo, groups]);

  return (
    <div className={className}>
      {groups.map((group) => {
        const isFolded = !!folded[group.key];
        return (
          <div key={group.key} ref={(el) => { groupRefs.current[group.key] = el; }}>
            <button
              type="button"
              onClick={() => setFolded((f) => ({ ...f, [group.key]: !f[group.key] }))}
              aria-expanded={!isFolded}
              className={`${HEADER} ${stickyTopClass} ${headerBgClass}`}
            >
              {/* The month's own name, and how much is inside it only once it
                  is folded away — so an open month adds no numbers to read. */}
              <span>{monthHeading(group.key, isFolded ? group.count : null, countSingular, countPlural)}</span>
              <ChevronDown
                size={16}
                aria-hidden="true"
                className={`shrink-0 transition-transform ${isFolded ? "-rotate-90" : ""}`}
              />
            </button>

            {!isFolded && (
              <div className={`${CARD} mb-5`}>
                {group.items.map((item, index) => (
                  <div key={item.id || `${group.key}-${index}`}>{renderItem(item, index)}</div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}