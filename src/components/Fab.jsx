import React from "react";
import { Plus } from "lucide-react";

/**
 * The floating action button: the app's main action on a screen, in the shared
 * primary pill (see src/lib/buttonStyles.js) — the same radius, height and fill
 * as every other primary button. It floats over the content, so it keeps the soft
 * shadow the app's Save buttons are flat without.
 *
 * A caller may leave the icon out (`icon={null}`) for a button that is only a
 * label, and add classes of its own for that screen — Home's is compact, flat and
 * sits clear of the tab bar (see .btn-fab-home in index.css).
 */
export default function Fab({ onClick, label, icon: Icon = Plus, className = "" }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`btn-pill btn-primary btn-fab fixed bottom-fab-safe right-5 lg:right-8 z-30 px-6 text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${className}`}
    >
      {Icon && <Icon size={18} aria-hidden="true" />} {label}
    </button>
  );
}