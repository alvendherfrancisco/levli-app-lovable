import React from "react";
import { ChevronDown } from "lucide-react";
import { REPORT_TAGLINE } from "@/lib/reportOptions";
import { useReportTokens } from "@/components/report/ReportTheme";
import { SHEET_DIVIDER, SHEET_FIELD, SHEET_FIELD_SELECT } from "@/components/modals/shot/sheetUi";

/**
 * The Report screen as a picture, for the screen's lock: the setup above (the
 * date range, the name on the report and "More options"), the "Hide preview"
 * line, and the report preview card under them — its title, the lines that say
 * who and which dates it covers, its summary, its headline figures, its chart
 * and its tables.
 *
 * Nothing on it is real. Every value is invented for the picture ("Alex Morgan",
 * "1 Jun – 31 Aug 2026", "-8.4 kg"), the chart is a drawn line rather than a
 * chart, and there is no field, button, chevron or list anywhere on the page —
 * so nothing behind the lock can be pressed, focused or read out. It reads no
 * data of any kind: no store, no profile, no records, so nothing of the
 * person's own is in the page to be found through the blur, a screenshot, or an
 * accessibility tool.
 *
 * The cards are the app's own: the setup card is drawn with the very field
 * classes the real form uses, and the preview card with the report's own theme
 * tokens (see src/components/report/reportTokens.js), so the picture follows the
 * live theme exactly as the real preview does, in light mode and in dark.
 */
const SAMPLE_STATS = [
  { label: "Weight change", value: "-8.4 kg" },
  { label: "% change", value: "-9.1%" },
  { label: "Rate / week", value: "-0.6 kg" },
  { label: "Current BMI", value: "28.3" },
];

const SAMPLE_DOSES = [
  { dose: "1 mg", date: "Mon 8 Sep", site: "Left thigh" },
  { dose: "1 mg", date: "Mon 1 Sep", site: "Right thigh" },
  { dose: "0.5 mg", date: "Mon 25 Aug", site: "Left abdomen" },
];

const LABEL = "text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2";

/** One report section: a bold heading over a thin divider, as the report draws it. */
function Section({ title, children, t }) {
  return (
    <section className="pt-4 mt-4 border-t" style={{ borderColor: t.divider }}>
      <h3 className="text-base font-bold mb-3" style={{ color: t.ink }}>{title}</h3>
      {children}
    </section>
  );
}

/** A table row reduced to its shape: a bar the length of a line of text. */
function Bar({ width, t }) {
  return <span className="block h-3 rounded-full" style={{ width, background: t.barTrack }} />;
}

/** The weight chart, as the line itself over its grid — a drawing, not a chart. */
function SampleChart({ t }) {
  const points = [[4, 50], [40, 42], [76, 45], [112, 31], [148, 26]];
  return (
    <svg viewBox="0 0 220 64" className="h-16 w-full" fill="none" preserveAspectRatio="none" aria-hidden="true">
      {[12, 30, 48].map((y) => (
        <line key={y} x1="0" y1={y} x2="220" y2={y} stroke={t.grid} strokeWidth="1" />
      ))}
      <path
        d="M4 50 L40 42 L76 45 L112 31 L148 26 L216 13"
        stroke={t.weightLine}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {points.map(([x, y]) => (
        <circle key={x} cx={x} cy={y} r="2.6" fill={t.weightLine} />
      ))}
      <circle cx="216" cy="13" r="3.4" fill={t.weightLine} />
    </svg>
  );
}

export default function ReportSamplePage() {
  const t = useReportTokens();

  return (
    <div className="mx-auto w-full max-w-lg md:max-w-2xl px-4 pt-4 space-y-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">{REPORT_TAGLINE}</p>

      {/* The setup: the range in its field, the name in the same field, and
          "More options" as it reads while it is closed. */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 card-line space-y-5">
        <div>
          <p className={LABEL}>Date range</p>
          <div className="relative">
            <div className={`${SHEET_FIELD_SELECT} flex items-center`}>
              <span className="block min-w-0 truncate">Last 3 months</span>
            </div>
            <ChevronDown
              size={18}
              aria-hidden="true"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </div>
        </div>

        <div>
          <p className={LABEL}>Name for report</p>
          <div className={`${SHEET_FIELD} flex items-center`}>Alex Morgan</div>
        </div>

        <div className={`${SHEET_DIVIDER} pt-3`}>
          <div className="flex min-h-[44px] items-center justify-between gap-3">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">More options</span>
            <ChevronDown size={18} aria-hidden="true" className="text-gray-500 dark:text-gray-400" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end py-2">
        <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">Hide preview</span>
      </div>

      {/* The preview card, in the report's own colours for the current theme. */}
      <div
        className="report-page rounded-2xl border p-4 sm:p-5"
        style={{ background: t.cardBg, borderColor: t.cardBorder, color: t.ink }}
      >
        <h2 className="text-xl font-bold" style={{ color: t.ink }}>Levli Health Report</h2>
        <div className="text-sm mt-1 space-y-0.5" style={{ color: t.muted }}>
          <p className="break-words">Name: Alex Morgan</p>
          <p className="break-words">Date range: 1 Jun – 31 Aug 2026</p>
          <p className="break-words">Generated: 16 Oct 2026</p>
        </div>

        <Section title="Summary" t={t}>
          <p className="text-sm font-semibold break-words" style={{ color: t.ink }}>Ozempic® 1 mg — once weekly</p>
          <div
            className="mt-3 rounded-xl px-3 py-3 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4"
            style={{ background: t.tableHeadBg }}
          >
            {SAMPLE_STATS.map((stat) => (
              <div key={stat.label} className="min-w-0">
                <span className="block text-xs leading-snug" style={{ color: t.muted }}>{stat.label}</span>
                <span className="block text-base sm:text-lg font-bold leading-tight mt-0.5" style={{ color: t.ink }}>
                  {stat.value}
                </span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Weight" t={t}>
          <SampleChart t={t} />
          <div className="mt-3 space-y-2">
            <Bar width="58%" t={t} />
            <Bar width="44%" t={t} />
            <Bar width="36%" t={t} />
          </div>
        </Section>

        <Section title="Doses taken (newest first)" t={t}>
          <div className="space-y-2">
            {SAMPLE_DOSES.map((row) => (
              <div key={row.date} className="flex items-center justify-between gap-3 text-sm" style={{ color: t.muted }}>
                <span className="min-w-0 truncate">{row.dose}</span>
                <span className="shrink-0">{row.date}</span>
                <span className="shrink-0" style={{ color: t.ink }}>{row.site}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Side effects" t={t}>
          <p className="text-sm break-words" style={{ color: t.muted }}>Nausea — mild, 3 entries</p>
          <p className="text-sm mt-1 break-words" style={{ color: t.muted }}>Fatigue — mild, 1 entry</p>
          <div className="mt-3 space-y-2">
            <Bar width="52%" t={t} />
            <Bar width="30%" t={t} />
          </div>
        </Section>
      </div>
    </div>
  );
}