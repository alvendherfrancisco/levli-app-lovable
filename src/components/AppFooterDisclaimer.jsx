import React from "react";
import { Link } from "react-router-dom";
import { DISCLAIMER_TEXT } from "@/lib/appInfo";

/** The one disclaimer, shown identically wherever it appears. */
export default function AppFooterDisclaimer({ className = "" }) {
  return (
    <div className={`px-4 pt-2 pb-6 text-center ${className}`}>
      <p className="text-xs text-gray-500 dark:text-[#9A9DAE] leading-relaxed max-w-md mx-auto">{DISCLAIMER_TEXT}</p>
      <div className="flex items-center justify-center gap-x-3 gap-y-1 mt-2 flex-wrap text-xs">
        <Link to="/medical-disclaimer" className="text-indigo-600 dark:text-indigo-400 underline">Medical disclaimer</Link>
        <Link to="/about-sources" className="text-indigo-600 dark:text-indigo-400 underline">About &amp; sources</Link>
        <Link to="/privacy" className="text-indigo-600 dark:text-indigo-400 underline">Privacy</Link>
      </div>
    </div>
  );
}