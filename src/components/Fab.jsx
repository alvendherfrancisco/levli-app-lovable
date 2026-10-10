import React from "react";
import { Plus } from "lucide-react";

/**
 * The floating action button: the app's main action on a screen, in the shared
 * primary pill (see src/lib/buttonStyles.js) — the same radius, height and fill
 * as every other primary button, and the one that keeps the soft indigo shadow:
 * it floats over the content, where the app's Save buttons are flat.
 */
export default function Fab({ onClick, label, icon: Icon = Plus }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="btn-pill btn-primary btn-fab fixed bottom-fab-safe right-5 lg:right-8 z-30 px-6 text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
    >
      <Icon size={18} aria-hidden="true" /> {label}
    </button>
  );
}