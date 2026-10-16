import React from "react";
import { Search, X } from "lucide-react";

/**
 * The one way a long list is searched: a field that takes whatever width it is
 * given, with the cross that empties it inside the field itself.
 *
 * It is always on the screen — it sits on one row beside the calendar button that
 * narrows the same list by date, above the list it searches — so the two filters
 * read as one row of controls rather than as something hidden behind an icon.
 *
 * The field is the sheet's own 52px pill (src/components/modals/shot/sheetUi.js)
 * so every field in the app is the same shape, and 16px text so iOS never zooms
 * in when it is tapped.
 */
export default function ListSearchBar({ value, onChange, placeholder, ariaLabel }) {
  return (
    <div className="relative flex-1 min-w-0">
      <Search
        size={16}
        aria-hidden="true"
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel || placeholder}
        className="w-full h-[52px] rounded-full border border-gray-200 bg-white pl-10 pr-11 text-[16px] text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-indigo-300 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-[#E8E9F0] dark:placeholder:text-gray-500"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full text-gray-400 active:opacity-70"
        >
          <X size={18} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}