import React from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { MORE_ITEMS, NavIcon } from "@/lib/nav";
import useModal from "@/hooks/useModal";

/**
 * The More menu, as a sheet that rises from the bottom tab bar and rests
 * directly on top of it — the More tab no longer opens a page of its own.
 *
 * It lists the same destinations the More screen does (one source of truth, see
 * src/lib/nav.jsx), and tapping one opens that page and closes the sheet.
 *
 * `bottom` is the tab bar's own measured height, so the sheet's bottom edge sits
 * exactly on the bar's top edge on every device, safe area included.
 */
export default function MoreSheet({ open, onClose, bottom }) {
  const sheetRef = useModal({ open, onDismiss: onClose });

  if (!open) return null;

  return (
    <div
      className="fixed inset-x-0 top-0 z-[60] flex items-end justify-center lg:hidden"
      style={{ bottom }}
    >
      <div className="absolute inset-0 bg-black/40 overlay-lock" onClick={onClose} aria-hidden="true" />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label="More"
        tabIndex={-1}
        className="relative w-full max-w-[520px] max-h-[70dvh] overflow-y-auto overflow-x-hidden no-scrollbar sheet-lock bg-white dark:bg-[#0f1117] rounded-t-3xl animate-in slide-in-from-bottom dark:shadow-[0_-8px_40px_rgba(0,0,0,0.5)] outline-none"
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <h2 className="text-xl font-bold text-gray-900 dark:text-[#E8E9F0]">More</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X size={22} />
          </button>
        </div>

        <ul className="px-4 pb-4 space-y-2">
          {MORE_ITEMS.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                onClick={onClose}
                className="flex items-center gap-3 min-h-[52px] px-2 py-2"
              >
                <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-indigo-50 dark:bg-indigo-500/15">
                  <NavIcon item={item} size={18} className="text-indigo-600 dark:text-indigo-400" />
                </span>
                <span className="text-base font-semibold text-gray-900 dark:text-white">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}