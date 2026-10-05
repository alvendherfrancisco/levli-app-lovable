// ─────────────────────────────────────────────────────────────────────────────
// Doctor report — vector charts drawn straight into the PDF.
// Drawn with primitives (no screenshotting), so they stay sharp in print and
// keep their colours on the report's white background.
// ─────────────────────────────────────────────────────────────────────────────

const INK = [31, 41, 55];
const MUTED = [120, 130, 145];
const GRID = [234, 236, 240];
const WEIGHT = [99, 102, 241];
const AVERAGE = [139, 92, 246];
const BAR = [79, 70, 229];

export function hexToRgb(hex) {
  const value = String(hex || "").replace("#", "");
  if (value.length !== 6) return [100, 116, 139];
  return [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16));
}

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
 * Weight line chart with its dashed 7-day rolling average and a colour-coded
 * dose timeline on the same date axis. Only real entries are plotted.
 */
export function drawWeightChart(doc, { x, y, w, h, series = [], markers = [], unit, fromTs, toTs, labelFor }) {
  const plotX = x + 11;
  const plotW = w - 11;
  const markerBand = 4;
  const plotY = y + markerBand + 2;
  const plotH = h - markerBand - 12;
  const legendY = plotY + plotH + 7;

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

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  for (let i = 0; i <= 3; i++) {
    const value = lo + ((hi - lo) * i) / 3;
    const gy = Y(value);
    line(doc, plotX, gy, plotX + plotW, gy, GRID);
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text(`${Math.round(value * 10) / 10}`, plotX - 2, gy + 1, { align: "right" });
  }

  doc.setFontSize(7);
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

  // Dashed 7-day rolling average
  doc.setLineDashPattern([1.2, 0.9], 0);
  doc.setLineWidth(0.45);
  points.forEach((point, i) => {
    if (!i) return;
    line(doc, X(points[i - 1].ts), Y(points[i - 1].rollingAvg), X(point.ts), Y(point.rollingAvg), AVERAGE);
  });
  doc.setLineDashPattern([], 0);

  // Dose timeline — one coloured tick per dose, in its own dose colour
  markers.forEach((marker) => {
    const mx = X(marker.ts);
    if (mx < plotX || mx > plotX + plotW) return;
    const rgb = hexToRgb(marker.color);
    doc.setFillColor(rgb[0], rgb[1], rgb[2]);
    doc.rect(mx - 0.35, plotY - markerBand, 0.7, markerBand, "F");
  });

  // Legend
  let lx = plotX;
  doc.setFontSize(7);
  line(doc, lx, legendY + 8, lx + 5, legendY + 8, WEIGHT);
  doc.setTextColor(INK[0], INK[1], INK[2]);
  doc.text("Weight", lx + 6, legendY + 9);
  lx += 22;
  doc.setLineDashPattern([1.2, 0.9], 0);
  line(doc, lx, legendY + 8, lx + 5, legendY + 8, AVERAGE);
  doc.setLineDashPattern([], 0);
  doc.text("7-day average", lx + 6, legendY + 9);
  lx += 32;

  let doseRowY = legendY + 6.4;
  markers.forEach((marker) => {
    const width = 4 + doc.getTextWidth(marker.label) + 5;
    if (lx + width > plotX + plotW) {
      lx = plotX;
      doseRowY += 5;
    }
    const rgb = hexToRgb(marker.color);
    doc.setFillColor(rgb[0], rgb[1], rgb[2]);
    doc.roundedRect(lx, doseRowY, 3.4, 3.4, 0.8, 0.8, "F");
    doc.setTextColor(INK[0], INK[1], INK[2]);
    doc.text(marker.label, lx + 4.4, doseRowY + 2.6);
    lx += width;
  });

  return h + 14 + Math.max(0, doseRowY - (legendY + 6.4));
}

/** Horizontal bars of how often each side effect was logged. */
export function drawFrequencyBars(doc, { x, y, w, rows, maxLabelWidth = 52, barMaxWidth = 70 }) {
  const labelW = Math.min(maxLabelWidth, w * 0.34);
  const rowH = 7;
  const max = Math.max(...rows.map((r) => r.count), 1);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  rows.forEach((row, i) => {
    const ry = y + i * rowH;
    doc.setTextColor(INK[0], INK[1], INK[2]);
    doc.text(fitText(doc, row.label, labelW - 2), x, ry + 2.6);
    const barW = Math.max(1.5, (row.count / max) * Math.min(barMaxWidth, w - labelW - 10));
    doc.setFillColor(BAR[0], BAR[1], BAR[2]);
    doc.roundedRect(x + labelW, ry, barW, 3.6, 0.8, 0.8, "F");
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text(String(row.count), x + labelW + barW + 2, ry + 2.8);
  });

  return rows.length * rowH;
}