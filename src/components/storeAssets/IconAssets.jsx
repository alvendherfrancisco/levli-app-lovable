import React from "react";
import { Download } from "lucide-react";
import { APP_STORE_ICON, ICON_FILES } from "@/lib/storeAssets";

/**
 * The icon block: the store file shown as the square it is, beside the way iOS
 * rounds it, then every brand export as a download.
 */
export default function IconAssets() {
  return (
    <div>
      <div className="flex items-start gap-4">
        <div className="shrink-0">
          <img
            src={APP_STORE_ICON.path}
            alt="Levli app icon, square, as uploaded to App Store Connect"
            width={96}
            height={96}
            className="h-24 w-24 rounded-xl border border-gray-100 dark:border-white/[0.08]"
          />
          <p className="mt-1 text-center text-[11px] text-gray-400 dark:text-gray-500">The file</p>
        </div>
        <div className="shrink-0">
          <img
            src={APP_STORE_ICON.path}
            alt="The same icon with the rounded corners iOS applies"
            width={96}
            height={96}
            className="h-24 w-24 rounded-[22px]"
          />
          <p className="mt-1 text-center text-[11px] text-gray-400 dark:text-gray-500">On iPhone</p>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900 dark:text-[#E8E9F0]">{APP_STORE_ICON.size}, PNG</p>
          <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-[#9A9DAE]">{APP_STORE_ICON.verified}</p>
        </div>
      </div>

      <a
        href={APP_STORE_ICON.path}
        download={APP_STORE_ICON.filename}
        className="btn-pill btn-primary mt-4 w-full"
      >
        <Download size={16} aria-hidden="true" /> Download the App Store icon
      </a>

      <p className="mt-5 mb-2 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
        The rest of the brand icon set
      </p>
      <ul className="divide-y divide-gray-100 dark:divide-white/[0.07]">
        {ICON_FILES.map((file) => (
          <li key={file.path} className="flex items-center justify-between gap-3 py-2.5">
            <span className="min-w-0">
              <span className="block truncate text-sm text-gray-800 dark:text-[#E8E9F0]">{file.label}</span>
              <span className="block text-xs text-gray-400 dark:text-gray-500">{file.size} · {file.note}</span>
            </span>
            <a
              href={file.path}
              download
              aria-label={`Download ${file.label}`}
              className="btn-pill btn-pill-sm btn-secondary shrink-0"
            >
              <Download size={13} aria-hidden="true" /> Get
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}