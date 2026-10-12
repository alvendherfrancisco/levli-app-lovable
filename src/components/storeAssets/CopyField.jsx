import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "@/lib/toast";
import { copyText } from "@/lib/storeDownload";

/**
 * One listing field: its label, Apple's character count, the value, and a button
 * that puts the value on the clipboard ready to paste into App Store Connect.
 */
export default function CopyField({ field }) {
  const [copied, setCopied] = useState(false);
  const count = Array.from(field.value).length;
  const over = field.limit != null && count > field.limit;

  const handleCopy = async () => {
    const ok = await copyText(field.value);
    if (!ok) {
      toast.error("Couldn't copy. Select the text instead.");
      return;
    }
    setCopied(true);
    toast.success(`${field.label} copied`);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="py-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-gray-900 dark:text-[#E8E9F0]">{field.label}</span>
        <span className="flex items-center gap-2">
          {field.limit != null && (
            <span className={`text-xs ${over ? "text-red-500" : "text-gray-400 dark:text-gray-500"}`}>
              {count}/{field.limit}
            </span>
          )}
          <button
            type="button"
            onClick={handleCopy}
            className="btn-pill btn-pill-sm btn-secondary"
          >
            {copied ? <Check size={13} aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </span>
      </div>
      {field.rows ? (
        <pre className="mt-2 max-h-72 overflow-y-auto whitespace-pre-wrap break-words rounded-2xl border border-gray-100 bg-gray-50 px-3 py-2.5 font-body text-[13px] leading-relaxed text-gray-700 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-[#C9CCDA]">
          {field.value}
        </pre>
      ) : (
        <p className="mt-1 break-words text-[13px] leading-relaxed text-gray-600 dark:text-[#9A9DAE]">{field.value}</p>
      )}
      {field.hint && <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{field.hint}</p>}
    </div>
  );
}