import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Settings, Plus, Package, AlertTriangle, Trash2, ChevronRight, Thermometer } from "lucide-react";
import PageContainer from "@/components/PageContainer";
import Fab from "@/components/Fab";
import { useAppState } from "@/lib/AppState";
import InventoryModal from "@/components/modals/InventoryModal";
import ConfirmDialog from "@/components/ConfirmDialog";
import { todayKey, fromDayKey, calendarDaysBetween } from "@/lib/dateUtils";
import useModal from "@/hooks/useModal";
import { toast } from "@/lib/toast";

export default function InventoryPage() {
  const { inventory, deleteInventory, addStorageLog, storageLogs } = useAppState();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [storageModalFor, setStorageModalFor] = useState(null);
  const [excursion, setExcursion] = useState(false);
  const [storageNote, setStorageNote] = useState("");
  const [removeTarget, setRemoveTarget] = useState(null);
  const today = todayKey();
  const storageSheetRef = useModal({ open: !!storageModalFor, onDismiss: () => setStorageModalFor(null) });

  const openNew = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (i) => { setEditing(i); setModalOpen(true); };

  // Removing asks first, in the app's own dialog; this is the work it does once
  // the answer is yes.
  const handleDelete = async () => {
    const item = removeTarget;
    if (!item) return;
    await deleteInventory(item.id);
    toast.deleted("Inventory item removed");
    setRemoveTarget(null);
  };

  const openStorageLog = (item) => {
    setStorageModalFor(item);
    setExcursion(false);
    setStorageNote("");
  };

  const saveStorageLog = async () => {
    if (!storageModalFor) return;
    await addStorageLog({
      inventory_id: storageModalFor.id || undefined,
      product_name: storageModalFor.product_name,
      logged_date: today,
      temperature_excursion: excursion,
      notes: storageNote,
    });
    toast.success("Storage log saved");
    setStorageModalFor(null);
  };

  const itemsWithStatus = useMemo(() => {
    return inventory.map((i) => {
      const warningDays = i.expiry_warning_days ?? 14;
      let daysToExpiry = null;
      let isExpired = false;
      let isExpiringSoon = false;
      if (i.expiry_date) {
        daysToExpiry = calendarDaysBetween(today, i.expiry_date);
        isExpired = daysToExpiry < 0;
        isExpiringSoon = daysToExpiry >= 0 && daysToExpiry <= warningDays;
      }
      const isLow = i.remaining_quantity != null && i.starting_quantity != null && i.remaining_quantity <= 2;
      return { ...i, daysToExpiry, isExpired, isExpiringSoon, isLow };
    });
  }, [inventory, today]);

  const productStorageLogs = (productId) => storageLogs.filter((s) => s.inventory_id === productId || s.product_name === (inventory.find((i) => i.id === productId)?.product_name));

  return (
    <PageContainer bottomInset="fab">
      <div className="sticky top-0 z-30 bg-white dark:bg-gray-950 w-full flex items-center justify-between px-5 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inventory</h1>
        <div className="flex items-center gap-3">
          <button onClick={openNew} aria-label="Add product"><Plus size={24} className="text-indigo-600" /></button>
          <Link to="/settings" aria-label="Settings"><Settings size={22} className="text-gray-600 dark:text-gray-400" /></Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto pt-4 px-4">
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
          Track product quantities, lot numbers, and expiry dates. Logging a shot for a tracked product decrements the remaining quantity.
        </p>

        {itemsWithStatus.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-800 text-center">
            <Package size={36} className="mx-auto mb-3 text-gray-300 dark:text-white/20" />
            <p className="text-sm text-gray-400 dark:text-[#9A9DAE] mb-4">No inventory tracked yet.</p>
            <button onClick={openNew} className="px-5 py-3 bg-indigo-600 text-white rounded-xl font-semibold flex items-center gap-2 mx-auto">
              <Plus size={18} /> Add Product
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {itemsWithStatus.map((i) => (
              <div key={i.id} className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="flex items-start justify-between gap-2">
                  <button onClick={() => openEdit(i)} className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-bold text-gray-900 dark:text-white break-words">{i.product_name}</span>
                      {i.status !== "active" && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-500/10 text-gray-500 whitespace-nowrap flex-shrink-0">{i.status}</span>}
                    </div>
                    <div className="space-y-1 text-sm text-gray-500 dark:text-[#9A9DAE]">
                      {i.remaining_quantity != null && i.starting_quantity != null && (
                        <div className="flex items-center gap-2">
                          <Package size={14} className="text-indigo-500" />
                          {i.remaining_quantity} / {i.starting_quantity} {i.quantity_unit || "doses"} remaining
                        </div>
                      )}
                      {i.lot_number && <div className="text-xs">Lot: {i.lot_number}</div>}
                      {i.expiry_date && (
                        <div className={`text-xs flex items-center gap-1 ${i.isExpired ? "text-red-500" : i.isExpiringSoon ? "text-orange-500" : "text-gray-400"}`}>
                          {i.isExpired ? <><AlertTriangle size={12} /> Expired</> : i.isExpiringSoon ? <><AlertTriangle size={12} /> Expires in {i.daysToExpiry}d</> : `Expires ${i.expiry_date}`}
                        </div>
                      )}
                      {i.storage_location && <div className="text-xs">Stored: {i.storage_location}</div>}
                    </div>
                  </button>
                  <div className="flex flex-col gap-2 items-end flex-shrink-0">
                    <button onClick={() => openEdit(i)} className="text-gray-400 hover:text-indigo-600"><ChevronRight size={20} /></button>
                    <button onClick={() => openStorageLog(i)} className="text-gray-400 hover:text-orange-500"><Thermometer size={16} /></button>
                    <button onClick={() => setRemoveTarget(i)} aria-label="Remove this item" className="text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                  </div>
                </div>
                {productStorageLogs(i.id).length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-100 dark:border-white/[0.08]">
                    <p className="text-[11px] text-gray-400 mb-1">Storage logs</p>
                    {productStorageLogs(i.id).slice(0, 3).map((s) => (
                      <div key={s.id} className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        {s.temperature_excursion && <AlertTriangle size={11} className="text-orange-500" />}
                        {s.logged_date}{s.notes ? ` — ${s.notes}` : ""}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Fab onClick={openNew} label="Add Product" />

      <ConfirmDialog
        open={!!removeTarget}
        tone="destructive"
        title="Remove this item?"
        message={<><strong className="font-semibold text-gray-900 dark:text-white">{removeTarget?.product_name}</strong> will be removed from your inventory.</>}
        confirmLabel="Remove item"
        cancelLabel="Keep it"
        onConfirm={handleDelete}
        onCancel={() => setRemoveTarget(null)}
      />

      <InventoryModal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} editing={editing} />

      {/* Storage log modal */}
      {storageModalFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/40 overlay-lock" onClick={() => setStorageModalFor(null)} aria-hidden="true" />
          <div ref={storageSheetRef} role="dialog" aria-modal="true" aria-label="Storage log" tabIndex={-1} className="relative bg-white dark:bg-[#0f1117] rounded-3xl w-full max-w-sm min-w-0 max-h-[92dvh] overflow-y-auto overflow-x-hidden no-scrollbar sheet-lock p-6 shadow-2xl outline-none">
            <h2 className="text-xl font-bold text-gray-900 dark:text-[#E8E9F0] mb-4 break-words">Storage Log — {storageModalFor.product_name}</h2>
            <label className="flex items-center gap-3 cursor-pointer mb-4">
              <input type="checkbox" checked={excursion} onChange={(e) => setExcursion(e.target.checked)} className="w-5 h-5 accent-indigo-600" />
              <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1"><Thermometer size={16} className="text-orange-500" /> Temperature excursion observed</span>
            </label>
            <textarea value={storageNote} onChange={(e) => setStorageNote(e.target.value)} rows={3} placeholder="Notes (optional)"
              className="w-full border border-gray-200 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-[#E8E9F0] rounded-xl px-4 py-3 text-base outline-none focus:border-indigo-300 mb-4" />
            <button onClick={saveStorageLog} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold">Save Log</button>
          </div>
        </div>
      )}
    </PageContainer>
  );
}