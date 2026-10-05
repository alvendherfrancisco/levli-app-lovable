import React from "react";
import PaperPairs from "@/components/report/PaperPairs";
import WeightDoseChart from "@/components/report/WeightDoseChart";
import DoseTable from "@/components/report/DoseTable";
import SideEffectsTable from "@/components/report/SideEffectsTable";
import SideEffectBars from "@/components/report/SideEffectBars";
import OptionalSections from "@/components/report/OptionalSections";
import SectionBoundary from "@/components/report/SectionBoundary";
import { formatDayShort } from "@/lib/reportData";

const signed = (value, digits = 1) =>
  value == null ? "—" : `${value < 0 ? "-" : "+"}${Math.abs(value).toFixed(digits)}`;

/** One report section. If its content fails, only this section shows a message. */
function Section({ title, children }) {
  return (
    <section className="pt-4 mt-4 border-t border-gray-200">
      <h3 className="text-sm font-bold text-gray-900 mb-1">{title}</h3>
      <div className="h-0.5 w-10 bg-indigo-600 rounded mb-3" />
      <SectionBoundary title={title}>{children}</SectionBoundary>
    </section>
  );
}

function goalText(goalDistance, unit) {
  if (!goalDistance) return "Not set";
  if (goalDistance.direction === "at") return "At goal";
  return `${goalDistance.value} ${unit} ${goalDistance.direction} goal`;
}

/**
 * The on-screen report — a white page that mirrors exactly what the PDF
 * contains, so what is reviewed is what gets shared.
 */
export default function ReportPreview({ report }) {
  const header = report.header;
  const unit = report.unit;
  const weight = report.weight;
  const has = (id) => report.sections.includes(id);

  return (
    <div className="bg-white text-gray-900 rounded-2xl border border-gray-200 p-5">
      <h2 className="text-xl font-bold">Levli Health Report</h2>
      {header.name && <p className="text-xs text-gray-500 mt-1">Name: {header.name}</p>}
      <div className="text-xs text-gray-500 mt-1 space-y-0.5">
        <p>Date range: {header.rangeLabel}</p>
        <p>Generated: {header.generatedLabel}</p>
        <p>Medication{header.medications.length === 1 ? "" : "s"}: {header.medications.join(", ") || "—"}</p>
      </div>

      <Section title="At a glance">
        <PaperPairs pairs={[
          ["Height", header.heightLabel || "Not recorded"],
          ["Starting weight", header.startWeight != null ? `${header.startWeight} ${unit}` : "—"],
          ["Current weight", header.endWeight != null ? `${header.endWeight} ${unit}` : "—"],
          ["Goal weight", header.goalWeight != null ? `${header.goalWeight} ${unit}` : "Not set"],
          ["Total change", header.change != null ? `${signed(header.change)} ${unit} (${signed(header.changePct)}%)` : "—"],
          ...(header.bmi != null ? [["BMI", String(header.bmi)]] : []),
        ]} />
        {header.bmi == null && header.heightLabel && (
          <p className="text-[11px] text-gray-500 mt-2">
            BMI is omitted because the height and weight on file do not produce a plausible value. Check the height and weight units in Profile.
          </p>
        )}
      </Section>

      {has("weight") && (
        <Section title="Weight progress">
          {weight.count === 0 ? (
            <p className="text-sm text-gray-500">No weight entries in this selected range.</p>
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
              <div className="mt-4">
                <WeightDoseChart series={weight.series} rows={report.doses.rows} unit={unit} range={report.range} />
              </div>
              {weight.gaps.length > 0 && (
                <div className="mt-3 space-y-1">
                  {weight.gaps.map((gap) => (
                    <p key={gap.from} className="text-[11px] text-gray-500">
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
        <Section title="Doses taken">
          {report.doses.count === 0 ? (
            <p className="text-sm text-gray-500">No doses logged in this selected range.</p>
          ) : (
            <>
              <p className="text-xs text-gray-600 mb-1">{report.doses.changes.join(" · ")}</p>
              <p className="text-xs text-gray-600 mb-3">
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
        <Section title="Side effects">
          <SideEffectsTable rows={report.sideEffects.rows} />
          {report.sideEffects.frequency.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-gray-900 mb-2">How often each side effect was logged</p>
              <SideEffectBars rows={report.sideEffects.frequency} />
            </div>
          )}
          {report.sideEffects.total > 0 && (
            <p className="text-xs text-gray-600 mt-3">
              Severe or persistent symptoms should be discussed with a healthcare provider.
            </p>
          )}
        </Section>
      )}

      <OptionalSections report={report} />
    </div>
  );
}