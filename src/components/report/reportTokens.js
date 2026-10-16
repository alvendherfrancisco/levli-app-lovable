// ─────────────────────────────────────────────────────────────────────────────
// Doctor report — the one place its colours are defined.
//
// Two token sets come from here:
//   • the app-theme tokens, used by the on-screen preview (light and dark), and
//   • the PDF/print tokens, always light, which is what the exported PDF is
//     drawn with — whatever the app theme or the device's dark-mode setting is.
// The preview components and the PDF/canvas code both read this file, so there
// is a single source of truth for the report's palette and never a hard-coded
// white or black in the preview.
// ─────────────────────────────────────────────────────────────────────────────

/** Always light — the exported PDF and the "PDF look" preview. */
export const PDF_TOKENS = {
  mode: "pdf",
  page: "#FFFFFF",
  cardBg: "#FFFFFF",
  cardBorder: "#E5E7EB",
  ink: "#111827",
  muted: "#4B5563",
  divider: "#E5E7EB",
  accent: "#4F46E5",
  grid: "#E5E7EB",
  axis: "#6B7280",
  tableHeadBg: "#F3F4F8",
  tableZebraBg: "#FAFAFC",
  barTrack: "#EEF0F6",
  barFill: "#4F46E5",
  // The report's single accent: the weight line itself. The rolling average is
  // dashed in muted grey instead of a second colour, so the chart still reads
  // when it is printed in grayscale.
  weightLine: "#4F46E5",
  avgLine: "#6B7280",
  doseTick: "#CBD5E1",
  tooltipBg: "#FFFFFF",
  tooltipBorder: "#E5E7EB",
  tooltipText: "#111827",
  doseBarOpacity: 0.7,
  doseBarWidth: 1.2,
  // Severity is the one thing the report colours besides its single accent: the
  // levels stay apart from each other in grayscale as well as in colour.
  severity: { mild: "#15803D", moderate: "#B45309", severe: "#B91C1C", emergency: "#7F1D1D", none: "#4B5563" },
};

/** On screen, light mode — the same palette as the PDF. */
export const APP_LIGHT_TOKENS = {
  ...PDF_TOKENS,
  mode: "app-light",
  muted: "#6B7280",
  axis: "#9CA3AF",
  grid: "#EAECF0",
  tableHeadBg: "#F9FAFB",
  doseBarOpacity: 0.55,
};

/**
 * On screen, dark mode: the card is a step lighter than the page, the text is
 * light (ink ≈ 13:1 and muted ≈ 7:1 against the card), and the weight line is
 * brightened so it keeps well over 3:1.
 */
export const APP_DARK_TOKENS = {
  mode: "app-dark",
  page: "#0B0D13",
  cardBg: "#171A21",
  cardBorder: "#2A2F3A",
  ink: "#E8E9F0",
  muted: "#A9AFC0",
  divider: "#2A2F3A",
  accent: "#A5B4FC",
  grid: "#2E3441",
  axis: "#9AA1B2",
  tableHeadBg: "#1E2130",
  tableZebraBg: "#1B1E26",
  barTrack: "#232733",
  barFill: "#818CF8",
  weightLine: "#A5B4FC",
  avgLine: "#C4B5FD",
  doseTick: "#3A4152",
  tooltipBg: "#1E2130",
  tooltipBorder: "#333846",
  tooltipText: "#E8E9F0",
  doseBarOpacity: 0.4,
  doseBarWidth: 1,
  // The same levels, lightened so they keep their contrast on the dark card.
  severity: { mild: "#6EE7B7", moderate: "#FCD34D", severe: "#FCA5A5", emergency: "#F87171", none: "#A9AFC0" },
};

/** The tokens for one preview mode: "app" follows the live theme, "pdf" is fixed light. */
export function reportTokens(mode, isDark) {
  if (mode === "pdf") return PDF_TOKENS;
  return isDark ? APP_DARK_TOKENS : APP_LIGHT_TOKENS;
}

/** "#4F46E5" → [79, 70, 229], for the PDF drawing code. */
export function tokenRgb(hex) {
  const value = String(hex || "").replace("#", "");
  if (value.length !== 6) return [100, 116, 139];
  return [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16));
}

/** PDF tokens already converted for jsPDF's setFillColor/setTextColor. */
export const PDF_RGB = {
  page: tokenRgb(PDF_TOKENS.page),
  ink: tokenRgb(PDF_TOKENS.ink),
  muted: tokenRgb(PDF_TOKENS.muted),
  divider: tokenRgb(PDF_TOKENS.divider),
  grid: tokenRgb(PDF_TOKENS.grid),
  accent: tokenRgb(PDF_TOKENS.accent),
  tableHeadBg: tokenRgb(PDF_TOKENS.tableHeadBg),
  tableZebraBg: tokenRgb(PDF_TOKENS.tableZebraBg),
  weightLine: tokenRgb(PDF_TOKENS.weightLine),
  avgLine: tokenRgb(PDF_TOKENS.avgLine),
  barFill: tokenRgb(PDF_TOKENS.barFill),
  doseTick: tokenRgb(PDF_TOKENS.doseTick),
  severity: Object.fromEntries(
    Object.entries(PDF_TOKENS.severity).map(([key, hex]) => [key, tokenRgb(hex)]),
  ),
};