import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
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
import ReportLockView from "@/components/report/ReportLockView";
import ReportEmptyState from "@/components/report/ReportEmptyState";
import ReportStatusScreen from "@/components/report/ReportStatusScreen";
import ReportHeader from "@/components/report/ReportHeader";
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

  // How tall the fixed bar is, measured as it renders (see the spacer at the end
  // of the column).
  const barRef = useRef(null);
  const [barHeight, setBarHeight] = useState(0);

  useEffect(() => {
    const el = barRef.current;
    if (!el || typeof ResizeObserver === "undefined") return undefined;
    const measure = () => setBarHeight(Math.round(el.offsetHeight));
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    measure();
    return () => observer.disconnect();
    // The bar belongs to the screen's Premium state (see below), so the
    // measurement is taken again when the account's plan changes.
  }, [isPremium]);

  // The name starts from the first name saved in Profile. Once the field has
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

  // The report is put together only for an account with Premium. This is the one
  // screen that is Premium whole, so without it nothing of the person's own is
  // assembled at all — what the locked screen shows is an invented sample page
  // (see ReportLockView).
  //
  // The weight unit is never chosen here: it follows Settings, through the
  // profile, so the report and the app always read in the same unit.
  const report = useMemo(() => (isPremium ? buildReport(
    { shots, weightHistory, dayMetrics, adverseEvents, journalEntries, progressPhotosList, profile, medications },
    { ...options, medication },
  ) : null), [
    isPremium,
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
      // The account's entitlement is confirmed by the backend before a single
      // page is drawn, not only by this screen's own lock: no route into the
      // export — this button, the row on Profile, a deep link — can produce a
      // PDF for an account without Premium.
      const gate = await base44.functions.invoke("report-export-gate", {});
      if (!gate?.data?.allowed) {
        toast.error("Levli Premium is needed to export the report");
        openPaywall();
        return;
      }
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

  // The locked screen, whole: the header, and under it one blurred sample of this
  // very screen with the single lock group over it. Nothing scrolls, nothing on
  // the sample can be pressed, and nothing of the report is drawn behind the
  // blur. It comes before the loading gate: an account without Premium has no
  // report of its own to wait for.
  if (!isPremium) {
    return (
      <div className="flex h-[100dvh] flex-col overflow-hidden bg-gray-50 dark:bg-gray-950">
        <ReportHeader onBack={() => navigate(-1)} showBadge={false} />
        {/* Everything under the header, in the room that is left of the screen —
            the header keeps the status-bar inset, and the group is centred in it,
            clear of the foot of the screen. */}
        <div className="relative min-h-0 flex-1">
          <ReportThemeProvider>
            <ReportLockView onUnlock={openPaywall} />
          </ReportThemeProvider>
        </div>
      </div>
    );
  }

  if (shotsLoading) {
    return <ReportStatusScreen failed={timedOut} onRetry={retry} />;
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-screen w-full">
      {/* The screen is a Premium feature, and says so beside its own name, in the
          crown pill the app's locked cards already wear (see ReportHeader). */}
      <ReportHeader onBack={() => navigate(-1)} />

      {/* A single readable column — the settings, the preview and the button all
          belong to it — with room kept at the foot for the fixed button bar: the
          bar's own measured height, added as the last block of the column, so a
          taller bar (a wrapped note, a larger text size, the home indicator on
          one device and not another) can never leave anything under it. */}
      <div className="max-w-lg md:max-w-2xl mx-auto px-4 pt-4 space-y-4">
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

        {/* The room the fixed bar takes, measured as it renders. */}
        <div aria-hidden="true" style={{ height: barHeight + 16 }} />
      </div>

      {/* One main action, fixed at the foot of the screen so it is always
          reachable, with the sharing note directly above it. */}
      <div ref={barRef} className="fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
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
            {busy && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
            {busy ? "Generating…" : "Download"}
          </button>
        </div>
      </div>
    </div>
  );
}