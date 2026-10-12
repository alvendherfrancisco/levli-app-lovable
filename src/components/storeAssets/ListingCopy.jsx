import React from "react";
import CopyField from "@/components/storeAssets/CopyField";
import { LISTING_GROUPS } from "@/lib/storeAssets";

/** Every listing field, grouped, with its character count and a copy button. */
export default function ListingCopy() {
  return (
    <div>
      {LISTING_GROUPS.map((group) => (
        <div key={group.title} className="mb-5 last:mb-0">
          <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">{group.title}</p>
          <div className="divide-y divide-gray-100 dark:divide-white/[0.07]">
            {group.fields.map((field) => <CopyField key={field.key} field={field} />)}
          </div>
        </div>
      ))}
    </div>
  );
}