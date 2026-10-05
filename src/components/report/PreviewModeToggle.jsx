import React from "react";
import { Smartphone, FileText } from "lucide-react";

/**
 * Switches the preview between the app's own theme and exactly what the
 * exported PDF will look like.
 */
export default function PreviewModeToggle({ mode, onChange }) {
  const options = [
    { id: "app", label: "App theme", Icon: Smartphone },
    { id: "pdf", label: "PDF look", Icon: FileText },
  ];

  return (
    <div
      className="flex items-center gap-1 p-1 rounded-xl bg-gray-100 dark:bg-white/[0.06] border border-gray-200 dark:border-white/10"
      role="group"
      aria-label="Preview style"
    >
      <span className="pl-2 pr-1 text-sm text-gray-500 dark:text-gray-400">Preview:</span>
      {options.map(({ id, label, Icon }) => {
        const active = mode === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            aria-pressed={active}
            className={`flex-1 min-w-0 min-h-[40px] px-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors ${
              active
                ? "bg-white dark:bg-white/[0.14] text-indigo-600 dark:text-indigo-300 shadow-sm"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            <Icon size={15} aria-hidden="true" />
            {label}
          </button>
        );
      })}
    </div>
  );
}