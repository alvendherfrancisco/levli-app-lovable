import React from "react";
import { ChevronDown } from "lucide-react";
import { SHEET_FIELD } from "@/components/modals/shot/sheetUi";

/**
 * One row of the sheet that opens a picker: what is chosen on the left, the
 * chevron on the right, and the whole row is the tap target.
 *
 * A row with nothing to choose from is not a control at all: it is drawn as the
 * same field with its value in plain text and no chevron, so it never invites a
 * tap that would lead nowhere. `tag` is the small grey word a row may carry
 * before the chevron (the injection site's "Suggested").
 */
export default function SheetPickerRow({
  value, placeholder = "Select", tag, tappable = false,
  onClick, ariaExpanded, ariaLabel,
}) {
  const body = (
    <>
      <span className={`min-w-0 truncate ${value ? "" : "text-gray-400 dark:text-gray-500"}`}>
        {value || placeholder}
      </span>
      <span className="flex shrink-0 items-center gap-2">
        {tag}
        {tappable && <ChevronDown size={18} aria-hidden="true" className="text-gray-400" />}
      </span>
    </>
  );

  const rowClass = `${SHEET_FIELD} flex items-center justify-between gap-3 text-left`;

  if (!tappable) return <div className={rowClass}>{body}</div>;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={ariaExpanded}
      aria-label={ariaLabel}
      className={rowClass}
    >
      {body}
    </button>
  );
}