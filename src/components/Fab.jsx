import React from "react";
import { Plus } from "lucide-react";

/**
 * The floating action button: the app's main action on a screen, in the shared
 * primary pill (see src/lib/buttonStyles.js) — the same radius, fill and label
 * as every other primary button. It floats over the content, so it keeps the soft
 * shadow the app's Save buttons are flat without.
 *
 * One button, one position: `.btn-fab-add` (src/index.css) gives it its height
 * (the FAB token) and its distance from the tab bar and the right edge, so the
 * action sits identically on every screen. It never sits on the tab bar, and the
 * pages that carry it reserve its room at the foot of the content (the PageContainer
 * insets), so it never covers the disclaimer either.
 *
 * A caller may leave the icon out (`icon={null}`) for a button that is only a
 * label, and add classes of its own for that screen.
 */
export default function Fab({ onClick, label, icon: Icon = Plus, className = "" }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`btn-pill btn-primary btn-fab btn-fab-add fixed bottom-fab-safe right-5 lg:right-8 z-30 px-6 text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${className}`}
    >
      {Icon && <Icon size={18} aria-hidden="true" />} {label}
    </button>
  );
}