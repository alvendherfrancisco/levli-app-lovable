import React, { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { helperCls } from "@/components/medications/formStyles";

/** "Need help?" — opens a short explanation in plain words for the current step. */
export default function StepHelp({ text }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-2 min-h-[56px] text-lg font-semibold text-indigo-700 dark:text-indigo-300 underline"
      >
        <HelpCircle size={22} className="flex-shrink-0" aria-hidden="true" />
        Need help?
        <ChevronDown size={20} className={`flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      {open && <p className={`${helperCls} mt-1 mb-2`}>{text}</p>}
    </div>
  );
}