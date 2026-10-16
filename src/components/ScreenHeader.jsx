import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

/** The sticky back-bar every full-screen settings sub-page uses. */
export default function ScreenHeader({ title, subtitle }) {
  const navigate = useNavigate();
  return (
    <div className="w-full flex items-start gap-3 px-5 pt-6 pb-4 bg-white dark:bg-gray-950 sticky top-0 z-30">
      {/* The back button is a 44px target that adds no height of its own
          (-my-1.5), pulled back to the row's own left edge (-ml-2.5) so the glyph
          sits exactly where it always has. With items-start it lines up with the
          title rather than with the middle of the title-and-subtitle block. */}
      <button
        onClick={() => navigate(-1)}
        aria-label="Go back"
        className="-my-1.5 -ml-2.5 flex h-11 w-11 flex-shrink-0 items-center justify-center"
      >
        <ChevronLeft size={24} className="text-gray-600 dark:text-gray-400" />
      </button>
      <div className="min-w-0">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
        {subtitle && <p className="text-xs text-gray-500 dark:text-[#9A9DAE] mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}