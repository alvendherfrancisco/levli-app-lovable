/* Temporary: exercises the report engine and PDF for the three data cases. */
import { jsPDF } from "jspdf";
import { buildReport, summaryFigures, medicationLine, weightContextLine, adherenceLine, duplicateLine } from "@/lib/reportData";
import { buildReportPdf } from "@/lib/reportPdf";
import { REPORT_FOOTER } from "@/lib/reportOptions";

const profile = { weight_unit: "kg", height_cm: 172, height_unit: "cm", goal_weight_kg: 78, liquid_unit: "ml" };
const shot = (o) => ({ dose_unit: "mg", time: "08:30", site: "left thigh", route: "subcutaneous", drug_class: "semaglutide", ...o });

/** The app stores shot dates as "Mon DD, YYYY". */
const day = (key) => {
  const [y, m, d] = key.split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[m - 1]} ${String(d).padStart(2, "0")}, ${y}`;
};

const cases = {
  minimal: {
    shots: [shot({ id: "s1", medication: "Ozempic", dose: 0.25, date: "2026-09-01" })],
    weightHistory: [], dayMetrics: {}, adverseEvents: [], journalEntries: [], progressPhotosList: [], profile,
  },
  duplicates: {
    shots: [
      shot({ id: "s1", medication: "Mounjaro", dose: 5, date: "2026-09-20", drug_class: "tirzepatide" }),
      shot({ id: "s2", medication: "Mounjaro", dose: 5, date: "2026-09-20", drug_class: "tirzepatide" }),
      shot({ id: "s3", medication: "Mounjaro", dose: 5, date: "2026-09-13", site: "right thigh", drug_class: "tirzepatide" }),
    ],
    weightHistory: [],
    dayMetrics: {},
    adverseEvents: [{ id: "a1", symptom: "Nausea, headache", severity: "mild", onset_date: "2026-09-14", duration: "2 days" }],
    journalEntries: [], progressPhotosList: [], profile,
  },
  full: {
    shots: [
      shot({ id: "f1", medication: "Ozempic", dose: 0.25, date: "2026-05-04", site: "left thigh" }),
      shot({ id: "f2", medication: "Ozempic", dose: 0.5, date: "2026-05-11", site: "right thigh" }),
      shot({ id: "f3", medication: "Ozempic", dose: 0.5, date: "2026-05-18", site: "abdomen left", pain: 2 }),
      shot({ id: "f4", medication: "Mounjaro", dose: 5, date: "2026-06-01", site: "abdomen right", drug_class: "tirzepatide", concentration: "2.5 mg/mL" }),
      shot({ id: "f5", medication: "Mounjaro", dose: 5, date: "2026-06-08", site: "left thigh", drug_class: "tirzepatide", concentration: "2.5 mg/mL", pain: 4 }),
      shot({ id: "f6", medication: "Mounjaro", dose: 7.5, date: "2026-06-15", site: "right thigh", drug_class: "tirzepatide", concentration: "2.5 mg/mL" }),
    ],
    weightHistory: [
      ["2026-05-04", 96.4], ["2026-05-18", 95.1], ["2026-06-01", 94.2], ["2026-06-15", 92.8],
      ["2026-07-01", 91.9], ["2026-07-20", 90.4], ["2026-08-10", 89.6], ["2026-08-30", 88.7], ["2026-09-20", 87.9],
    ].map(([date, weight]) => ({ date, weight })),
    dayMetrics: {
      "2026-06-01": { day_key: "2026-06-01", water: 1500, calories: 1780, protein: 104, exercise_min: 25, fiber: 22 },
      "2026-06-02": { day_key: "2026-06-02", water: 1200, calories: 1900, protein: 96, exercise_min: 0, carbs: 180 },
      "2026-06-09": { day_key: "2026-06-09", water: 1700, calories: 1650, protein: 118, exercise_min: 40 },
    },
    adverseEvents: [
      { id: "a1", symptom: "Nausea", severity: "moderate", onset_date: "2026-06-02", duration: "1 day", notes: "after first dose" },
      { id: "a2", symptom: "Injection site reaction", severity: "mild", onset_date: "2026-06-09" },
      { id: "a3", symptom: "Constipation, nausea", severity: "severe", onset_date: "2026-06-16", duration: "5 days" },
    ],
    journalEntries: [
      { id: "j1", date: "Jun 2, 2026", time: "20:00", mood: "okay", category: "Side effects", text: "Queasy in the evening but it passed. Managed to eat a full dinner." },
    ],
    progressPhotosList: [], profile,
  },
};

const options = {
  rangeId: "all", customFrom: "", customTo: "", medication: "all", weightUnit: "kg", name: "Alex Morgan",
  sections: ["weight", "doses", "sideEffects", "injectionSites", "nutrition", "water", "exercise", "journal"],
};

/** Column weights as declared in reportPdf.js, to check nothing is truncated. */
const columnCheck = (weights) => {
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  const probe = new jsPDF({ unit: "mm", format: "a4" });
  probe.setFont("helvetica", "bold");
  probe.setFontSize(10);
  const out = {};
  Object.entries(weights).forEach(([label, w]) => {
    const available = (w / total) * 182 - 4;
    out[label] = `${probe.getTextWidth(label).toFixed(1)}mm in ${available.toFixed(1)}mm`;
  });
  return out;
};

// Records where a page break happens, so a stray pagination can be traced.
const proto = jsPDF.prototype;
const origText = proto.text;
const origAddPage = proto.addPage;
let lastTextY = 0;
let breaks = [];
proto.text = function (text, x, y, ...rest) {
  if (typeof y === "number") lastTextY = y;
  return origText.call(this, text, x, y, ...rest);
};
proto.addPage = function (...args) {
  breaks.push(Number(lastTextY.toFixed(1)));
  return origAddPage.apply(this, args);
};

export async function run() {
  const out = {};

  for (const [name, state] of Object.entries(cases)) {
    const report = buildReport(state, options);
    const json = JSON.stringify(report);
    const problems = [];
    if (json.includes("—")) problems.push("em dash present");
    if (json.toLowerCase().includes("check your")) problems.push("user-addressed message");

    const doc = await buildReportPdf(report);
    out[name] = {
      pages: doc.getNumberOfPages(),
      pdfBytes: doc.output("arraybuffer").byteLength,
      medications: report.summary.medications.map((g) => `${g.name} | ${g.dose} ${g.unit} | ${g.route || "no route"} | ${g.concentration || "no concentration"} | n=${g.count}`),
      figures: summaryFigures(report.summary, report.unit).map((f) => `${f.label}: ${f.value}`),
      duplicates: report.summary.duplicates.map((d) => `${d.dayLabel} ${d.time} | ${d.doseLabel} | ${d.site} | x${d.count}`),
      doseRows: report.doses.rows.length,
      changes: report.doses.changes,
      sections: report.sections,
      data: { weightEntries: report.weight.count, doses: report.doses.count, sideEffects: report.sideEffects.total },
      emptyLine: report.weight.count === 0 ? "No weight entries in this period." : report.weight.count === 1 ? "One weight entry in this period." : "chart drawn",
      problems,
    };
  }

  const probe = new jsPDF({ unit: "mm", format: "a4" });
  probe.setFontSize(8);
  out.widths = {
    footer: `${probe.getTextWidth(REPORT_FOOTER).toFixed(1)}mm (fits ~146mm before the page number)`,
  };
  out.doseTableColumns = columnCheck({ Date: 22, Time: 13, Dose: 17, "Injection site": 30, Pain: 12 });
  out.sideEffectColumns = columnCheck({ Date: 20, "Side effect": 34, Severity: 16, "Duration / notes": 30, "Previous dose": 24 });

  // The exact sentences the PDF and the preview both draw.
  const full = buildReport(cases.full, options);
  const dup = buildReport(cases.duplicates, options);
  const min = buildReport(cases.minimal, options);
  out.sentences = {
    medication: full.summary.medications.map(medicationLine),
    weightContext: weightContextLine(full.weight, full.unit),
    adherenceWithSchedule: adherenceLine(full.doses.adherence, full.doses.count),
    adherenceNoSchedule: adherenceLine(min.doses.adherence, min.doses.count),
    duplicate: dup.summary.duplicates.map(duplicateLine),
  };

  // How the content grows, page by page.
  out.pageProbe = {};
  for (const subset of [["weight"], ["doses"], ["sideEffects"], ["weight", "doses"], ["weight", "doses", "sideEffects"], options.sections]) {
    const report = buildReport(cases.full, { ...options, sections: subset });
    breaks = [];
    lastTextY = 0;
    const doc = await buildReportPdf(report);
    out.pageProbe[subset.join("+")] = {
      pages: doc.getNumberOfPages(),
      brokeAfterY: breaks.slice(),
      lastY: Number(lastTextY.toFixed(1)),
    };
  }

  // Nothing drawn may contain a dash, a placeholder or a message for the reader.
  const banned = ["—", "Not set", "Not recorded", "undefined", "null", "Check your", "in the app", "this range"];
  const bannedHits = Object.entries(out.sentences).flatMap(([key, value]) =>
    (Array.isArray(value) ? value : [value]).filter((text) => banned.some((bad) => String(text).includes(bad))).map((text) => `${key}: ${text}`));
  out.bannedHits = bannedHits;
  return out;
}