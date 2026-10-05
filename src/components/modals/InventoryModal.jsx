import React, { useState, useEffect } from "react";
import { X, Save } from "lucide-react";
import { useAppState } from "@/lib/AppState";
import { getMedicationPickerNames } from "@/lib/medicationConfig";
import useModal from "@/hooks/useModal";
import { toast } from "sonner";

const pad = (n) => String(n).padStart(2, "0");
function todayInput() { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }

export default function InventoryModal({ open, onClose, editing }) {
  const { addInventory, updateInventory } = useAppState();
  const [productName, setProductName] = useState("");
  const [lotNumber, setLotNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [startingQuantity, setStartingQuantity] = useState("");
  const [remainingQuantity, setRemainingQuantity] = useState("");
  const [quantityUnit, setQuantityUnit] = useState("doses");
  const [storageLocation, setStorageLocation] = useState("");
  const [openedDate, setOpenedDate] = useState("");
  const [inUseExpiry, setInUseExpiry] = useState("");
  const [expiryWarningDays, setExpiryWarningDays] = useState("14");
  const [status, setStatus] = useState("active");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (editing) {
        setProductName(editing.product_name || "");
        setLotNumber(editing.lot_number || "");
        setExpiryDate(editing.expiry_date || "");
        setStartingQuantity(editing.starting_quantity != null ? String(editing.starting_quantity) : "");
        setRemainingQuantity(editing.remaining_quantity != null ? String(editing.remaining_quantity) : "");
        setQuantityUnit(editing.quantity_unit || "doses");
        setStorageLocation(editing.storage_location || "");
        setOpenedDate(editing.opened_date || "");
        setInUseExpiry(editing.in_use_expiry || "");
        setExpiryWarningDays(String(editing.expiry_warning_days ?? 14));
        setStatus(editing.status || "active");
      } else {
        setProductName(""); setLotNumber(""); setExpiryDate(""); setStartingQuantity("");
        setRemainingQuantity(""); setQuantityUnit("doses"); setStorageLocation("");
        setOpenedDate(""); setInUseExpiry(""); setExpiryWarningDays("14"); setStatus("active");
      }
    }
  }, [open, editing]);

  const sheetRef = useModal({ open, onDismiss: onClose });

  if (!open) return null;

  const handleSave = async () => {
    if (!productName.trim()) { toast.error("Product name is required"); return; }
    setSaving(true);
    const sq = parseFloat(startingQuantity) || 0;
    const rq = remainingQuantity !== "" ? parseFloat(remainingQuantity) : sq;
    const payload = {
      product_name: productName,
      lot_number: lotNumber || undefined,
      expiry_date: expiryDate || undefined,
      starting_quantity: sq,
      remaining_quantity: rq,
      quantity_unit: quantityUnit,
      storage_location: storageLocation || undefined,
      opened_date: openedDate || undefined,
      in_use_expiry: inUseExpiry || undefined,
      expiry_warning_days: parseInt(expiryWarningDays) || 14,
      status,
    };
    try {
      if (editing) {
        await updateInventory(editing.id, payload);
        toast.success("Product updated");
      } else {
        await addInventory(payload);
        toast.success("Product added");
      }
      setSaving(false);
      setTimeout(() => onClose(), 300);
    } catch (err) {
      toast.error("Failed to save product");
      setSaving(false);
    }
  };

  const Field = ({ label, children }) => (
    <div>
      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">{label}</label>
      {children}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 overlay-lock" onClick={onClose} aria-hidden="true" />
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
            <button onClick={onClose}><X size={22} className="text-gray-400" /></button>
          </div>
        </div>
        <div className="px-5 pb-4 space-y-4">
          <Field label="Product name">
            <input type="text" list="med-list" value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="e.g. Ozempic®"
              className="w-full border border-gray-200 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-[#E8E9F0] rounded-xl px-4 py-3 text-base outline-none focus:border-indigo-300" />
            <datalist id="med-list">{getMedicationPickerNames().map((m) => <option key={m} value={m} />)}</datalist>
          </Field>
          <div className="flex flex-col sm:flex-row gap-3">
            <Field label="Lot number">
              <input type="text" value={lotNumber} onChange={(e) => setLotNumber(e.target.value)}
                className="w-full border border-gray-200 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-[#E8E9F0] rounded-xl px-4 py-3 text-base outline-none focus:border-indigo-300" />
            </Field>
            <Field label="Expiry date">
              <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full border border-gray-200 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-[#E8E9F0] dark:[color-scheme:dark] rounded-xl px-4 py-3 text-base outline-none focus:border-indigo-300" />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Starting quantity">
              <input type="number" min="0" step="1" value={startingQuantity} onChange={(e) => setStartingQuantity(e.target.value)}
                className="w-full border border-gray-200 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-[#E8E9F0] rounded-xl px-4 py-3 text-base outline-none focus:border-indigo-300" />
            </Field>
            <Field label="Remaining quantity">
              <input type="number" min="0" step="1" value={remainingQuantity} onChange={(e) => setRemainingQuantity(e.target.value)} placeholder="defaults to starting"
                className="w-full border border-gray-200 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-[#E8E9F0] rounded-xl px-4 py-3 text-base outline-none focus:border-indigo-300" />
            </Field>
            <Field label="Unit">
              <select value={quantityUnit} onChange={(e) => setQuantityUnit(e.target.value)}
                className="w-full border border-gray-200 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-[#E8E9F0] rounded-xl px-4 py-3 text-base outline-none focus:border-indigo-300">
                {["doses", "mg", "mL", "units", "pens", "vials"].map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Storage location">
            <input type="text" value={storageLocation} onChange={(e) => setStorageLocation(e.target.value)} placeholder="e.g. Refrigerator"
              className="w-full border border-gray-200 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-[#E8E9F0] rounded-xl px-4 py-3 text-base outline-none focus:border-indigo-300" />
          </Field>
          <div className="flex flex-col sm:flex-row gap-3">
            <Field label="Opened date">
              <input type="date" value={openedDate} onChange={(e) => setOpenedDate(e.target.value)}
                className="w-full border border-gray-200 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-[#E8E9F0] dark:[color-scheme:dark] rounded-xl px-4 py-3 text-base outline-none focus:border-indigo-300" />
            </Field>
            <Field label="In-use expiry">
              <input type="date" value={inUseExpiry} onChange={(e) => setInUseExpiry(e.target.value)}
                className="w-full border border-gray-200 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-[#E8E9F0] dark:[color-scheme:dark] rounded-xl px-4 py-3 text-base outline-none focus:border-indigo-300" />
            </Field>
          </div>
          <Field label="Expiry warning (days before)">
            <input type="number" min="1" step="1" value={expiryWarningDays} onChange={(e) => setExpiryWarningDays(e.target.value)}
              className="w-full border border-gray-200 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-[#E8E9F0] rounded-xl px-4 py-3 text-base outline-none focus:border-indigo-300" />
          </Field>
          <Field label="Status">
            <select value={status} onChange={(e) => setStatus(e.target.value)}
              className="w-full border border-gray-200 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-[#E8E9F0] rounded-xl px-4 py-3 text-base outline-none focus:border-indigo-300">
              {["active", "depleted", "expired", "archived"].map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
            </select>
          </Field>
        </div>
        <div className="sticky bottom-0 px-5 pt-3 bg-white dark:bg-[#0f1117] border-t border-gray-100 dark:border-white/[0.08]" style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))" }}>
          <button onClick={handleSave} disabled={saving}
            className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
            <Save size={16} /> {saving ? "Saving…" : editing ? "Update" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}