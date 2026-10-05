// ─────────────────────────────────────────────────────────────────────────────
// Doctor report — TEST FIXTURES.
//
// ⚠️ Testing only. Nothing in production imports this file: the report template
// reads the app's own data and never a fixture. It exists so the report can be
// rendered and checked against known scenarios, including the edge cases the
// template has to handle (no weight, duplicate entries, a dose change, several
// side effects, a single entry, an implausible BMI).
//
// Every fixture uses the same state shape the app holds at export time, so the
// report is built by the real engine — `buildReport(state, options)`.
// ─────────────────────────────────────────────────────────────────────────────

import { todayKey } from "@/lib/dateUtils";
import { shotDateFromKey } from "@/lib/repeatSchedule";
import { addDaysToKey } from "@/lib/reportData";

/** A day key relative to today, so fixtures stay inside "last 90 days". */
const day = (offset) => addDaysToKey(todayKey(), offset);

/** A one-dose-a-week schedule, oldest first. */
function weeklyDoses({ medication, steps, startOffset, route, concentration, sites }) {
  const shots = [];
  let offset = startOffset;
  steps.forEach(({ dose, count, unit = "mg", concentration: conc }) => {
    for (let i = 0; i < count; i += 1) {
      const index = shots.length;
      shots.push({
        id: `${medication}-${index}`,
        medication,
        dose,
        dose_unit: unit,
        dose_source: "label",
        route,
        concentration: conc || concentration,
        device_type: "multidose_pen",
        // Shots are stored the way the app stores them ("Jun 29, 2026").
        date: shotDateFromKey(day(offset)),
        time: "08:00",
        site: sites[index % sites.length],
        pain: [0, 1, 0, 2][index % 4],
      });
      offset += 7;
    }
  });
  return shots;
}

const PHOTO = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240">'
  + '<rect width="240" height="240" fill="rgb(226,232,240)"/>'
  + '<circle cx="120" cy="84" r="34" fill="rgb(148,163,184)"/>'
  + '<rect x="56" y="130" width="128" height="90" rx="26" fill="rgb(148,163,184)"/>'
  + "</svg>",
)}`;

// ── 1. Minimal data ──────────────────────────────────────────────────────────
// One dose, no weight, no side effects, no optional data.
const minimal = {
  profile: { height_cm: 170, height_unit: "cm", weight_unit: "kg", unit_check_status: "kept_kg" },
  shots: [{
    id: "min-1",
    medication: "Ozempic®",
    dose: 0.25,
    dose_unit: "mg",
    dose_source: "label",
    route: "subcutaneous",
    concentration: "0.68 mg/mL",
    date: shotDateFromKey(day(-3)),
    time: "09:15",
    site: "Left abdomen",
    pain: 1,
  }],
  weightHistory: [],
  dayMetrics: {},
  adverseEvents: [],
  journalEntries: [],
  progressPhotosList: [],
};

// ── 2. Duplicate dose entries, no weight ─────────────────────────────────────
// Two entries share a timestamp, dose and site; no weight was ever logged.
const duplicates = {
  profile: { height_cm: 178, height_unit: "in", weight_unit: "lb", unit_check_status: "converted" },
  shots: [
    {
      id: "dup-1", medication: "Ozempic®", dose: 1, dose_unit: "mg", dose_source: "label",
      route: "subcutaneous", concentration: "1.34 mg/mL", date: shotDateFromKey(day(-14)), time: "08:00", site: "Right thigh", pain: 0,
    },
    {
      id: "dup-2", medication: "Ozempic®", dose: 1, dose_unit: "mg", dose_source: "label",
      route: "subcutaneous", concentration: "1.34 mg/mL", date: shotDateFromKey(day(-21)), time: "08:00", site: "Left thigh", pain: 0,
    },
    {
      id: "dup-3", medication: "Ozempic®", dose: 1, dose_unit: "mg", dose_source: "label",
      route: "subcutaneous", concentration: "1.34 mg/mL", date: shotDateFromKey(day(-21)), time: "08:00", site: "Left thigh", pain: 0,
    },
  ],
  weightHistory: [],
  dayMetrics: {},
  adverseEvents: [],
  journalEntries: [],
  progressPhotosList: [],
};

// ── 3. Full data: weight history, a dose change, several side effects ─────────
const fullMetrics = {};
for (let i = 0; i < 24; i += 1) {
  const key = day(-i * 3);
  fullMetrics[key] = {
    day_key: key,
    calories: 1520 + (i % 5) * 45,
    protein: 96 + (i % 4) * 6,
    fiber: 18 + (i % 3),
    carbs: 132 + (i % 6) * 5,
    water: 64 + (i % 3) * 8,
    exercise_min: i % 3 === 0 ? 0 : 25 + (i % 4) * 5,
  };
}

const full = {
  profile: {
    height_cm: 172,
    height_unit: "cm",
    weight_unit: "lb", // logged in pounds; the report is exported in kilograms
    unit_check_status: "converted",
    goal_weight_kg: 90,
    liquid_unit: "oz",
  },
  shots: weeklyDoses({
    medication: "Ozempic®",
    startOffset: -84,
    route: "subcutaneous",
    concentration: "1.34 mg/mL",
    sites: ["Left abdomen", "Right abdomen", "Left thigh", "Right thigh"],
    // A dose change halfway through the period: 6 weeks at 0.5 mg, then 1 mg.
    steps: [
      { dose: 0.5, count: 6 },
      { dose: 1, count: 7, concentration: "2.68 mg/mL" },
    ],
  }),
  weightHistory: [
    { date: day(-84), weight: 231.5 },
    { date: day(-77), weight: 230.2 },
    { date: day(-70), weight: 228.8 },
    { date: day(-63), weight: 227.9 },
    { date: day(-56), weight: 226.4 },
    { date: day(-49), weight: 225.8 },
    { date: day(-42), weight: 224.9 },
    { date: day(-35), weight: 223.6 },
    { date: day(-28), weight: 222.8 },
    { date: day(-21), weight: 221.5 },
    { date: day(-14), weight: 220.9 },
    { date: day(-7), weight: 219.4 },
  ],
  dayMetrics: fullMetrics,
  adverseEvents: [
    {
      id: "ae-1", symptom: "Nausea", severity: "moderate", symptom_key: "nausea",
      onset_date: day(-40), day_key: day(-40), duration: "3 days", resolved: true,
    },
    {
      id: "ae-2", symptom: "Headache", severity: "mild", symptom_key: "headache",
      onset_date: day(-33), day_key: day(-33), duration: "1 day", resolved: true,
    },
    {
      id: "ae-3", symptom: "Injection site reaction", severity: "mild", symptom_key: "injection_site",
      onset_date: day(-20), day_key: day(-20), duration: "2 days", resolved: true,
    },
    {
      id: "ae-4", symptom: "Diarrhoea", severity: "moderate", symptom_key: "diarrhoea",
      onset_date: day(-12), day_key: day(-12), duration: "ongoing", resolved: false,
    },
    {
      id: "ae-5", symptom: "Constipation, bloating", severity: "mild", symptom_key: "constipation",
      onset_date: day(-5), day_key: day(-5), duration: "2 days", resolved: true,
    },
  ],
  journalEntries: [
    { id: "j-1", date: shotDateFromKey(day(-45)), time: "21:30", mood: "Hopeful", category: "Side effects", text: "First week on the higher dose. Queasy in the evenings, better if I eat small meals." },
    { id: "j-2", date: shotDateFromKey(day(-9)), time: "07:45", mood: "Steady", category: "Progress", text: "Clothes fitting better. Walking after dinner most evenings." },
  ],
  progressPhotosList: [{ id: "p-1", day_key: day(-45), url: PHOTO }],
};

// ── 4. Edge cases: a single entry, and an implausible BMI ─────────────────────
// One weight entry (no trend line possible) whose value cannot produce a real
// adult BMI, so BMI is left out with no note. No report name either.
const edgeCases = {
  profile: { height_cm: 178, height_unit: "cm", weight_unit: "lb", unit_check_status: "pending" },
  shots: [{
    id: "edge-1",
    medication: "Mounjaro®",
    dose: 2.5,
    dose_unit: "mg",
    dose_source: "label",
    route: "subcutaneous",
    concentration: "0.5 mg/0.5 mL",
    date: shotDateFromKey(day(-10)),
    time: "19:00",
    site: "Right abdomen",
    pain: 2,
  }],
  weightHistory: [{ date: day(-10), weight: 55 }],
  dayMetrics: {},
  adverseEvents: [],
  journalEntries: [],
  progressPhotosList: [],
};

export const REPORT_FIXTURES = [
  {
    id: "minimal",
    title: "1 · Minimal data",
    note: "One dose, no weight, no side effects. Expect one weight line, no chart, and no optional sections.",
    state: minimal,
    options: { rangeId: "all", medication: "all", weightUnit: "kg", name: "Sample patient", sections: [] },
  },
  {
    id: "duplicates",
    title: "2 · Duplicate entries, no weight",
    note: "Two doses logged at the same timestamp, dose and site; no weight entries at all.",
    state: duplicates,
    options: { rangeId: "all", medication: "all", weightUnit: "lb", name: "Sample patient", sections: ["injectionSites"] },
  },
  {
    id: "full",
    title: "3 · Full data — weight history, dose change, side effects",
    note: "90 days: 13 doses with a 0.5 mg → 1 mg change, 12 weight entries exported in kg while the profile is in lb, 5 side effects, plus nutrition, water, exercise, journal and one photo.",
    state: full,
    options: {
      rangeId: "3m",
      medication: "all",
      weightUnit: "kg",
      name: "Sample patient",
      sections: ["injectionSites", "nutrition", "water", "exercise", "journal", "progressPictures"],
    },
  },
  {
    id: "edge",
    title: "4 · Edge cases — one entry, implausible BMI",
    note: "A single weight entry (so no trend line), a weight and height that cannot produce a real BMI (left out silently), and no report name.",
    state: edgeCases,
    options: { rangeId: "all", medication: "all", weightUnit: "lb", name: "", sections: ["injectionSites"] },
  },
];