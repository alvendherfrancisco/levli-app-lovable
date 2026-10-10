import React, { useEffect, useMemo, useRef, useState } from "react";
import { X, Save, ChevronDown } from "lucide-react";
import { useAppState } from "@/lib/AppState";
import useModal from "@/hooks/useModal";
import useDiscardConfirm from "@/hooks/useDiscardConfirm";
import { toast } from "@/lib/toast";
import { sound } from "@/lib/sounds";
import ConfirmDialog from "@/components/ConfirmDialog";
import InventoryProductPicker, { OTHER_PRODUCT } from "@/components/inventory/InventoryProductPicker";
import InventoryQuantityField from "@/components/inventory/InventoryQuantityField";
import InventoryDetails from "@/components/inventory/InventoryDetails";
import DateInput from "@/components/DateInput";
import {
  EXPIRY_WARNING_OPTIONS, STORAGE_OPTIONS, defaultQuantityUnit, suggestedInUseExpiry,
} from "@/lib/inventoryDefaults";

const LABEL_CLASS = "text-sm font-semibold text-gray-700 dark:text-gray-300";

/** A new product: only what the four fields need, everything else at default. */
const EMPTY_FORM = {
  productName: "", productIsOther: false,
  expiryDate: "", quantity: "", quantityUnit: "doses",
  lotNumber: "", storageLocation: "", storageIsOther: false,
  openedDate: "", inUseExpiry: "", inUseTouched: false,
  expiryWarningDays: "14", warningOtherOpen: false,
  remainingQuantity: "", status: "active",
};

/** The same form, filled from a product that already exists. */
function formFromRecord(record, activeNames) {
  if (!record) return { ...EMPTY_FORM };
  const name = record.product_name || "";
  const warningDays = String(record.expiry_warning_days ?? 14);
  const storage = record.storage_location || "";
  return {
    productName: name,
    // A name that is not one of the user's active medications (an archived or
    // hand-typed one) belongs in the Other field, so it stays visible and editable.
    productIsOther: !activeNames.includes(name),
    expiryDate: record.expiry_date || "",
    quantity: record.starting_quantity != null ? String(record.starting_quantity) : "",
    quantityUnit: record.quantity_unit || defaultQuantityUnit(name),
    lotNumber: record.lot_number || "",
    storageLocation: storage,
    storageIsOther: !!storage && !STORAGE_OPTIONS.includes(storage),
    openedDate: record.opened_date || "",
    inUseExpiry: record.in_use_expiry || "",
    // A stored in-use expiry is the user's own value, never re-suggested.
    inUseTouched: !!record.in_use_expiry,
    expiryWarningDays: warningDays,
    warningOtherOpen: !EXPIRY_WARNING_OPTIONS.includes(Number(warningDays)),
    remainingQuantity: record.remaining_quantity != null ? String(record.remaining_quantity) : "",
    status: record.status || "active",
  };
}

export default function InventoryModal({ open, onClose, editing }) {
  const { addInventory, updateInventory, medications = [] } = useAppState();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [pendingProduct, setPendingProduct] = useState(null);
  const [saving, setSaving] = useState(false);
  const initialRef = useRef(EMPTY_FORM);

  // The medications the user is actually taking — the chips on offer.
  const activeMeds = useMemo(
    () => medications.filter((m) => (m.status || "active") === "active" && !m.archived_date),
    [medications],
  );
  const activeNames = useMemo(() => activeMeds.map((m) => m.medication_name).filter(Boolean), [activeMeds]);

  useEffect(() => {
    if (!open) return;
    const initial = formFromRecord(editing, activeNames);
    setForm(initial);
    initialRef.current = initial;
    setErrors({});
    setDetailsOpen(false);
    setPendingProduct(null);
    setSaving(false);
  }, [open, editing]);

  // Closing with something typed in asks first, in the app's own dialog.
  const { requestClose, dialog } = useDiscardConfirm({ dirty: () => isDirty(), onClose });
  const sheetRef = useModal({ open, onDismiss: requestClose });

  if (!open) return null;

  const set = (field, value) => setForm((prev) => ({
    ...prev,
    [field]: value,
    // Touching the in-use expiry makes it the user's own value.
    ...(field === "inUseExpiry" ? { inUseTouched: true } : {}),
  }));

  const productChip = form.productIsOther
    ? OTHER_PRODUCT
    : (activeNames.includes(form.productName) ? form.productName : null);

  // The in-use expiry the form shows and saves: the label's suggestion until the
  // user touches it, theirs from then on.
  const suggested = suggestedInUseExpiry(form.productName, form.openedDate);
  const view = { ...form, inUseExpiry: form.inUseTouched ? form.inUseExpiry : suggested };

  const filledDetails = [form.lotNumber, form.storageLocation, form.openedDate, view.inUseExpiry].filter(Boolean).length
    + (editing && form.status !== "active" ? 1 : 0);

  // Anything the user has entered or changed since the form opened.
  const isDirty = () => {
    const start = initialRef.current;
    return ["productName", "quantity", "expiryDate", "lotNumber", "storageLocation", "openedDate", "inUseExpiry"]
      .some((key) => String(form[key] ?? "") !== String(start[key] ?? ""));
  };

  /**
   * Everything the save needs: a product, the expiry date the box carries, and
   * how many there are. Run live to gate the Save button and again by the save
   * itself, so a dimmed button and a refused save can never disagree.
   */
  const problems = () => {
    const found = {};
    const name = String(form.productName || "").trim();
    const quantity = String(form.quantity || "").trim();

    if (!name) {
      found.product = form.productIsOther
        ? "Type the product name from the box or pen."
        : "Tap your product, or choose Other and type it.";
    }
    if (!form.expiryDate) found.expiry = "Add the expiry date printed on the box or pen.";
    if (!/^\d+$/.test(quantity) || Number(quantity) < 1) found.quantity = "Enter how many you have as a whole number.";
    if (form.openedDate) {
      if (form.expiryDate && form.expiryDate < form.openedDate) found.expiry = "The expiry date can't be before the opened date.";
      if (view.inUseExpiry && view.inUseExpiry < form.openedDate) found.inUseExpiry = "The in-use expiry can't be before the opened date.";
    }
    return found;
  };

  // Nothing to save until the three answers are there: a product, the expiry
  // date the box carries, and how many there are — and, on an edit, until
  // something has actually changed from the saved product. The date-ordering
  // checks belong to the save itself, which flags them inline and opens the
  // details section, so pressing the button is always how a mistake is found.
  const canSave = !saving
    && !!String(form.productName || "").trim()
    && !!form.expiryDate
    && /^\d+$/.test(String(form.quantity || "").trim())
    && Number(form.quantity) >= 1
    && (!editing || isDirty());

  // Switching product resets the unit and the suggested dates to the new
  // product's own defaults, and clears the count entered for the old one.
  const applyProduct = (next) => {
    setForm((prev) => ({
      ...prev,
      productIsOther: next === OTHER_PRODUCT,
      productName: next === OTHER_PRODUCT ? "" : next,
      quantity: "",
      quantityUnit: next === OTHER_PRODUCT ? "doses" : defaultQuantityUnit(next),
      inUseExpiry: "",
      inUseTouched: false,
    }));
    setErrors((prev) => ({ ...prev, product: undefined, quantity: undefined }));
  };

  const handlePickProduct = (next) => {
    if (next === productChip) return;
    if (isDirty()) { setPendingProduct(next); return; }
    applyProduct(next);
  };

  const handleSave = async () => {
    const name = String(form.productName || "").trim();
    const quantity = String(form.quantity || "").trim();
    const found = problems();

    if (Object.keys(found).length) {
      sound.warning();
      setErrors(found);
      if (found.inUseExpiry) setDetailsOpen(true);
      return;
    }

    setSaving(true);
    const quantityNumber = parseInt(quantity, 10);
    const remaining = form.remainingQuantity !== "" ? parseFloat(form.remainingQuantity) : quantityNumber;
    const payload = {
      product_name: name,
      lot_number: form.lotNumber || undefined,
      expiry_date: form.expiryDate || undefined,
      starting_quantity: quantityNumber,
      remaining_quantity: remaining,
      quantity_unit: form.quantityUnit,
      storage_location: form.storageLocation || undefined,
      opened_date: form.openedDate || undefined,
      in_use_expiry: view.inUseExpiry || undefined,
      expiry_warning_days: parseInt(form.expiryWarningDays, 10) || 14,
      status: form.status,
    };
    try {
      if (editing) {
        await updateInventory(editing.id, payload);
        toast.success("Product updated");
      } else {
        await addInventory(payload);
        toast.success("Product added");
      }
      sound.success();
      setSaving(false);
      setTimeout(() => onClose(), 300);
    } catch (err) {
      toast.error("Couldn't save. Please try again.", { actionLabel: "Retry", onAction: handleSave });
      setSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
        <div className="absolute inset-0 bg-black/40 overlay-lock" onClick={requestClose} aria-hidden="true" />
        <div
          ref={sheetRef}
          role="dialog"
          aria-modal="true"
          aria-label={editing ? "Edit Product" : "Add Product"}
          tabIndex={-1}
          className="relative bg-white dark:bg-[#0f1117] rounded-t-3xl sm:rounded-3xl w-full sm:max-w-[520px] max-h-[92dvh] overflow-y-auto overflow-x-hidden no-scrollbar sheet-lock animate-in slide-in-from-bottom sm:mx-4 dark:shadow-[0_-8px_40px_rgba(0,0,0,0.5)] outline-none"
        >
          <div className="sticky top-0 z-10 bg-white dark:bg-[#0f1117]">
            <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 bg-gray-300 rounded-full" /></div>
            <div className="flex items-center justify-between px-5 pb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-[#E8E9F0]">{editing ? "Edit Product" : "Add Product"}</h2>
              <button onClick={requestClose} aria-label="Close"><X size={22} className="text-gray-400" /></button>
            </div>
          </div>

          <div className="px-5 pb-5 space-y-5">
            <InventoryProductPicker
              medications={activeMeds}
              selected={productChip}
              onPick={handlePickProduct}
              customName={form.productIsOther ? form.productName : ""}
              onCustomName={(value) => { set("productName", value); setErrors((p) => ({ ...p, product: undefined })); }}
              error={errors.product}
            />

            {/* The only date the box always carries. */}
            <div>
              <label htmlFor="inv-expiry" className={`${LABEL_CLASS} mb-2 block`}>Expiry date</label>
              <DateInput
                id="inv-expiry"
                value={form.expiryDate}
                onChange={(value) => { set("expiryDate", value); setErrors((p) => ({ ...p, expiry: undefined })); }}
                ariaLabel="Expiry date"
              />
              {errors.expiry && <p className="text-sm font-medium text-red-600 dark:text-red-400 mt-2">{errors.expiry}</p>}
            </div>

            <InventoryQuantityField
              value={form.quantity}
              onChange={(value) => { set("quantity", value); setErrors((p) => ({ ...p, quantity: undefined })); }}
              unit={form.quantityUnit}
              onUnitChange={(unit) => set("quantityUnit", unit)}
              error={errors.quantity}
            />

            {/* Everything else, closed until it is needed. */}
            <div className="border-t border-gray-100 dark:border-white/[0.08] pt-3">
              <button
                type="button"
                onClick={() => { if (detailsOpen) sound.close(); else sound.open(); setDetailsOpen((v) => !v); }}
                aria-expanded={detailsOpen}
                className="w-full min-h-[44px] flex items-center justify-between gap-2"
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  More details (optional)
                  {!detailsOpen && filledDetails > 0 && (
                    <span className="text-[11px] font-medium text-indigo-500 dark:text-indigo-400">· {filledDetails} filled in</span>
                  )}
                </span>
                <ChevronDown size={18} className={`text-gray-400 transition-transform ${detailsOpen ? "rotate-180" : ""}`} />
              </button>

              {detailsOpen && (
                <InventoryDetails
                  form={view}
                  set={set}
                  isEditing={!!editing}
                  unit={form.quantityUnit}
                  errors={errors}
                  inUseIsSuggested={!form.inUseTouched && !!suggested}
                />
              )}
            </div>
          </div>

          <div className="sticky bottom-0 px-5 pt-3 bg-white dark:bg-[#0f1117] border-t border-gray-100 dark:border-white/[0.08]" style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))" }}>
            <button onClick={handleSave} disabled={!canSave} aria-disabled={!canSave || undefined}
              className="w-full py-3.5 btn-pill btn-primary font-semibold flex items-center justify-center gap-2">
              <Save size={16} /> {saving ? "Saving…" : editing ? "Update" : "Save"}
            </button>
          </div>
        </div>
      </div>

      {dialog}

      {/* Switching product asks first, in the app's own dialog. */}
      <ConfirmDialog
        open={!!pendingProduct}
        tone="warning"
        title="Change product?"
        message={`Switching to ${pendingProduct === OTHER_PRODUCT ? "another product" : pendingProduct} updates the unit and suggested dates, and clears the quantity you entered. Your expiry date and other details stay.`}
        confirmLabel="Change product"
        cancelLabel="Keep current"
        onConfirm={() => { applyProduct(pendingProduct); setPendingProduct(null); }}
        onCancel={() => setPendingProduct(null)}
      />
    </>
  );
}