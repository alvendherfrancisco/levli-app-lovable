import React from "react";
import { Download } from "lucide-react";
import { toast } from "@/lib/toast";
import { downloadReleasePack } from "@/lib/storeDownload";
import { ICON_FILES, SHOT_PLAN, LISTING_GROUPS, CONNECT_FORMS, RELEASE_CHECKLIST } from "@/lib/storeAssets";

const counts = [
  { label: "Icon exports", value: ICON_FILES.length },
  { label: "Shots planned", value: SHOT_PLAN.length },
  { label: "Listing fields", value: LISTING_GROUPS.reduce((n, g) => n + g.fields.length, 0) },
  { label: "Connect answers", value: CONNECT_FORMS.reduce((n, f) => n + f.rows.length, 0) },
  { label: "Checklist items", value: RELEASE_CHECKLIST.length },
];

/** The pack: everything on this page as one downloadable file. */
export default function ReleasePackCard({ appVersion }) {
  const handleDownload = () => {
    downloadReleasePack({ appVersion });
    toast.success("Release pack downloaded");
  };

  return (
    <div className="px-4 mb-6">
      <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4 dark:border-indigo-500/25 dark:bg-indigo-500/10">
        <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">The whole release pack, in one file</p>
        <p className="mt-1 text-xs leading-relaxed text-indigo-900/80 dark:text-indigo-200">
          The icon files, the screenshot plan, every listing field with its character count, the Connect answers and the
          checklist, ready to hand round the team.
        </p>
        <button type="button" onClick={handleDownload} className="btn-pill btn-primary mt-3 w-full">
          <Download size={16} aria-hidden="true" /> Download the release pack
        </button>
        <ul className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-3">
          {counts.map((item) => (
            <li key={item.label}>
              <span className="block text-lg font-bold text-indigo-900 dark:text-indigo-100">{item.value}</span>
              <span className="block text-[11px] uppercase text-indigo-900/70 dark:text-indigo-300">{item.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}