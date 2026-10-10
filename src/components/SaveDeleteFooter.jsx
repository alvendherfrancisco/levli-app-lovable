import React, { useState } from "react";
import { Trash2 } from "lucide-react";
import ConfirmDialog from "@/components/ConfirmDialog";

/**
 * The footer of an edit sheet: the update button, and — while a saved entry is
 * in front of you — the way to remove it, in red, alongside.
 *
 * The two pills sit side by side with a 12px gap and the same height: Delete on
 * the left, about 35% of the width, and the update button taking the rest. A
 * sheet whose footer also carries a Cancel gives the three buttons an equal
 * share instead. The Delete pill is never dimmed, unlike the update button,
 * which stays faded until something has changed.
 *
 * Nothing is removed on the first tap: the question is asked in the app's own
 * dialog, and only its answer deletes. Both the pill and the dialog are marked
 * `data-skip-dirty`, so opening and cancelling the question never counts as an
 * edit to the sheet behind it.
 */
export default function SaveDeleteFooter({
  saveLabel, onSave, saveDisabled = false, saveBusy = false, saveIcon = null,
  cancelLabel, onCancel, small = false,
  onDelete, deleteLabel = "Delete", deleteTitle, deleteMessage = "This can't be undone.",
  deleteAriaLabel,
}) {
  const [asking, setAsking] = useState(false);
  const removable = typeof onDelete === "function";
  // One pill shape at either size, so every button in the row is the same height.
  const pill = small ? "btn-pill btn-pill-sm" : "btn-pill";

  const handleConfirm = async () => {
    await onDelete?.();
    setAsking(false);
  };

  return (
    <>
      <div className="flex items-center gap-3">
        {removable && (
          <div data-skip-dirty className={cancelLabel ? "flex-1 min-w-0" : "w-[35%] shrink-0"}>
            <button
              type="button"
              onClick={() => setAsking(true)}
              // The word is always announced here, even when the pill is too
              // narrow to draw it.
              aria-label={deleteAriaLabel || deleteLabel}
              className={`${pill} btn-danger btn-foot-delete w-full`}
            >
              <Trash2 size={small ? 16 : 18} aria-hidden="true" />
              <span className="btn-foot-delete-label min-w-0 truncate">{deleteLabel}</span>
            </button>
          </div>
        )}

        {cancelLabel && (
          <div className="flex-1 min-w-0">
            <button
              type="button"
              onClick={onCancel}
              className={`${pill} w-full bg-gray-100 dark:bg-white/[0.07] text-gray-500 dark:text-[#9A9DAE] border border-gray-200 dark:border-white/[0.08]`}
            >
              {cancelLabel}
            </button>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <button
            type="button"
            onClick={onSave}
            disabled={saveDisabled}
            aria-disabled={saveDisabled || undefined}
            className={`${pill} btn-primary w-full`}
          >
            {saveIcon}
            {saveBusy ? "Saving…" : saveLabel}
          </button>
        </div>
      </div>

      {removable && (
        <div data-skip-dirty>
          <ConfirmDialog
            open={asking}
            tone="destructive"
            title={deleteTitle}
            message={deleteMessage}
            confirmLabel={deleteLabel}
            cancelLabel="Cancel"
            onCancel={() => setAsking(false)}
            onConfirm={handleConfirm}
          />
        </div>
      )}
    </>
  );
}