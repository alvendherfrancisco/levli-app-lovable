import React, { useMemo, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { buildReport } from "@/lib/reportData";
import { buildReportPdf } from "@/lib/reportPdf";
import { shareOrDownloadPdf } from "@/lib/shareReport";
import { toast } from "@/lib/toast";
import ReportPreview from "@/components/report/ReportPreview";
import { ReportThemeProvider } from "@/components/report/ReportTheme";

/**
 * One test fixture, rendered through the real report engine and the real
 * preview. Test-only screen: the fixtures live outside the report template, so
 * nothing here is ever part of a user's report.
 */
export default function FixtureCard({ fixture }) {
  const report = useMemo(() => buildReport(fixture.state, fixture.options), [fixture]);
  const [busy, setBusy] = useState(false);

  const exportPdf = async () => {
    setBusy(true);
    try {
      const doc = await buildReportPdf(report);
      await shareOrDownloadPdf(doc, `levli-report-fixture-${fixture.id}.pdf`);
    } catch (err) {
      console.error("Fixture export failed:", err);
      toast.error("Could not create the PDF.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
      <div className="flex items-start justify-between gap-3 px-4 pt-4">
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">{fixture.title}</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{fixture.note}</p>
        </div>
        <button
          onClick={exportPdf}
          disabled={busy}
          className="shrink-0 min-h-[44px] px-3 rounded-xl bg-indigo-600 text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-60"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} PDF
        </button>
      </div>
      <div className="p-4">
        <ReportThemeProvider mode="pdf">
          <ReportPreview report={report} />
        </ReportThemeProvider>
      </div>
    </section>
  );
}