import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Crown, Download, Eye, Loader2 } from "lucide-react";
import { toast } from "@/lib/toast";
import { useAppState } from "@/lib/AppState";
import { useSubscription } from "@/lib/SubscriptionContext";
import { buildReport, medicationList } from "@/lib/reportData";
import {
  CORE_IDS, DEFAULT_RANGE, RANGE_OPTIONS, REPORT_TAGLINE, SHARE_NOTICE, loadReportPrefs, normaliseSections,
  saveReportPrefs,
} from "@/lib/reportOptions";
import { buildReportPdf } from "@/lib/reportPdf";
import { reportFileName, downloadPdf } from "@/lib/shareReport";
import ReportOptions from "@/components/report/ReportOptions";
import ReportPreview from "@/components/report/ReportPreview";
import ReportEmptyState from "@/components/report/ReportEmptyState";
import ReportStatusScreen from "@/components/report/ReportStatusScreen";
import { ReportThemeProvider } from "@/components/report/ReportTheme";

export default function ReportPage() {
  const navigate = useNavigate();
  const {
    shots, weightHistory, dayMetrics, adverseEvents, journalEntries, progressPhotosList, profile, medications,
    shotsLoading, loadShots, refreshProfile,
  } = useAppState();
  const { isPremium, openPaywall } = useSubscription();

  const prefs = useRef(loadReportPrefs());
  const nameChosenByUser = useRef(!!prefs.current.name);

  const [options, setOptions] = useState({
    // Anything unusable in the remembered choices falls back to the defaults,
    // so the page never depends on state saved by another screen.
    rangeId: RANGE_OPTIONS.some((r) => r.id === prefs.current.rangeId) ? prefs.current.rangeId : DEFAULT_RANGE,
    customFrom: typeof prefs.current.customFrom === "string" ? prefs.current.customFrom : "",
    customTo: typeof prefs.current.customTo === "string" ? prefs.current.customTo : "",
    medication: typeof prefs.current.medication === "string" ? prefs.current.medication : "all",
    name: typeof prefs.current.name === "string" ? prefs.current.name : "",
    sections: normaliseSections(prefs.current.sections),
  });
  const [busy, setBusy] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [timedOut, setTimedOut] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // The name starts from the first name saved in About you. Once the field has
  // been typed in, that is what is used — the prefilled value never overwrites it.
  useEffect(() => {
    if (nameChosenByUser.current) return;
    const saved = String(profile?.first_name || "").trim();
    if (!saved) return;
    setOptions((prev) => (prev.name ? prev : { ...prev, name: saved }));
  }, [profile?.first_name]);

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

  const medicationsInLog = useMemo(() => medicationList(shots), [shots]);
  const medication = options.medication === "all" || medicationsInLog.includes(options.medication)
    ? options.medication
    : "all";

  // The weight unit is never chosen here: it follows Settings, through the
  // profile, so the report and the app always read in the same unit.
  const report = useMemo(() => buildReport(
    { shots, weightHistory, dayMetrics, adverseEvents, journalEntries, progressPhotosList, profile, medications },
    { ...options, medication },
  ), [
    shots, weightHistory, dayMetrics, adverseEvents, journalEntries, progressPhotosList, profile, medications,
    options, medication,
  ]);

  const updateOptions = (patch) => {
    if ("name" in patch) nameChosenByUser.current = true;
    const next = { ...options, ...patch };
    setOptions(next);
    saveReportPrefs({
      rangeId: next.rangeId,
      customFrom: next.customFrom,
      customTo: next.customTo,
      medication: next.medication,
      name: next.name,
      sections: next.sections.filter((id) => !CORE_IDS.includes(id)),
    });
  };

  const handleExport = async () => {
    setBusy(true);
    try {
      const doc = await buildReportPdf(report);
      downloadPdf(doc, reportFileName());
      toast.success("Report saved as a PDF");
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
          <button onClick={openPaywall} className="btn-pill btn-primary mt-6">Unlock with Levli Premium</button>
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
        {/* The header carries no second download action: the one main button at
            the foot of the screen is the only way the report is exported. */}
        <span aria-hidden="true" />
      </header>

      {/* A single readable column — the settings, the preview and the button all
          belong to it — with room kept at the foot for the fixed button bar. */}
      <div className="max-w-lg md:max-w-2xl mx-auto px-4 pt-4 pb-40 space-y-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">{REPORT_TAGLINE}</p>

        <ReportOptions
          options={options}
          onChange={updateOptions}
          medications={medicationsInLog}
          available={report.available}
        />

        {!report.hasAnyData ? (
          <ReportEmptyState isAllTime={!!report.range.allTime} onAllTime={() => updateOptions({ rangeId: "all" })} />
        ) : showPreview ? (
          <>
            {/* Sits directly under the page header while the report is read, so
                the preview can be put away and brought back from one place. */}
            <div className="sticky top-[calc(4.25rem_+_env(safe-area-inset-top,0px))] z-20 -mx-1 px-1 py-2 bg-gray-50 dark:bg-gray-950">
              <div className="flex items-center justify-end">
                <button type="button" onClick={() => setShowPreview(false)} className="btn-link text-sm">
                  Hide preview
                </button>
              </div>
            </div>
            {/* One preview, in the app's own theme: dark surface with light text
                in dark mode, white with dark text in light mode. Only the colours
                follow the theme — the layout, the sections and their order, the
                type, the spacing and every line of content are the PDF's own, so
                what is read here is what is exported. The exported PDF itself is
                always the light one, whatever theme the app is in. */}
            <ReportThemeProvider>
              <ReportPreview report={report} />
            </ReportThemeProvider>
          </>
        ) : (
          <button type="button" onClick={() => setShowPreview(true)} className="btn-link text-sm mx-auto py-2">
            <Eye size={15} aria-hidden="true" /> Show preview
          </button>
        )}
      </div>

      {/* One main action, fixed at the foot of the screen so it is always
          reachable, with the sharing note directly above it. */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
        <div
          className="max-w-lg md:max-w-2xl mx-auto px-4 pt-3 space-y-2"
          style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
        >
          <p className="text-[11px] text-gray-500 dark:text-gray-400 text-center px-2">{SHARE_NOTICE}</p>
          <button
            onClick={handleExport}
            disabled={busy || !report.hasAnyData}
            className="btn-pill btn-primary w-full"
          >
            {busy ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Download size={16} aria-hidden="true" />}
            {busy ? "Generating…" : "Download"}
          </button>
        </div>
      </div>
    </div>
  );
}