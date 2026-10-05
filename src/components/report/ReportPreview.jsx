import React from "react";
import PaperPairs from "@/components/report/PaperPairs";
import WeightDoseChart from "@/components/report/WeightDoseChart";
import DoseTable from "@/components/report/DoseTable";
import SideEffectsTable from "@/components/report/SideEffectsTable";
import SideEffectBars from "@/components/report/SideEffectBars";
import OptionalSections from "@/components/report/OptionalSections";
import SectionBoundary from "@/components/report/SectionBoundary";
import { formatDayShort } from "@/lib/reportData";
import { useReportTokens } from "@/components/report/ReportTheme";

const signed = (value, digits = 1) =>
  value == null ? "—" : `${value < 0 ? "-" : "+"}${Math.abs(value).toFixed(digits)}`;

/**
 * Direction-aware goal wording. Above the goal weight there is still weight to
 * lose, so it reads "70 lb to go"; at or past the goal it reads "Goal reached".
 * It never says "below goal" when the reading is below it for the wrong reason.
 */
function goalText(goalDistance, unit) {
  if (!goalDistance) return "Not set";
  if (goalDistance.direction === "above") return `${goalDistance.value} ${unit} to go`;
  return "Goal reached";
}

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
 */
export default function ReportPreview({ report }) {
  const t = useReportTokens();
  const header = report.header;
  const unit = report.unit;
  const weight = report.weight;
  const has = (id) => report.sections.includes(id);

  return (
    <div
      className="report-page rounded-2xl border p-5 min-w-0 overflow-x-hidden break-words"
      style={{ background: t.cardBg, borderColor: t.cardBorder, color: t.ink }}
    >
      <h2 className="text-xl font-bold" style={{ color: t.ink }}>Levli Health Report</h2>
      {header.name && <p className="text-sm mt-1" style={{ color: t.muted }}>Name: {header.name}</p>}
      <div className="text-sm mt-1 space-y-0.5" style={{ color: t.muted }}>
        <p className="break-words">Date range: {header.rangeLabel}</p>
        <p className="break-words">Generated: {header.generatedLabel}</p>
        <p className="break-words">Medication{header.medications.length === 1 ? "" : "s"}: {header.medications.join(", ") || "—"}</p>
      </div>

      <Section title="At a glance" t={t}>
        <PaperPairs pairs={[
          ["Height", header.heightLabel || "Not recorded"],
          ["Starting weight", header.startWeight != null ? `${header.startWeight} ${unit}` : "—"],
          ["Current weight", header.endWeight != null ? `${header.endWeight} ${unit}` : "—"],
          ["Goal weight", header.goalWeight != null ? `${header.goalWeight} ${unit}` : "Not set"],
          ["Total change", header.change != null ? `${signed(header.change)} ${unit} (${signed(header.changePct)}%)` : "—"],
          ...(header.bmi != null ? [["BMI", String(header.bmi)]] : []),
        ]} />
        {header.bmi == null && header.heightLabel && (
          <p className="text-sm mt-2" style={{ color: t.muted }}>
            BMI is omitted because the height and weight on file do not produce a plausible value. Check your height and weight units in Profile.
          </p>
        )}
      </Section>

      {has("weight") && (
        <Section title="Weight progress" t={t}>
          {weight.count === 0 ? (
            <p className="text-sm" style={{ color: t.muted }}>No weight entries in this selected range.</p>
          ) : (
            <>
              <PaperPairs pairs={[
                ["Starting weight", `${weight.start} ${unit}`],
                ["Current weight", `${weight.end} ${unit}`],
                ["Total change", `${signed(weight.change)} ${unit}`],
                ["Change (%)", `${signed(weight.changePct)}%`],
                ["Average weekly change", weight.perWeek != null ? `${signed(weight.perWeek)} ${unit}` : "—"],
                ["Goal", weight.goalLabel ? `${weight.goalLabel} · ${goalText(weight.goalDistance, unit)}` : "Not set"],
                ["Entries", String(weight.count)],
                ["Period", weight.weeks ? `${weight.weeks} weeks` : "—"],
              ]} />
              {weight.count >= 2 ? (
                <div className="mt-4">
                  <WeightDoseChart series={weight.series} rows={report.doses.rows} unit={unit} range={report.range} />
                </div>
              ) : (
                <p className="text-sm mt-3" style={{ color: t.muted }}>Not enough entries in this range.</p>
              )}
              {weight.gaps.length > 0 && (
                <div className="mt-3 space-y-1">
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
            <p className="text-sm" style={{ color: t.muted }}>No doses logged in this selected range.</p>
          ) : (
            <>
              <p className="text-sm mb-1 break-words" style={{ color: t.muted }}>{report.doses.changes.join(" · ")}</p>
              <p className="text-sm mb-3" style={{ color: t.muted }}>
                {report.doses.adherence.scheduled
                  ? `Shots logged: ${report.doses.adherence.logged} of ${report.doses.adherence.scheduled} scheduled doses (${report.doses.adherence.days}-day range).`
                  : `Shots logged: ${report.doses.adherence.logged}.`}
              </p>
              <DoseTable
                rows={report.doses.rows}
                showPain={has("injectionSites")}
                showDetail={report.doses.rows.some((r) => r.detail)}
              />
            </>
          )}
        </Section>
      )}

      {has("sideEffects") && (
        <Section title="Side effects" t={t}>
          <SideEffectsTable rows={report.sideEffects.rows} />
          {report.sideEffects.frequency.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-semibold mb-2" style={{ color: t.ink }}>How often each side effect was logged</p>
              <SideEffectBars rows={report.sideEffects.frequency} />
            </div>
          )}
          {report.sideEffects.total > 0 && (
            <p className="text-sm mt-3" style={{ color: t.muted }}>
              Severe or persistent symptoms should be discussed with a healthcare provider.
            </p>
          )}
        </Section>
      )}

      <OptionalSections report={report} />
    </div>
  );
}