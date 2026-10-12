import React from "react";
import { CONNECT_FORMS } from "@/lib/storeAssets";

/** The App Store Connect answers, form by form. */
export default function ConnectForms() {
  return (
    <div>
      {CONNECT_FORMS.map((form) => (
        <div key={form.title} className="mb-5 last:mb-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-[#E8E9F0]">{form.title}</p>
          {form.intro && <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{form.intro}</p>}
          <dl className="mt-2 space-y-2">
            {form.rows.map((row) => (
              <div key={row.label} className="rounded-2xl border border-gray-100 px-3 py-2.5 dark:border-white/[0.08]">
                <dt className="flex items-start justify-between gap-2">
                  <span className="text-xs font-medium text-gray-900 dark:text-[#E8E9F0]">{row.label}</span>
                  {row.open && (
                    <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                      Only the team
                    </span>
                  )}
                </dt>
                <dd className={`mt-1 text-[13px] leading-relaxed ${row.open ? "font-medium text-amber-700 dark:text-amber-300" : "text-gray-600 dark:text-[#9A9DAE]"}`}>
                  {row.value}
                </dd>
                {row.note && <dd className="mt-1 text-xs leading-relaxed text-gray-400 dark:text-gray-500">{row.note}</dd>}
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}