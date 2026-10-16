import React from "react";
import { X } from "lucide-react";
import useModal from "@/hooks/useModal";
import { siteDisplayName } from "@/lib/injectionSites";
import { FOOTNOTE } from "@/components/insights/insightUi";

/**
 * The dose entries logged at one site — what the rotation card opens when a site
 * is tapped, its dot on the body or its row in the list. A short read-only list
 * of the entries in the range the card is showing, newest first.
 */
export default function SiteEntriesSheet({ open, site, entries, onClose }) {
  const sheetRef = useModal({ open, onDismiss: onClose });

  if (!open) return null;

  const name = siteDisplayName(site);

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center px-6">
      <div className="absolute inset-0 bg-black/40 overlay-lock" onClick={onClose} aria-hidden="true" />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Dose entries at ${name}`}
        tabIndex={-1}
        className="relative w-full max-w-lg rounded-t-3xl bg-white dark:bg-[#0f1117] max-h-[80dvh] overflow-y-auto overflow-x-hidden no-scrollbar sheet-lock animate-in slide-in-from-bottom outline-none border border-transparent dark:border-white/[0.07] dark:shadow-[0_-8px_40px_rgba(0,0,0,0.5)]"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 bg-white px-5 pt-5 pb-4 dark:bg-[#0f1117]">
          <div className="min-w-0">
            <h2 className="truncate text-xl font-bold text-gray-900 dark:text-[#E8E9F0]">{name}</h2>
            <p className={`mt-0.5 ${FOOTNOTE}`}>
              {entries.length} {entries.length === 1 ? "dose" : "doses"} logged
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full"
          >
            <X size={22} className="text-gray-400" />
          </button>
        </div>

        <ul className="px-5" style={{ paddingBottom: "calc(20px + env(safe-area-inset-bottom, 0px))" }}>
          {entries.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between gap-3 border-t border-gray-100 py-3 first:border-t-0 dark:border-white/[0.06]"
            >
              <div className="min-w-0">
                <p className="truncate text-sm text-gray-900 dark:text-[#E8E9F0]">{s.medication}</p>
                <p className={`mt-0.5 ${FOOTNOTE}`}>
                  {s.date}
                  {s.time ? ` · ${s.time}` : ""}
                </p>
              </div>
              {s.dose != null && (
                <span className="flex-shrink-0 text-sm font-medium text-gray-700 dark:text-[#E8E9F0]">
                  {s.dose} {s.dose_unit || "mg"}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}