import React from "react";
import { Check, X } from "lucide-react";
import { NAME_RULES } from "@/lib/storeAssets";

/** How the name is written, and the shapes it never takes. */
export default function NameSection() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-2xl border border-cardline bg-white p-5 dark:bg-[#0f1117]">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-500/15 text-teal-600 dark:text-teal-400">
            <Check size={14} strokeWidth={3} />
          </span>
          <p className="text-sm font-semibold">{NAME_RULES.do.title}</p>
        </div>
        <p className="mt-4 font-heading text-3xl font-extrabold tracking-tight">{NAME_RULES.do.line}</p>
        <p className="mt-2 text-sm text-muted-foreground">{NAME_RULES.do.note}</p>
      </div>

      <div className="rounded-2xl border border-cardline bg-white p-5 dark:bg-[#0f1117]">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500/15 text-red-600 dark:text-red-400">
            <X size={14} strokeWidth={3} />
          </span>
          <p className="text-sm font-semibold">{NAME_RULES.dont.title}</p>
        </div>
        <p className="mt-4 font-heading text-3xl font-extrabold tracking-tight text-muted-foreground">
          <span className="line-through decoration-red-400/70">{NAME_RULES.dont.line}</span>
        </p>
        <p className="mt-2 text-sm text-muted-foreground">{NAME_RULES.dont.note}</p>
      </div>
    </div>
  );
}