import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

/**
 * One row in a settings card: icon, label, optional hint and a chevron.
 * Renders as a link, an external link or a button depending on what it does.
 */
export default function SettingsRow({ icon, label, hint, onPress, href, to, danger }) {
  const inner = (
    <div className="flex items-center justify-between py-3.5 w-full min-h-[44px]">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">{icon}</div>
        <span className={`text-sm ${danger ? "text-red-600 dark:text-red-400 font-medium" : "text-gray-700 dark:text-gray-300"}`}>
          {label}
          {hint && <span className="block text-xs text-gray-500 dark:text-[#9A9DAE]">{hint}</span>}
        </span>
      </div>
      <ChevronRight size={16} className="text-gray-400 dark:text-gray-500 flex-shrink-0" aria-hidden="true" />
    </div>
  );
  if (to) return <Link to={to}>{inner}</Link>;
  if (href) return <a href={href} target="_blank" rel="noopener noreferrer">{inner}</a>;
  if (onPress) return <button onClick={onPress} className="w-full text-left">{inner}</button>;
  return inner;
}