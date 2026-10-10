import React, { useState } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";

/**
 * The way to remove one of the day's entries, now that the Update sheets carry
 * no delete action of their own.
 *
 * A quiet text link under the entries it belongs to, and nothing happens on the
 * first tap: the entry is only removed once the question has been answered. The
 * touch target stays 44px tall while the words stay small.
 */
export default function EntryDeleteLink({ label, title, message, confirmLabel = "Delete", onDelete }) {
  const [asking, setAsking] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setAsking(true)}
        className="btn-link text-xs"
        // The link's own rule drops min-height, so the 44px touch target the
        // words "Delete entry" still need is set here, where nothing overrides
        // it. The words stay small; only the tap area is full size.
        style={{ minHeight: "44px" }}
      >
        {label}
      </button>
      <ConfirmDialog
        open={asking}
        tone="destructive"
        title={title}
        message={message}
        confirmLabel={confirmLabel}
        cancelLabel="Keep it"
        onCancel={() => setAsking(false)}
        onConfirm={async () => { await onDelete(); setAsking(false); }}
      />
    </>
  );
}