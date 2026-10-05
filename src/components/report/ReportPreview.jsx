import React from "react";
import SummaryTiles from "@/components/report/SummaryTiles";
import WeightDoseChart from "@/components/report/WeightDoseChart";
import WeightTable from "@/components/report/WeightTable";
import DoseTable from "@/components/report/DoseTable";
import SideEffectsTable from "@/components/report/SideEffectsTable";
import OptionalSections from "@/components/report/OptionalSections";
import SectionBoundary from "@/components/report/SectionBoundary";
import { NO_DOSES_LINE, NO_WEIGHT_LINE } from "@/lib/reportData";
import { useReportTokens } from "@/components/report/ReportTheme";

/** One report section. If its content fails, only this section shows a message. */
function Section({ title, children, t }) {
  return (
    <section className="pt-4 mt-4 border-t" style={{ borderColor: t.divider }}>
      <h3 className="text-base font-bold mb-1" style={{ color: t.ink }}>{title}</h3>
      <div className="h-0.5 w-10 rounded mb-3" style={{ background: t.accent }} />
      <SectionBoundary title={title}>{children}</SectionBoundary>
    </section>
  );
}

/**
 * The on-screen report — one component driven entirely by the report engine and
 * the report tokens, so it mirrors the PDF's content and order: header, summary
 * tiles, weight progress, doses taken, side effects, then the optional sections.
 * In "app theme" it follows the live light/dark theme; in "PDF look" it is
 * painted with the always-light PDF tokens, which is exactly what gets exported.
 */
export default function ReportPreview({ report }) {
  const t = useReportTokens();
  const header = report.header;
  const unit = report.unit;
  const has = (id) => report.sections.includes(id);
  const adherence = report.doses.adherence;

  return (
    <div
      className="report-page rounded-2xl border p-5 min-w-0 overflow-x-hidden break-words"
      style={{ background: t.cardBg, borderColor: t.cardBorder, color: t.ink }}
    >
      {/* 1. Header — title and generated date, then only the details that exist. */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="text-xl font-bold" style={{ color: t.ink }}>Levli Health Report</h2>
        <p className="text-sm" style={{ color: t.muted }}>Generated {header.generatedLabel}</p>
      </div>
      <div className="text-sm mt-2 space-y-0.5" style={{ color: t.muted }}>
        {header.name && <p className="break-words">Report name: {header.name}</p>}
        {header.heightLabel && <p className="break-words">Height: {header.heightLabel}</p>}
        <p className="break-words">Period: {header.periodLabel}</p>
        {header.medications.length > 0 && (
          <p className="break-words">
            Medication{header.medications.length === 1 ? "" : "s"}: {header.medications.join(", ")}
          </p>
        )}
      </div>

      {/* 2. Summary tiles — only the values that exist. */}
      <Section title="Summary" t={t}>
        <SummaryTiles tiles={report.summaryTiles} />
        {!report.has.weight && (
          <p className="text-sm mt-3" style={{ color: t.muted }}>{NO_WEIGHT_LINE}</p>
        )}
      </Section>

      {/* 3. Weight progress — the chart, then the compact entry table. */}
      {has("weight") && report.has.weight && (
        <Section title="Weight progress" t={t}>
          {report.weight.count >= 2 ? (
            <WeightDoseChart series={report.weight.series} rows={report.doses.rows} unit={unit} range={report.range} />
          ) : (
            <p className="text-sm" style={{ color: t.muted }}>One weight entry in this period, so there is no trend line.</p>
          )}
          <WeightTable rows={report.weight.table} />
        </Section>
      )}

      {/* 4. Doses taken — the generated one-line summary, adherence, the table,
          then the duplicate note and the medication / route footnote. */}
      {has("doses") && (
        <Section title="Doses taken" t={t}>
          {report.doses.count === 0 ? (
            <p className="text-sm" style={{ color: t.muted }}>{NO_DOSES_LINE}</p>
          ) : (
            <>
              <p className="text-sm mb-1 break-words" style={{ color: t.ink }}>{report.doses.changes.join(" · ")}</p>
              <p className="text-sm mb-3" style={{ color: t.muted }}>
                {adherence.scheduled
                  ? `Shots logged: ${adherence.logged} of ${adherence.scheduled} scheduled doses (${adherence.days}-day range).`
                  : `Shots logged: ${adherence.logged}.`}
              </p>
              <DoseTable rows={report.doses.rows} showSiteAndPain={has("injectionSites")} />
              {report.doses.duplicateNote && (
                <p className="text-sm mt-2" style={{ color: t.ink }}>{report.doses.duplicateNote}</p>
              )}
              {report.doses.footnotes.map((line) => (
                <p key={line} className="text-sm mt-1 break-words" style={{ color: t.muted }}>{line}</p>
              ))}
            </>
          )}
        </Section>
      )}

      {/* 5. Side effects. */}
      {has("sideEffects") && (
        <Section title="Side effects" t={t}>
          <SideEffectsTable rows={report.sideEffects.rows} />
        </Section>
      )}

      <OptionalSections report={report} />
    </div>
  );
}