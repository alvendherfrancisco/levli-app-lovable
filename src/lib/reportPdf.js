// ─────────────────────────────────────────────────────────────────────────────
// Doctor report — PDF.
//
// A clean A4 document on a WHITE background (the app itself is dark), built only
// from values the report engine assembled. Clinician-first order: header,
// summary tiles, weight progress, doses taken, side effects, then any optional
// section the user selected that has data in the range.
//
// Nothing is truncated and nothing is drawn below 10pt, every table repeats its
// header row on a new page, and every page carries the same footer.
// ─────────────────────────────────────────────────────────────────────────────

import { getDoseColor, getDoseTextColor, CUSTOM_DOSE_COLOR } from "@/lib/doseColors";
import { fromDayKey, toDayKey } from "@/lib/dateUtils";
import { REPORT_FOOTER } from "@/lib/reportOptions";
import { formatDayShort, NO_DOSES_LINE, NO_SIDE_EFFECTS_LINE, NO_WEIGHT_LINE } from "@/lib/reportData";
import { drawWeightChart, hexToRgb } from "@/lib/reportPdfCharts";
import { PDF_RGB } from "@/components/report/reportTokens";

const PAGE = { w: 210, h: 297, margin: 14, contentW: 182, bottom: 262 };

// Every colour in the exported PDF comes from the shared PDF token set, which is
// always light — nothing here can be darkened by the app's theme.
const INK = PDF_RGB.ink;
const MUTED = PDF_RGB.muted;
const DIVIDER = PDF_RGB.divider;
const ACCENT = PDF_RGB.accent;
const HEAD_BG = PDF_RGB.tableHeadBg;
const ZEBRA_BG = PDF_RGB.tableZebraBg;
const TILE_BG = PDF_RGB.tileBg;

// Type sizes. Body text — including notes and table cells — is never below 10pt.
const TYPE = { title: 19, heading: 13, body: 10, tileValue: 14, footer: 10 };
// Line height for 10pt text, and the first baseline inside a row.
const LEAD = 4.6;
const BASELINE = 5.1;
const ROW_MIN = 7.8;

// Summary tiles: three across the page.
const TILE_COLS = 3;
const TILE_GAP = 3;
const TILE_PAD = 3.2;

function paintWhite(doc) {
  doc.setFillColor(PDF_RGB.page[0], PDF_RGB.page[1], PDF_RGB.page[2]);
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
  if (value == null || !Number.isFinite(value)) return "";
  return `${value < 0 ? "-" : "+"}${Math.abs(value).toFixed(digits)}`;
}

function heading(doc, text, y) {
  y = ensure(doc, y, 17);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(TYPE.heading);
  doc.setTextColor(INK[0], INK[1], INK[2]);
  doc.text(text, PAGE.margin, y);
  doc.setDrawColor(ACCENT[0], ACCENT[1], ACCENT[2]);
  doc.setLineWidth(0.6);
  doc.line(PAGE.margin, y + 1.8, PAGE.margin + 22, y + 1.8);
  return y + 8.5;
}

/** One muted (or ink) body line, wrapped rather than cut. */
function note(doc, text, y, colour = MUTED) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(TYPE.body);
  doc.setTextColor(colour[0], colour[1], colour[2]);
  const lines = doc.splitTextToSize(String(text), PAGE.contentW);
  y = ensure(doc, y, lines.length * LEAD + 2);
  doc.text(lines, PAGE.margin, y);
  return y + lines.length * LEAD + 1.6;
}

/**
 * Two-column key/value block at 10pt. Long labels and values wrap onto the next
 * line (the row grows) — text is never cut off with an ellipsis.
 */
function keyValues(doc, pairs, y) {
  const rowH = 6.6;
  const colW = PAGE.contentW / 2;
  const valueW = 46;

  const drawPair = (pair, left) => {
    doc.setFontSize(TYPE.body);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    const labelLines = doc.splitTextToSize(String(pair[0] ?? ""), colW - valueW - 4);
    doc.text(labelLines, left, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(INK[0], INK[1], INK[2]);
    const valueLines = doc.splitTextToSize(String(pair[1] ?? ""), valueW - 2);
    doc.text(valueLines, left + colW - valueW, y);
    return Math.max(labelLines.length, valueLines.length);
  };

  for (let i = 0; i < pairs.length; i += 2) {
    const second = pairs[i + 1];
    const rows = Math.max(drawPair(pairs[i], PAGE.margin), second ? drawPair(second, PAGE.margin + colW) : 1);
    y += Math.max(rowH, rows * LEAD + 1.4);
  }
  return y + 2;
}

/**
 * The summary tiles: label, value and one supporting line, in a bordered box.
 * Every tile in a row shares the height the tallest one needs, so nothing is cut.
 */
function tiles(doc, list, y) {
  const colW = (PAGE.contentW - TILE_GAP * (TILE_COLS - 1)) / TILE_COLS;

  for (let i = 0; i < list.length; i += TILE_COLS) {
    const row = list.slice(i, i + TILE_COLS);
    const measured = row.map((tile) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(TYPE.body);
      const labelLines = doc.splitTextToSize(tile.label, colW - TILE_PAD * 2);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(TYPE.tileValue);
      const valueLines = doc.splitTextToSize(tile.value, colW - TILE_PAD * 2);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(TYPE.body);
      const subLines = tile.sub ? doc.splitTextToSize(tile.sub, colW - TILE_PAD * 2) : [];
      return { tile, labelLines, valueLines, subLines };
    });
    const rowH = Math.max(...measured.map((m) => (
      TILE_PAD * 2 + (m.labelLines.length + m.subLines.length) * LEAD + m.valueLines.length * 6.4
    )), 20);

    y = ensure(doc, y, rowH + 3);
    measured.forEach((m, ci) => {
      const x = PAGE.margin + ci * (colW + TILE_GAP);
      doc.setFillColor(TILE_BG[0], TILE_BG[1], TILE_BG[2]);
      doc.setDrawColor(DIVIDER[0], DIVIDER[1], DIVIDER[2]);
      doc.setLineWidth(0.25);
      doc.roundedRect(x, y, colW, rowH, 1.8, 1.8, "FD");

      let ty = y + TILE_PAD + LEAD - 1;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(TYPE.body);
      doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
      doc.text(m.labelLines, x + TILE_PAD, ty);
      ty += m.labelLines.length * LEAD + 5.2;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(TYPE.tileValue);
      doc.setTextColor(INK[0], INK[1], INK[2]);
      doc.text(m.valueLines, x + TILE_PAD, ty);
      ty += m.valueLines.length * 6.4;

      if (m.subLines.length) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(TYPE.body);
        doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
        doc.text(m.subLines, x + TILE_PAD, ty);
      }
    });
    y += rowH + 3;
  }
  return y + 1;
}

/** Table with per-row page-break safety, wrapped cells and an optional dose badge. */
function table(doc, { x = PAGE.margin, y, width = PAGE.contentW, columns, rows }) {
  const total = columns.reduce((a, c) => a + c.w, 0);
  const cols = columns.map((c) => ({ ...c, w: (c.w / total) * width }));

  const linesFor = (text, w, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(TYPE.body);
    return doc.splitTextToSize(String(text ?? ""), w - 3);
  };

  const drawHead = (top) => {
    const headLines = cols.map((c) => linesFor(c.label, c.w, true));
    const count = Math.max(...headLines.map((lines) => lines.length));
    const height = Math.max(ROW_MIN, count * LEAD + 2.8);
    doc.setFillColor(HEAD_BG[0], HEAD_BG[1], HEAD_BG[2]);
    doc.rect(x, top, width, height, "F");
    let cx = x + 1.5;
    headLines.forEach((cellLines, i) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(TYPE.body);
      doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
      doc.text(cellLines, cx, top + BASELINE);
      cx += cols[i].w;
    });
    return top + height;
  };

  y = ensure(doc, y, ROW_MIN * 2);
  y = drawHead(y);

  rows.forEach((row, index) => {
    const cells = cols.map((c) => linesFor(c.text(row), c.w));
    const count = Math.max(1, ...cells.map((cell) => cell.length));
    const height = Math.max(ROW_MIN, count * LEAD + 2.8);

    if (y + height > PAGE.bottom) {
      y = newPage(doc);
      y = drawHead(y);
    }
    if (index % 2 === 1) {
      doc.setFillColor(ZEBRA_BG[0], ZEBRA_BG[1], ZEBRA_BG[2]);
      doc.rect(x, y, width, height, "F");
    }

    let cx = x + 1.5;
    cols.forEach((c, ci) => {
      const maxW = c.w - 3;
      const cellLines = cells[ci];
      if (c.badge) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(TYPE.body);
        const colour = c.colour ? c.colour(row) : CUSTOM_DOSE_COLOR;
        const rgb = hexToRgb(colour);
        const badgeW = Math.min(maxW, doc.getTextWidth(cellLines[0] || "") + 4.6);
        doc.setFillColor(rgb[0], rgb[1], rgb[2]);
        doc.roundedRect(cx, y + 1.2, badgeW, 5.4, 1, 1, "F");
        const ink = hexToRgb(getDoseTextColor(colour));
        doc.setTextColor(ink[0], ink[1], ink[2]);
        doc.text(cellLines[0] || "", cx + 2.3, y + BASELINE);
        doc.setTextColor(INK[0], INK[1], INK[2]);
      } else {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(TYPE.body);
        doc.setTextColor(INK[0], INK[1], INK[2]);
        doc.text(cellLines, cx, y + BASELINE);
      }
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
    doc.setDrawColor(DIVIDER[0], DIVIDER[1], DIVIDER[2]);
    doc.setLineWidth(0.3);
    doc.line(PAGE.margin, PAGE.h - 16, PAGE.w - PAGE.margin, PAGE.h - 16);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(TYPE.footer);
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text(REPORT_FOOTER, PAGE.margin, PAGE.h - 11);
    doc.text(`Page ${i} of ${pages}`, PAGE.w - PAGE.margin, PAGE.h - 11, { align: "right" });
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

function doseLabel(row) {
  return row.dose == null ? "—" : `${row.dose} ${row.unit}`;
}

export async function buildReportPdf(report) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  paintWhite(doc);

  const unit = report.unit;
  const has = (id) => report.sections.includes(id);
  const header = report.header;
  let y = PAGE.margin + 4;

  // ── 1. Header ──────────────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(TYPE.title);
  doc.setTextColor(INK[0], INK[1], INK[2]);
  doc.text("Levli Health Report", PAGE.margin, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(TYPE.body);
  doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  doc.text(`Generated ${header.generatedLabel}`, PAGE.w - PAGE.margin, y, { align: "right" });
  y += 8;

  // Report name, height, period and medication(s) — each line only when the
  // value exists, so nothing is printed as "not set".
  const meta = [];
  if (header.name) meta.push(`Report name: ${header.name}`);
  if (header.heightLabel) meta.push(`Height: ${header.heightLabel}`);
  meta.push(`Period: ${header.periodLabel}`);
  if (header.medications.length) {
    meta.push(`Medication${header.medications.length === 1 ? "" : "s"}: ${header.medications.join(", ")}`);
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(TYPE.body);
  doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  meta.forEach((line) => {
    const wrapped = doc.splitTextToSize(line, PAGE.contentW);
    doc.text(wrapped, PAGE.margin, y);
    y += wrapped.length * LEAD;
  });
  y += 3;
  doc.setDrawColor(DIVIDER[0], DIVIDER[1], DIVIDER[2]);
  doc.setLineWidth(0.3);
  doc.line(PAGE.margin, y, PAGE.w - PAGE.margin, y);
  y += 7;

  // ── 2. Summary ─────────────────────────────────────────────────────────────
  y = heading(doc, "Summary", y);
  if (report.summaryTiles.length) y = tiles(doc, report.summaryTiles, y);
  // No weight entries: one muted line instead of weight figures.
  if (!report.has.weight) y = note(doc, NO_WEIGHT_LINE, y);

  // ── 3. Weight progress ─────────────────────────────────────────────────────
  if (has("weight") && report.has.weight) {
    y = heading(doc, "Weight progress", y + 3);
    const weight = report.weight;

    if (weight.count >= 2) {
      const chartHeight = 64;
      y = ensure(doc, y, chartHeight + 22);
      const markers = report.doses.rows
        .map((row) => ({
          ts: fromDayKey(row.day).getTime(),
          color: getDoseColor(row.medication, row.dose),
          label: doseLabel(row),
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
      y += 2;
    } else {
      y = note(doc, "One weight entry in this period, so there is no trend line.", y);
      y += 2;
    }

    // Compact table: date, weight, change since the previous entry.
    y = table(doc, {
      y,
      width: 104,
      columns: [
        { label: "Date", w: 34, text: (r) => r.dayLabel },
        { label: "Weight", w: 28, text: (r) => r.valueLabel },
        { label: "Change", w: 28, text: (r) => r.changeLabel },
      ],
      rows: report.weight.table,
    });
    y = note(doc, "Newest entry first. Change is measured against the entry logged before it.", y);
  }

  // ── 4. Doses taken ─────────────────────────────────────────────────────────
  if (has("doses")) {
    y = heading(doc, "Doses taken", y + 3);
    if (!report.doses.count) {
      y = note(doc, NO_DOSES_LINE, y);
    } else {
      const adherence = report.doses.adherence;
      y = note(doc, report.doses.changes.join(" · "), y, INK);
      y = note(
        doc,
        adherence.scheduled
          ? `Shots logged: ${adherence.logged} of ${adherence.scheduled} scheduled doses (${adherence.days}-day range).`
          : `Shots logged: ${adherence.logged}.`,
        y,
      );
      y += 1.5;

      // Medication and route are never repeated per row: the medication is in
      // the header, the route and concentration in the footnote below.
      const withSite = has("injectionSites");
      const columns = [
        { label: "Date", w: 24, text: (r) => r.dayLabel },
        { label: "Time", w: 13, text: (r) => r.time },
        { label: "Dose", w: 16, badge: true, text: (r) => doseLabel(r), colour: (r) => getDoseColor(r.medication, r.dose) },
        ...(withSite ? [{ label: "Injection site", w: 32, text: (r) => r.site }] : []),
        ...(withSite ? [{ label: "Pain", w: 15, text: (r) => (r.pain != null ? `${r.pain}/10` : "—") }] : []),
      ];
      y = table(doc, { y, columns, rows: report.doses.rows });

      if (report.doses.duplicateNote) {
        y = note(doc, report.doses.duplicateNote, y, INK);
      }
      report.doses.footnotes.forEach((line) => {
        y = note(doc, line, y);
      });
    }
  }

  // ── 5. Side effects ────────────────────────────────────────────────────────
  if (has("sideEffects")) {
    y = heading(doc, "Side effects", y + 3);
    if (!report.sideEffects.total) {
      y = note(doc, NO_SIDE_EFFECTS_LINE, y);
    } else {
      y = table(doc, {
        y,
        columns: [
          { label: "Date", w: 26, text: (r) => r.dayLabel },
          { label: "Side effect", w: 54, text: (r) => r.symptom },
          { label: "Severity", w: 20, text: (r) => r.severity || "—" },
        ],
        rows: report.sideEffects.rows,
      });
    }
  }

  // ── 6. Optional sections ───────────────────────────────────────────────────
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
    y = note(doc, `${injection.sitesUsed} site${injection.sitesUsed === 1 ? "" : "s"} used across ${injection.totalDosesWithSite} doses.`, y);
    y = note(
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
    y = keyValues(doc, [
      ["Days logged", String(nutrition.days)],
      ["Calories (average)", nutrition.calories != null ? `${nutrition.calories} kcal` : "Not logged"],
      ["Protein (average)", nutrition.protein != null ? `${nutrition.protein} g` : "Not logged"],
      ["Fiber (average)", nutrition.fiber != null ? `${nutrition.fiber} g` : "Not logged"],
      ["Carbs (average)", nutrition.carbs != null ? `${nutrition.carbs} g` : "Not logged"],
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
    y = heading(doc, "Water", y + 3);
    y = note(doc, `Logged on ${water.days} day${water.days === 1 ? "" : "s"} · average ${water.average} ${water.unit}/day · total ${water.total} ${water.unit}.`, y, INK);
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
    y = note(doc, `Logged on ${exercise.days} day${exercise.days === 1 ? "" : "s"} · average ${exercise.average} min/day · total ${exercise.total} min.`, y, INK);
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
      y = ensure(doc, y, bodyLines.length * LEAD + 10);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(TYPE.body);
      doc.setTextColor(INK[0], INK[1], INK[2]);
      doc.text(meta, PAGE.margin, y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(TYPE.body);
      doc.text(bodyLines, PAGE.margin, y + LEAD + 1.4);
      y += bodyLines.length * LEAD + LEAD + 4;
    });
    y = note(doc, "Entries are shown exactly as written.", y);
  }

  const pictures = report.optional.progressPictures;
  if (has("progressPictures") && pictures) {
    y = heading(doc, "Progress pictures", y + 3);
    const cell = 52;
    let col = 0;
    for (const photo of pictures) {
      if (col === 0) y = ensure(doc, y, cell + 10);
      const dataUrl = await loadThumbnail(photo.url);
      const px = PAGE.margin + col * (cell + 8);
      if (dataUrl) {
        doc.addImage(dataUrl, "JPEG", px, y, cell, cell);
      } else {
        doc.setDrawColor(DIVIDER[0], DIVIDER[1], DIVIDER[2]);
        doc.rect(px, y, cell, cell);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(TYPE.body);
        doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
        doc.text("Photo unavailable", px + 2, y + cell / 2);
      }
      doc.setFont("helvetica", "normal");
      doc.setFontSize(TYPE.body);
      doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
      doc.text(photo.dayLabel, px, y + cell + 5);
      col += 1;
      if (col === 3) {
        col = 0;
        y += cell + 10;
      }
    }
    if (col !== 0) y += cell + 10;
  }

  footer(doc);
  return doc;
}