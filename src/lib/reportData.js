// ─────────────────────────────────────────────────────────────────────────────
// Doctor report — data assembly.
//
// PRESENTS only what the user logged, straight from existing entity fields:
// shots, DayMetric (weight / nutrition / water / exercise / legacy side-effect
// notes), AdverseEvent, JournalEntry, ProgressPhoto and the profile.
// No interpretation, no diagnosis, no dose advice, nothing invented.
//
// Every value the report shows is built here from the selected range, the
// medication filter, the chosen weight unit and the selected sections — the
// screens and the PDF both render this one object, so the two can never drift.
// ─────────────────────────────────────────────────────────────────────────────

import { convertWeight } from "@/lib/units";
import { heightCmOf, heightText, shownBmi, toKg } from "@/lib/measure";
import { parseShotDate, toDayKey, todayKey, fromDayKey, calendarDaysBetween } from "@/lib/dateUtils";
import { getDosingInterval } from "@/lib/medicationData";
import { calcAdherence } from "@/lib/adherence";
import { RANGE_OPTIONS, DEFAULT_RANGE, CORE_IDS, OPTIONAL_IDS } from "@/lib/reportOptions";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Adult BMI is shown only inside this band. Outside it the number is almost
// always a unit or data-entry mismatch rather than a measurement, so it is left
// out of the report entirely — no note, no placeholder.
export const BMI_MIN_PLAUSIBLE = 12;
export const BMI_MAX_PLAUSIBLE = 70;
// While an unanswered kg/lb question is outstanding, a very low value is not
// shown as a number either.
const BMI_SUSPICIOUS_LOW = 15;

// The one muted line each empty section falls back to, so the preview and the
// PDF always say the same thing.
export const NO_WEIGHT_LINE = "No weight entries recorded in this period.";
export const NO_DOSES_LINE = "No doses logged in this period.";
export const NO_SIDE_EFFECTS_LINE = "None logged.";

export function addDaysToKey(key, days) {
  const d = fromDayKey(key);
  d.setDate(d.getDate() + days);
  return toDayKey(d);
}

/** "2026-01-19" → "19 Jan 2026" */
export function formatDay(key) {
  if (!key) return "—";
  const d = fromDayKey(key);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** "2026-01-19" → "19 Jan" */
export function formatDayShort(key) {
  if (!key) return "—";
  const d = fromDayKey(key);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** "+1.4" / "-2.0" — the sign is the point of a change column. */
function signed(value, digits = 1) {
  if (value == null || !Number.isFinite(value)) return "";
  return `${value < 0 ? "-" : "+"}${Math.abs(value).toFixed(digits)}`;
}

const DAY_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Anything rendered as text — a non-string never reaches the report. */
function asText(value, fallback = "") {
  if (value == null) return fallback;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}

/** A finite number, or null — guards numbers stored as strings. */
function asNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** A "YYYY-MM-DD" key, or null when the value isn't one. */
function asDayKey(value) {
  return typeof value === "string" && DAY_KEY_RE.test(value) ? value : null;
}

/** Only ever hands a parseable string to the date parser, and rejects an unreadable date. */
function parseDate(value) {
  if (typeof value !== "string") return null;
  const d = parseShotDate(value);
  return d && Number.isFinite(d.getTime()) ? d : null;
}

/** Shot record → its "YYYY-MM-DD" day key. */
export function shotDayKey(shot) {
  const explicit = asDayKey(shot?.date);
  if (explicit) return explicit;
  const d = parseDate(shot?.date);
  return d ? toDayKey(d) : "";
}

/** AdverseEvent → its "YYYY-MM-DD" day key (day_key, else parsed onset_date). */
export function eventDayKey(event) {
  if (!event) return "";
  const explicit = asDayKey(event.day_key) || asDayKey(event.onset_date);
  if (explicit) return explicit;
  const d = parseDate(event.onset_date);
  return d ? toDayKey(d) : "";
}

/** JournalEntry date ("Jun 29, 2026") → its day key. */
export function journalDayKey(entry) {
  const explicit = asDayKey(entry?.date);
  if (explicit) return explicit;
  const d = parseDate(entry?.date);
  return d ? toDayKey(d) : "";
}

/** Canonical height in metres (0 when the profile has no usable height). */
export function heightMetres(profile = {}) {
  const cm = heightCmOf(profile);
  return cm ? cm / 100 : 0;
}

export function heightLabel(profile = {}) {
  return heightText(heightCmOf(profile), profile.height_unit || "in");
}

/** BMI for a weight in the given unit — null when height is missing or the result is implausible. */
export function plausibleBmi(profile, weight, unit) {
  const cm = heightCmOf(profile);
  if (weight == null || !cm) return null;
  const kg = convertWeight(weight, unit, "kg");
  if (kg == null || !Number.isFinite(kg)) return null;
  const bmi = shownBmi(kg, cm);
  if (bmi == null) return null;
  const outstanding = !profile?.unit_check_status || profile.unit_check_status === "pending";
  return outstanding && bmi < BMI_SUSPICIOUS_LOW ? null : bmi;
}

/** Resolves the chosen date range into inclusive "YYYY-MM-DD" keys. */
export function resolveRange({ rangeId, customFrom, customTo, dayKeys = [] }) {
  const today = todayKey();
  if (rangeId === "all") {
    const earliest = dayKeys.filter(Boolean).sort()[0];
    return {
      from: earliest || today,
      to: today,
      name: "All time",
      label: earliest ? `All time (${formatDay(earliest)} – ${formatDay(today)})` : "All time",
    };
  }
  if (rangeId === "custom") {
    // An unreadable date falls back to the last 90 days rather than breaking the range.
    const a = asDayKey(customFrom) || addDaysToKey(today, -90);
    const b = asDayKey(customTo) || today;
    const from = a <= b ? a : b;
    const to = a <= b ? b : a;
    return { from, to, name: "Custom", label: `Custom (${formatDay(from)} – ${formatDay(to)})` };
  }
  const option = RANGE_OPTIONS.find((r) => r.id === rangeId)
    || RANGE_OPTIONS.find((r) => r.id === DEFAULT_RANGE)
    || RANGE_OPTIONS[0];
  const from = addDaysToKey(today, -(option.days - 1));
  return { from, to: today, name: option.label, label: option.label };
}

/**
 * Weight entries in the range, converted from their logged unit into the
 * report unit. Only real entries are returned — nothing is interpolated.
 */
export function buildWeightSeries(weightHistory = [], range, profileUnit, reportUnit) {
  const points = weightHistory
    .filter((w) => w && asDayKey(w.date) && w.date >= range.from && w.date <= range.to)
    .map((w) => {
      const raw = typeof w.weight === "number" ? w.weight : parseFloat(w.weight);
      const converted = Number.isFinite(raw) ? convertWeight(raw, profileUnit, reportUnit) : null;
      return {
        dayKey: w.date,
        ts: fromDayKey(w.date).getTime(),
        value: Number.isFinite(converted) ? Math.round(converted * 10) / 10 : null,
        label: formatDayShort(w.date),
      };
    })
    // A weight in an unreadable unit or an unparseable date is left out rather
    // than plotted as NaN.
    .filter((p) => Number.isFinite(p.ts) && Number.isFinite(p.value));

  // 7-day rolling average over the entries themselves, as on Insights.
  return points.map((point, i) => {
    const window = points.slice(Math.max(0, i - 6), i + 1);
    const avg = window.reduce((a, p) => a + p.value, 0) / window.length;
    return { ...point, rollingAvg: Math.round(avg * 10) / 10 };
  });
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

export function summarizeWeight(series, profile, profileUnit, reportUnit) {
  if (!series.length) {
    return { count: 0, start: null, end: null, change: null, changePct: null, goal: null, goalLabel: null, goalDistance: null };
  }
  const start = series[0];
  const end = series[series.length - 1];
  const change = round1(end.value - start.value);
  const changePct = start.value > 0 ? round1(((end.value - start.value) / start.value) * 100) : null;

  // The goal is stored in kilograms and converted for display only.
  const goalKg = parseFloat(profile?.goal_weight_kg) || toKg(profile?.goal_weight, profileUnit);
  const goal = Number.isFinite(goalKg) && goalKg > 0 ? round1(convertWeight(goalKg, "kg", reportUnit)) : null;
  let goalDistance = null;
  if (goal != null) {
    const diff = round1(end.value - goal);
    goalDistance = {
      value: Math.abs(diff),
      direction: Math.abs(diff) < 0.05 ? "at" : diff > 0 ? "above" : "below",
    };
  }

  return {
    count: series.length, start: start.value, end: end.value, change, changePct,
    goal, goalLabel: goal != null ? `${goal} ${reportUnit}` : null, goalDistance,
  };
}

/**
 * Weight entries for the compact table, newest first, each with the change from
 * the entry logged before it. The oldest entry has nothing to compare against,
 * so its change cell stays empty.
 */
export function weightTableRows(series = [], unit) {
  return series
    .map((point, i) => {
      const change = i > 0 ? round1(point.value - series[i - 1].value) : null;
      return {
        id: point.dayKey,
        dayLabel: formatDay(point.dayKey),
        valueLabel: `${point.value} ${unit}`,
        change,
        changeLabel: change == null ? "" : `${signed(change)} ${unit}`,
      };
    })
    .reverse();
}

/** Distinct medications across every shot, newest first. */
export function medicationList(shots = []) {
  const seen = [];
  [...shots]
    .sort((a, b) => (shotDayKey(b) || "").localeCompare(shotDayKey(a) || ""))
    .forEach((s) => {
      if (s.medication && !seen.includes(s.medication)) seen.push(s.medication);
    });
  return seen;
}

function routeLabel(shot) {
  const route = asText(shot.route).replace(/_/g, " ");
  return [route, asText(shot.concentration)].filter(Boolean).join(" · ");
}

/** Dose table rows, newest first. Medication and route are never repeated here. */
export function doseRows(shotsDesc = []) {
  return shotsDesc.map((s) => {
    const dose = asNumber(s.dose);
    const unit = asText(s.dose_unit, "mg");
    return {
      id: s.id,
      day: shotDayKey(s),
      dayLabel: formatDay(shotDayKey(s)),
      time: asText(s.time, "—"),
      medication: asText(s.medication, "—"),
      dose,
      unit,
      doseLabel: dose != null ? `${dose} ${unit}` : "—",
      site: asText(s.site, "—"),
      pain: asNumber(s.pain),
      detail: asText(routeLabel(s)),
      notes: asText(s.notes),
    };
  });
}

/**
 * "0.5 mg from 19 Jan, 1 mg from 2 Mar" — every dose step in the range with the
 * date it started. Medication is named when more than one is in the report.
 */
export function doseChangeSummary(rowsAsc = [], multipleMeds = false) {
  const steps = [];
  rowsAsc.forEach((row) => {
    const key = `${row.medication}|${row.dose}|${row.unit}`;
    const last = steps[steps.length - 1];
    if (last && last.key === key) {
      last.count += 1;
      return;
    }
    steps.push({ key, medication: row.medication, dose: row.dose, unit: row.unit, day: row.day, count: 1 });
  });

  if (steps.length === 1) {
    const only = steps[0];
    const name = multipleMeds ? `${only.medication} ` : "";
    return [`${name}${only.dose} ${only.unit} throughout (${only.count} dose${only.count === 1 ? "" : "s"})`];
  }

  return steps.map((step) => {
    const name = multipleMeds ? `${step.medication} ` : "";
    return `${name}${step.dose} ${step.unit} from ${formatDayShort(step.day)}`;
  });
}

/**
 * The dose each reported medication is on now, and how long it has been at that
 * dose. Built from the whole log so a step that began before the report window
 * still shows its real start date; the dose shown is the last one logged on or
 * before the end of the period.
 */
export function currentDoses(allShots = [], medications = [], range = {}) {
  const named = medications.length > 1;
  return medications
    .map((medication) => {
      const rows = allShots
        .filter((s) => s.medication === medication)
        .map((s) => ({ day: shotDayKey(s), dose: asNumber(s.dose), unit: asText(s.dose_unit, "mg") }))
        .filter((row) => row.day && row.dose != null && (!range?.to || row.day <= range.to))
        .sort((a, b) => b.day.localeCompare(a.day));
      if (!rows.length) return null;

      const latest = rows[0];
      // Walk back over the same dose to find the day this step started.
      let since = latest.day;
      rows.forEach((row) => {
        if (row.dose !== latest.dose || row.unit !== latest.unit) return;
        if (row.day < since) since = row.day;
      });

      const days = range?.to ? calendarDaysBetween(since, range.to) : null;
      const duration = days == null || days < 1
        ? ""
        : days < 14
          ? `for ${days} day${days === 1 ? "" : "s"}`
          : `for ${Math.round(days / 7)} weeks`;

      return {
        medication,
        label: `${latest.dose} ${latest.unit}`,
        // The medication is only named when the report holds more than one, so a
        // single-medication tile reads "for 6 weeks · since 12 Aug".
        sub: [named ? medication : "", duration, `since ${formatDayShort(since)}`].filter(Boolean).join(" · "),
      };
    })
    .filter(Boolean);
}

/**
 * Doses logged twice at the same timestamp, dose and site. Flagged in one line
 * under the table — nothing is removed or corrected.
 */
export function duplicateDoseNote(rows = []) {
  const seen = new Map();
  rows.forEach((row) => {
    const key = [row.day, row.time, row.dose, row.unit, row.site].join("|");
    seen.set(key, (seen.get(key) || 0) + 1);
  });
  const extras = [...seen.values()].reduce((total, count) => total + (count > 1 ? count - 1 : 0), 0);
  if (!extras) return "";
  return extras === 1
    ? "1 entry shares the same timestamp and may be a duplicate."
    : `${extras} entries share the same timestamp and may be duplicates.`;
}

/**
 * One footnote line per medication shown in the dose table: its route and
 * concentration, and the doses used. This is where medication and route live,
 * instead of a column repeated on every row.
 */
export function doseFootnotes(rows = []) {
  const byMedication = new Map();
  rows.forEach((row) => {
    if (!byMedication.has(row.medication)) byMedication.set(row.medication, { details: [], doses: [] });
    const entry = byMedication.get(row.medication);
    if (row.detail && !entry.details.includes(row.detail)) entry.details.push(row.detail);
    if (row.doseLabel !== "—" && !entry.doses.includes(row.doseLabel)) entry.doses.push(row.doseLabel);
  });

  return [...byMedication.entries()].map(([medication, entry]) => [
    medication,
    entry.details.join(" / "),
    // Rows arrive newest first, so the dose list reverses to the order of use.
    entry.doses.length ? `doses ${[...entry.doses].reverse().join(", ")}` : "",
  ].filter(Boolean).join(" · "));
}

/** "Shots logged: X of Y scheduled" — the same logic as the Shots page figure. */
export function adherenceFor(shots = [], shotsInRange = [], medicationFilter, days) {
  const meds = medicationFilter && medicationFilter !== "all"
    ? [medicationFilter]
    : [...new Set(shotsInRange.map((s) => s.medication).filter(Boolean))];

  let logged = 0;
  let scheduled = 0;
  meds.forEach((med) => {
    if (!getDosingInterval(med)) {
      logged += shotsInRange.filter((s) => s.medication === med).length;
      return;
    }
    const result = calcAdherence(shots, med, days);
    logged += result.logged;
    scheduled += result.scheduled || 0;
  });

  return { logged, scheduled: scheduled > 0 ? scheduled : null, days, medications: meds };
}

/** Strips emoji so the symptom reads cleanly in a printed table. */
export function cleanSymptom(text) {
  const cleaned = String(text || "")
    .replace(/[\u{1F000}-\u{1FAFF}\u{2190}-\u{2BFF}\u{FE0F}\u{20E3}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || String(text || "").trim();
}

/**
 * Side-effect rows, newest first: what was logged, when, and how bad. Free-text
 * side effects recorded before structured tracking are shown the same way.
 */
export function sideEffectRows(events = [], dayMetrics = {}, range) {
  const structured = events
    .map((e) => ({ day: eventDayKey(e), event: e }))
    .filter(({ day }) => day && day >= range.from && day <= range.to)
    .map(({ day, event }) => ({
      id: event.id,
      day,
      dayLabel: formatDay(day),
      symptom: cleanSymptom(event.symptom),
      severity: asText(event.severity),
      legacy: false,
    }));

  const legacy = Object.values(dayMetrics)
    .filter((m) => m.day_key >= range.from && m.day_key <= range.to && m.side_effects)
    .map((m) => ({
      id: `legacy-${m.day_key}`,
      day: m.day_key,
      dayLabel: formatDay(m.day_key),
      symptom: cleanSymptom(m.side_effects),
      severity: "",
      legacy: true,
    }));

  return [...structured, ...legacy].sort((a, b) => b.day.localeCompare(a.day));
}

function inRange(dayKey, range) {
  return !!dayKey && dayKey >= range.from && dayKey <= range.to;
}

function weekBuckets(range) {
  const buckets = [];
  let start = range.from;
  // Capped so an extreme custom range can never hang the report.
  while (start <= range.to && buckets.length < 520) {
    buckets.push({ start, end: addDaysToKey(start, 6) });
    start = addDaysToKey(start, 7);
  }
  return buckets;
}

/** Weekly averages for one metric, over the days actually logged. */
export function weeklyAverage(dayMetrics = {}, range, field) {
  return weekBuckets(range)
    .map((bucket) => {
      const values = Object.values(dayMetrics)
        .filter((m) => inRange(m.day_key, range) && m.day_key >= bucket.start && m.day_key <= bucket.end && m[field] != null)
        .map((m) => Number(m[field]))
        .filter((v) => Number.isFinite(v));
      if (!values.length) return null;
      const avg = values.reduce((a, v) => a + v, 0) / values.length;
      return { label: `Week of ${formatDayShort(bucket.start)}`, days: values.length, value: round1(avg) };
    })
    .filter(Boolean);
}

function averageOf(rows, field) {
  const values = rows.map((r) => Number(r[field])).filter((v) => Number.isFinite(v));
  if (!values.length) return null;
  return Math.round(values.reduce((a, v) => a + v, 0) / values.length);
}

function metricRows(dayMetrics, range, fields) {
  return Object.values(dayMetrics).filter((m) => inRange(m.day_key, range) && fields.some((f) => m[f] != null));
}

export function nutritionData(dayMetrics, range) {
  const rows = metricRows(dayMetrics, range, ["calories", "protein", "fiber", "carbs"]);
  if (!rows.length) return null;
  return {
    days: rows.length,
    calories: averageOf(rows, "calories"),
    protein: averageOf(rows, "protein"),
    fiber: averageOf(rows, "fiber"),
    carbs: averageOf(rows, "carbs"),
    weekly: weeklyAverage(dayMetrics, range, "calories"),
  };
}

export function waterData(dayMetrics, range, liquidUnit) {
  const rows = metricRows(dayMetrics, range, ["water"]);
  if (!rows.length) return null;
  return {
    days: rows.length,
    unit: liquidUnit || "oz",
    average: averageOf(rows, "water"),
    total: Math.round(rows.reduce((a, r) => a + (Number(r.water) || 0), 0)),
    weekly: weeklyAverage(dayMetrics, range, "water"),
  };
}

export function exerciseData(dayMetrics, range) {
  const rows = metricRows(dayMetrics, range, ["exercise_min"]);
  if (!rows.length) return null;
  return {
    days: rows.length,
    average: averageOf(rows, "exercise_min"),
    total: Math.round(rows.reduce((a, r) => a + (Number(r.exercise_min) || 0), 0)),
    weekly: weeklyAverage(dayMetrics, range, "exercise_min"),
  };
}

export function journalRows(journalEntries = [], range) {
  const rows = journalEntries
    .map((entry) => ({ entry, day: journalDayKey(entry) }))
    .filter(({ day }) => inRange(day, range))
    .map(({ entry, day }) => ({
      id: entry.id,
      day,
      dayLabel: formatDay(day),
      time: asText(entry.time),
      mood: asText(entry.mood),
      category: asText(entry.category),
      text: asText(entry.text),
    }))
    .sort((a, b) => b.day.localeCompare(a.day));
  return rows.length ? rows : null;
}

export function progressPictureRows(photos = [], range) {
  const rows = photos
    .filter((p) => inRange(p.day_key, range) && p.url)
    .map((p) => ({ id: p.id, dayKey: p.day_key, dayLabel: formatDay(p.day_key), url: p.url }))
    .sort((a, b) => a.dayKey.localeCompare(b.dayKey));
  return rows.length ? rows : null;
}

export function injectionSiteData(shotsInRange = []) {
  const siteOf = (s) => asText(s.site).trim();
  const painOf = (s) => asNumber(s.pain);
  const withSite = shotsInRange.filter((s) => siteOf(s));
  if (!withSite.length) return null;
  const counts = new Map();
  withSite.forEach((s) => counts.set(siteOf(s), (counts.get(siteOf(s)) || 0) + 1));
  const painShots = shotsInRange.filter((s) => (painOf(s) || 0) > 0);

  return {
    counts: [...counts.entries()]
      .map(([site, count]) => ({ site, count, pct: Math.round((count / withSite.length) * 100) }))
      .sort((a, b) => b.count - a.count || a.site.localeCompare(b.site)),
    totalDosesWithSite: withSite.length,
    sitesUsed: counts.size,
    pain: painShots
      .map((s) => ({
        id: s.id,
        dayLabel: formatDay(shotDayKey(s)),
        pain: painOf(s),
        medication: asText(s.medication, "—"),
        doseLabel: asNumber(s.dose) != null ? `${asNumber(s.dose)} ${asText(s.dose_unit, "mg")}` : "—",
      }))
      .sort((a, b) => b.dayLabel.localeCompare(a.dayLabel)),
    painReported: painShots.length,
    averagePain: painShots.length ? round1(painShots.reduce((a, s) => a + (painOf(s) || 0), 0) / painShots.length) : null,
  };
}

/** The report period: its name, both dates and how many days it covers. */
function periodLabel(range) {
  const days = `${range.days} day${range.days === 1 ? "" : "s"}`;
  const name = range.name && range.name !== "Custom" ? `${range.name} · ` : "";
  return `${name}${formatDay(range.from)} – ${formatDay(range.to)} · ${days}`;
}

function goalSub(goalDistance, unit) {
  if (!goalDistance) return "";
  return goalDistance.direction === "above" ? `${goalDistance.value} ${unit} to go` : "Goal reached";
}

/**
 * The summary tiles, in the order a clinician reads them. Built here so the
 * screen and the PDF show the same tiles with the same wording. A tile only
 * exists when its value exists — nothing is shown as "not set" or "—".
 */
export function summaryTiles({ current = [], weight, series = [], adherence, dosesCount, bmi, unit }) {
  const tiles = current.map((dose) => ({
    id: `dose-${dose.medication}`,
    label: current.length > 1 ? `Current dose · ${dose.medication}` : "Current dose",
    value: dose.label,
    sub: dose.sub,
  }));

  if (dosesCount > 0) {
    tiles.push({
      id: "doses",
      label: "Doses logged",
      value: String(dosesCount),
      sub: adherence.scheduled ? `of ${adherence.scheduled} scheduled` : "in this period",
    });
  }

  if (series.length) {
    const first = series[0];
    const last = series[series.length - 1];
    tiles.push({ id: "start", label: "Start weight", value: `${weight.start} ${unit}`, sub: `on ${formatDayShort(first.dayKey)}` });
    tiles.push({ id: "current", label: "Current weight", value: `${weight.end} ${unit}`, sub: `on ${formatDayShort(last.dayKey)}` });
    tiles.push({
      id: "change",
      label: "Total change",
      value: `${signed(weight.change)} ${unit}`,
      sub: weight.changePct != null ? `${signed(weight.changePct)}%` : "",
    });
    if (weight.goalLabel) {
      tiles.push({ id: "goal", label: "Goal weight", value: weight.goalLabel, sub: goalSub(weight.goalDistance, unit) });
    }
    if (bmi != null) tiles.push({ id: "bmi", label: "BMI", value: String(bmi), sub: "" });
  }

  return tiles;
}

/**
 * Assembles everything the report screens and the PDF need, from the app's
 * existing state and the chosen options.
 */
export function buildReport(state, options) {
  const {
    shots = [], weightHistory = [], dayMetrics = {}, adverseEvents = [],
    journalEntries = [], progressPhotosList = [],
  } = state || {};
  const profile = state?.profile || {};
  const profileUnit = profile.weight_unit || "lb";
  const unit = options.weightUnit || profileUnit;

  const shotsDesc = [...shots].sort((a, b) => (shotDayKey(b) || "").localeCompare(shotDayKey(a) || ""));
  const medications = medicationList(shots);

  // Only real day keys take part in range resolution, so a stray value can
  // never collapse the range.
  const dayKeys = [
    ...weightHistory.map((w) => w.date),
    ...shotsDesc.map(shotDayKey),
    ...adverseEvents.map(eventDayKey),
    ...Object.keys(dayMetrics),
  ].map((key) => asDayKey(key)).filter(Boolean);

  const range = resolveRange({
    rangeId: options.rangeId || DEFAULT_RANGE,
    customFrom: options.customFrom,
    customTo: options.customTo,
    dayKeys,
  });
  range.days = calendarDaysBetween(range.from, range.to) + 1;

  const medicationFilter = options.medication || "all";
  const shotsInRange = shotsDesc.filter((s) => {
    const key = shotDayKey(s);
    if (!inRange(key, range)) return false;
    return medicationFilter === "all" || s.medication === medicationFilter;
  });

  const series = buildWeightSeries(weightHistory, range, profileUnit, unit);
  const weight = summarizeWeight(series, profile, profileUnit, unit);
  const doses = doseRows(shotsInRange);
  const changes = doseChangeSummary([...doses].reverse(), new Set(doses.map((d) => d.medication)).size > 1);
  const adherence = adherenceFor(shots, shotsInRange, medicationFilter, range.days);
  const sideEffects = sideEffectRows(adverseEvents, dayMetrics, range);

  // The medications this report covers, and the dose each of them is on.
  const medicationsInRange = medicationList(shotsInRange);
  const current = currentDoses(
    shots,
    medicationFilter === "all" ? medicationsInRange : [medicationFilter],
    range,
  );

  const optional = {
    injectionSites: injectionSiteData(shotsInRange),
    nutrition: nutritionData(dayMetrics, range),
    water: waterData(dayMetrics, range, profile.liquid_unit || "oz"),
    exercise: exerciseData(dayMetrics, range),
    journal: journalRows(journalEntries, range),
    progressPictures: progressPictureRows(progressPhotosList, range),
  };

  const available = {};
  OPTIONAL_IDS.forEach((id) => { available[id] = !!optional[id]; });
  // Core sections are always part of the report. An optional section only
  // appears when it was selected AND the range holds data for it.
  const selected = [...new Set([...CORE_IDS, ...(options.sections || [])])]
    .filter((id) => CORE_IDS.includes(id) || available[id]);

  const bmi = plausibleBmi(profile, weight.end, unit);
  const name = (options.name || "").trim();
  const covered = medicationFilter === "all" ? medicationsInRange : [medicationFilter];

  return {
    range,
    unit,
    available,
    sections: selected,
    hasAnyData: !!(shotsInRange.length || series.length || sideEffects.length),
    header: {
      name,
      generatedLabel: formatDay(todayKey()),
      periodLabel: periodLabel(range),
      medications: medicationFilter === "all" ? medications : [medicationFilter],
      heightLabel: heightLabel(profile),
    },
    summaryTiles: summaryTiles({ current, weight, series, adherence, dosesCount: doses.length, bmi, unit }),
    // `series` carries the plotted points through to the chart and the PDF.
    // `table` is the compact table underneath it.
    weight: { ...weight, series, table: weightTableRows(series, unit) },
    doses: {
      rows: doses,
      changes,
      adherence,
      count: doses.length,
      duplicateNote: duplicateDoseNote(doses),
      footnotes: doseFootnotes(doses),
      medications: covered,
    },
    sideEffects: { rows: sideEffects, total: sideEffects.length },
    optional,
    has: {
      weight: series.length > 0,
      doses: doses.length > 0,
      sideEffects: sideEffects.length > 0,
    },
  };
}