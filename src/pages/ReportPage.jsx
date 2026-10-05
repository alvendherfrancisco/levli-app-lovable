import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Crown, Download, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAppState } from "@/lib/AppState";
import { useSubscription } from "@/lib/SubscriptionContext";
import { buildReport, medicationList } from "@/lib/reportData";
import {
  CORE_IDS, DEFAULT_RANGE, SHARE_NOTICE, loadReportPrefs, normaliseSections, saveReportPrefs,
} from "@/lib/reportOptions";
import { buildReportPdf } from "@/lib/reportPdf";
import { reportFileName, shareOrDownloadPdf } from "@/lib/shareReport";
import ReportOptions from "@/components/report/ReportOptions";
import ReportPreview from "@/components/report/ReportPreview";
import ReportEmptyState from "@/components/report/ReportEmptyState";

export default function ReportPage() {
  const navigate = useNavigate();
  const {
    shots, weightHistory, dayMetrics, adverseEvents, journalEntries, progressPhotosList, profile,
  } = useAppState();
  const { isPremium, openPaywall } = useSubscription();

  const prefs = useRef(loadReportPrefs());
  const unitChosenByUser = useRef(!!prefs.current.weightUnit);

  const [options, setOptions] = useState({
    rangeId: prefs.current.rangeId || DEFAULT_RANGE,
    customFrom: prefs.current.customFrom || "",
    customTo: prefs.current.customTo || "",
    medication: prefs.current.medication || "all",
    weightUnit: prefs.current.weightUnit || profile?.weight_unit || "lb",
    name: prefs.current.name || "",
    sections: normaliseSections(prefs.current.sections || []),
  });
  const [busy, setBusy] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  // The unit follows the Profile setting until it is changed here.
  useEffect(() => {
    if (!unitChosenByUser.current && profile?.weight_unit) {
      setOptions((prev) => ({ ...prev, weightUnit: profile.weight_unit }));
    }
  }, [profile?.weight_unit]);

  const medications = useMemo(() => medicationList(shots), [shots]);
  const medication = options.medication === "all" || medications.includes(options.medication)
    ? options.medication
    : "all";

  const report = useMemo(() => buildReport(
    { shots, weightHistory, dayMetrics, adverseEvents, journalEntries, progressPhotosList, profile },
    { ...options, medication },
  ), [shots, weightHistory, dayMetrics, adverseEvents, journalEntries, progressPhotosList, profile, options, medication]);

  const updateOptions = (patch) => {
    if ("weightUnit" in patch) unitChosenByUser.current = true;
    const next = { ...options, ...patch };
    setOptions(next);
    saveReportPrefs({
      rangeId: next.rangeId,
      customFrom: next.customFrom,
      customTo: next.customTo,
      medication: next.medication,
      weightUnit: next.weightUnit,
      name: next.name,
      sections: next.sections.filter((id) => !CORE_IDS.includes(id)),
    });
  };

  const handleExport = async () => {
    setBusy(true);
    try {
      const doc = await buildReportPdf(report);
      const result = await shareOrDownloadPdf(doc, reportFileName());
      if (result === "downloaded") toast.success("Report saved as a PDF");
      if (result === "shared") toast.success("Report shared");
    } catch (err) {
      console.error("Report export failed:", err);
      toast.error("Could not create the report. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (!isPremium) {
    return (
      <div className="bg-gray-50 dark:bg-gray-950 min-h-screen w-full">
        <div className="w-full flex items-center justify-between px-5 pt-6 pb-4 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-30">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-indigo-600">
            <ChevronLeft size={22} /><span className="font-medium">Back</span>
          </button>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Report</h1>
          <span className="w-6" />
        </div>
        <div className="max-w-lg mx-auto px-4 py-10 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
            <Crown size={30} className="text-indigo-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Report export is a premium feature</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-sm">Upgrade to Levli Premium to generate and share a PDF summary for your doctor.</p>
          <button onClick={openPaywall} className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold">Unlock with Levli Premium</button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-screen w-full">
      <div className="w-full flex items-center justify-between px-5 pt-6 pb-4 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-30">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-indigo-600">
          <ChevronLeft size={22} /><span className="font-medium">Back</span>
        </button>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">Report</h1>
        <button onClick={handleExport} disabled={busy || !report.hasAnyData} className="text-indigo-600 disabled:opacity-40">
          {busy ? <Loader2 size={18} className="animate-spin" /> : <Download size={20} />}
        </button>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        <ReportOptions
          options={options}
          onChange={updateOptions}
          medications={medications}
          available={report.available}
        />

        {!report.hasAnyData ? (
          <ReportEmptyState rangeLabel={report.range.label} onAllTime={() => updateOptions({ rangeId: "all" })} />
        ) : showPreview ? (
          <ReportPreview report={report} />
        ) : null}

        <div className="space-y-2 pb-4">
          <p className="text-[11px] text-gray-500 dark:text-gray-400 text-center px-2">{SHARE_NOTICE}</p>
          <button
            onClick={handleExport}
            disabled={busy || !report.hasAnyData}
            className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {busy ? "Generating PDF…" : "Download / Share PDF"}
          </button>
          {report.hasAnyData && (
            <button
              onClick={() => setShowPreview((v) => !v)}
              className="w-full py-3 rounded-xl font-semibold text-sm bg-white dark:bg-white/[0.06] text-indigo-600 dark:text-indigo-400 border border-gray-200 dark:border-white/10 flex items-center justify-center gap-2"
            >
              {showPreview ? <><EyeOff size={16} /> Hide preview</> : <><Eye size={16} /> Preview report</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}