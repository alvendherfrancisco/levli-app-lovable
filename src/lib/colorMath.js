// ─────────────────────────────────────────────────────────────────────────────
// Colour maths for the dose palette.
//
// No dependencies and no app imports, so the same functions run in the app and
// in the palette check script (scripts/check-dose-colors.mjs) that verifies the
// stored colours before a release.
//
// Everything works in sRGB. Contrast is the WCAG 2.1 ratio, and the palette uses
// it for the one thing a filled chip has to get right: its text.
// ─────────────────────────────────────────────────────────────────────────────

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

export function hexToRgb(hex) {
  const value = String(hex || "").replace("#", "").trim();
  const full = value.length === 3 ? value.split("").map((c) => c + c).join("") : value;
  if (!/^[0-9a-f]{6}$/i.test(full)) return null;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
}

export function rgbToHex(rgb) {
  return `#${rgb
    .map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0"))
    .join("")}`;
}

/** WCAG relative luminance (0 = black, 1 = white). */
export function relativeLuminance(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const [r, g, b] = rgb
    .map((v) => v / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two colours (1 → 21). */
export function contrastRatio(a, b) {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** sRGB → HSL. Hue in degrees, saturation and lightness as 0–1. */
export function rgbToHsl(hex) {
  const rgb = hexToRgb(hex) || [0, 0, 0];
  const [r, g, b] = rgb.map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (!d) return [0, 0, l];
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h * 360, s, l];
}

/** HSL → sRGB hex. */
export function hslToRgb(hueDeg, saturation, lightness) {
  const s = clamp(saturation, 0, 1);
  const l = clamp(lightness, 0, 1);
  if (!s) {
    const v = Math.round(l * 255);
    return rgbToHex([v, v, v]);
  }
  const h = ((((hueDeg % 360) + 360) % 360) / 360);
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const channel = (t) => {
    let x = t;
    if (x < 0) x += 1;
    if (x > 1) x -= 1;
    if (x < 1 / 6) return p + (q - p) * 6 * x;
    if (x < 1 / 2) return q;
    if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
    return p;
  };
  return rgbToHex([channel(h + 1 / 3), channel(h), channel(h - 1 / 3)].map((v) => v * 255));
}

/** The same colour moved to another lightness — hue and saturation kept. */
export function withLightness(hex, lightness) {
  const [h, s] = rgbToHsl(hex);
  return hslToRgb(h, s, lightness);
}

/** The colour mixed toward white. 0 = unchanged, 1 = white. */
export function mixWithWhite(hex, amount) {
  const rgb = hexToRgb(hex);
  if (!rgb) return "#FFFFFF";
  const t = clamp(amount, 0, 1);
  return rgbToHex(rgb.map((v) => v + (255 - v) * t));
}

/** How far apart two swatches are, as plain RGB distance. */
export function colourDistance(a, b) {
  const ra = hexToRgb(a);
  const rb = hexToRgb(b);
  if (!ra || !rb) return 0;
  return Math.sqrt(ra.reduce((sum, v, i) => sum + (v - rb[i]) ** 2, 0));
}

/** The two chip text colours the palette uses. */
export const CHIP_TEXT_LIGHT = "#FFFFFF";
export const CHIP_TEXT_DARK = "#1F2937";

/** Whichever chip text colour reads better on this background. */
export function readableTextColor(background) {
  return contrastRatio(background, CHIP_TEXT_LIGHT) >= contrastRatio(background, CHIP_TEXT_DARK)
    ? CHIP_TEXT_LIGHT
    : CHIP_TEXT_DARK;
}

/**
 * A filled chip that meets WCAG AA.
 *
 * The hue is never swapped for another one: when a colour cannot carry either
 * text colour at 4.5:1, its lightness is stepped (keeping hue and saturation)
 * until it can, and the text colour that passes is returned with it.
 */
export function ensureContrast(background, min = 4.5) {
  const rgb = hexToRgb(background);
  if (!rgb) return { background: CHIP_TEXT_DARK, color: CHIP_TEXT_LIGHT };
  const [h, s, l] = rgbToHsl(background);
  for (let i = 0; i <= 20; i += 1) {
    const step = i * 0.02;
    const candidates = i === 0 ? [l] : [l - step, l + step];
    for (const candidate of candidates) {
      const tone = hslToRgb(h, s, clamp(candidate, 0.06, 0.94));
      const color = readableTextColor(tone);
      if (contrastRatio(tone, color) >= min) return { background: tone, color };
    }
  }
  return { background: hslToRgb(h, s, 0.16), color: CHIP_TEXT_LIGHT };
}