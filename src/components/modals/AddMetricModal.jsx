import React, { useState, useRef, useEffect } from "react";
import { X, Camera, Image, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { todayKey } from "@/lib/dateUtils";
import DateInput from "@/components/DateInput";
import CameraCapture from "@/components/modals/CameraCapture";
import SafeImage from "@/components/SafeImage";
import useModal from "@/hooks/useModal";
import useDiscardConfirm from "@/hooks/useDiscardConfirm";
import { hasChanged, isAboveZero, isBlank } from "@/lib/formValidity";
import SaveDeleteFooter from "@/components/SaveDeleteFooter";

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
  // A value is judged only once the field has been left: nothing is flagged
  // while the person is still typing.
  const [touched, setTouched] = useState(false);
  useEffect(() => { if (open) { setVal(value && value !== "0" ? String(value) : ""); setError(""); setTouched(false); } }, [open, value]);

  // Nothing to save until the minutes are a real amount — empty and zero are not
  // data — and, while editing, until something has changed from the minutes
  // already logged.
  const edited = hasChanged({ minutes: val }, { minutes: value });
  const canSave = isAboveZero(val) && edited;
  const shownError = error || (touched && !isBlank(val) && !isAboveZero(val) ? "Enter a number of minutes above 0." : "");

  const { requestClose, dialog } = useDiscardConfirm({ dirty: () => edited, onClose });
  const sheetRef = useModal({ open, onDismiss: requestClose });

  if (!open) return null;

  const handleSave = () => {
    if (!canSave) { setTouched(true); return; }
    onSave(val || "0");
    onClose();
  };

  return (
    <>
    <ModalShell onClose={requestClose}>
      <div ref={sheetRef} role="dialog" aria-modal="true" aria-label="Update Exercise" tabIndex={-1} className="relative bg-white dark:bg-[#0f1117] rounded-3xl w-full max-w-sm min-w-0 max-h-[92dvh] overflow-y-auto overflow-x-hidden no-scrollbar sheet-lock p-6 shadow-2xl dark:shadow-[0_8px_40px_rgba(0,0,0,0.6)] border border-transparent dark:border-white/[0.07] outline-none">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-[#E8E9F0] mb-4">Update Exercise</h2>
        <label className="text-sm text-gray-400 dark:text-[#9A9DAE] mb-2 block">Duration</label>
        <div className={`flex items-center border rounded-xl px-4 py-3 mb-1 dark:bg-white/[0.05] ${shownError ? "border-red-400" : "border-gray-200 dark:border-white/[0.1]"}`}>
          <input
            type="text" inputMode="numeric"
            value={val}
            onChange={(e) => { setVal(numericOnly(e.target.value).split(".")[0]); setError(""); }}
            onFocus={(e) => e.target.select()}
            onBlur={() => setTouched(true)}
            placeholder="0"
            className="flex-1 min-w-0 outline-none text-lg font-medium bg-transparent text-gray-900 dark:text-[#E8E9F0] placeholder-gray-300 dark:placeholder-[#9A9DAE]"
            autoFocus
          />
          <span className="flex-shrink-0 whitespace-nowrap text-gray-400 dark:text-[#9A9DAE] text-sm ml-2">minutes</span>
        </div>
        {shownError && <p className="text-xs text-red-500 mb-4">{shownError}</p>}
        {!shownError && <div className="mb-5" />}
        <SaveDeleteFooter
          small
          cancelLabel="Cancel"
          onCancel={requestClose}
          saveLabel="Save"
          onSave={handleSave}
          saveDisabled={!canSave}
          onDelete={onDelete}
          deleteTitle="Delete this exercise entry?"
          deleteAriaLabel="Delete exercise entry"
        />
      </div>
    </ModalShell>
    {dialog}
    </>
  );
}

// ── Progress Photo ────────────────────────────────────────────────────────────
function ProgressModal({ open, onClose, value, dayKey, onSave, onDelete }) {
  const hasExisting = value && value !== "–";
  const [imgUrl, setImgUrl] = useState(hasExisting ? value : null);
  // Today unless the sheet was opened from a day the strip has selected.
  const [photoDate, setPhotoDate] = useState(dayKey || todayKey());
  const [uploading, setUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const galleryRef = useRef();

  useEffect(() => { if (open) { setImgUrl(hasExisting ? value : null); setPhotoDate(dayKey || todayKey()); setUploading(false); setShowCamera(false); } }, [open]);

  // A photo is required, and — on an entry that already has one — nothing is
  // saved until the picture or its date has actually changed.
  const edited = hasChanged(
    { photo: imgUrl, date: photoDate },
    { photo: hasExisting ? value : "", date: dayKey || todayKey() },
  );
  const canSave = !uploading && !!imgUrl && !!photoDate && edited;

  const { requestClose, dialog } = useDiscardConfirm({ dirty: () => edited, onClose });
  const sheetRef = useModal({ open, onDismiss: requestClose });

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
    <>
    <ModalShell onClose={requestClose} bottom>
      <div ref={sheetRef} role="dialog" aria-modal="true" aria-label={hasExisting ? "Edit Progress Picture" : "Add Progress Picture"} tabIndex={-1} className="relative bg-white dark:bg-[#0f1117] rounded-t-3xl w-full max-w-lg max-h-[92dvh] overflow-y-auto overflow-x-hidden no-scrollbar sheet-lock animate-in slide-in-from-bottom dark:shadow-[0_-8px_40px_rgba(0,0,0,0.5)] dark:border-t dark:border-white/[0.07] outline-none">
        <div className="sticky top-0 z-10 bg-white dark:bg-[#0f1117]">
          <div className="flex items-center justify-between px-5 pt-5 pb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-[#E8E9F0]">{hasExisting ? "Edit Progress Picture" : "Add Progress Picture"}</h2>
            <button onClick={requestClose} aria-label="Close" className="w-11 h-11 flex items-center justify-center rounded-full"><X size={22} className="text-gray-400" /></button>
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
              className="flex-1 py-3 btn-pill btn-primary font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
              <Camera size={18} /> Camera
            </button>
            <button disabled={uploading} onClick={() => galleryRef.current?.click()}
              className="flex-1 py-3 btn-pill btn-primary font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
              <Image size={18} /> Gallery
            </button>
            <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
          <div className="mt-4">
            <label htmlFor="progress-date" className="text-sm text-gray-400 dark:text-[#9A9DAE] mb-2 block">Date</label>
            <DateInput id="progress-date" value={photoDate} onChange={setPhotoDate} ariaLabel="Date" />
          </div>
        </div>
        {showCamera && <CameraCapture onCapture={handleCameraCapture} onClose={() => setShowCamera(false)} />}
        {hasExisting ? (
          <div className="sticky bottom-0 px-5 pt-3 bg-white dark:bg-[#0f1117] border-t border-gray-100 dark:border-white/[0.08]" style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))" }}>
            <SaveDeleteFooter
              saveLabel="Update"
              onSave={() => { if (canSave) { onSave(imgUrl, photoDate); onClose(); } }}
              saveDisabled={!canSave}
              onDelete={async () => { onDelete(); onClose(); }}
              deleteTitle="Delete this progress photo?"
              deleteAriaLabel="Delete progress photo"
            />
          </div>
        ) : (
          <div className="sticky bottom-0 px-5 pt-3 bg-white dark:bg-[#0f1117] border-t border-gray-100 dark:border-white/[0.08]" style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))" }}>
            <button disabled={!canSave} aria-disabled={!canSave || undefined} onClick={() => { if (canSave) { onSave(imgUrl, photoDate); onClose(); } }}
              className="btn-pill btn-primary w-full">
              Save
            </button>
          </div>
        )}
      </div>
    </ModalShell>
    {dialog}
    </>
  );
}

// ── Generic (Weight, and any future metric) ───────────────────────────────────
function GenericMetricModal({ open, onClose, label, unit, value, placeholder, onSave, onDelete, validate }) {
  const [val, setVal] = useState("");
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);
  useEffect(() => { if (open) { setVal(value && value !== "–" ? String(value) : ""); setError(""); setTouched(false); } }, [open, value]);

  // The range the save itself checks, run live so the button can follow it.
  const rangeMessage = validate ? validate(val) : "";
  const invalidMessage = rangeMessage || (isAboveZero(val) ? "" : `Enter a ${label.toLowerCase()} above 0.`);
  const edited = hasChanged({ value: val }, { value });
  const canSave = isAboveZero(val) && !rangeMessage && edited;
  const shownError = error || (touched && !isBlank(val) ? invalidMessage : "");

  const { requestClose, dialog } = useDiscardConfirm({ dirty: () => edited, onClose });
  const sheetRef = useModal({ open, onDismiss: requestClose });

  if (!open) return null;

  const handleSave = () => {
    if (!canSave) { setTouched(true); setError(""); return; }
    onSave(val);
    onClose();
  };

  return (
    <>
    <ModalShell onClose={requestClose}>
      <div ref={sheetRef} role="dialog" aria-modal="true" aria-label={`Update ${label}`} tabIndex={-1} className="relative bg-white dark:bg-[#0f1117] rounded-3xl w-full max-w-sm min-w-0 max-h-[92dvh] overflow-y-auto overflow-x-hidden no-scrollbar sheet-lock p-6 shadow-2xl dark:shadow-[0_8px_40px_rgba(0,0,0,0.6)] border border-transparent dark:border-white/[0.07] outline-none">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-[#E8E9F0] mb-4">Update {label}</h2>
        <label className="text-sm text-gray-400 dark:text-[#9A9DAE] mb-2 block">{label}</label>
        <div className={`flex items-center border rounded-xl px-4 py-3 mb-1 dark:bg-white/[0.05] ${shownError ? "border-red-400" : "border-gray-200 dark:border-white/[0.1]"}`}>
          <input
            type="text" inputMode="decimal"
            value={val}
            onChange={(e) => { setVal(numericOnly(e.target.value)); setError(""); }}
            onFocus={(e) => e.target.select()}
            onBlur={() => setTouched(true)}
            placeholder={placeholder || "0.0"}
            className="flex-1 min-w-0 outline-none text-lg font-medium bg-transparent text-gray-900 dark:text-[#E8E9F0] placeholder-gray-300 dark:placeholder-[#9A9DAE]"
            autoFocus
          />
          <span className="flex-shrink-0 whitespace-nowrap text-gray-400 dark:text-[#9A9DAE] text-sm ml-2">{unit}</span>
        </div>
        {shownError && <p className="text-xs text-red-500 mb-4">{shownError}</p>}
        {!shownError && <div className="mb-5" />}
        <SaveDeleteFooter
          small
          cancelLabel="Cancel"
          onCancel={requestClose}
          saveLabel="Save"
          onSave={handleSave}
          saveDisabled={!canSave}
          onDelete={onDelete}
          deleteTitle={`Delete this ${label.toLowerCase()} entry?`}
          deleteAriaLabel={`Delete ${label.toLowerCase()} entry`}
        />
      </div>
    </ModalShell>
    {dialog}
    </>
  );
}

export default function AddMetricModal({ open, onClose, label, unit, value, dayKey, placeholder, onSave, onDelete, validate }) {
  if (label === "Exercise") {
    return <ExerciseModal open={open} onClose={onClose} value={value} onSave={onSave} onDelete={onDelete} />;
  }
  if (label === "Progress") {
    return <ProgressModal open={open} onClose={onClose} value={value} dayKey={dayKey} onSave={onSave} onDelete={onDelete || (() => onSave("–"))} />;
  }
  return <GenericMetricModal open={open} onClose={onClose} label={label} unit={unit} value={value} placeholder={placeholder} onSave={onSave} onDelete={onDelete} validate={validate} />;
}