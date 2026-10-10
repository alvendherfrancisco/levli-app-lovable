import React from "react";
import { SHEET_LABEL_ROW, SHEET_LABEL_TEXT } from "@/components/modals/shot/sheetUi";

/**
 * One labelled part of the sheet: the label, then its field, 8px below it.
 *
 * Every label in the sheet is this one label — the same size, the same weight,
 * the same colour — and anything that sits level with it on the right (a unit, a
 * value) is passed in as `trailing`. A field with no label of its own passes
 * none and gets the field alone.
 */
export default function SheetField({ label, htmlFor, trailing, className = "", children }) {
  return (
    <div className={className}>
      {label && (
        <div className={SHEET_LABEL_ROW}>
          <label htmlFor={htmlFor} className={SHEET_LABEL_TEXT}>{label}</label>
          {trailing}
        </div>
      )}
      {children}
    </div>
  );
}