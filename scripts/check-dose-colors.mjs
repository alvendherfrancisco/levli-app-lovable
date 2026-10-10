#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// Dose palette check — run before a release:  npm run check:colors
//
// Verifies the palette's own rules against the colour data stored on the
// catalogue (src/lib/medicationConfig.js), where every token was read from the
// manufacturer reference recorded beside it:
//
//   1. every product with a confirmed colour system carries a light and a dark
//      token for each labelled strength, with a source link and a verified date
//   2. every chip it draws meets WCAG AA (4.5:1) in light and in dark mode
//   3. the standard scale steps light to dark, and stays clear of any brand's
//      own colour within the same theme
//   4. a dose typed through "+ Other" on a branded product is a neutral outline
//   5. the print swatch stays readable in greyscale
//   6. a product flagged for review says why
//
//   node scripts/check-dose-colors.mjs --table   (prints the sign-off table)
// ─────────────────────────────────────────────────────────────────────────────

import { MEDICATION_CONFIG, LISTED_MEDICATIONS } from "../src/lib/medicationConfig.js";
import {
  STANDARD_SCALE, NEUTRAL_DOSE_COLOR, getDoseColor, getDoseStyle, getDoseToken,
  getDoseScheme, getPrintDoseStyle, isCustomDose,
} from "../src/lib/doseColors.js";
import { colourDistance, contrastRatio, relativeLuminance, rgbToHsl } from "../src/lib/colorMath.js";

const failures = [];
const check = (ok, message) => { if (!ok) failures.push(message); };

const confirmed = MEDICATION_CONFIG.filter((e) => e.colorScheme?.status === "confirmed");
const review = MEDICATION_CONFIG.filter((e) => e.colorScheme?.status === "review");
// Every labelled strength of a product: the list on the product itself plus the
// list each of its forms carries. Ozempic's tablet strengths live on its tablet
// form, so a tablet colour is checked exactly like a pen's.
const labelledStrengths = (entry) => [
  ...entry.allowedDoses,
  ...(entry.forms || []).flatMap((f) => (f.doses || []).map((d) => ({ ...d, unit: d.unit || "mg" }))),
];
// A strength drawn as a filled chip is one that carries a token.
const colouredStrengths = (entry) => labelledStrengths(entry).filter((d) => d.color?.light);
// Brand colours per theme: the scale only has to stay clear of the colours that
// can actually appear beside it on screen.
const brandByMode = {
  light: confirmed.flatMap((e) => colouredStrengths(e).map((d) => d.color.light)),
  dark: confirmed.flatMap((e) => colouredStrengths(e).map((d) => d.color.dark)),
};

// 1. Tokens, sources and dates on every confirmed product.
confirmed.forEach((entry) => {
  const { source, verified } = entry.colorScheme;
  check(/^https:\/\//.test(source || ""), `${entry.id}: no source link recorded`);
  check(/^\d{4}-\d{2}-\d{2}$/.test(verified || ""), `${entry.id}: no verified date recorded`);
  check(entry.allowedDoses.length > 0, `${entry.id}: no labelled strengths`);
  entry.allowedDoses.forEach((d) => {
    check(!!d.color?.light && !!d.color?.dark,
      `${entry.id} ${d.value} ${d.unit}: needs a light and a dark token`);
  });
  // A form is coloured as a set or not at all: when the maker's pack colour is in
  // hand every strength on that form carries a token (Ozempic's tablets), and a
  // form with no reference stays uncoloured on purpose, drawn as a neutral
  // outline rather than being given an invented colour.
  (entry.forms || []).forEach((form) => {
    const doses = form.doses || [];
    if (!doses.length) return;
    const coloured = doses.filter((d) => d.color?.light);
    check(coloured.length === 0 || coloured.length === doses.length,
      `${entry.id} ${form.label}: ${coloured.length} of ${doses.length} strengths carry a token`);
    coloured.forEach((d) => {
      check(!!d.color?.light && !!d.color?.dark,
        `${entry.id} ${form.label} ${d.value} ${d.unit}: needs a light and a dark token`);
    });
  });
});

// 2. Every chip the app draws, in both modes, meets WCAG AA.
const chipRows = [];
confirmed.forEach((entry) => colouredStrengths(entry).forEach((d) => {
  [false, true].forEach((isDark) => {
    const chip = getDoseStyle(entry.brandName, d.value, isDark);
    const ratio = contrastRatio(chip.background, chip.color);
    if (!isDark) chipRows.push({ entry, dose: d, chip });
    check(ratio >= 4.5,
      `${entry.id} ${d.value} ${d.unit} (${isDark ? "dark" : "light"}): chip contrast ${ratio.toFixed(2)} is under 4.5`);
  });
}));

// 3. The standard scale: ordered light → dark, and no brand's colour reused.
const lightSteps = STANDARD_SCALE.map((s) => relativeLuminance(s.light));
const darkSteps = STANDARD_SCALE.map((s) => relativeLuminance(s.dark));
check(lightSteps.every((v, i) => i === 0 || v < lightSteps[i - 1]),
  "standard scale is not ordered from light to dark in light mode");
check(darkSteps.every((v, i) => i === 0 || v < darkSteps[i - 1]),
  "standard scale is not ordered from light to dark in dark mode");
check(STANDARD_SCALE.length >= 6, "standard scale needs at least six steps");

const compounded = MEDICATION_CONFIG.find((e) => e.id === "compounded_semaglutide");
const maxDose = Number(compounded.maxDoseMg);
STANDARD_SCALE.forEach((step, i) => {
  const dose = (maxDose * (i + 1)) / STANDARD_SCALE.length;
  const resolved = getDoseToken(compounded.brandName, dose);
  check(resolved?.light === step.light,
    `standard scale step ${i + 1} is not reached by a ${dose.toFixed(2)} mg compounded dose`);
  [false, true].forEach((isDark) => {
    const chip = getDoseStyle(compounded.brandName, dose, isDark);
    const ratio = contrastRatio(chip.background, chip.color);
    check(ratio >= 4.5, `standard scale step ${i + 1} (${isDark ? "dark" : "light"}): contrast ${ratio.toFixed(2)}`);
  });
});

STANDARD_SCALE.forEach((step, i) => {
  brandByMode.light.forEach((hex) => check(colourDistance(step.light, hex) >= 40,
    `standard scale step ${i + 1} (light) is too close to a brand colour ${hex}`));
  brandByMode.dark.forEach((hex) => check(colourDistance(step.dark, hex) >= 40,
    `standard scale step ${i + 1} (dark) is too close to a brand colour ${hex}`));
});
// The neutral carries no brand hue, and is never used as a chip fill.
const neutralSaturation = rgbToHsl(NEUTRAL_DOSE_COLOR)[1];
check(neutralSaturation <= 0.2, `the neutral dose colour is too saturated (${neutralSaturation.toFixed(2)})`);
[...brandByMode.light, ...brandByMode.dark].forEach((hex) => {
  check(hex.toLowerCase() !== NEUTRAL_DOSE_COLOR.toLowerCase(),
    `the neutral colour is also a brand's own colour (${hex})`);
});

// 4. A typed dose on a branded product is a neutral outline, a labelled one filled.
confirmed.forEach((entry) => {
  const labelled = entry.allowedDoses[0];
  const filled = getDoseStyle(entry.brandName, labelled.value, false);
  check(filled.background !== "transparent", `${entry.id}: a labelled dose is not filled`);
  const typedValue = Number(labelled.value) + 0.03;
  const typed = getDoseStyle(entry.brandName, typedValue, false);
  check(typed.background === "transparent" && isCustomDose(entry.brandName, typedValue),
    `${entry.id}: a typed dose (${typedValue}) is not drawn as a neutral outline`);
});

// 5. The print swatch: pale enough to survive greyscale, dark text on it.
confirmed.forEach((entry) => colouredStrengths(entry).forEach((d) => {
  const print = getPrintDoseStyle(entry.brandName, d.value);
  const ratio = contrastRatio(print.background, print.color);
  check(ratio >= 7, `${entry.id} ${d.value} ${d.unit}: print swatch contrast ${ratio.toFixed(2)} is under 7`);
  check(relativeLuminance(print.background) >= 0.6,
    `${entry.id} ${d.value} ${d.unit}: print swatch is too dark to stay readable in greyscale`);
}));

// 6. Every review flag explains itself.
review.forEach((entry) => {
  check((entry.colorScheme.note || "").length > 40, `${entry.id}: flagged for review with no reason recorded`);
  check((entry.colorScheme.source || "") === "", `${entry.id}: flagged for review but carries a source`);
});

// 7. Every product the pickers offer resolves to a colour.
LISTED_MEDICATIONS.forEach((entry) => {
  if (entry.colorScheme) {
    check(["confirmed", "review"].includes(entry.colorScheme.status),
      `${entry.id}: unexpected colour scheme status "${entry.colorScheme.status}"`);
  }
  labelledStrengths(entry).forEach((d) => {
    check(!!getDoseColor(entry.brandName, d.value), `${entry.id}: ${d.value} resolves to no colour`);
  });
});

// ── Report ──────────────────────────────────────────────────────────────────
if (process.argv.includes("--table")) {
  const rows = [...MEDICATION_CONFIG]
    .filter((e) => e.id !== "custom")
    .map((e) => {
      const scheme = e.colorScheme;
      const status = scheme?.status === "confirmed" ? "confirmed"
        : scheme?.status === "review" ? "REVIEW (standard scale)" : "standard scale";
      if (!e.allowedDoses.length) {
        return `| ${e.name} | all doses | standard scale | standard scale | n/a | n/a | ${status} |`;
      }
      return labelledStrengths(e)
        .map((d) => {
          const fallback = e.colorScheme ? "neutral (no pack colour)" : "standard scale";
          const light = d.color?.light || fallback;
          const dark = d.color?.dark || fallback;
          return `| ${e.name} | ${d.value} ${d.unit} | ${light} | ${dark} | ${scheme?.source || "n/a"} | ${scheme?.verified || "n/a"} | ${status} |`;
        })
        .join("\n");
    })
    .join("\n");
  console.log("| Medication | Dose | Token (light) | Token (dark) | Source | Verified | Status |");
  console.log("|---|---|---|---|---|---|---|");
  console.log(rows);
  console.log("");
}

if (failures.length) {
  console.error(`✗ dose palette: ${failures.length} problem${failures.length === 1 ? "" : "s"}`);
  failures.forEach((f) => console.error(`   · ${f}`));
  process.exit(1);
}
console.log(`✓ dose palette: ${confirmed.length} products with confirmed colours (${chipRows.length} labelled strengths), ${review.length} flagged for review`);