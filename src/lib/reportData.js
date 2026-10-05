// ─────────────────────────────────────────────────────────────────────────────
// Doctor report — data assembly.
//
// PRESENTS only what the user logged, straight from existing entity fields:
// shots, DayMetric (weight / nutrition / water / exercise / legacy side-effect
// notes), AdverseEvent, JournalEntry, ProgressPhoto and the profile.
// No interpretation, no diagnosis, no dose advice, nothing invented.
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
// out and the user is asked to check their units instead.
export const BMI_MIN_PLAUSIBLE = 12;
export const BMI_MAX_PLAUSIBLE = 70;
// While an unanswered kg/lb question is outstanding, a very low value is not
// shown as a number either.
const BMI_SUSPICIOUS_LOW = 15;

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
      label: earliest ? `All time (${formatDay(earliest)} – ${formatDay(today)})` : "All time",
    };
  }
  if (rangeId === "custom") {
    // An unreadable date falls back to the last 90 days rather than breaking the range.
    const a = asDayKey(customFrom) || addDaysToKey(today, -90);
    const b = asDayKey(customTo) || today;
    const from = a <= b ? a : b;
    const to = a <= b ? b : a;
    return { from, to, label: `Custom (${formatDay(from)} – ${formatDay(to)})` };
  }
  const option = RANGE_OPTIONS.find((r) => r.id === rangeId)
    || RANGE_OPTIONS.find((r) => r.id === DEFAULT_RANGE)
    || RANGE_OPTIONS[0];
  const from = addDaysToKey(today, -(option.days - 1));
  return { from, to: today, label: option.label };
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

function weightGaps(series) {
  const gaps = [];
  for (let i = 1; i < series.length; i++) {
    const days = calendarDaysBetween(series[i - 1].dayKey, series[i].dayKey);
    if (days >= 14) {
      gaps.push({ from: series[i - 1].dayKey, to: series[i].dayKey, days });
    }
  }
  return gaps;
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

/** "+1.2" / "-4.3" — the sign is always shown, so a change can never be misread. */
function signedText(value, digits = 1) {
  return `${value < 0 ? "-" : "+"}${Math.abs(value).toFixed(digits)}`;
}

export function summarizeWeight(series, profile, profileUnit, reportUnit, range) {
  if (!series.length) {
    return {
      count: 0, start: null, end: null, change: null, changePct: null,
      perWeek: null, weeks: null, goal: null, goalLabel: null, goalDistance: null, gaps: [],
    };
  }
  const start = series[0];
  const end = series[series.length - 1];
  const change = round1(end.value - start.value);
  const changePct = start.value > 0 ? round1(((end.value - start.value) / start.value) * 100) : null;

  // The period is counted from the SAME start and end dates as the header
  // range, so the two can never disagree. The weekly rate uses the exact span.
  const rangeDays = Number.isFinite(range?.days) && range.days > 0 ? range.days : null;
  const weeksExact = rangeDays ? rangeDays / 7 : null;
  const weeks = series.length >= 2 && weeksExact ? Math.max(1, Math.round(weeksExact)) : null;
  const perWeek = series.length >= 2 && weeksExact ? round1(change / weeksExact) : null;

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
    perWeek, weeks, goal, goalLabel: goal != null ? `${goal} ${reportUnit}` : null,
    goalDistance, gaps: weightGaps(series),
  };
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

/** The shot's route as words: "subcutaneous", "oral tablet". */
function routeWords(shot) {
  return asText(shot.route).replace(/_/g, " ").trim();
}

/**
 * Dose table rows, newest first. Each row also carries the medication, its
 * route and its concentration, so the report can name those once in its summary
 * rather than repeating them down every line of the table.
 */
export function doseRows(shotsDesc = []) {
  return shotsDesc.map((s) => {
    const dose = asNumber(s.dose);
    const unit = asText(s.dose_unit, "mg");
    return {
      id: s.id,
      day: shotDayKey(s),
      dayLabel: formatDay(shotDayKey(s)),
      time: asText(s.time),
      medication: asText(s.medication),
      route: routeWords(s),
      generic: asText(s.drug_class),
      concentration: asText(s.concentration),
      dose,
      unit,
      doseLabel: dose != null ? `${dose} ${unit}` : "",
      site: asText(s.site),
      pain: asNumber(s.pain),
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
 * One entry per medication for the report's summary, newest first: the latest
 * dose logged for it, its most recent route, and its concentration when every
 * dose shared one.
 */
export function doseGroups(rows = []) {
  const groups = new Map();
  rows.forEach((row) => {
    const name = row.medication || "Unnamed medication";
    if (!groups.has(name)) {
      groups.set(name, {
        name, dose: row.dose, unit: row.unit, route: row.route,
        generic: row.generic, count: 0, concentrations: new Set(),
      });
    }
    const group = groups.get(name);
    group.count += 1;
    if (!group.route && row.route) group.route = row.route;
    if (!group.generic && row.generic) group.generic = row.generic;
    if (row.concentration) group.concentrations.add(row.concentration);
  });
  return [...groups.values()].map(({ concentrations, ...group }) => ({
    ...group,
    concentration: concentrations.size === 1 ? [...concentrations][0] : "",
  }));
}

/** "Ozempic (semaglutide) · 2.5 mg · subcutaneous" — named once, at the top. */
export function medicationLine(group) {
  const generic = group.generic && group.generic.toLowerCase() !== group.name.toLowerCase()
    ? `(${group.generic})`
    : "";
  const parts = [
    group.dose != null ? `${group.dose} ${group.unit}` : "",
    group.route,
    group.concentration,
  ].filter(Boolean);
  return [`${group.name} ${generic}`.trim(), ...parts].join(" · ");
}

/**
 * Entries that look like the same dose logged twice: same date, time, dose and
 * site. Reported as a note under the table — nothing is removed, and nothing is
 * concluded from it.
 */
export function duplicateDoses(rows = []) {
  const groups = new Map();
  rows.forEach((row) => {
    const key = [row.day, row.time, row.dose, row.unit, String(row.site).trim().toLowerCase()].join("|");
    const found = groups.get(key);
    if (found) {
      found.count += 1;
      return;
    }
    groups.set(key, { dayLabel: row.dayLabel, time: row.time, doseLabel: row.doseLabel, site: row.site, count: 1 });
  });
  return [...groups.values()].filter((group) => group.count > 1);
}

/** "Possible duplicate: 19 Jan 2026, 08:30 · 2.5 mg · left thigh (logged twice)." */
export function duplicateLine(group) {
  const when = [group.dayLabel, group.time].filter(Boolean).join(", ");
  const facts = [group.doseLabel, group.site].filter(Boolean).join(" · ");
  const times = group.count === 2 ? "twice" : `${group.count} times`;
  return `Possible duplicate: ${[when, facts].filter(Boolean).join(" · ")} (logged ${times}).`;
}

/** " · 6.8 kg to go" while the goal weight is still ahead, " · reached" once it is met. */
function goalSuffix(goalDistance, unit) {
  if (!goalDistance) return "";
  if (goalDistance.direction === "above") return ` · ${goalDistance.value} ${unit} to go`;
  return " · reached";
}

/**
 * The figures that lead the report — medication dose counts and the weight
 * figures. Only values that exist are returned, so nothing is ever shown as a
 * dash or a placeholder.
 */
export function summaryFigures(summary, unit) {
  const figures = [];
  if (summary.totalDoses) figures.push({ label: "Doses logged", value: String(summary.totalDoses) });

  const weight = summary.weight || {};
  if (weight.count >= 2) {
    figures.push({ label: "Starting weight", value: `${weight.start} ${unit}` });
    figures.push({ label: "Current weight", value: `${weight.end} ${unit}` });
    const pct = weight.changePct != null ? ` (${signedText(weight.changePct)}%)` : "";
    figures.push({ label: "Total change", value: `${signedText(weight.change)} ${unit}${pct}` });
  } else if (weight.count === 1) {
    figures.push({ label: "Current weight", value: `${weight.end} ${unit}` });
  }
  if (weight.goal != null) {
    figures.push({ label: "Goal weight", value: `${weight.goal} ${unit}${goalSuffix(weight.goalDistance, unit)}` });
  }
  if (summary.bmi != null) figures.push({ label: "BMI", value: String(summary.bmi) });
  return figures;
}

/** "14 entries · average change -0.4 kg per week." */
export function weightContextLine(weight, unit) {
  const parts = [`${weight.count} ${weight.count === 1 ? "entry" : "entries"}`];
  if (weight.weeks) parts.push(`over ${weight.weeks} weeks`);
  if (weight.perWeek != null) parts.push(`average change ${signedText(weight.perWeek)} ${unit} per week`);
  return `${parts.join(" · ")}.`;
}

/** "Doses logged: 12 of 14 scheduled in a 90-day period." */
export function adherenceLine(adherence, totalDoses) {
  return adherence.scheduled
    ? `Doses logged: ${adherence.logged} of ${adherence.scheduled} scheduled in a ${adherence.days}-day period.`
    : `Doses logged: ${totalDoses} in this period.`;
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
 * Side-effect rows, newest first, each with the most recent dose logged before
 * it — timing data only, no conclusions.
 */
export function sideEffectRows(events = [], shotsDesc = [], dayMetrics = {}, range) {
  const structured = events
    .map((e) => {
      const day = eventDayKey(e);
      return { day, event: e };
    })
    .filter(({ day }) => day && day >= range.from && day <= range.to)
    .map(({ day, event }) => ({
      id: event.id,
      day,
      dayLabel: formatDay(day),
      symptom: cleanSymptom(event.symptom),
      severity: asText(event.severity),
      detail: asText(event.duration || event.notes),
      legacy: false,
    }));

  // Free-text side effects logged before structured tracking are still shown.
  const legacy = Object.values(dayMetrics)
    .filter((m) => m.day_key >= range.from && m.day_key <= range.to && m.side_effects)
    .map((m) => ({
      id: `legacy-${m.day_key}`,
      day: m.day_key,
      dayLabel: formatDay(m.day_key),
      symptom: cleanSymptom(m.side_effects),
      severity: "",
      detail: "",
      legacy: true,
    }));

  return [...structured, ...legacy]
    .sort((a, b) => b.day.localeCompare(a.day))
    .map((row) => {
      const prior = shotsDesc.find((s) => {
        const key = shotDayKey(s);
        return key && key <= row.day;
      });
      return {
        ...row,
        prior: prior
          ? { label: `${prior.dose} ${prior.dose_unit || "mg"}`, day: shotDayKey(prior), dayLabel: formatDay(shotDayKey(prior)) }
          : null,
      };
    });
}

export function sideEffectFrequency(rows = []) {
  const counts = new Map();
  rows.forEach((row) => {
    row.symptom.split(",").map((part) => part.trim()).filter(Boolean).forEach((term) => {
      counts.set(term, (counts.get(term) || 0) + 1);
    });
  });
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
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
  const weight = summarizeWeight(series, profile, profileUnit, unit, range);
  const doses = doseRows(shotsInRange);
  const changes = doseChangeSummary([...doses].reverse(), new Set(doses.map((d) => d.medication)).size > 1);
  const medicationGroups = doseGroups(doses);
  const duplicates = duplicateDoses(doses);
  const adherence = adherenceFor(shots, shotsInRange, medicationFilter, range.days);
  const sideEffects = sideEffectRows(adverseEvents, shotsDesc, dayMetrics, range);

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
  // An optional section only appears when the user has data for it in the range.
  const selected = (options.sections || []).filter((id) => CORE_IDS.includes(id) || available[id]);

  const bmi = plausibleBmi(profile, weight.end, unit);
  const name = (options.name || "").trim();

  return {
    range,
    unit,
    available,
    sections: selected,
    hasAnyData: !!(shotsInRange.length || series.length || sideEffects.length),
    header: {
      name,
      generatedLabel: formatDay(todayKey()),
      rangeLabel: range.label,
      medications: medicationFilter === "all" ? medications : [medicationFilter],
      heightLabel: heightLabel(profile),
      startWeight: weight.start,
      endWeight: weight.end,
      goalWeight: weight.goal,
      change: weight.change,
      changePct: weight.changePct,
      bmi,
    },
    // `series` carries the plotted points through to the chart and the PDF.
    // `notEnough` is set when a trend cannot be drawn, so the preview and the
    // PDF say the same thing.
    // The summary is what leads the report: every medication with its latest
    // dose, route and concentration, the number of doses, the weight figures
    // that exist, and any entries that look like the same dose logged twice.
    summary: {
      medications: medicationGroups,
      totalDoses: doses.length,
      duplicates,
      weight,
      bmi,
    },
    weight: { ...weight, series, notEnough: series.length < 2 },
    doses: { rows: doses, changes, adherence, count: doses.length },
    sideEffects: { rows: sideEffects, frequency: sideEffectFrequency(sideEffects), total: sideEffects.length },
    optional,
    has: {
      weight: series.length > 0,
      doses: doses.length > 0,
      sideEffects: sideEffects.length > 0,
    },
  };
}