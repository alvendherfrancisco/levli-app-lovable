// ─────────────────────────────────────────────────────────────────────────────
// Doctor report — data assembly.
//
// PRESENTS only what the user logged, straight from existing entity fields:
// shots, DayMetric (weight / nutrition / water / exercise / legacy side-effect
// notes), AdverseEvent, JournalEntry, ProgressPhoto and the profile.
// No interpretation, no diagnosis, no dose advice, nothing invented.
// ─────────────────────────────────────────────────────────────────────────────

import { convertWeight } from "@/lib/units";
import { parseShotDate, toDayKey, todayKey, fromDayKey, calendarDaysBetween } from "@/lib/dateUtils";
import { getDosingInterval } from "@/lib/medicationData";
import { calcAdherence } from "@/lib/adherence";
import { RANGE_OPTIONS, DEFAULT_RANGE, CORE_IDS, OPTIONAL_IDS } from "@/lib/reportOptions";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// BMI is shown only inside this band. Outside it the number is almost always a
// unit or data-entry mismatch rather than a real measurement, so it is left out.
export const BMI_MIN_PLAUSIBLE = 15;
export const BMI_MAX_PLAUSIBLE = 80;

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

/** Shot record → its "YYYY-MM-DD" day key. */
export function shotDayKey(shot) {
  const d = parseShotDate(shot?.date);
  return d ? toDayKey(d) : "";
}

/** AdverseEvent → its "YYYY-MM-DD" day key (day_key, else parsed onset_date). */
export function eventDayKey(event) {
  if (!event) return "";
  if (event.day_key) return event.day_key;
  if (!event.onset_date) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(event.onset_date)) return event.onset_date;
  const d = parseShotDate(event.onset_date);
  return d ? toDayKey(d) : "";
}

/** JournalEntry date ("Jun 29, 2026") → its day key. */
export function journalDayKey(entry) {
  const d = parseShotDate(entry?.date);
  return d ? toDayKey(d) : "";
}

export function heightMetres(profile = {}) {
  const unit = profile.height_unit || "in";
  const a = parseFloat(profile.height_ft) || 0;
  const b = parseFloat(profile.height_in) || 0;
  if (unit === "cm") return a > 0 ? a / 100 : 0;
  const totalInches = a * 12 + b;
  return totalInches > 0 ? totalInches * 0.0254 : 0;
}

export function heightLabel(profile = {}) {
  const unit = profile.height_unit || "in";
  const a = parseFloat(profile.height_ft) || 0;
  const b = parseFloat(profile.height_in) || 0;
  if (unit === "cm") return a > 0 ? `${Math.round(a)} cm` : null;
  const totalInches = a * 12 + b;
  if (totalInches <= 0) return null;
  return `${a} ft ${b} in (${Math.round(totalInches * 2.54)} cm)`;
}

/** BMI for a weight in the given unit — null when height is missing or the result is implausible. */
export function plausibleBmi(profile, weight, unit) {
  const h = heightMetres(profile);
  const kg = convertWeight(weight, unit, "kg");
  if (!h || kg == null) return null;
  const bmi = kg / (h * h);
  if (!Number.isFinite(bmi) || bmi < BMI_MIN_PLAUSIBLE || bmi > BMI_MAX_PLAUSIBLE) return null;
  return Math.round(bmi * 10) / 10;
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
    const a = customFrom || addDaysToKey(today, -90);
    const b = customTo || today;
    const from = a <= b ? a : b;
    const to = a <= b ? b : a;
    return { from, to, label: `Custom (${formatDay(from)} – ${formatDay(to)})` };
  }
  const option = RANGE_OPTIONS.find((r) => r.id === rangeId) || RANGE_OPTIONS[1];
  const from = addDaysToKey(today, -(option.days - 1));
  return { from, to: today, label: option.label };
}

/**
 * Weight entries in the range, converted from their logged unit into the
 * report unit. Only real entries are returned — nothing is interpolated.
 */
export function buildWeightSeries(weightHistory = [], range, profileUnit, reportUnit) {
  const points = weightHistory
    .filter((w) => w.date >= range.from && w.date <= range.to)
    .map((w) => ({
      dayKey: w.date,
      ts: fromDayKey(w.date).getTime(),
      value: Math.round(convertWeight(w.weight, profileUnit, reportUnit) * 10) / 10,
      label: formatDayShort(w.date),
    }));

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

export function summarizeWeight(series, profile, profileUnit, reportUnit) {
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
  const days = series.length >= 2 ? calendarDaysBetween(start.dayKey, end.dayKey) : 0;
  const weeks = series.length >= 2 ? Math.max(1, round1(days / 7)) : null;
  const perWeek = weeks ? round1(change / weeks) : null;

  const goalRaw = parseFloat(profile?.goal_weight);
  const goal = Number.isFinite(goalRaw) && goalRaw > 0 ? round1(convertWeight(goalRaw, profileUnit, reportUnit)) : null;
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

function routeLabel(shot) {
  const route = (shot.route || "").replace(/_/g, " ");
  return [route, shot.concentration].filter(Boolean).join(" · ");
}

/** Dose table rows, newest first. */
export function doseRows(shotsDesc = []) {
  return shotsDesc.map((s) => ({
    id: s.id,
    day: shotDayKey(s),
    dayLabel: formatDay(shotDayKey(s)),
    time: s.time || "—",
    medication: s.medication || "—",
    dose: s.dose,
    unit: s.dose_unit || "mg",
    doseLabel: s.dose != null ? `${s.dose} ${s.dose_unit || "mg"}` : "—",
    site: s.site || "—",
    pain: s.pain ?? null,
    detail: routeLabel(s),
    notes: s.notes || "",
  }));
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
      severity: event.severity || "",
      detail: event.duration || event.notes || "",
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
  while (start <= range.to) {
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
      time: entry.time || "",
      mood: entry.mood || "",
      category: entry.category || "",
      text: entry.text || "",
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
  const withSite = shotsInRange.filter((s) => s.site);
  if (!withSite.length) return null;
  const counts = new Map();
  withSite.forEach((s) => counts.set(s.site, (counts.get(s.site) || 0) + 1));
  const painShots = shotsInRange.filter((s) => (s.pain || 0) > 0);

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
        pain: s.pain,
        medication: s.medication || "—",
        doseLabel: `${s.dose} ${s.dose_unit || "mg"}`,
      }))
      .sort((a, b) => b.dayLabel.localeCompare(a.dayLabel)),
    painReported: painShots.length,
    averagePain: painShots.length ? round1(painShots.reduce((a, s) => a + s.pain, 0) / painShots.length) : null,
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

  const dayKeys = [
    ...weightHistory.map((w) => w.date),
    ...shotsDesc.map(shotDayKey),
    ...adverseEvents.map(eventDayKey),
    ...Object.keys(dayMetrics),
  ].filter(Boolean);

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
    weight,
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