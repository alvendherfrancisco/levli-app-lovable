import React from "react";
import { CheckCircle2, ArrowRight, AlertTriangle } from "lucide-react";

// Brief confirmation shown after a shot is saved, with a link into the existing
// side-effect tracking flow and a static red-flag note.
export default function ShotSuccessPanel({ title, detail, onReportSideEffect }) {
  return (
    <div className="px-5 pb-2">
      <div className="flex flex-col items-center text-center pt-2 pb-5">
        <CheckCircle2 size={48} className="text-indigo-500" strokeWidth={1.5} />
        <h3 className="text-lg font-bold text-gray-900 dark:text-[#E8E9F0] mt-3">{title}</h3>
        {detail && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{detail}</p>}
      </div>

      <button
        onClick={onReportSideEffect}
        className="w-full flex items-center justify-between gap-3 rounded-2xl border border-indigo-100 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/10 px-4 py-3.5 text-left"
      >
        <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
          Report a side effect
        </span>
        <ArrowRight size={16} className="text-indigo-500 dark:text-indigo-400 flex-shrink-0" />
      </button>

      <div className="mt-3 flex items-start gap-2 rounded-2xl bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 px-3.5 py-3">
        <AlertTriangle size={16} className="text-orange-500 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-orange-700 dark:text-orange-300 leading-relaxed">
          Seek urgent medical care for severe or persistent abdominal pain, repeated vomiting, or signs of an allergic reaction.
        </p>
      </div>
    </div>
  );
}