import React, { useState, useRef, useEffect } from "react";
import { X, Camera, Image, Trash2, Save, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import CameraCapture from "@/components/modals/CameraCapture";
import SafeImage from "@/components/SafeImage";
import useModal from "@/hooks/useModal";

function numericOnly(value) {
  let v = value.replace(/[^0-9.]/g, "");
  const parts = v.split(".");
  if (parts.length > 2) v = parts[0] + "." + parts.slice(1).join("");
  return v;
}

// ── Shared dark-mode dialog shell ───────────────────────────────────────────
function ModalShell({ onClose, children, bottom = false }) {
  return (
    <div className={`fixed inset-0 z-[60] flex ${bottom ? "items-end" : "items-center"} justify-center px-6`}>
      <div className="absolute inset-0 bg-black/40 overlay-lock" onClick={onClose} aria-hidden="true" />
      {children}
    </div>
  );
}

// ── Exercise ─────────────────────────────────────────────────────────────────
function ExerciseModal({ open, onClose, value, onSave, onDelete }) {
  const [val, setVal] = useState("");
  const [error, setError] = useState("");
  useEffect(() => { if (open) { setVal(value && value !== "0" ? String(value) : ""); setError(""); } }, [open, value]);

  const sheetRef = useModal({ open, onDismiss: onClose });

  if (!open) return null;

  const handleSave = () => {
    const n = parseFloat(val);
    if (val !== "" && (isNaN(n) || n < 0)) { setError("Please enter a valid number of minutes."); return; }
    onSave(val || "0");
    onClose();
  };

  return (
    <ModalShell onClose={onClose}>
      <div ref={sheetRef} role="dialog" aria-modal="true" aria-label="Update Exercise" tabIndex={-1} className="relative bg-white dark:bg-[#0f1117] rounded-3xl w-full max-w-sm min-w-0 max-h-[92dvh] overflow-y-auto overflow-x-hidden no-scrollbar sheet-lock p-6 shadow-2xl dark:shadow-[0_8px_40px_rgba(0,0,0,0.6)] border border-transparent dark:border-white/[0.07] outline-none">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-[#E8E9F0] mb-4">Update Exercise</h2>
        <label className="text-sm text-gray-400 dark:text-[#9A9DAE] mb-2 block">Duration</label>
        <div className={`flex items-center border rounded-xl px-4 py-3 mb-1 dark:bg-white/[0.05] ${error ? "border-red-400" : "border-gray-200 dark:border-white/[0.1]"}`}>
          <input
            type="text" inputMode="numeric"
            value={val}
            onChange={(e) => { setVal(numericOnly(e.target.value).split(".")[0]); setError(""); }}
            onFocus={(e) => e.target.select()}
            placeholder="0"
            className="flex-1 outline-none text-lg font-medium bg-transparent text-gray-900 dark:text-[#E8E9F0] placeholder-gray-300 dark:placeholder-[#9A9DAE]"
            autoFocus
          />
          <span className="text-gray-400 dark:text-[#9A9DAE] text-sm ml-2">minutes</span>
        </div>
        {error && <p className="text-xs text-red-500 mb-4">{error}</p>}
        {!error && <div className="mb-5" />}
        <div className="flex items-center justify-end gap-4">
          <button
            onClick={() => { onDelete(); onClose(); }}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-transparent dark:border-red-500/20">
            Delete
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-indigo-600 text-white">
            Save
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

// ── Progress Photo ────────────────────────────────────────────────────────────
function ProgressModal({ open, onClose, value, dayKey, onSave, onDelete }) {
  const hasExisting = value && value !== "–";
  const [imgUrl, setImgUrl] = useState(hasExisting ? value : null);
  const [photoDate, setPhotoDate] = useState(dayKey || "");
  const [uploading, setUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const galleryRef = useRef();

  useEffect(() => { if (open) { setImgUrl(hasExisting ? value : null); setPhotoDate(dayKey || ""); setUploading(false); setShowCamera(false); } }, [open]);

  const sheetRef = useModal({ open, onDismiss: onClose });

  if (!open) return null;

  const uploadFile = async (file) => {
    setUploading(true);
    try {
      // Private storage: returns a file_uri (not a public URL).
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      setImgUrl(file_uri);
    } finally {
      setUploading(false);
    }
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    await uploadFile(file);
    e.target.value = "";
  };

  const handleCameraCapture = async (file) => {
    setShowCamera(false);
    await uploadFile(file);
  };

  return (
    <ModalShell onClose={onClose} bottom>
      <div ref={sheetRef} role="dialog" aria-modal="true" aria-label={hasExisting ? "Edit Progress Picture" : "Add Progress Picture"} tabIndex={-1} className="relative bg-white dark:bg-[#0f1117] rounded-t-3xl w-full max-w-lg max-h-[92dvh] overflow-y-auto overflow-x-hidden no-scrollbar sheet-lock animate-in slide-in-from-bottom dark:shadow-[0_-8px_40px_rgba(0,0,0,0.5)] dark:border-t dark:border-white/[0.07] outline-none">
        <div className="sticky top-0 z-10 bg-white dark:bg-[#0f1117]">
          <div className="flex items-center justify-between px-5 pt-5 pb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-[#E8E9F0]">{hasExisting ? "Edit Progress Picture" : "Add Progress Picture"}</h2>
            <button onClick={onClose} aria-label="Close" className="w-11 h-11 flex items-center justify-center rounded-full"><X size={22} className="text-gray-400" /></button>
          </div>
        </div>
        <div className="px-5 pb-4">
          <div className="border border-gray-200 dark:border-white/[0.1] rounded-2xl overflow-hidden bg-gray-50 dark:bg-white/[0.04] flex items-center justify-center" style={{ minHeight: 220 }}>
            {uploading ? (
              <div className="flex flex-col items-center gap-3 py-12 text-gray-400 dark:text-[#9A9DAE]">
                <Loader2 size={40} className="animate-spin" />
                <p className="text-sm">Uploading...</p>
              </div>
            ) : imgUrl ? (
              <SafeImage src={imgUrl} alt="Progress" className="w-full object-cover max-h-64" />
            ) : (
              <div className="flex flex-col items-center gap-3 py-12 text-gray-300 dark:text-white/20">
                <Camera size={48} />
                <p className="text-sm text-gray-400 dark:text-[#9A9DAE]">No image selected.</p>
              </div>
            )}
          </div>
          <div className="flex gap-3 mt-4">
            <button disabled={uploading} onClick={() => setShowCamera(true)}
              className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
              <Camera size={18} /> Camera
            </button>
            <button disabled={uploading} onClick={() => galleryRef.current?.click()}
              className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
              <Image size={18} /> Gallery
            </button>
            <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
          <div className="mt-4">
            <label className="text-sm text-gray-400 dark:text-[#9A9DAE] mb-2 block">Date</label>
            <input
              type="date"
              value={photoDate}
              onChange={(e) => setPhotoDate(e.target.value)}
              className="w-full border border-gray-200 dark:border-white/[0.1] dark:bg-white/[0.05] rounded-xl px-4 py-3 outline-none text-gray-900 dark:text-[#E8E9F0] dark:[color-scheme:dark]"
            />
          </div>
        </div>
        {showCamera && <CameraCapture onCapture={handleCameraCapture} onClose={() => setShowCamera(false)} />}
        {hasExisting ? (
          <div className="sticky bottom-0 flex gap-3 px-5 pt-3 bg-white dark:bg-[#0f1117] border-t border-gray-100 dark:border-white/[0.08]" style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))" }}>
            <button onClick={() => { onDelete(); onClose(); }}
              className="flex-1 py-3 bg-red-500/10 dark:bg-red-500/10 text-red-500 dark:text-red-400 border border-red-500/20 rounded-xl font-semibold flex items-center justify-center gap-2">
              <Trash2 size={18} /> Delete
            </button>
            <button disabled={uploading || !imgUrl || !photoDate} onClick={() => { onSave(imgUrl, photoDate); onClose(); }}
              className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
              <Save size={18} /> Update
            </button>
          </div>
        ) : (
          <div className="sticky bottom-0 px-5 pt-3 bg-white dark:bg-[#0f1117] border-t border-gray-100 dark:border-white/[0.08]" style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))" }}>
            <button disabled={uploading || !imgUrl || !photoDate} onClick={() => { if (imgUrl) { onSave(imgUrl, photoDate); onClose(); } }}
              className={`w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 bg-indigo-600 text-white ${!imgUrl || uploading ? "opacity-60" : ""}`}>
              <Save size={18} /> Save
            </button>
          </div>
        )}
      </div>
    </ModalShell>
  );
}

// ── Generic (Weight, and any future metric) ───────────────────────────────────
function GenericMetricModal({ open, onClose, label, unit, value, onSave, validate }) {
  const [val, setVal] = useState("");
  const [error, setError] = useState("");
  useEffect(() => { if (open) { setVal(value && value !== "–" ? String(value) : ""); setError(""); } }, [open, value]);

  const sheetRef = useModal({ open, onDismiss: onClose });

  if (!open) return null;

  const handleSave = () => {
    if (!val || isNaN(parseFloat(val)) || parseFloat(val) < 0) {
      setError(`Please enter a valid ${label.toLowerCase()} value.`);
      return;
    }
    // An implausible value is never saved and never shown as a number.
    if (validate) {
      const message = validate(val);
      if (message) { setError(message); return; }
    }
    onSave(val);
    onClose();
  };

  return (
    <ModalShell onClose={onClose}>
      <div ref={sheetRef} role="dialog" aria-modal="true" aria-label={`Update ${label}`} tabIndex={-1} className="relative bg-white dark:bg-[#0f1117] rounded-3xl w-full max-w-sm min-w-0 max-h-[92dvh] overflow-y-auto overflow-x-hidden no-scrollbar sheet-lock p-6 shadow-2xl dark:shadow-[0_8px_40px_rgba(0,0,0,0.6)] border border-transparent dark:border-white/[0.07] outline-none">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-[#E8E9F0] mb-4">Update {label}</h2>
        <label className="text-sm text-gray-400 dark:text-[#9A9DAE] mb-2 block">{label}</label>
        <div className={`flex items-center border rounded-xl px-4 py-3 mb-1 dark:bg-white/[0.05] ${error ? "border-red-400" : "border-gray-200 dark:border-white/[0.1]"}`}>
          <input
            type="text" inputMode="decimal"
            value={val}
            onChange={(e) => { setVal(numericOnly(e.target.value)); setError(""); }}
            onFocus={(e) => e.target.select()}
            placeholder="0.0"
            className="flex-1 outline-none text-lg font-medium bg-transparent text-gray-900 dark:text-[#E8E9F0] placeholder-gray-300 dark:placeholder-[#9A9DAE]"
            autoFocus
          />
          <span className="text-gray-400 dark:text-[#9A9DAE] text-sm ml-2">{unit}</span>
        </div>
        {error && <p className="text-xs text-red-500 mb-4">{error}</p>}
        {!error && <div className="mb-5" />}
        <div className="flex items-center justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-500 dark:text-[#9A9DAE] bg-gray-100 dark:bg-white/[0.07]">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-indigo-600 text-white">
            Save
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

export default function AddMetricModal({ open, onClose, label, unit, value, dayKey, onSave, onDelete, validate }) {
  if (label === "Exercise") {
    return <ExerciseModal open={open} onClose={onClose} value={value} onSave={onSave} onDelete={onDelete || (() => onSave("0"))} />;
  }
  if (label === "Progress") {
    return <ProgressModal open={open} onClose={onClose} value={value} dayKey={dayKey} onSave={onSave} onDelete={onDelete || (() => onSave("–"))} />;
  }
  return <GenericMetricModal open={open} onClose={onClose} label={label} unit={unit} value={value} onSave={onSave} validate={validate} />;
}