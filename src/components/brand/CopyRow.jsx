import React, { useState } from "react";
import { Check, Copy } from "lucide-react";
import { copyText } from "@/lib/downloadAsset";

/** One line of store copy, with the button that puts it on the clipboard. */
export default function CopyRow({ label, limit, value, multiline }) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    const ok = await copyText(value);
    setCopied(ok);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-cardline bg-white p-4 dark:bg-[#0f1117]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">{label}</p>
          {limit ? <p className="text-xs text-muted-foreground">{limit}</p> : null}
        </div>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400"
        >
          {copied ? <Check size={15} /> : <Copy size={15} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p
        className={`mt-2 whitespace-pre-line text-sm text-foreground ${multiline ? "max-h-72 overflow-y-auto rounded-xl border border-cardline bg-background p-3 no-scrollbar" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}