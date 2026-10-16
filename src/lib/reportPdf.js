// ─────────────────────────────────────────────────────────────────────────────
// Doctor report — PDF.
//
// A clean portrait A4 document on a WHITE background (the app itself is dark),
// built only from values the report engine assembled. It opens with a short
// summary — medication, dose, number of doses, and the weight figures — then one
// section per selected topic.
//
// Two rules run through the whole document:
//   • a value or a section with no data is left out or collapsed into a single
//     muted line; there is never a dash, a placeholder or a note addressed to
//     the person reading the app, and
//   • every line of body text is 10pt or larger (only the page footer is
//     smaller), one accent colour carries the weight line, and the only other
//     colours are the side-effect severity levels — so the page stays readable
//     printed in colour or in grayscale.
//
// Rows and charts are never split across pages, and every page carries the same
// footer.
// ─────────────────────────────────────────────────────────────────────────────

import { fromDayKey, toDayKey } from "@/lib/dateUtils";
import { REPORT_FOOTER } from "@/lib/reportOptions";
import {
  doseCountLine, duplicateLine, formatDayShort, medicationLine, summaryFigures, weightContextLine,
} from "@/lib/reportData";
import { drawWeightChart, fitText } from "@/lib/reportPdfCharts";
import { PDF_RGB } from "@/components/report/reportTokens";

const PAGE = { w: 210, h: 297, margin: 14, contentW: 182, bottom: 264 };
// Every colour in the exported PDF comes from the shared PDF token set, which is
// always light — nothing here can be darkened by the app's theme.
const INK = PDF_RGB.ink;
const MUTED = PDF_RGB.muted;

const BODY = 10; // the smallest body text in the document
const FOOT = 8; // the page footer only
const LEAD = BODY * 0.406; // one line of 10pt text, in millimetres
const VALUE_LEAD = 13 * 0.406; // one line of the summary's 13pt figures

function paintWhite(doc) {
  doc.setFillColor(PDF_RGB.page[0], PDF_RGB.page[1], PDF_RGB.page[2]);
  doc.rect(0, 0, PAGE.w, PAGE.h, "F");
}

function newPage(doc) {
  doc.addPage();
  paintWhite(doc);
  return PAGE.margin + 6;
}

function ensure(doc, y, needed) {
  return y + needed > PAGE.bottom ? newPage(doc) : y;
}

/** A plain bold heading, with one thin divider under it across the page. */
function heading(doc, text, y) {
  y = ensure(doc, y, 18);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(INK[0], INK[1], INK[2]);
  doc.text(text, PAGE.margin, y);
  doc.setDrawColor(PDF_RGB.divider[0], PDF_RGB.divider[1], PDF_RGB.divider[2]);
  doc.setLineWidth(0.2);
  doc.line(PAGE.margin, y + 2, PAGE.margin + PAGE.contentW, y + 2);
  return y + 9;
}

/** One line of muted body text — context, notes, and empty sections. */
function muted(doc, text, y, size = BODY) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(size);
  doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  const lines = doc.splitTextToSize(text, PAGE.contentW);
  const lead = size * 0.406;
  y = ensure(doc, y, lines.length * lead + 2.5);
  doc.text(lines, PAGE.margin, y);
  return y + lines.length * lead + 2.5;
}

/** One line of body text in the report ink — values that carry the content. */
function inkLine(doc, text, y, size = BODY) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(size);
  doc.setTextColor(INK[0], INK[1], INK[2]);
  const lines = doc.splitTextToSize(text, PAGE.contentW);
  const lead = size * 0.406;
  y = ensure(doc, y, lines.length * lead + 2.5);
  doc.text(lines, PAGE.margin, y);
  return y + lines.length * lead + 2.5;
}

/**
 * The figures that lead the report, in a very light panel: a muted label above a
 * bold value, up to four to a row. Long labels and values wrap — nothing is cut
 * off — and only figures that exist are passed in.
 */
function figurePanel(doc, figures, y) {
  if (!figures.length) return y;
  const pad = 4.5;

  // A figure marked `wide` — the goal, whose value carries "to go" — takes a row
  // of its own, so it is never wrapped across two columns.
  const rows = [];
  let row = [];
  figures.forEach((figure) => {
    if (figure.wide) {
      if (row.length) { rows.push(row); row = []; }
      rows.push([figure]);
      return;
    }
    row.push(figure);
    if (row.length === 4) { rows.push(row); row = []; }
  });
  if (row.length) rows.push(row);

  rows.forEach((row) => {
    const colW = (PAGE.contentW - pad * 2) / row.length;
    const sized = row.map((figure) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(BODY);
      const labelLines = doc.splitTextToSize(figure.label, colW - 4);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      const valueLines = doc.splitTextToSize(figure.value, colW - 4);
      return { figure, labelLines, valueLines };
    });
    const blockH = Math.max(...sized.map((s) => s.labelLines.length * LEAD + s.valueLines.length * VALUE_LEAD));
    const height = blockH + pad * 2;

    y = ensure(doc, y, height + 3);
    doc.setFillColor(PDF_RGB.tableHeadBg[0], PDF_RGB.tableHeadBg[1], PDF_RGB.tableHeadBg[2]);
    doc.roundedRect(PAGE.margin, y, PAGE.contentW, height, 2, 2, "F");

    sized.forEach(({ figure, labelLines, valueLines }, i) => {
      const x = PAGE.margin + pad + i * colW;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(BODY);
      doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
      doc.text(labelLines, x, y + pad + BODY * 0.34);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(INK[0], INK[1], INK[2]);
      doc.text(valueLines, x, y + pad + labelLines.length * LEAD + 13 * 0.4);
    });

    y += height + 4;
  });

  return y;
}

/**
 * Key/value pairs, two to a row. The label sits muted on the left and the value
 * bold in the ink colour on the right. Long labels and values wrap onto the next
 * line — text is never cut off with an ellipsis.
 */
function keyValues(doc, pairs, y) {
  const colW = PAGE.contentW / 2;
  const valueW = 42;
  const rowH = 6.6;

  const drawPair = (pair, left) => {
    const labelW = colW - valueW - 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(BODY);
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    const labelLines = doc.splitTextToSize(String(pair[0] ?? ""), labelW);
    doc.text(labelLines, left, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(INK[0], INK[1], INK[2]);
    const valueLines = doc.splitTextToSize(String(pair[1] ?? ""), valueW - 2);
    doc.text(valueLines, left + colW - valueW, y);
    return Math.max(labelLines.length, valueLines.length);
  };

  for (let i = 0; i < pairs.length; i += 2) {
    const second = pairs[i + 1];
    const lines = Math.max(drawPair(pairs[i], PAGE.margin), second ? drawPair(second, PAGE.margin + colW) : 1);
    y += Math.max(rowH, lines * LEAD + 2);
  }
  return y + 2;
}

/**
 * A table with per-row page-break safety. Cells wrap onto extra lines and the
 * row grows to fit, so nothing that was logged is missing from the printed
 * report. A column marked `bold` carries the value the eye should land on first,
 * and one marked `colour` prints its cells in the colour it returns — the
 * severity of a side effect.
 */
function table(doc, { x = PAGE.margin, y, width = PAGE.contentW, columns, rows, fontSize = BODY }) {
  const headH = 8.6;
  const rowH = 8.2;
  const pad = 2;
  const total = columns.reduce((a, c) => a + c.w, 0);
  const cols = columns.map((c) => ({ ...c, w: (c.w / total) * width }));

  const drawHead = (top) => {
    doc.setFillColor(PDF_RGB.tableHeadBg[0], PDF_RGB.tableHeadBg[1], PDF_RGB.tableHeadBg[2]);
    doc.rect(x, top, width, headH, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(fontSize);
    doc.setTextColor(INK[0], INK[1], INK[2]);
    let cx = x + pad;
    cols.forEach((c) => {
      doc.text(fitText(doc, c.label, c.w - pad * 2), cx, top + headH - 3);
      cx += c.w;
    });
    return top + headH;
  };

  y = ensure(doc, y, headH + rowH);
  y = drawHead(y);

  rows.forEach((row, index) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(fontSize);
    const cells = cols.map((c) => doc.splitTextToSize(String(c.text(row) ?? ""), c.w - pad * 2));
    const lines = Math.max(1, ...cells.map((cell) => cell.length));
    const height = Math.max(rowH, lines * LEAD + 3.4);

    if (y + height > PAGE.bottom) {
      y = newPage(doc);
      y = drawHead(y);
      doc.setFontSize(fontSize);
    }
    if (index % 2 === 1) {
      doc.setFillColor(PDF_RGB.tableZebraBg[0], PDF_RGB.tableZebraBg[1], PDF_RGB.tableZebraBg[2]);
      doc.rect(x, y, width, height, "F");
    }
    let cx = x + pad;
    cols.forEach((c, ci) => {
      doc.setFont("helvetica", c.bold ? "bold" : "normal");
      const colour = (c.colour && c.colour(row)) || INK;
      doc.setTextColor(colour[0], colour[1], colour[2]);
      doc.text(cells[ci], cx, y + rowH - 3);
      cx += c.w;
    });
    y += height;
  });

  return y + 3;
}

function footer(doc) {
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setDrawColor(PDF_RGB.divider[0], PDF_RGB.divider[1], PDF_RGB.divider[2]);
    doc.setLineWidth(0.3);
    doc.line(PAGE.margin, PAGE.h - 16, PAGE.w - PAGE.margin, PAGE.h - 16);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(FOOT);
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

/** Dose rows plotted on the weight chart's timeline, in the report's range only. */
function doseMarkers(rows, range) {
  const from = fromDayKey(range.from).getTime();
  const to = fromDayKey(range.to).getTime();
  return rows
    .map((row) => ({ ts: fromDayKey(row.day).getTime() }))
    .filter((marker) => Number.isFinite(marker.ts) && marker.ts >= from && marker.ts <= to);
}

export async function buildReportPdf(report) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  paintWhite(doc);

  const unit = report.unit;
  const summary = report.summary;
  const has = (id) => report.sections.includes(id);
  let y = PAGE.margin + 2;

  // ── 1. Title block ────────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(INK[0], INK[1], INK[2]);
  doc.text("Levli Health Report", PAGE.margin, y);
  y += 3.6;
  doc.setDrawColor(PDF_RGB.divider[0], PDF_RGB.divider[1], PDF_RGB.divider[2]);
  doc.setLineWidth(0.2);
  doc.line(PAGE.margin, y, PAGE.margin + PAGE.contentW, y);
  y += 8;

  if (report.header.name) y = muted(doc, `Name: ${report.header.name}`, y);
  y = muted(doc, `Date range: ${report.header.rangeLabel}`, y);
  y = muted(doc, `Generated: ${report.header.generatedLabel}`, y);
  y += 4;

  // ── 2. Summary — medication, dose, doses logged, weight ───────────────────
  const figures = summaryFigures(summary, unit);
  if (summary.medications.length || figures.length) {
    y = heading(doc, "Summary", y);
    summary.medications.forEach((group) => {
      y = inkLine(doc, medicationLine(group), y);
    });
    if (summary.medications.length && figures.length) y += 1.5;
    y = figurePanel(doc, figures, y);
    if (summary.goalBmiNote) y = muted(doc, summary.goalBmiNote, y + 1);
    y += 3;
  }

  // ── 3. Weight ─────────────────────────────────────────────────────────────
  if (has("weight")) {
    y = heading(doc, "Weight", y + 3);
    const weight = report.weight;

    if (!weight.count) {
      y = muted(doc, "No weight entries in this period.", y);
    } else if (weight.count < 2) {
      y = muted(doc, "One weight entry in this period.", y);
    } else {
      const chartHeight = 64;
      y = ensure(doc, y, chartHeight + 22);
      y += drawWeightChart(doc, {
        x: PAGE.margin,
        y,
        w: PAGE.contentW,
        h: chartHeight,
        series: weight.series || [],
        markers: doseMarkers(report.doses.rows, report.range),
        unit,
        fromTs: fromDayKey(report.range.from).getTime(),
        toTs: fromDayKey(report.range.to).getTime(),
        labelFor: (ts) => formatDayShort(toDayKey(new Date(ts))),
      });
      y = muted(doc, "Solid line: weight entries. Dashed line: 7-day rolling average. Ticks: dose dates.", y);
      if (weight.firstLast?.length) {
        y = table(doc, {
          y,
          columns: [
            { label: "Entry", w: 38, text: (r) => r.label },
            { label: "Date", w: 38, text: (r) => r.dayLabel },
            { label: "Weight", w: 24, bold: true, text: (r) => r.value },
          ],
          rows: weight.firstLast,
        });
      }
      y = muted(doc, weightContextLine(weight, unit), y);
      weight.gaps.forEach((gap) => {
        y = muted(doc, `No weight entries between ${formatDayShort(gap.from)} and ${formatDayShort(gap.to)} (${gap.days} days).`, y);
      });
    }
  }

  // ── 4. Doses taken ────────────────────────────────────────────────────────
  if (has("doses")) {
    y = heading(doc, "Doses taken (newest first)", y + 3);

    if (!summary.totalDoses) {
      y = muted(doc, "No doses logged in this period.", y);
    } else {
      y = muted(doc, doseCountLine(summary.totalDoses, report.doses.adherence), y);
      // Each change of dose is stated in words. A dose that never changed is
      // already named in the summary above, so nothing is repeated here.
      report.doses.changes.forEach((line) => {
        y = muted(doc, line, y);
      });

      const showPain = has("injectionSites");
      const columns = [
        { label: "Date", w: 20, text: (r) => r.dayLabel },
        { label: "Time", w: 12, text: (r) => r.time },
        { label: "Medication", w: 32, text: (r) => r.medication },
        { label: "Dose", w: 16, bold: true, text: (r) => r.doseLabel },
        { label: "Injection site", w: 24, text: (r) => r.site },
        ...(showPain ? [{ label: "Pain", w: 11, text: (r) => (r.pain != null ? `${r.pain}/10` : "") }] : []),
      ];
      y = table(doc, { y, columns, rows: report.doses.rows });
      summary.duplicates.forEach((group) => {
        y = muted(doc, duplicateLine(group), y);
      });
    }
  }

  // ── 5. Side effects ───────────────────────────────────────────────────────
  if (has("sideEffects")) {
    y = heading(doc, "Side effects", y + 3);

    if (!report.sideEffects.total) {
      y = muted(doc, "No side effects logged in this period.", y);
    } else {
      y = table(doc, {
        y,
        columns: [
          { label: "Symptom", w: 32, text: (r) => r.symptom },
          { label: "Date", w: 20, text: (r) => r.dayLabel },
          {
            label: "Severity",
            w: 16,
            bold: true,
            text: (r) => r.severityLabel,
            colour: (r) => PDF_RGB.severity[r.severityKey] || PDF_RGB.severity.none,
          },
          { label: "Days after dose", w: 34, text: (r) => r.afterDose },
        ],
        rows: report.sideEffects.rows,
      });

      if (report.sideEffects.frequency.length) {
        y = ensure(doc, y, 16 + report.sideEffects.frequency.length * 8);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10.5);
        doc.setTextColor(INK[0], INK[1], INK[2]);
        doc.text("How often each side effect was logged", PAGE.margin, y);
        y += 5;
        y = table(doc, {
          y,
          columns: [
            { label: "Side effect", w: 60, text: (r) => r.label },
            { label: "Times logged", w: 20, bold: true, text: (r) => String(r.count) },
          ],
          rows: report.sideEffects.frequency,
        });
      }

      y = muted(doc, "Severe or persistent symptoms should be discussed with a healthcare provider.", y);
    }
  }

  // ── 6. Optional sections ──────────────────────────────────────────────────
  const injection = report.optional.injectionSites;
  if (has("injectionSites") && injection) {
    y = heading(doc, "Injection sites and pain", y + 3);
    y = table(doc, {
      y,
      columns: [
        { label: "Site", w: 60, text: (r) => r.site },
        { label: "Doses", w: 20, text: (r) => String(r.count) },
        { label: "% of doses", w: 20, text: (r) => `${r.pct}%` },
      ],
      rows: injection.counts,
    });
    y = muted(doc, `${injection.sitesUsed} site${injection.sitesUsed === 1 ? "" : "s"} used across ${injection.totalDosesWithSite} doses.`, y - 1);
    y = muted(
      doc,
      injection.painReported
        ? `Pain was recorded on ${injection.painReported} dose${injection.painReported === 1 ? "" : "s"}, average ${injection.averagePain}/10.`
        : "No pain was recorded with any dose in this period.",
      y,
    );
  }

  const nutrition = report.optional.nutrition;
  if (has("nutrition") && nutrition) {
    y = heading(doc, "Nutrition", y + 3);
    const pairs = [["Days logged", String(nutrition.days)]];
    if (nutrition.calories != null) pairs.push(["Calories (average)", `${nutrition.calories} kcal`]);
    if (nutrition.protein != null) pairs.push(["Protein (average)", `${nutrition.protein} g`]);
    if (nutrition.fiber != null) pairs.push(["Fiber (average)", `${nutrition.fiber} g`]);
    if (nutrition.carbs != null) pairs.push(["Carbs (average)", `${nutrition.carbs} g`]);
    y = keyValues(doc, pairs, y);

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
    y = heading(doc, "Water", y + 3);
    y = muted(doc, `Logged on ${water.days} day${water.days === 1 ? "" : "s"} · average ${water.average} ${water.unit}/day · total ${water.total} ${water.unit}.`, y);
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
    y = heading(doc, "Exercise", y + 3);
    y = muted(doc, `Logged on ${exercise.days} day${exercise.days === 1 ? "" : "s"} · average ${exercise.average} min/day · total ${exercise.total} min.`, y);
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
    y = heading(doc, "Journal entries", y + 3);
    journal.forEach((entry) => {
      const meta = [entry.dayLabel, entry.time, entry.mood, entry.category].filter(Boolean).join(" · ");
      const bodyLines = doc.splitTextToSize(entry.text, PAGE.contentW);
      y = ensure(doc, y, bodyLines.length * LEAD + 12);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(BODY);
      doc.setTextColor(INK[0], INK[1], INK[2]);
      doc.text(meta, PAGE.margin, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(INK[0], INK[1], INK[2]);
      doc.text(bodyLines, PAGE.margin, y + LEAD + 1.2);
      y += bodyLines.length * LEAD + 12;
    });
    y = muted(doc, "Entries appear exactly as written by the person logging them.", y);
  }

  const pictures = report.optional.progressPictures;
  if (has("progressPictures") && pictures) {
    y = heading(doc, "Progress pictures", y + 3);
    const cell = 52;
    let col = 0;
    for (const photo of pictures) {
      if (col === 0) y = ensure(doc, y, cell + 9);
      const dataUrl = await loadThumbnail(photo.url);
      const px = PAGE.margin + col * (cell + 8);
      if (dataUrl) {
        doc.addImage(dataUrl, "JPEG", px, y, cell, cell);
      } else {
        doc.setDrawColor(PDF_RGB.divider[0], PDF_RGB.divider[1], PDF_RGB.divider[2]);
        doc.rect(px, y, cell, cell);
      }
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
      doc.text(photo.dayLabel, px, y + cell + 4);
      col += 1;
      if (col === 3) {
        col = 0;
        y += cell + 9;
      }
    }
    if (col !== 0) y += cell + 9;
  }

  footer(doc);
  return doc;
}