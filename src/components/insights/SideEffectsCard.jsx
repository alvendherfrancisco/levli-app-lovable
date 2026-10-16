import React, { useMemo, useState } from "react";
import IonIcon from "@/components/IonIcon";
import InsightCard from "@/components/insights/InsightCard";
import SectionHeader from "@/components/insights/SectionHeader";
import InsightEmptyState from "@/components/insights/InsightEmptyState";
import RangeTabs from "@/components/insights/RangeTabs";
import { FOOTNOTE } from "@/components/insights/insightUi";
import SideEffectsModal from "@/components/modals/SideEffectsModal";
import { useAppState } from "@/lib/AppState";
import { fromDayKey, parseShotDate, toDayKey, todayKey } from "@/lib/dateUtils";

/** The windows the card can be read over. */
const RANGES = { "30 Days": 30, "90 Days": 90 };

/**
 * The dot each severity is drawn with: one amber-to-red ladder, so the worst a
 * symptom was logged as is readable at a glance.
 */
const SEVERITY_DOT = { mild: "#F59E0B", moderate: "#F97316", severe: "#E11D48", emergency: "#E11D48" };
const SEVERITY_RANK = { mild: 1, moderate: 2, severe: 3, emergency: 4 };
const SEVERITY_LEGEND = ["mild", "moderate", "severe"];

const cap = (word) => word.charAt(0).toUpperCase() + word.slice(1);

/** The day a record belongs to: its own key, or the date it started on. */
const dayOf = (event) => event.day_key || String(event.onset_date || "").slice(0, 10);

/** "today" / "yesterday" / "3 days ago" / "2 weeks ago", for one line of text. */
function lastLoggedLabel(dayKey) {
  const days = Math.round((fromDayKey(todayKey()) - fromDayKey(dayKey)) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 14) return "last week";
  if (days < 60) return `${Math.round(days / 7)} weeks ago`;
  return `${Math.round(days / 30)} months ago`;
}

/**
 * How the logged side effects sit against the shots before them, when that is
 * clear enough to say: the most common gap, and only when it covers most of the
 * symptoms that followed a shot at all.
 */
function afterShotHint(events, shots) {
  const shotDays = shots
    .map((s) => { const d = parseShotDate(s.date); return d ? toDayKey(d) : ""; })
    .filter(Boolean)
    .sort();
  if (shotDays.length < 2) return "";

  const buckets = new Map();
  let matched = 0;

  events.forEach((event) => {
    const day = dayOf(event);
    if (!day) return;
    const previous = [...shotDays].reverse().find((k) => k <= day);
    if (!previous) return;
    const delta = Math.round((fromDayKey(day) - fromDayKey(previous)) / 86400000);
    if (delta < 0 || delta > 7) return;
    matched += 1;
    const label =
      delta === 0 ? "the same day as a shot"
      : delta === 1 ? "1 day after a shot"
      : delta <= 3 ? "2-3 days after a shot"
      : "4-7 days after a shot";
    buckets.set(label, (buckets.get(label) || 0) + 1);
  });

  const best = [...buckets.entries()].sort((a, b) => b[1] - a[1])[0];
  return best && best[1] >= 3 && best[1] / matched >= 0.5 ? `Most often ${best[0]}` : "";
}

/**
 * The side effects logged over the last 30 or 90 days: what keeps coming back,
 * how bad it was, when it last happened, and how it sits against the shots.
 *
 * Logging lives in one place — the Side Effects form (Home and History) — and
 * this card is the reading of it, so the header offers that same form rather than
 * a second way in. It reads the very records the day's own list on Home and
 * History reads (the AdverseEvent records held once in src/lib/AppState.jsx), so a
 * side effect added, edited or removed anywhere in the app is reflected here the
 * moment it is saved, with no reload.
 */
export default function SideEffectsCard() {
  const { adverseEvents, shots } = useAppState();
  const [range, setRange] = useState("90 Days");
  const [showAll, setShowAll] = useState(false);
  const [logging, setLogging] = useState(false);
  const days = RANGES[range];

  const summary = useMemo(() => {
    const today = fromDayKey(todayKey());
    const cutoff = new Date(today);
    cutoff.setDate(cutoff.getDate() - days + 1);
    const from = toDayKey(cutoff);

    const events = (adverseEvents || []).filter((e) => {
      const day = dayOf(e);
      return day && day >= from && day <= todayKey();
    });

    // One row per symptom: how often, the worst severity logged, and when last.
    const bySymptom = new Map();
    events.forEach((event) => {
      const symptom = String(event.symptom || "").trim();
      if (!symptom) return;
      const row = bySymptom.get(symptom) || { symptom, count: 0, severity: "", lastDay: "" };
      row.count += 1;
      const severity = String(event.severity || "").toLowerCase();
      if ((SEVERITY_RANK[severity] || 0) > (SEVERITY_RANK[row.severity] || 0)) row.severity = severity;
      const day = dayOf(event);
      if (day > row.lastDay) row.lastDay = day;
      bySymptom.set(symptom, row);
    });

    const rows = [...bySymptom.values()].sort(
      (a, b) => b.count - a.count || a.symptom.localeCompare(b.symptom)
    );
    const lastDay = rows.reduce((acc, row) => (row.lastDay > acc ? row.lastDay : acc), "");

    return {
      total: events.length,
      rows,
      maxCount: rows.length ? rows[0].count : 0,
      lastLabel: lastDay ? lastLoggedLabel(lastDay) : "",
      afterShot: afterShotHint(events, shots || []),
      anySeverity: rows.some((row) => row.severity),
    };
  }, [adverseEvents, shots, days]);

  const visibleRows = showAll ? summary.rows : summary.rows.slice(0, 3);

  return (
    <InsightCard>
      <SectionHeader
        compact
        icon={<IonIcon name="warning" size={16} className="text-indigo-600 dark:text-indigo-400" />}
        title="Side Effects"
        action={
          summary.total > 0 ? (
            <button onClick={() => setLogging(true)} className="btn-pill btn-pill-sm btn-primary flex-shrink-0">
              Log
            </button>
          ) : null
        }
      />

      <RangeTabs
        variant="segmented"
        options={Object.keys(RANGES)}
        value={range}
        onChange={(r) => { setRange(r); setShowAll(false); }}
        className="mb-4"
      />

      {summary.total === 0 ? (
        <InsightEmptyState
          message="No side effects logged"
          action={<button onClick={() => setLogging(true)} className="btn-pill btn-pill-sm btn-primary">Log one</button>}
        />
      ) : (
        <>
          <span className="inline-block rounded-full bg-gray-100 dark:bg-white/[0.06] px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:text-[#C0C3D4]">
            {summary.total} in last {days} days
          </span>

          <div className="mt-1.5">
            {visibleRows.map((row) => (
              <div key={row.symptom} className="flex w-full items-center gap-2.5 py-2">
                <span className="flex w-2 justify-center flex-shrink-0">
                  {row.severity && (
                    <span className="h-2 w-2 rounded-full" style={{ background: SEVERITY_DOT[row.severity] }}
                      title={`${cap(row.severity)} severity`} />
                  )}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-gray-700 dark:text-[#E8E9F0]">{row.symptom}</span>
                <span className="h-1.5 w-14 overflow-hidden rounded-full bg-gray-100 dark:bg-white/[0.08] flex-shrink-0">
                  <span className="block h-full rounded-full"
                    style={{ width: `${Math.max(12, Math.round((row.count / summary.maxCount) * 100))}%`, background: "linear-gradient(90deg,#F59E0B,#E11D48)" }} />
                </span>
                <span className="w-5 text-right text-xs tabular-nums text-gray-500 dark:text-[#9A9DAE] flex-shrink-0">{row.count}</span>
              </div>
            ))}
          </div>

          {summary.rows.length > 3 && (
            <button onClick={() => setShowAll((v) => !v)} className="btn-link text-xs">
              {showAll ? "Show less" : `See all ${summary.rows.length}`}
            </button>
          )}

          <p className={`mt-2 ${FOOTNOTE}`}>
            Last logged {summary.lastLabel}
            {summary.afterShot && <> · {summary.afterShot}</>}
          </p>

          {summary.anySeverity && (
            <p className={`mt-1.5 flex items-center gap-3 ${FOOTNOTE}`}>
              {SEVERITY_LEGEND.map((level) => (
                <span key={level} className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: SEVERITY_DOT[level] }} />
                  {cap(level)}
                </span>
              ))}
            </p>
          )}
        </>
      )}

      <SideEffectsModal open={logging} onClose={() => setLogging(false)} dayKey={todayKey()} />
    </InsightCard>
  );
}