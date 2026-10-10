import React, { useEffect, useRef, useState } from "react";
import OptionChips from "@/components/OptionChips";
import ClearFieldButton from "@/components/ClearFieldButton";
import DateInput from "@/components/DateInput";
import { EXPIRY_WARNING_OPTIONS, STORAGE_OPTIONS, statusOptionsFor } from "@/lib/inventoryDefaults";
import { todayKey } from "@/lib/dateUtils";

const INPUT_CLASS = "w-full min-h-[52px] box-border rounded-xl border border-gray-200 dark:border-white/[0.12] dark:bg-white/[0.05] dark:text-[#E8E9F0] px-3 py-2.5 text-base outline-none focus:border-indigo-400 dark:[color-scheme:dark]";
const LABEL_CLASS = "text-sm font-semibold text-gray-700 dark:text-gray-300";
const HINT_CLASS = "text-xs text-gray-500 dark:text-[#9A9DAE] mt-1.5 leading-snug";

const OTHER = "other";
const NOT_OPENED = "none";
const TODAY = "today";

/**
 * Everything the Add / Edit form only sometimes needs: lot number, where it is
 * kept, when it was opened, the in-use expiry, the expiry warning, and — when
 * an existing product is being edited — its remaining quantity and status.
 * Closed until it is asked for, and nothing here is required.
 *
 * `form` carries the whole form, `set(field, value)` changes one field at a
 * time. In-use expiry arrives already resolved: the label's suggestion until
 * the user changes it, their own value afterwards, never locked.
 */
export default function InventoryDetails({ form, set, isEditing, unit, errors, inUseIsSuggested }) {
  const today = todayKey();
  const [focusField, setFocusField] = useState(null);
  const storageRef = useRef(null);
  const warningRef = useRef(null);

  // A tapped "Other" is what opens the keyboard, never the form itself.
  useEffect(() => {
    if (!focusField) return;
    const node = focusField === "storage" ? storageRef.current : warningRef.current;
    node?.focus();
    setFocusField(null);
  }, [focusField]);

  const storageChip = STORAGE_OPTIONS.includes(form.storageLocation)
    ? form.storageLocation
    : (form.storageIsOther || form.storageLocation ? OTHER : null);

  const openedChip = !form.openedDate ? NOT_OPENED : form.openedDate === today ? TODAY : null;

  const warningDays = Number(form.expiryWarningDays);
  const warningChip = EXPIRY_WARNING_OPTIONS.includes(warningDays)
    ? warningDays
    : (form.warningOtherOpen || form.expiryWarningDays !== "" ? OTHER : null);

  const pickStorage = (next) => {
    if (next === OTHER) { set("storageIsOther", true); set("storageLocation", ""); setFocusField("storage"); return; }
    set("storageIsOther", false);
    set("storageLocation", next || "");
  };

  const pickOpened = (next) => {
    if (next === TODAY) { set("openedDate", today); return; }
    set("openedDate", "");
  };

  const pickWarningDays = (next) => {
    if (next === OTHER) { set("warningOtherOpen", true); set("expiryWarningDays", ""); setFocusField("warning"); return; }
    set("warningOtherOpen", false);
    // Clearing this optional choice returns it to the 14-day default.
    set("expiryWarningDays", next == null ? "14" : String(next));
  };

  return (
    <div className="mt-3 space-y-5">
      {/* Lot number */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <label htmlFor="inv-lot" className={LABEL_CLASS}>Lot number</label>
          <ClearFieldButton show={!!form.lotNumber} onClear={() => set("lotNumber", "")} />
        </div>
        <input
          id="inv-lot"
          type="text"
          value={form.lotNumber}
          autoComplete="off"
          onChange={(e) => set("lotNumber", e.target.value)}
          className={INPUT_CLASS}
        />
        <p className={HINT_CLASS}>Printed on the box or pen.</p>
      </div>

      {/* Storage location */}
      <OptionChips
        label="Storage location"
        options={[...STORAGE_OPTIONS.map((s) => ({ value: s, label: s })), { value: OTHER, label: "Other" }]}
        value={storageChip}
        onChange={pickStorage}
        soundOnSelect
      />
      {form.storageIsOther && (
        <input
          ref={storageRef}
          type="text"
          value={form.storageLocation}
          autoComplete="off"
          onChange={(e) => set("storageLocation", e.target.value)}
          placeholder="e.g. Medicine cabinet"
          aria-label="Storage location"
          className={`${INPUT_CLASS} mt-2`}
        />
      )}

      {/* Opened date */}
      <div>
        <OptionChips
          label="Opened date"
          options={[{ value: NOT_OPENED, label: "Not opened yet" }, { value: TODAY, label: "Today" }]}
          value={openedChip}
          onChange={pickOpened}
          soundOnSelect
        />
        <DateInput
          value={form.openedDate}
          onChange={(value) => set("openedDate", value)}
          ariaLabel="Opened date"
          className="mt-2"
        />
      </div>

      {/* In-use expiry */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <label htmlFor="inv-in-use" className={LABEL_CLASS}>In-use expiry</label>
          <ClearFieldButton show={!!form.inUseExpiry} onClear={() => set("inUseExpiry", "")} />
        </div>
        <DateInput
          id="inv-in-use"
          value={form.inUseExpiry}
          onChange={(value) => set("inUseExpiry", value)}
          ariaLabel="In-use expiry"
        />
        {inUseIsSuggested && <p className={HINT_CLASS}>Suggested from the product label, change if needed.</p>}
        {errors.inUseExpiry && <p className="text-sm font-medium text-red-600 dark:text-red-400 mt-2">{errors.inUseExpiry}</p>}
      </div>

      {/* Expiry warning */}
      <div>
        <OptionChips
          label="Expiry warning (days before)"
          options={[...EXPIRY_WARNING_OPTIONS.map((d) => ({ value: d, label: String(d) })), { value: OTHER, label: "Other" }]}
          value={warningChip}
          onChange={pickWarningDays}
          required
          soundOnSelect
          helper="How many days ahead of the expiry date Levli should warn you."
        />
        {(form.warningOtherOpen || warningChip === OTHER) && (
          <input
            ref={warningRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={form.expiryWarningDays}
            onChange={(e) => set("expiryWarningDays", e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="Days"
            aria-label="Expiry warning days"
            className={`${INPUT_CLASS} mt-2`}
          />
        )}
      </div>

      {/* Existing product only: what is left, and where it stands. */}
      {isEditing && (
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <label htmlFor="inv-remaining" className={LABEL_CLASS}>Remaining quantity</label>
            <ClearFieldButton show={form.remainingQuantity !== ""} onClear={() => set("remainingQuantity", "")} />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="inv-remaining"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={form.remainingQuantity}
              onChange={(e) => set("remainingQuantity", e.target.value.replace(/[^0-9]/g, ""))}
              className={`${INPUT_CLASS} flex-1 min-w-0`}
            />
            <span className="text-sm text-gray-500 dark:text-[#9A9DAE] flex-shrink-0">{unit}</span>
          </div>
          <p className={HINT_CLASS}>Left as it is unless you change it.</p>
        </div>
      )}

      {isEditing && (
        <OptionChips
          label="Status"
          options={statusOptionsFor(form.status)}
          value={form.status}
          onChange={(next) => set("status", next)}
          required
          soundOnSelect
        />
      )}
    </div>
  );
}