import React from "react";
import WeightDoseChart from "@/components/report/WeightDoseChart";
import DoseTable from "@/components/report/DoseTable";
import SideEffectsTable from "@/components/report/SideEffectsTable";
import SideEffectBars from "@/components/report/SideEffectBars";
import OptionalSections from "@/components/report/OptionalSections";
import SectionBoundary from "@/components/report/SectionBoundary";
import SummaryFigures from "@/components/report/SummaryFigures";
import {
  adherenceLine, duplicateLine, formatDayShort, medicationLine, summaryFigures, weightContextLine,
} from "@/lib/reportData";
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
 * The on-screen report — one component driven entirely by the report tokens, so
 * it mirrors the PDF's content and layout. In "app theme" it follows the live
 * light/dark theme; in "PDF look" it is painted with the always-light PDF
 * tokens, which is exactly what gets exported.
 *
 * It reads the same strings the PDF is drawn from, so the summary, the empty
 * sections and the notes can never say one thing on screen and another in print.
 */
export default function ReportPreview({ report }) {
  const t = useReportTokens();
  const header = report.header;
  const unit = report.unit;
  const weight = report.weight;
  const summary = report.summary;
  const has = (id) => report.sections.includes(id);
  const figures = summaryFigures(summary, unit);

  return (
    <div
      className="report-page rounded-2xl border p-5 min-w-0 overflow-x-hidden break-words"
      style={{ background: t.cardBg, borderColor: t.cardBorder, color: t.ink }}
    >
      <h2 className="text-xl font-bold" style={{ color: t.ink }}>Levli Health Report</h2>
      <div className="text-sm mt-1 space-y-0.5" style={{ color: t.muted }}>
        {header.name && <p className="break-words">Name: {header.name}</p>}
        <p className="break-words">Date range: {header.rangeLabel}</p>
        <p className="break-words">Generated: {header.generatedLabel}</p>
      </div>

      {(summary.medications.length > 0 || figures.length > 0) && (
        <Section title="Summary" t={t}>
          <div className="space-y-1">
            {summary.medications.map((group) => (
              <p key={group.name} className="text-sm font-semibold break-words" style={{ color: t.ink }}>
                {medicationLine(group)}
              </p>
            ))}
          </div>
          {figures.length > 0 && (
            <div className={summary.medications.length ? "mt-3" : ""}>
              <SummaryFigures figures={figures} />
            </div>
          )}
        </Section>
      )}

      {has("weight") && (
        <Section title="Weight" t={t}>
          {weight.count === 0 ? (
            <p className="text-sm" style={{ color: t.muted }}>No weight entries in this period.</p>
          ) : (
            <>
              {weight.count < 2 && (
                <p className="text-sm" style={{ color: t.muted }}>One weight entry in this period.</p>
              )}
              {weight.count >= 2 && (
                <>
                  <WeightDoseChart series={weight.series} rows={report.doses.rows} unit={unit} range={report.range} />
                  <p className="text-sm mt-3" style={{ color: t.muted }}>{weightContextLine(weight, unit)}</p>
                </>
              )}
              {weight.gaps.length > 0 && (
                <div className="mt-2 space-y-1">
                  {weight.gaps.map((gap) => (
                    <p key={gap.from} className="text-sm" style={{ color: t.muted }}>
                      No weight entries between {formatDayShort(gap.from)} and {formatDayShort(gap.to)} ({gap.days} days).
                    </p>
                  ))}
                </div>
              )}
            </>
          )}
        </Section>
      )}

      {has("doses") && (
        <Section title="Doses taken" t={t}>
          {report.doses.count === 0 ? (
            <p className="text-sm" style={{ color: t.muted }}>No doses logged in this period.</p>
          ) : (
            <>
              <p className="text-sm mb-1 break-words" style={{ color: t.muted }}>
                {adherenceLine(report.doses.adherence, report.doses.count)}
              </p>
              {report.doses.changes.length > 1 && (
                <p className="text-sm mb-3 break-words" style={{ color: t.muted }}>
                  Dose: {report.doses.changes.join(" · ")}
                </p>
              )}
              <DoseTable rows={report.doses.rows} showPain={has("injectionSites")} />
              <p className="text-sm mt-2" style={{ color: t.muted }}>Newest dose first.</p>
              {summary.duplicates.map((group, index) => (
                <p key={`${group.dayLabel}-${group.time}-${index}`} className="text-sm mt-1 break-words" style={{ color: t.muted }}>
                  {duplicateLine(group)}
                </p>
              ))}
            </>
          )}
        </Section>
      )}

      {has("sideEffects") && (
        <Section title="Side effects" t={t}>
          {report.sideEffects.total === 0 ? (
            <p className="text-sm" style={{ color: t.muted }}>No side effects logged in this period.</p>
          ) : (
            <>
              <SideEffectsTable rows={report.sideEffects.rows} />
              {report.sideEffects.frequency.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-semibold mb-2" style={{ color: t.ink }}>How often each side effect was logged</p>
                  <SideEffectBars rows={report.sideEffects.frequency} />
                </div>
              )}
              <p className="text-sm mt-3" style={{ color: t.muted }}>
                Severe or persistent symptoms should be discussed with a healthcare provider.
              </p>
            </>
          )}
        </Section>
      )}

      <OptionalSections report={report} />
    </div>
  );
}