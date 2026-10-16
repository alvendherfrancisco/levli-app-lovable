import React from "react";
import WeightDoseChart from "@/components/report/WeightDoseChart";
import DoseTable from "@/components/report/DoseTable";
import SideEffectsTable from "@/components/report/SideEffectsTable";
import OptionalSections from "@/components/report/OptionalSections";
import SectionBoundary from "@/components/report/SectionBoundary";
import SummaryFigures from "@/components/report/SummaryFigures";
import ReportTable from "@/components/report/ReportTable";
import {
  doseCountLine, duplicateLine, formatDayShort, medicationLine, summaryFigures, weightContextLine,
} from "@/lib/reportData";
import { useReportTokens } from "@/components/report/ReportTheme";

/**
 * One report section: a plain bold heading over a thin divider, so the report
 * reads as a document rather than as a set of decorated cards. If the section's
 * content fails, only this section shows a message.
 */
function Section({ title, children, t }) {
  return (
    <section className="pt-4 mt-4 border-t" style={{ borderColor: t.divider }}>
      <h3 className="text-base font-bold mb-3" style={{ color: t.ink }}>{title}</h3>
      <SectionBoundary title={title}>{children}</SectionBoundary>
    </section>
  );
}

/**
 * The on-screen report — one component driven entirely by the report tokens, so
 * it mirrors the PDF's content and layout. It paints itself in the app's own
 * theme (light or dark), and everything that is not a colour — the layout, the
 * sections and their order, the type, the spacing — is the PDF's own; the
 * exported PDF is always the light one.
 *
 * It reads the same strings the PDF is drawn from, so the summary, the section
 * wording and the notes can never say one thing on screen and another in print.
 *
 * With `locked` — an account without Levli Premium — the same report is still
 * drawn, but only its own header is left readable: the sections below are held
 * at a fixed height under a blur that takes no tap and no scroll, the card's own
 * surface fades up over them, and the `overlay` (the lock, see ReportLock) sits
 * centred on that part. That is why the scrim is drawn here rather than by the
 * lock: only this component knows the surface the current theme has given the
 * card, so the fade can end exactly on it in light and in dark mode.
 */
export default function ReportPreview({ report, locked = false, overlay = null }) {
  const t = useReportTokens();
  const header = report.header;
  const unit = report.unit;
  const weight = report.weight;
  const summary = report.summary;
  const has = (id) => report.sections.includes(id);
  const figures = summaryFigures(summary, unit);
  const severityColour = (key) => t.severity?.[key] || t.severity?.none || undefined;

  // Everything under the header: the sections themselves, in the PDF's own order.
  // Drawn in full for an account with Premium, and drawn from these same lines —
  // never a second, shorter version — behind the lock.
  const sections = (
    <>
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
          {summary.goalBmiNote && (
            <p className="text-sm mt-2 break-words" style={{ color: t.muted }}>{summary.goalBmiNote}</p>
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
                <WeightDoseChart series={weight.series} rows={report.doses.rows} unit={unit} range={report.range} />
              )}
              {weight.firstLast?.length > 0 && (
                <div className="mt-3">
                  <ReportTable
                    rows={weight.firstLast}
                    rowKey={(row) => row.id}
                    columns={[
                      { label: "Entry", text: (row) => row.label, lead: true },
                      { label: "Date", text: (row) => row.dayLabel },
                      { label: "Weight", text: (row) => row.value, strong: true },
                    ]}
                  />
                </div>
              )}
              {weight.count >= 2 && (
                <p className="text-sm mt-3" style={{ color: t.muted }}>{weightContextLine(weight, unit)}</p>
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
        <Section title="Doses taken (newest first)" t={t}>
          {report.doses.count === 0 ? (
            <p className="text-sm" style={{ color: t.muted }}>No doses logged in this period.</p>
          ) : (
            <>
              <p className="text-sm mb-1 break-words" style={{ color: t.muted }}>
                {doseCountLine(report.doses.count, report.doses.adherence)}
              </p>
              {report.doses.changes.map((line) => (
                <p key={line} className="text-sm break-words" style={{ color: t.muted }}>{line}</p>
              ))}
              <div className={report.doses.changes.length ? "mt-3" : ""}>
                <DoseTable rows={report.doses.rows} showPain={has("injectionSites")} />
              </div>
              {summary.duplicates.map((group, index) => (
                <p key={`${group.dayLabel}-${group.time}-${index}`} className="text-sm mt-2 break-words" style={{ color: t.muted }}>
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
              <SideEffectsTable rows={report.sideEffects.rows} severityColour={severityColour} />
              {report.sideEffects.frequency.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-semibold mb-2" style={{ color: t.ink }}>How often each side effect was logged</p>
                  <ul className="space-y-1">
                    {report.sideEffects.frequency.map((row) => (
                      <li
                        key={row.label}
                        className="flex items-baseline justify-between gap-3 text-sm"
                        style={{ color: t.muted }}
                      >
                        <span className="min-w-0 break-words">{row.label}</span>
                        <span className="flex-shrink-0 font-semibold" style={{ color: t.ink }}>{row.count}</span>
                      </li>
                    ))}
                  </ul>
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
    </>
  );

  return (
    <div
      className="report-page rounded-2xl border p-4 sm:p-5 min-w-0 overflow-x-hidden break-words"
      style={{ background: t.cardBg, borderColor: t.cardBorder, color: t.ink }}
    >
      <h2 className="text-xl font-bold" style={{ color: t.ink }}>Levli Health Report</h2>
      <div className="text-sm mt-1 space-y-0.5" style={{ color: t.muted }}>
        {header.name && <p className="break-words">Name: {header.name}</p>}
        <p className="break-words">Date range: {header.rangeLabel}</p>
        <p className="break-words">Generated: {header.generatedLabel}</p>
      </div>

      {locked ? (
        <div className="relative mt-4 h-[340px] overflow-hidden">
          {/* The report, kept as it is and held under the blur: no tap, no
              selection, and no scrolling it into focus. */}
          <div aria-hidden="true" className="pointer-events-none select-none blur-[6px]">
            {sections}
          </div>
          {/* The card's own surface, fading up from nothing to flat. */}
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{ background: `linear-gradient(to bottom, ${t.cardBg}00 0%, ${t.cardBg}B3 45%, ${t.cardBg} 100%)` }}
          />
          {/* The lock sits in the lower part of the blocked area rather than in
              the middle of it: the blurred lines stay readable above it, and the
              gradient behind it has already reached the card's own flat surface
              by the time the artwork starts, so nothing overlaps blurred text. */}
          <div className="absolute inset-0 flex items-end justify-center pb-4">{overlay}</div>
        </div>
      ) : (
        sections
      )}
    </div>
  );
}