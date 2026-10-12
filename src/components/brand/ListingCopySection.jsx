import React from "react";
import CopyRow from "@/components/brand/CopyRow";
import { LISTING_COPY } from "@/lib/storeAssets";

/** The listing, ready to paste into App Store Connect. */
export default function ListingCopySection() {
  return (
    <div className="space-y-3">
      {LISTING_COPY.map((row) => (
        <CopyRow key={row.label} {...row} />
      ))}
      <p className="text-xs text-muted-foreground">
        Copy is written to be read by someone deciding whether to download, and honest about what the app does:
        it is a logbook, and it never gives medical advice.
      </p>
    </div>
  );
}