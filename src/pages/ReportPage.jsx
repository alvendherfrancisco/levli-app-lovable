import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Crown, Download, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "@/lib/toast";
import { useAppState } from "@/lib/AppState";
import { useSubscription } from "@/lib/SubscriptionContext";
import { buildReport, medicationList } from "@/lib/reportData";
import {
  CORE_IDS, DEFAULT_RANGE, RANGE_OPTIONS, SHARE_NOTICE, loadReportPrefs, normaliseSections, saveReportPrefs,
} from "@/lib/reportOptions";
import { buildReportPdf } from "@/lib/reportPdf";
import { reportFileName, shareOrDownloadPdf } from "@/lib/shareReport";
import ReportOptions from "@/components/report/ReportOptions";
import ReportPreview from "@/components/report/ReportPreview";
import ReportEmptyState from "@/components/report/ReportEmptyState";
import ReportStatusScreen from "@/components/report/ReportStatusScreen";
import PreviewModeToggle from "@/components/report/PreviewModeToggle";
import { ReportThemeProvider } from "@/components/report/ReportTheme";

const WEIGHT_UNITS = ["lb", "kg"];

export default function ReportPage() {
  const navigate = useNavigate();
  const {
    shots, weightHistory, dayMetrics, adverseEvents, journalEntries, progressPhotosList, profile,
    shotsLoading, loadShots, refreshProfile,
  } = useAppState();
  const { isPremium, openPaywall } = useSubscription();

  const prefs = useRef(loadReportPrefs());
  const unitChosenByUser = useRef(!!prefs.current.weightUnit);

  const [options, setOptions] = useState({
    // Anything unusable in the remembered choices falls back to the defaults,
    // so the page never depends on state saved by another screen.
    rangeId: RANGE_OPTIONS.some((r) => r.id === prefs.current.rangeId) ? prefs.current.rangeId : DEFAULT_RANGE,
    customFrom: typeof prefs.current.customFrom === "string" ? prefs.current.customFrom : "",
    customTo: typeof prefs.current.customTo === "string" ? prefs.current.customTo : "",
    medication: typeof prefs.current.medication === "string" ? prefs.current.medication : "all",
    weightUnit: WEIGHT_UNITS.includes(prefs.current.weightUnit) ? prefs.current.weightUnit : "lb",
    name: typeof prefs.current.name === "string" ? prefs.current.name : "",
    sections: normaliseSections(prefs.current.sections),
  });
  const [busy, setBusy] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  // "app" follows the live theme; "pdf" shows the always-light exported look.
  const [previewMode, setPreviewMode] = useState("app");
  const [timedOut, setTimedOut] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // The unit follows the Profile setting until it is changed here.
  useEffect(() => {
    if (unitChosenByUser.current) return;
    const stored = profile?.weight_unit;
    if (!WEIGHT_UNITS.includes(stored)) return;
    setOptions((prev) => (prev.weightUnit === stored ? prev : { ...prev, weightUnit: stored }));
  }, [profile?.weight_unit]);

  // A load that never finishes says so after 15s instead of showing nothing.
  useEffect(() => {
    if (!shotsLoading) {
      setTimedOut(false);
      return undefined;
    }
    const timer = setTimeout(() => setTimedOut(true), 15000);
    return () => clearTimeout(timer);
  }, [shotsLoading, reloadKey]);

  const retry = () => {
    setTimedOut(false);
    setReloadKey((key) => key + 1);
    loadShots?.();
    refreshProfile?.();
  };

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
        <header
          className="w-full sticky top-0 z-30 grid items-center px-5 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800"
          style={{
            gridTemplateColumns: "1fr auto 1fr",
            paddingTop: "calc(0.75rem + env(safe-area-inset-top, 0px))",
            paddingBottom: "0.75rem",
          }}
        >
          <button
            onClick={() => navigate(-1)}
            aria-label="Back"
            className="justify-self-start flex items-center gap-1 min-w-[44px] min-h-[44px] text-indigo-600 dark:text-indigo-400"
          >
            <ChevronLeft size={22} /><span className="font-medium">Back</span>
          </button>
          <h1 className="text-center whitespace-nowrap text-[18px] font-semibold text-gray-900 dark:text-white">Report</h1>
          <span aria-hidden="true" />
        </header>
        <div className="max-w-lg mx-auto px-4 py-10 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-500/15 flex items-center justify-center mb-4">
            <Crown size={30} className="text-indigo-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Report export is a premium feature</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-sm">Upgrade to Levli Premium to generate and share a PDF summary for your doctor.</p>
          <button onClick={openPaywall} className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold">Unlock with Levli Premium</button>
        </div>
      </div>
    );
  }

  if (shotsLoading) {
    return <ReportStatusScreen failed={timedOut} onRetry={retry} />;
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-screen w-full">
      <header
        className="w-full sticky top-0 z-30 grid items-center px-5 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800"
        style={{
          gridTemplateColumns: "1fr auto 1fr",
          paddingTop: "calc(0.75rem + env(safe-area-inset-top, 0px))",
          paddingBottom: "0.75rem",
        }}
      >
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="justify-self-start flex items-center gap-1 min-w-[44px] min-h-[44px] text-indigo-600 dark:text-indigo-400"
        >
          <ChevronLeft size={22} /><span className="font-medium">Back</span>
        </button>
        <h1 className="text-center whitespace-nowrap text-[18px] font-semibold text-gray-900 dark:text-white">Report</h1>
        <button
          onClick={handleExport}
          disabled={busy || !report.hasAnyData}
          aria-label="Download or share PDF"
          className="justify-self-end flex items-center justify-center min-w-[44px] min-h-[44px] text-indigo-600 dark:text-indigo-400 disabled:opacity-40"
        >
          {busy ? <Loader2 size={20} className="animate-spin" /> : <Download size={22} />}
        </button>
      </header>

      {/* A single readable column, widened on larger screens: the report is a
          document, and the options, the preview and the buttons all belong to
          that one column. */}
      <div className="max-w-lg md:max-w-2xl mx-auto px-4 py-4 space-y-4">
        <ReportOptions
          options={options}
          onChange={updateOptions}
          medications={medications}
          available={report.available}
        />

        {report.hasAnyData && showPreview && (
          <PreviewModeToggle mode={previewMode} onChange={setPreviewMode} />
        )}

        {!report.hasAnyData ? (
          <ReportEmptyState rangeLabel={report.range.label} onAllTime={() => updateOptions({ rangeId: "all" })} />
        ) : showPreview ? (
          <ReportThemeProvider mode={previewMode}>
            <ReportPreview report={report} />
          </ReportThemeProvider>
        ) : null}

        <div className="space-y-2" style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}>
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