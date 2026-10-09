import React from "react";
import { Link } from "react-router-dom";

/**
 * The one footer, shown identically at the end of every screen: one short line
 * of what Levli is, then the three public pages as plain indigo text. Small and
 * centred, so it stays clear of the tab bar and the floating button.
 */
export default function AppFooterDisclaimer({ className = "" }) {
  return (
    <div className={`px-5 pt-4 pb-2 text-center ${className}`}>
      <p className="text-[13px] text-gray-400 dark:text-[#9A9DAE]">Levli is a logbook, not medical advice.</p>
      <div className="mt-1.5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[13px] text-indigo-600 dark:text-indigo-400">
        <Link to="/medical-disclaimer" className="hover:underline">Disclaimer</Link>
        <span aria-hidden="true" className="text-gray-300 dark:text-white/25">·</span>
        <Link to="/about-sources" className="hover:underline">Sources</Link>
        <span aria-hidden="true" className="text-gray-300 dark:text-white/25">·</span>
        <Link to="/privacy" className="hover:underline">Privacy</Link>
      </div>
    </div>
  );
}