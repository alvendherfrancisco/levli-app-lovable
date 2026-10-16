import React from "react";
import { ChevronDown } from "lucide-react";
import { REPORT_TAGLINE } from "@/lib/reportOptions";
import { ReportThemeProvider, useReportTokens } from "@/components/report/ReportTheme";
import { SHEET_DIVIDER, SHEET_FIELD, SHEET_FIELD_SELECT } from "@/components/modals/shot/sheetUi";

/**
 * The Report screen as a picture, for the screen's lock: the setup above (the
 * date range in its field, the name on the report, and "More options"), the
 * "Hide preview" line, and under them the report itself, drawn as the sheet of
 * paper it is.
 *
 * The paper follows the app's own theme, exactly as the report preview on the real
 * screen does (see ReportPreview): the light page in light mode, and the darker
 * sheet in dark mode, with the purple band across its head, the summary, the
 * figures and the chart. It is tilted a degree and carries a soft shadow, the way
 * a page laid on a desk reads, and it lies behind the lock group.
 *
 * Nothing on it is real. Every value is invented for the picture ("Alex Morgan",
 * "1 Jun – 31 Aug 2026", "-8.4 kg"), the chart is a drawn line rather than a
 * chart, and there is no field, button, chevron or list anywhere on the page —
 * so nothing behind the lock can be pressed, focused or read out. It reads no
 * data of any kind: no store, no profile, no records, so nothing of the person's
 * own is in the page to be found through the blur, a screenshot, or an
 * accessibility tool.
 *
 * The setup card is the app's own — the very field classes the real form uses —
 * and follows the app's live theme. The paper under it reads the same theme, from
 * the report's own token sets (see src/components/report/reportTokens.js), so the
 * two always agree in either mode.
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
function Section({ title, children }) {
  const T = useReportTokens();
  return (
    <section className="pt-4 mt-4 border-t" style={{ borderColor: T.divider }}>
      <h3 className="text-base font-bold mb-3" style={{ color: T.ink }}>{title}</h3>
      {children}
    </section>
  );
}

/** A table row reduced to its shape: a bar the length of a line of text. */
function Bar({ width }) {
  const T = useReportTokens();
  return <span className="block h-3 rounded-full" style={{ width, background: T.barTrack }} />;
}

/**
 * The weight chart, as the report draws it: what was expected in teal, the weight
 * itself in the report's purple with the wash under it, over its grid. A drawing,
 * not a chart — it plots nothing but the picture's own made-up line.
 */
function SampleChart() {
  const T = useReportTokens();
  const points = [[6, 52], [42, 44], [78, 47], [114, 34], [150, 28], [216, 16]];
  return (
    <svg viewBox="0 0 220 64" className="h-16 w-full" fill="none" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="sampleWeightFill" x1="0" y1="16" x2="0" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8B5CF6" stopOpacity="0.3" />
          <stop offset="1" stopColor="#8B5CF6" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[12, 30, 48].map((y) => (
        <line key={y} x1="0" y1={y} x2="220" y2={y} stroke={T.grid} strokeWidth="1" />
      ))}
      <path d="M6 56 L60 50 L120 42 L180 34 L216 30" stroke="#14B8A6" strokeWidth="2"
        strokeDasharray="5 4" strokeLinecap="round" />
      <path d="M6 52 L42 44 L78 47 L114 34 L150 28 L216 16 L216 60 L6 60 Z" fill="url(#sampleWeightFill)" />
      <path d="M6 52 L42 44 L78 47 L114 34 L150 28 L216 16" stroke="#6366F1" strokeWidth="2.6"
        strokeLinecap="round" strokeLinejoin="round" />
      {points.map(([x, y]) => (
        <circle key={x} cx={x} cy={y} r="2.6" fill="#6366F1" />
      ))}
      <circle cx="216" cy="16" r="3.6" fill="#4F46E5" />
    </svg>
  );
}

export default function ReportSamplePage() {
  // The same theme the real report preview follows, so the page behind the lock
  // and the page under it are the same page in either mode.
  return (
    <ReportThemeProvider mode="app">
      <SamplePage />
    </ReportThemeProvider>
  );
}

/** The page itself, in the token set the provider above supplies. */
function SamplePage() {
  const T = useReportTokens();

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

      {/* The report itself: one sheet of paper, in the colours the PDF is drawn
          with. It is tilted a little and lifted off the page by its own shadow. */}
      <div
        className="report-page -rotate-[1.2deg] rounded-2xl overflow-hidden shadow-[0_18px_44px_-18px_rgba(16,24,40,0.45)]"
        style={{ background: T.cardBg, color: T.ink }}
      >
        {/* The band across the head of the page. */}
        <div className="px-4 sm:px-5 py-3.5" style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)" }}>
          <h2 className="text-lg font-bold text-white">Levli Health Report</h2>
        </div>

        <div className="p-4 sm:p-5">
          <div className="text-sm space-y-0.5" style={{ color: T.muted }}>
            <p className="break-words">Name: Alex Morgan</p>
            <p className="break-words">Date range: 1 Jun – 31 Aug 2026</p>
            <p className="break-words">Generated: 16 Oct 2026</p>
          </div>

          <Section title="Summary">
            <p className="text-sm font-semibold break-words" style={{ color: T.ink }}>Ozempic® 1 mg — once weekly</p>
            <div
              className="mt-3 rounded-xl px-3 py-3 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4"
              style={{ background: T.tableHeadBg }}
            >
              {SAMPLE_STATS.map((stat) => (
                <div key={stat.label} className="min-w-0">
                  <span className="block text-xs leading-snug" style={{ color: T.muted }}>{stat.label}</span>
                  <span className="block text-base sm:text-lg font-bold leading-tight mt-0.5" style={{ color: T.ink }}>
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Weight">
            <SampleChart />
            <div className="mt-3 space-y-2">
              <Bar width="58%" />
              <Bar width="44%" />
              <Bar width="36%" />
            </div>
          </Section>

          <Section title="Doses taken (newest first)">
            <div className="space-y-2">
              {SAMPLE_DOSES.map((row) => (
                <div key={row.date} className="flex items-center justify-between gap-3 text-sm" style={{ color: T.muted }}>
                  <span className="min-w-0 truncate">{row.dose}</span>
                  <span className="shrink-0">{row.date}</span>
                  <span className="shrink-0" style={{ color: T.ink }}>{row.site}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Side effects">
            <p className="text-sm break-words" style={{ color: T.muted }}>Nausea — mild, 3 entries</p>
            <p className="text-sm mt-1 break-words" style={{ color: T.muted }}>Fatigue — mild, 1 entry</p>
            <div className="mt-3 space-y-2">
              <Bar width="52%" />
              <Bar width="30%" />
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}