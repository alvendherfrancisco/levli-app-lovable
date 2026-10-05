// ─────────────────────────────────────────────────────────────────────────────
// Doctor report — PDF.
//
// A clean A4 document on a WHITE background (the app itself is dark), built
// only from values the report engine assembled. Rows and charts are never split
// across pages, and every page carries the same footer.
// ─────────────────────────────────────────────────────────────────────────────

import { getDoseColor, getDoseTextColor, CUSTOM_DOSE_COLOR } from "@/lib/doseColors";
import { fromDayKey, toDayKey } from "@/lib/dateUtils";
import { REPORT_FOOTER } from "@/lib/reportOptions";
import { formatDayShort } from "@/lib/reportData";
import { drawWeightChart, drawFrequencyBars, fitText, hexToRgb } from "@/lib/reportPdfCharts";

const PAGE = { w: 210, h: 297, margin: 14, contentW: 182, bottom: 268 };
const INK = [31, 41, 55];
const MUTED = [122, 132, 148];

function paintWhite(doc) {
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, PAGE.w, PAGE.h, "F");
}

function newPage(doc) {
  doc.addPage();
  paintWhite(doc);
  return PAGE.margin + 4;
}

function ensure(doc, y, needed) {
  return y + needed > PAGE.bottom ? newPage(doc) : y;
}

function signed(value, digits = 1) {
  if (value == null) return "—";
  return `${value < 0 ? "-" : "+"}${Math.abs(value).toFixed(digits)}`;
}

function heading(doc, text, y) {
  y = ensure(doc, y, 16);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12.5);
  doc.setTextColor(INK[0], INK[1], INK[2]);
  doc.text(text, PAGE.margin, y);
  doc.setDrawColor(99, 102, 241);
  doc.setLineWidth(0.6);
  doc.line(PAGE.margin, y + 1.6, PAGE.margin + 22, y + 1.6);
  return y + 8;
}

function note(doc, text, y, size = 8) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(size);
  doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  const lines = doc.splitTextToSize(text, PAGE.contentW);
  y = ensure(doc, y, lines.length * 3.8 + 2);
  doc.text(lines, PAGE.margin, y);
  return y + lines.length * 3.8 + 2;
}

/** Two-column key/value block. */
function keyValues(doc, pairs, y) {
  doc.setFontSize(8.5);
  const rowH = 5.4;
  const colW = PAGE.contentW / 2;
  for (let i = 0; i < pairs.length; i += 2) {
    y = ensure(doc, y, rowH);
    const pair = pairs[i];
    doc.setFont("helvetica", "normal");
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text(fitText(doc, pair[0], colW - 26), PAGE.margin, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(INK[0], INK[1], INK[2]);
    doc.text(fitText(doc, pair[1], 24), PAGE.margin + colW - 24, y);

    const second = pairs[i + 1];
    if (second) {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
      doc.text(fitText(doc, second[0], colW - 26), PAGE.margin + colW, y);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(INK[0], INK[1], INK[2]);
      doc.text(fitText(doc, second[1], 24), PAGE.margin + PAGE.contentW - 24, y);
    }
    y += rowH;
  }
  return y + 2;
}

/** Table with per-row page-break safety and an optional dose-colour badge. */
function table(doc, { x = PAGE.margin, y, width = PAGE.contentW, columns, rows, fontSize = 8 }) {
  const rowH = 6.2;
  const total = columns.reduce((a, c) => a + c.w, 0);
  const cols = columns.map((c) => ({ ...c, w: (c.w / total) * width }));

  const drawHead = (top) => {
    doc.setFillColor(243, 244, 248);
    doc.rect(x, top, width, rowH, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(fontSize);
    doc.setTextColor(88, 96, 110);
    let cx = x + 1.5;
    cols.forEach((c) => {
      doc.text(fitText(doc, c.label, c.w - 3), cx, top + rowH - 2.1);
      cx += c.w;
    });
    return top + rowH;
  };

  y = ensure(doc, y, rowH * 2);
  y = drawHead(y);

  rows.forEach((row, index) => {
    if (y + rowH > PAGE.bottom) {
      y = newPage(doc);
      y = drawHead(y);
    }
    if (index % 2 === 1) {
      doc.setFillColor(250, 250, 252);
      doc.rect(x, y, width, rowH, "F");
    }
    let cx = x + 1.5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(fontSize);
    cols.forEach((c) => {
      const maxW = c.w - 3;
      const text = fitText(doc, c.text(row), maxW);
      if (c.badge) {
        const colour = c.colour ? c.colour(row) : CUSTOM_DOSE_COLOR;
        const rgb = hexToRgb(colour);
        const badgeW = Math.min(maxW, doc.getTextWidth(text) + 3.4);
        doc.setFillColor(rgb[0], rgb[1], rgb[2]);
        doc.roundedRect(cx, y + 1.4, badgeW, 3.9, 0.9, 0.9, "F");
        const ink = hexToRgb(getDoseTextColor(colour));
        doc.setTextColor(ink[0], ink[1], ink[2]);
        doc.text(text, cx + 1.7, y + rowH - 2.1);
        doc.setTextColor(INK[0], INK[1], INK[2]);
      } else {
        doc.setTextColor(INK[0], INK[1], INK[2]);
        doc.text(text, cx, y + rowH - 2.1);
      }
      cx += c.w;
    });
    y += rowH;
  });

  return y + 3;
}

function footer(doc) {
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 228, 234);
    doc.setLineWidth(0.3);
    doc.line(PAGE.margin, PAGE.h - 16, PAGE.w - PAGE.margin, PAGE.h - 16);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text(REPORT_FOOTER, PAGE.margin, PAGE.h - 12);
    doc.text(`Page ${i} of ${pages}`, PAGE.w - PAGE.margin, PAGE.h - 12, { align: "right" });
  }
}

function loadThumbnail(url, size = 260) {
  return new Promise((resolve) => {
    try {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext("2d");
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, size, size);
          const scale = Math.max(size / image.width, size / image.height);
          const w = image.width * scale;
          const h = image.height * scale;
          ctx.drawImage(image, (size - w) / 2, (size - h) / 2, w, h);
          resolve(canvas.toDataURL("image/jpeg", 0.7));
        } catch {
          resolve(null);
        }
      };
      image.onerror = () => resolve(null);
      image.src = url;
    } catch {
      resolve(null);
    }
  });
}

function reportUnitLabel(row) {
  return row.dose == null ? "—" : `${row.dose} ${row.unit}`;
}

export async function buildReportPdf(report) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  paintWhite(doc);

  const unit = report.unit;
  const has = (id) => report.sections.includes(id);
  let y = PAGE.margin + 2;

  // ── 1. Header ──────────────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);
  doc.setTextColor(INK[0], INK[1], INK[2]);
  doc.text("Levli Health Report", PAGE.margin, y);
  y += 7;

  if (report.header.name) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text(`Name: ${report.header.name}`, PAGE.margin, y);
    y += 5;
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  doc.text(`Date range: ${report.header.rangeLabel}`, PAGE.margin, y);
  y += 4.6;
  doc.text(`Generated: ${report.header.generatedLabel}`, PAGE.margin, y);
  y += 4.6;
  doc.text(
    `Medication${report.header.medications.length === 1 ? "" : "s"}: ${report.header.medications.join(", ") || "—"}`,
    PAGE.margin, y,
  );
  y += 6;

  y = heading(doc, "At a glance", y);
  y = keyValues(doc, [
    ["Height", report.header.heightLabel || "Not recorded"],
    ["Starting weight", report.header.startWeight != null ? `${report.header.startWeight} ${unit}` : "—"],
    ["Current weight", report.header.endWeight != null ? `${report.header.endWeight} ${unit}` : "—"],
    ["Goal weight", report.header.goalWeight != null ? `${report.header.goalWeight} ${unit}` : "Not set"],
    ["Total change", report.header.change != null ? `${signed(report.header.change)} ${unit} (${signed(report.header.changePct)}%)` : "—"],
    ...(report.header.bmi != null ? [["BMI", `${report.header.bmi}`]] : []),
  ], y);

  if (report.header.bmi == null && report.header.heightLabel) {
    y = note(doc, "BMI is omitted because the height and weight on file do not produce a plausible value. Check the height and weight units in Profile.", y, 7.5);
  }

  // ── 2. Weight progress ─────────────────────────────────────────────────────
  if (has("weight")) {
    y = heading(doc, "Weight progress", y + 2);
    const weight = report.weight;

    if (!weight.count) {
      y = note(doc, "No weight entries in this selected range.", y);
    } else {
      y = keyValues(doc, [
        ["Starting weight", `${weight.start} ${unit}`],
        ["Current weight", `${weight.end} ${unit}`],
        ["Total change", `${signed(weight.change)} ${unit}`],
        ["Change (%)", `${signed(weight.changePct)}%`],
        ["Average weekly change", weight.perWeek != null ? `${signed(weight.perWeek)} ${unit}` : "—"],
        ["Goal", weight.goalLabel ? `${weight.goalLabel} · ${goalText(weight.goalDistance, unit)}` : "Not set"],
        ["Entries", `${weight.count}`],
        ["Period", weight.weeks ? `${weight.weeks} weeks` : "—"],
      ], y);
      y += 2;

      if (weight.count >= 2) {
        const chartHeight = 62;
        y = ensure(doc, y, chartHeight + 20);
        const markers = report.doses.rows
          .map((row) => ({
            ts: fromDayKey(row.day).getTime(),
            color: getDoseColor(row.medication, row.dose),
            label: reportUnitLabel(row),
          }))
          .filter((marker) => marker.ts >= fromDayKey(report.range.from).getTime() && marker.ts <= fromDayKey(report.range.to).getTime());

        y += drawWeightChart(doc, {
          x: PAGE.margin,
          y,
          w: PAGE.contentW,
          h: chartHeight,
          series: weight.series || [],
          markers,
          unit,
          fromTs: fromDayKey(report.range.from).getTime(),
          toTs: fromDayKey(report.range.to).getTime(),
          labelFor: (ts) => formatDayShort(toDayKey(new Date(ts))),
        });
        y = note(doc, "Solid line: logged weight entries (one point per entry, no values filled in). Dashed line: 7-day rolling average. Coloured ticks: dose dates, matching the dose colours in the app.", y, 7.5);
      } else {
        y = note(doc, "Only one weight entry in this range, so no trend line is drawn.", y);
      }

      if (weight.gaps.length) {
        weight.gaps.forEach((gap) => {
          y = note(doc, `No weight entries between ${formatDayShort(gap.from)} and ${formatDayShort(gap.to)} (${gap.days} days).`, y, 7.5);
        });
      }
    }
  }

  // ── 3. Doses taken ─────────────────────────────────────────────────────────
  if (has("doses")) {
    y = heading(doc, "Doses taken", y + 2);
    if (!report.doses.count) {
      y = note(doc, "No doses logged in this selected range.", y);
    } else {
      y = note(doc, report.doses.changes.join(" · "), y, 8.5);
      const adherence = report.doses.adherence;
      y = note(
        doc,
        adherence.scheduled
          ? `Shots logged: ${adherence.logged} of ${adherence.scheduled} scheduled doses (${adherence.days}-day range).`
          : `Shots logged: ${adherence.logged}.`,
        y, 8.5,
      );
      y += 1;

      const withDetail = report.doses.rows.some((r) => r.detail);
      const withPain = has("injectionSites");
      const columns = [
        { label: "Date", w: 20, text: (r) => r.dayLabel },
        { label: "Time", w: 14, text: (r) => r.time },
        { label: "Medication", w: 24, text: (r) => r.medication },
        { label: "Dose", w: 14, badge: true, text: (r) => reportUnitLabel(r), colour: (r) => getDoseColor(r.medication, r.dose) },
        { label: "Injection site", w: 26, text: (r) => r.site },
        ...(withDetail ? [{ label: "Route / concentration", w: 20, text: (r) => r.detail || "—" }] : []),
        ...(withPain ? [{ label: "Pain", w: 10, text: (r) => (r.pain != null ? `${r.pain}/10` : "—") }] : []),
      ];
      y = table(doc, { y, columns, rows: report.doses.rows });
      y = note(doc, "Newest dose first. Pain is the level recorded with each dose (0-10).", y, 7.5);
    }
  }

  // ── 4. Side effects ────────────────────────────────────────────────────────
  if (has("sideEffects")) {
    y = heading(doc, "Side effects", y + 2);
    if (!report.sideEffects.total) {
      y = note(doc, "No side effects logged in this selected range.", y);
    } else {
      y = table(doc, {
        y,
        columns: [
          { label: "Date", w: 22, text: (r) => r.dayLabel },
          { label: "Side effect", w: 32, text: (r) => r.symptom },
          { label: "Severity", w: 18, text: (r) => r.severity || "—" },
          { label: "Duration / notes", w: 30, text: (r) => r.detail || "—" },
          { label: "Most recent dose before", w: 28, text: (r) => (r.prior ? `${r.prior.label} on ${r.prior.dayLabel}` : "No dose logged before") },
        ],
        rows: report.sideEffects.rows,
      });

      if (report.sideEffects.frequency.length) {
        y = ensure(doc, y, 14 + report.sideEffects.frequency.length * 7);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(INK[0], INK[1], INK[2]);
        doc.text("How often each side effect was logged", PAGE.margin, y);
        y += 5;
        y += drawFrequencyBars(doc, {
          x: PAGE.margin,
          y,
          w: PAGE.contentW,
          rows: report.sideEffects.frequency,
        });
        y += 3;
      }

      y = note(doc, "Severe or persistent symptoms should be discussed with a healthcare provider.", y, 8.5);
    }
  }

  // ── 5. Optional sections ───────────────────────────────────────────────────
  const injection = report.optional.injectionSites;
  if (has("injectionSites") && injection) {
    y = heading(doc, "Injection sites and pain", y + 2);
    y = table(doc, {
      y,
      columns: [
        { label: "Site", w: 60, text: (r) => r.site },
        { label: "Doses", w: 20, text: (r) => String(r.count) },
        { label: "% of doses", w: 20, text: (r) => `${r.pct}%` },
      ],
      rows: injection.counts,
    });
    y = note(doc, `${injection.sitesUsed} site${injection.sitesUsed === 1 ? "" : "s"} used across ${injection.totalDosesWithSite} doses.`, y, 7.5);
    if (injection.painReported) {
      y = note(doc, `Pain was recorded on ${injection.painReported} dose${injection.painReported === 1 ? "" : "s"}, average ${injection.averagePain}/10.`, y, 7.5);
    } else {
      y = note(doc, "No pain was recorded with any dose in this range.", y, 7.5);
    }
  }

  const nutrition = report.optional.nutrition;
  if (has("nutrition") && nutrition) {
    y = heading(doc, "Nutrition", y + 2);
    y = keyValues(doc, [
      ["Days logged", String(nutrition.days)],
      ["Calories (average)", nutrition.calories != null ? `${nutrition.calories} kcal` : "—"],
      ["Protein (average)", nutrition.protein != null ? `${nutrition.protein} g` : "—"],
      ["Fiber (average)", nutrition.fiber != null ? `${nutrition.fiber} g` : "—"],
      ["Carbs (average)", nutrition.carbs != null ? `${nutrition.carbs} g` : "—"],
    ], y);
    if (nutrition.weekly.length) {
      y = table(doc, {
        y,
        columns: [
          { label: "Week", w: 55, text: (r) => r.label },
          { label: "Days logged", w: 20, text: (r) => String(r.days) },
          { label: "Average calories", w: 30, text: (r) => `${r.value} kcal` },
        ],
        rows: nutrition.weekly,
      });
    }
  }

  const water = report.optional.water;
  if (has("water") && water) {
    y = heading(doc, "Water", y + 2);
    y = note(doc, `Logged on ${water.days} day${water.days === 1 ? "" : "s"} · average ${water.average} ${water.unit}/day · total ${water.total} ${water.unit}.`, y, 8.5);
    if (water.weekly.length) {
      y = table(doc, {
        y,
        columns: [
          { label: "Week", w: 55, text: (r) => r.label },
          { label: "Days logged", w: 20, text: (r) => String(r.days) },
          { label: "Average", w: 30, text: (r) => `${r.value} ${water.unit}` },
        ],
        rows: water.weekly,
      });
    }
  }

  const exercise = report.optional.exercise;
  if (has("exercise") && exercise) {
    y = heading(doc, "Exercise", y + 2);
    y = note(doc, `Logged on ${exercise.days} day${exercise.days === 1 ? "" : "s"} · average ${exercise.average} min/day · total ${exercise.total} min.`, y, 8.5);
    if (exercise.weekly.length) {
      y = table(doc, {
        y,
        columns: [
          { label: "Week", w: 55, text: (r) => r.label },
          { label: "Days logged", w: 20, text: (r) => String(r.days) },
          { label: "Average", w: 30, text: (r) => `${r.value} min` },
        ],
        rows: exercise.weekly,
      });
    }
  }

  const journal = report.optional.journal;
  if (has("journal") && journal) {
    y = heading(doc, "Journal entries", y + 2);
    journal.forEach((entry) => {
      const meta = [entry.dayLabel, entry.time, entry.mood, entry.category].filter(Boolean).join(" · ");
      const bodyLines = doc.splitTextToSize(entry.text, PAGE.contentW);
      y = ensure(doc, y, bodyLines.length * 3.8 + 8);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(INK[0], INK[1], INK[2]);
      doc.text(meta, PAGE.margin, y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.text(bodyLines, PAGE.margin, y + 4);
      y += bodyLines.length * 3.8 + 8;
    });
    y = note(doc, "Entries are shown exactly as written by the person logging them.", y, 7.5);
  }

  const pictures = report.optional.progressPictures;
  if (has("progressPictures") && pictures) {
    y = heading(doc, "Progress pictures", y + 2);
    y = note(doc, "Personal photos, included because this section was selected.", y, 7.5);
    const cell = 52;
    let col = 0;
    for (const photo of pictures) {
      if (col === 0) y = ensure(doc, y, cell + 8);
      const dataUrl = await loadThumbnail(photo.url);
      const px = PAGE.margin + col * (cell + 8);
      if (dataUrl) {
        doc.addImage(dataUrl, "JPEG", px, y, cell, cell);
      } else {
        doc.setDrawColor(226, 228, 234);
        doc.rect(px, y, cell, cell);
        doc.setFontSize(7);
        doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
        doc.text("Photo unavailable", px + 2, y + cell / 2);
      }
      doc.setFontSize(7);
      doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
      doc.text(photo.dayLabel, px, y + cell + 3.6);
      col += 1;
      if (col === 3) {
        col = 0;
        y += cell + 8;
      }
    }
    if (col !== 0) y += cell + 8;
  }

  footer(doc);
  return doc;
}

function goalText(goalDistance, unit) {
  if (!goalDistance) return "Goal not set";
  if (goalDistance.direction === "at") return "At goal";
  return `${goalDistance.value} ${unit} ${goalDistance.direction} goal`;
}