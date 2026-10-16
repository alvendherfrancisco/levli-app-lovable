import React, { useEffect, useRef } from "react";
import { Search, X } from "lucide-react";

/**
 * The Journal's search, opened from the header's search icon and closed again by
 * its own cross: while it is open it takes the place of the category row, so the
 * list is never pushed further down by a field nobody is using.
 */
export default function JournalSearchBar({ value, onChange, onClose }) {
  const fieldRef = useRef(null);

  // The field is ready to be typed into the moment it appears.
  useEffect(() => { fieldRef.current?.focus(); }, []);

  return (
    <div className="px-4 pt-4 pb-3 flex items-center gap-2">
      <div className="relative flex-1 min-w-0">
        <Search size={16} aria-hidden="true" className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          ref={fieldRef}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search your entries"
          aria-label="Search journal entries"
          className="w-full h-[52px] rounded-full border border-gray-200 bg-white pl-10 pr-4 text-[16px] text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-indigo-300 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-[#E8E9F0] dark:placeholder:text-gray-500"
        />
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close search"
        className="w-11 h-11 flex shrink-0 items-center justify-center rounded-full text-gray-500 dark:text-gray-400"
      >
        <X size={20} />
      </button>
    </div>
  );
}