import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import SideEffectsModal from "@/components/modals/SideEffectsModal";
import { useAppState } from "@/lib/AppState";
import { fromDayKey, parseShotDate, toDayKey, todayKey } from "@/lib/dateUtils";

/** The windows the card can be read over. */
const WINDOWS = [30, 90];

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
 * how bad it was, when it last happened, and how it sits against the shots. Each
 * row opens that symptom's own journal entries, so the pattern can be talked
 * through with a prescriber.
 *
 * It reads the same structured records the day's own list on Home and History
 * reads — the AdverseEvent records held once in src/lib/AppState.jsx — so a side
 * effect logged, edited or removed anywhere in the app is reflected here the
 * moment it is saved, with no reload.
 */
export default function SideEffectsCard() {
  const navigate = useNavigate();
  const { adverseEvents, shots } = useAppState();
  const [days, setDays] = useState(90);
  const [showAll, setShowAll] = useState(false);
  const [logging, setLogging] = useState(false);

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
    <div className="mx-4 mb-4 bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(225,29,72,0.12)" }}>
            <AlertTriangle size={16} className="text-[#E11D48] dark:text-[#FB7185]" />
          </div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white truncate">Side Effects</h2>
        </div>
        <div className="flex gap-1.5 flex-shrink-0">
          {WINDOWS.map((w) => (
            <button key={w} onClick={() => { setDays(w); setShowAll(false); }}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                days === w
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white dark:bg-gray-900 text-gray-500 dark:text-[#9A9DAE] border-gray-200 dark:border-gray-700"
              }`}>
              {w}d
            </button>
          ))}
        </div>
      </div>

      {summary.total === 0 ? (
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-sm text-gray-500 dark:text-[#9A9DAE]">No side effects logged</p>
          <button onClick={() => setLogging(true)} className="btn-pill btn-pill-sm btn-primary">Log one</button>
        </div>
      ) : (
        <>
          <span className="mt-2 inline-block rounded-full bg-gray-100 dark:bg-white/[0.06] px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:text-[#C0C3D4]">
            {summary.total} in last {days} days
          </span>

          <div className="mt-1.5">
            {visibleRows.map((row) => (
              <button key={row.symptom}
                onClick={() => navigate(`/journal?symptom=${encodeURIComponent(row.symptom)}`)}
                className="flex w-full items-center gap-2.5 py-2 text-left">
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
              </button>
            ))}
          </div>

          {summary.rows.length > 3 && (
            <button onClick={() => setShowAll((v) => !v)} className="btn-link text-xs">
              {showAll ? "Show less" : `See all ${summary.rows.length}`}
            </button>
          )}

          <p className="mt-2 text-[11px] leading-relaxed text-gray-500 dark:text-[#9A9DAE]">
            Last logged {summary.lastLabel}
            {summary.afterShot && <> · {summary.afterShot}</>}
          </p>

          {summary.anySeverity && (
            <p className="mt-1.5 flex items-center gap-3 text-[11px] text-gray-500 dark:text-[#9A9DAE]">
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
    </div>
  );
}