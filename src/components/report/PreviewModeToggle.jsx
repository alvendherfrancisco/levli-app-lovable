import React from "react";
import { FileText, Smartphone } from "lucide-react";

/**
 * Switches the preview between exactly what the exported PDF looks like — the
 * default, because the PDF is what gets shared — and the app's own theme.
 */
export default function PreviewModeToggle({ mode, onChange }) {
  const options = [
    { id: "pdf", label: "PDF", Icon: FileText },
    { id: "app", label: "On screen", Icon: Smartphone },
  ];

  return (
    <div
      className="flex items-center gap-1 p-1 rounded-xl bg-gray-100 dark:bg-white/[0.06] border border-gray-200 dark:border-white/10"
      role="group"
      aria-label="Preview style"
    >
      {options.map(({ id, label, Icon }) => {
        const active = mode === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            aria-pressed={active}
            className={`flex-1 min-w-0 min-h-[40px] px-3 rounded-full text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors ${
              active
                ? "bg-white dark:bg-white/[0.14] text-indigo-600 dark:text-indigo-300 shadow-sm"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            <Icon size={15} className="flex-shrink-0" aria-hidden="true" />
            <span className="whitespace-nowrap">{label}</span>
          </button>
        );
      })}
    </div>
  );
}