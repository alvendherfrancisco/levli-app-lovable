// ─────────────────────────────────────────────────────────────────────────────
// Doctor report — vector charts drawn straight into the PDF.
//
// Drawn with primitives (no screenshotting), so they stay sharp in print and
// keep their contrast on the report's white background. The report uses ONE
// accent colour — the weight line and the bars — so both charts still read when
// they are printed in grayscale.
// ─────────────────────────────────────────────────────────────────────────────

import { PDF_RGB } from "@/components/report/reportTokens";

// Every colour is taken from the shared PDF token set (always light), so the
// chart inside the exported PDF can never pick up the app's dark theme.
const INK = PDF_RGB.ink;
const MUTED = PDF_RGB.muted;
const GRID = PDF_RGB.grid;
const WEIGHT = PDF_RGB.weightLine; // the report accent
const AVERAGE = PDF_RGB.avgLine; // muted grey, drawn dashed
const TICK = PDF_RGB.doseTick;
const BAR = PDF_RGB.barFill;

export function fitText(doc, text, maxWidth) {
  const str = String(text ?? "");
  if (doc.getTextWidth(str) <= maxWidth) return str;
  let cut = str;
  while (cut.length > 1 && doc.getTextWidth(`${cut}…`) > maxWidth) cut = cut.slice(0, -1);
  return `${cut}…`;
}

function line(doc, x1, y1, x2, y2, colour) {
  doc.setDrawColor(colour[0], colour[1], colour[2]);
  doc.line(x1, y1, x2, y2);
}

/**
 * Weight line chart with its dashed 7-day rolling average and a dose timeline on
 * the same date axis. Only real entries are plotted; dose dates are light ticks,
 * because the dose itself is listed in full in the table below.
 */
export function drawWeightChart(doc, { x, y, w, h, series = [], markers = [], unit, fromTs, toTs, labelFor }) {
  const plotX = x + 11;
  const plotW = w - 11;
  const markerBand = 4;
  const plotY = y + markerBand + 2;
  const plotH = h - markerBand - 12;
  const legendY = plotY + plotH + 8;

  // Only real points are drawn; anything unusable is left out.
  const points = (Array.isArray(series) ? series : [])
    .filter((p) => p && Number.isFinite(p.ts) && Number.isFinite(p.value));
  if (points.length < 2) return 0;

  const values = points.flatMap((p) => [p.value, p.rollingAvg]).filter((v) => Number.isFinite(v));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = (max - min) * 0.15 || 1;
  const lo = min - pad;
  const hi = max + pad;
  const axisFrom = Number.isFinite(fromTs) ? fromTs : points[0].ts;
  const axisTo = Number.isFinite(toTs) && toTs > axisFrom
    ? toTs
    : Math.max(points[points.length - 1].ts, axisFrom + 86400000);
  const span = Math.max(1, axisTo - axisFrom);
  const X = (ts) => plotX + ((ts - axisFrom) / span) * plotW;
  const Y = (v) => plotY + plotH - ((v - lo) / (hi - lo)) * plotH;

  doc.setDrawColor(GRID[0], GRID[1], GRID[2]);
  doc.setLineWidth(0.2);
  doc.rect(plotX, plotY, plotW, plotH);

  // The axis figures stay small: they label the chart, they are not body text.
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  const ticks = [];
  for (let i = 0; i <= 3; i++) {
    const value = lo + ((hi - lo) * i) / 3;
    const label = String(Math.round(value * 10) / 10);
    if (ticks.some((tick) => tick.label === label)) continue;
    ticks.push({ value, label });
  }
  ticks.forEach((tick) => {
    const gy = Y(tick.value);
    line(doc, plotX, gy, plotX + plotW, gy, GRID);
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text(tick.label, plotX - 2, gy + 1, { align: "right" });
  });

  doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  doc.text(labelFor(axisFrom), plotX, legendY + 4, { align: "left" });
  doc.text(labelFor(axisTo), plotX + plotW, legendY + 4, { align: "right" });
  doc.text(`${unit}`, plotX - 2, plotY - 1.5, { align: "right" });

  // Weight line + entry dots
  doc.setLineWidth(0.5);
  points.forEach((point, i) => {
    if (!i) return;
    line(doc, X(points[i - 1].ts), Y(points[i - 1].value), X(point.ts), Y(point.value), WEIGHT);
  });
  points.forEach((point) => {
    doc.setFillColor(WEIGHT[0], WEIGHT[1], WEIGHT[2]);
    doc.circle(X(point.ts), Y(point.value), 0.65, "F");
  });

  // Dashed 7-day rolling average — muted and dashed, never a second colour.
  doc.setLineDashPattern([1.2, 0.9], 0);
  doc.setLineWidth(0.45);
  points.forEach((point, i) => {
    if (!i) return;
    line(doc, X(points[i - 1].ts), Y(points[i - 1].rollingAvg), X(point.ts), Y(point.rollingAvg), AVERAGE);
  });
  doc.setLineDashPattern([], 0);

  // Dose timeline — one light tick per dose date.
  markers.forEach((marker) => {
    const mx = X(marker.ts);
    if (mx < plotX || mx > plotX + plotW) return;
    doc.setFillColor(TICK[0], TICK[1], TICK[2]);
    doc.rect(mx - 0.3, plotY - markerBand, 0.6, markerBand, "F");
  });

  // Legend, on one line.
  let lx = plotX;
  doc.setFontSize(8.5);
  line(doc, lx, legendY + 8, lx + 5, legendY + 8, WEIGHT);
  doc.setTextColor(INK[0], INK[1], INK[2]);
  doc.text("Weight", lx + 6.5, legendY + 9);
  lx += doc.getTextWidth("Weight") + 17;

  doc.setLineDashPattern([1.2, 0.9], 0);
  line(doc, lx, legendY + 8, lx + 5, legendY + 8, AVERAGE);
  doc.setLineDashPattern([], 0);
  doc.text("7-day average", lx + 6.5, legendY + 9);
  lx += doc.getTextWidth("7-day average") + 17;

  if (markers.length) {
    doc.setFillColor(TICK[0], TICK[1], TICK[2]);
    doc.rect(lx, legendY + 6.4, 0.9, 3, "F");
    doc.text("Dose dates", lx + 3.4, legendY + 9);
  }

  return h + 18;
}

/** Horizontal bars of how often each side effect was logged, in the accent. */
export function drawFrequencyBars(doc, { x, y, w, rows, maxLabelWidth = 60, barMaxWidth = 74 }) {
  const labelW = Math.min(maxLabelWidth, w * 0.34);
  const rowH = 8.5;
  const max = Math.max(...rows.map((r) => r.count), 1);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  rows.forEach((row, i) => {
    const ry = y + i * rowH;
    doc.setTextColor(INK[0], INK[1], INK[2]);
    doc.text(fitText(doc, row.label, labelW - 2), x, ry + 3);
    const barW = Math.max(1.5, (row.count / max) * Math.min(barMaxWidth, w - labelW - 12));
    doc.setFillColor(BAR[0], BAR[1], BAR[2]);
    doc.roundedRect(x + labelW, ry, barW, 4.2, 0.8, 0.8, "F");
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text(String(row.count), x + labelW + barW + 2, ry + 3.2);
  });

  return rows.length * rowH;
}