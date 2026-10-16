import React from "react";
import { SHEET_CHIP_OFF, SHEET_CHIP_ON, SHEET_CHIP_SM } from "@/components/modals/shot/sheetUi";

/**
 * The switch between the people who have shared their records with this account.
 * Shown only when there is more than one to choose between — with a single
 * person, the banner already says whose records these are.
 */
export default function SharedPersonSwitch({ shares = [], activeId, onSelect }) {
  if (shares.length < 2) return null;
  return (
    <div className="mx-3 mb-4 flex flex-wrap gap-2">
      {shares.map((share) => {
        const on = share.id === activeId;
        return (
          <button
            key={share.id}
            type="button"
            onClick={() => onSelect(share.id)}
            aria-pressed={on}
            className={`${SHEET_CHIP_SM} ${on ? SHEET_CHIP_ON : SHEET_CHIP_OFF}`}
          >
            {share.owner_name}
          </button>
        );
      })}
    </div>
  );
}