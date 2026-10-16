import React from "react";
import { Check } from "lucide-react";

/**
 * A small "Saved" beside a card's heading, for the couple of seconds after a
 * field on that card has been written. It is what takes the place of a Save
 * button: every field on the Profile screen saves itself, and this says it
 * landed.
 */
export default function SavedFlag({ show }) {
  if (!show) return null;
  return (
    <span className="flex items-center gap-1 text-xs font-medium text-teal-600 dark:text-teal-400">
      <Check size={14} aria-hidden="true" /> Saved
    </span>
  );
}