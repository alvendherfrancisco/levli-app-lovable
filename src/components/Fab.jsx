import React from "react";
import { Plus } from "lucide-react";

/**
 * The one floating action on a screen: a small pill, about 48px tall, sitting
 * clear of the tab bar and of the bottom safe area. PageContainer's "fab"
 * inset reserves the room below it, so the last card always scrolls clear of
 * both the button and the tab bar.
 */
export default function Fab({ onClick, label, icon: Icon = Plus }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="bottom-fab-safe fixed right-5 z-30 flex min-h-[48px] items-center gap-2 rounded-full bg-indigo-600 px-4 py-3 text-[15px] font-medium text-white shadow-lg shadow-indigo-600/25 transition-colors hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 lg:right-8"
    >
      <Icon size={18} strokeWidth={2} aria-hidden="true" /> {label}
    </button>
  );
}