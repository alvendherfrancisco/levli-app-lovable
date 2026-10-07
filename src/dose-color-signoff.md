# Dose colour sign-off

Every dose colour in Levli is stored on the medication catalogue entry in
`src/lib/medicationConfig.js` — the dose, a light token, a dark token, the source
it was read from and the date it was checked. Nothing in the UI holds a dose
colour of its own: `src/lib/doseColors.js` is the single resolver, so the same
dose is the same colour in the picker, the selected state, the repeat-dose
confirmation, shot history, the dose charts and the legend.

Re-run the checks at any time:

```
npm run check:colors            # verifies the rules below, exits non-zero on failure
npm run check:colors -- --table # prints the table again
```

## Confirmed manufacturer colours

Every token below was read from the manufacturer reference image recorded in that
product's `colorScheme.source`, and each product's strengths are listed exactly
as that reference shows them.

| Medication | Dose | Token (light) | Token (dark) | Verified | Source |
|---|---|---|---|---|---|
| Ozempic | 0.25 mg | `#808285` | `#9A9C9F` | 2026-10-08 | pen reference image |
| Ozempic | 0.5 mg | `#D61D29` | `#E4444F` | 2026-10-08 | pen reference image |
| Ozempic | 1 mg | `#00868B` | `#12999E` | 2026-10-08 | pen reference image |
| Ozempic | 2 mg | `#F5A41C` | `#F8B84A` | 2026-10-08 | pen reference image |
| Wegovy | 0.25 mg | `#4BB4A5` | `#63C7B8` | 2026-10-08 | pen reference image |
| Wegovy | 0.5 mg | `#A93C66` | `#C25580` | 2026-10-08 | pen reference image |
| Wegovy | 1 mg | `#A66E3E` | `#BC8654` | 2026-10-08 | pen reference image |
| Wegovy | 1.7 mg | `#0079A4` | `#1E93BF` | 2026-10-08 | pen reference image |
| Wegovy | 2.4 mg | `#3B4044` | `#585F64` | 2026-10-08 | pen reference image |
| Rybelsus | 3 mg | `#009933` | `#12AC47` | 2026-10-08 | tablet reference image |
| Rybelsus | 7 mg | `#E32D1C` | `#EF5243` | 2026-10-08 | tablet reference image |
| Rybelsus | 14 mg | `#008BCF` | `#21A0DE` | 2026-10-08 | tablet reference image |
| Foundayo | 0.8 mg | `#1A3D7D` | `#2F5AA5` | 2026-10-08 | dosing chart image |
| Foundayo | 2.5 mg | `#597C2E` | `#74994A` | 2026-10-08 | dosing chart image |
| Foundayo | 5.5 mg | `#733A8C` | `#8F55A8` | 2026-10-08 | dosing chart image |
| Foundayo | 9 mg | `#006A77` | `#128492` | 2026-10-08 | dosing chart image |
| Foundayo | 14.5 mg | `#C8642A` | `#DC7F45` | 2026-10-08 | dosing chart image |
| Foundayo | 17.2 mg | `#9C1C68` | `#B93E86` | 2026-10-08 | dosing chart image |
| Mounjaro | 2.5 mg | `#727479` | `#8C8E93` | 2026-10-08 | pen reference image |
| Mounjaro | 5 mg | `#562866` | `#70407F` | 2026-10-08 | pen reference image |
| Mounjaro | 7.5 mg | `#009180` | `#0FA795` | 2026-10-08 | pen reference image |
| Mounjaro | 10 mg | `#CC4678` | `#DE6591` | 2026-10-08 | pen reference image |
| Mounjaro | 12.5 mg | `#1775A6` | `#2E8EC0` | 2026-10-08 | pen reference image |
| Mounjaro | 15 mg | `#F38B38` | `#F6A25D` | 2026-10-08 | pen reference image |
| Zepbound | 2.5 mg | `#4A4F54` | `#666C72` | 2026-10-08 | pen reference image |
| Zepbound | 5 mg | `#4A2C6D` | `#6A478E` | 2026-10-08 | pen reference image |
| Zepbound | 7.5 mg | `#2E8C82` | `#41A79C` | 2026-10-08 | pen reference image |
| Zepbound | 10 mg | `#D53880` | `#E45C98` | 2026-10-08 | pen reference image |
| Zepbound | 12.5 mg | `#0086D3` | `#1E9EE5` | 2026-10-08 | pen reference image |
| Zepbound | 15 mg | `#D86616` | `#EC8137` | 2026-10-08 | pen reference image |
| Saxenda | 0.6 mg | `#253494` | `#3D4CAE` | 2026-10-08 | pen reference image |
| Saxenda | 1.2 mg | `#253494` | `#3D4CAE` | 2026-10-08 | pen reference image |
| Saxenda | 1.8 mg | `#253494` | `#3D4CAE` | 2026-10-08 | pen reference image |
| Saxenda | 2.4 mg | `#253494` | `#3D4CAE` | 2026-10-08 | pen reference image |
| Saxenda | 3 mg | `#253494` | `#3D4CAE` | 2026-10-08 | pen reference image |

Mirrored manufacturer behaviour worth signing off deliberately:

- **Ozempic** — four strengths, four label colours (grey, red, teal, gold) on a
  single shared pen body.
- **Wegovy** — one colour-coded pen label per strength.
- **Rybelsus** — the colour belongs to the carton, not the tablet (every tablet
  is white). The reference image also shows lower tablet strengths (1.5 mg,
  4 mg, 9 mg) that this config does not list yet; the entry records that.
- **Foundayo** — six steps, six colours, no two alike.
- **Mounjaro** — the reference is the US pen set (grey, dark purple, green,
  magenta, blue, orange). UK pens use a different set and are named in the entry.
- **Zepbound** — grey, deep purple, teal, magenta, bright blue, burnt orange;
  5 mg, 10 mg and 15 mg are the maintenance strengths.
- **Saxenda** — one royal-blue pen delivers every strength, so all five strengths
  share the pen's blue, exactly as the product does; the strength comes from the
  dose selector, and every chip prints the dose number.

## Awaiting a manufacturer reference (standard scale, flagged for review)

| Medication | Why it is on the standard scale |
|---|---|
| Victoza | One pen delivers 0.6 / 1.2 / 1.8 mg, so all doses would share one colour; no reference supplied for it |
| Trulicity | No reference supplied; no longer offered as a new choice |

Sending a reference image for either one is enough to turn it into a colour
block on each dose — the entry already has the slot, the source and the date.

## Standard scale and neutral

| Element | Light | Dark | Used by |
|---|---|---|---|
| Step 1 (lowest dose) | `#E0E3FE` | `#C6CCFD` | compounded products, peptides, Others |
| Step 2 | `#C7D2FE` | `#B2B8FB` | same |
| Step 3 | `#A5B4FC` | `#9EA3F9` | same |
| Step 4 | `#8B95F8` | `#8E92F7` | same |
| Step 5 | `#7A80F2` | `#7F81F5` | same |
| Step 6 | `#6A6CE8` | `#7272F0` | same |
| Step 7 | `#5C5BD9` | `#6763E8` | same |
| Step 8 (highest dose) | `#514FCA` | `#5D58DE` | same |
| Typed dose / no scheme | outline `#CBD5E1`, text `#475569` | outline `rgba(255,255,255,0.30)`, text `#C7CBD8` | "+ Other" on a branded product, unknown medication |

- One indigo hue, stepping light to dark with the product's own dose size. Steps
  are fixed, so adding a higher strength never repaints the ones below it.
- The scale was retuned in this pass so no step reads as a brand's own colour now
  that the brand blues are in place: its closest step is 74 RGB units from any
  brand colour in light mode and 59 in dark mode.
- Products with no labelled strengths (peptides, Others) take step 1 rather than
  implying a strength they do not have.
- A dose typed through "+ Other" on a branded product is a **neutral outline**,
  never a fill, so it cannot be mistaken for a labelled strength.

## What the checks confirm

`npm run check:colors` verifies, and currently passes:

| Rule | Result |
|---|---|
| Confirmed products carry a light and dark token per labelled strength, a source link and a verified date | pass, 7 products, 35 labelled strengths |
| Every chip meets WCAG AA in light and dark mode | 70 chip calculations, lowest 4.51:1 (Rybelsus 7 mg); 23 colours needed a lightness step with the hue kept |
| Standard scale ordered light → dark | pass in both modes |
| Standard scale never reads as a brand colour | minimum distance 74 (light) / 59 (dark) from any brand token |
| Labelled dose filled, typed dose neutral | pass on all seven branded products |
| Print swatch stays readable in greyscale | pale tint with near-black text, minimum 12.8:1 |
| Every review flag records why | pass (Victoza, Trulicity) |

## Visual QA before release (needs eyes, not a script)

- [ ] Add Shot Log: switch between Ozempic, Wegovy, Rybelsus, Foundayo, Mounjaro,
      Zepbound, Saxenda and a compounded product — chips change at once, no colour carries over.
- [ ] Compare each chip against the pen or carton in hand for the strength being logged.
- [ ] Selected chip: checkmark and ring visible with colour ignored.
- [ ] "+ Other" typed dose: outlined, not filled, in the picker, on the day card and in history.
- [ ] Repeat-dose confirmation shows the same colour as the picker chip.
- [ ] History dots, the exposure-chart markers and the dose legend agree with the picker.
- [ ] Saxenda: every strength shows the same pen blue, with the dose number legible on each chip.
- [ ] Light and dark mode both read cleanly; switch the theme with the sheet open.
- [ ] Largest system text size: chips, badges and legend labels do not clip.
- [ ] Colour-blind pass (protanopia, deuteranopia, tritanopia): adjacent doses stay
      identifiable from the printed dose number, which every chip, badge and legend row carries.
- [ ] Doctor report: doses print as text (no fill colour), so nothing there depends on
      colour; `getPrintDoseStyle()` is ready for any report surface that shows a swatch.