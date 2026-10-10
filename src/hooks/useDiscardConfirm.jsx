import React, { useState } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";

/**
 * The unsaved-changes guard every form shares.
 *
 * `dirty` is asked at the moment of the close rather than when the sheet
 * opened — pass a function to have it judged as the form is now. Cancel and the
 * close icon stay live: they ask before anything is lost instead of refusing to
 * close. `requestClose` is what the backdrop, the close icon and useModal's
 * onDismiss call, while a completed save still calls the plain onClose, so
 * saving never asks a question.
 */
export default function useDiscardConfirm({
  dirty, onClose,
  title = "Discard changes?",
  message = "You have unsaved changes. Closing now will lose them.",
}) {
  const [asking, setAsking] = useState(false);

  const isDirty = () => (typeof dirty === "function" ? !!dirty() : !!dirty);

  const requestClose = () => {
    if (isDirty()) { setAsking(true); return; }
    onClose();
  };

  const dialog = (
    <ConfirmDialog
      open={asking}
      tone="warning"
      title={title}
      message={message}
      confirmLabel="Discard changes"
      cancelLabel="Keep editing"
      onConfirm={() => { setAsking(false); onClose(); }}
      onCancel={() => setAsking(false)}
    />
  );

  return { requestClose, dialog };
}