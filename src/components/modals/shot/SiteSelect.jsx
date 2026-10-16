import React, { useId, useState } from "react";
import { createPortal } from "react-dom";
import { Check, X } from "lucide-react";
import { sound } from "@/lib/sounds";
import useModal from "@/hooks/useModal";
import SheetField from "@/components/modals/shot/SheetField";
import SheetPickerRow from "@/components/modals/shot/SheetPickerRow";
import { SITE_VIEWS, siteKey, siteLabel, siteViewLabel } from "@/lib/injectionSites";

/** The small grey word a suggested site carries. */
const SuggestedTag = () => (
  <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-500 dark:bg-white/[0.06] dark:text-gray-400">
    Suggested
  </span>
);

/** One site in the menu: the tick, the name, and "Suggested" on the site the
 *  rotation points at. */
function SiteRow({ site, label, selected, suggested, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(site)}
      aria-pressed={selected}
      className={`flex w-full min-h-[52px] items-center gap-2 border-b border-gray-100 px-4 py-2.5 text-left transition-colors last:border-b-0 dark:border-white/[0.06] ${
        selected ? "bg-indigo-50 dark:bg-indigo-500/15" : "hover:bg-gray-50 dark:hover:bg-white/[0.05]"
      }`}
    >
      {/* The tick keeps its own slot, so every name starts at the same place. */}
      <span className="flex w-4 shrink-0 justify-center" aria-hidden="true">
        {selected && <Check size={16} strokeWidth={3} className="text-indigo-600 dark:text-indigo-400" />}
      </span>
      <span className={`min-w-0 flex-1 text-sm leading-snug ${
        selected ? "text-indigo-700 dark:text-indigo-300" : "text-gray-900 dark:text-[#E8E9F0]"
      }`}>{label}</span>
      {suggested && <SuggestedTag />}
    </button>
  );
}

/**
 * Choose the injection site: one field in the sheet showing the site in hand with
 * its side and its figure — "Thigh, right (Front)" — that opens a menu of every
 * site the app knows, under the small headings Front and Back. The site in the
 * log is ticked, so editing opens with its own site already chosen, and the site
 * the rotation suggests carries the "Suggested" word.
 *
 * The menu is drawn through a portal, straight onto the page, rather than inside
 * the sheet that opened it — the same reason the medication picker is: the sheet
 * scrolls its own body and holds its Delete and Save buttons at the foot of it,
 * and a list rendered inside that body would be cut off by them. On the page
 * itself the menu scrolls inside its own bounds and ends where it should.
 *
 * Opening the menu changes nothing; the choice is what marks the log as edited.
 */
export default function SiteSelect({ sites, value, suggested = "", onChange }) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const headingId = useId();
  // Its own sheet behaviour: Escape, the back button and a focus trap belong to
  // the topmost layer, so this menu closes before the log behind it does.
  const sheetRef = useModal({ open, onDismiss: () => setOpen(false) });

  const selected = siteKey(value);
  const suggestedKey = siteKey(suggested);
  const viewLabel = siteViewLabel(value);
  const display = value ? `${siteLabel(value)}${viewLabel ? ` (${viewLabel})` : ""}` : "";

  const groups = SITE_VIEWS
    .map((v) => ({ ...v, sites: sites.filter((s) => s.view === v.key) }))
    .filter((g) => g.sites.length);
  const headingClass = "px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500";

  const choose = (next) => {
    sound.tap();
    onChange(next);
    setOpen(false);
  };

  return (
    <SheetField label="Injection site">
      {/* The row itself changes nothing, so a tap on it does not mark the log as
          edited. */}
      <div data-skip-dirty>
        <SheetPickerRow
          value={display}
          tappable
          onClick={() => setOpen(true)}
          ariaExpanded={open}
          ariaLabel="Injection site"
          tag={!!suggestedKey && selected === suggestedKey ? <SuggestedTag /> : null}
        />
      </div>

      {open && createPortal(
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 overlay-lock" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            className="relative flex flex-col w-full sm:max-w-[520px] max-h-[88dvh] overflow-hidden sheet-lock bg-white dark:bg-[#0f1117] rounded-t-3xl sm:rounded-3xl animate-in slide-in-from-bottom sm:mx-4 dark:shadow-[0_-8px_40px_rgba(0,0,0,0.5)] outline-none"
          >
            <div className="shrink-0 bg-white dark:bg-[#0f1117]">
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-white/20" />
              </div>
              <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-1">
                <h2 id={titleId} className="min-w-0 break-words text-[20px] font-semibold leading-tight text-gray-900 dark:text-[#E8E9F0]">
                  Injection site
                </h2>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center"
                >
                  <X size={22} className="text-gray-400" />
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain no-scrollbar">
              {groups.map((g) => {
                const id = `${headingId}-${g.key}`;
                return (
                  <div key={g.key} role="group" aria-labelledby={id}>
                    <p id={id} className={headingClass}>{g.label}</p>
                    {g.sites.map((s) => (
                      <SiteRow
                        key={s.value}
                        site={s.value}
                        label={s.label}
                        selected={s.id === selected}
                        suggested={!!suggestedKey && s.value === suggestedKey}
                        onSelect={choose}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </SheetField>
  );
}