import React from "react";
import { Plus } from "lucide-react";

export default function Fab({ onClick, label, icon: Icon = Plus }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="fixed bottom-fab-safe right-5 lg:right-8 z-30 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 font-semibold hover:bg-indigo-700 transition-colors text-base min-h-[48px] px-5 py-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
    >
      <Icon size={18} aria-hidden="true" /> {label}
    </button>
  );
}