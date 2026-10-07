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

| Medication | Dose | Token (light) | Token (dark) | Source | Verified | Status |
|---|---|---|---|---|---|---|
| Ozempic | 0.25 mg | `#C8102E` | `#CE2A3C` | [ozempic.com pen dosing](https://www.ozempic.com/ozempic-pen/dosing.html) | 2026-10-08 | confirmed (pen) |
| Ozempic | 0.5 mg | `#C8102E` | `#CE2A3C` | same | 2026-10-08 | confirmed (pen) |
| Ozempic | 1 mg | `#1A57A5` | `#2E6FC4` | same | 2026-10-08 | confirmed (pen) |
| Ozempic | 2 mg | `#E0A616` | `#EFBB33` | same | 2026-10-08 | confirmed (pen) |
| Wegovy | 0.25 mg | `#8FC043` | `#A3D25C` | [wegovy.com pen guide](https://www.wegovy.com/obesity/starting-wegovy/starting-wegovy-pen.html) | 2026-10-08 | confirmed (pen) |
| Wegovy | 0.5 mg | `#D6336C` | `#C92A62` | same | 2026-10-08 | confirmed (pen) |
| Wegovy | 1 mg | `#7A5230` | `#8E6238` | same | 2026-10-08 | confirmed (pen) |
| Wegovy | 1.7 mg | `#1D6FB8` | `#2472BB` | same | 2026-10-08 | confirmed (pen) |
| Wegovy | 2.4 mg | `#2B383D` | `#4A5A61` | same | 2026-10-08 | confirmed (pen) |
| Rybelsus | 3 mg | `#0B7F35` | `#127F3C` | [Novo Nordisk monograph](https://www.novonordisk.ca/content/dam/nncorp/ca/en/products/Rybelsus-CI-EN-monograph.pdf) | 2026-10-08 | confirmed (carton) |
| Rybelsus | 7 mg | `#C81E28` | `#D63A45` | same | 2026-10-08 | confirmed (carton) |
| Rybelsus | 14 mg | `#0B69B0` | `#1976BE` | same | 2026-10-08 | confirmed (carton) |
| Foundayo | 0.8 mg | `#E08CA8` | `#EDA3BC` | [FDA label, tablet description](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=8ac446c5-feba-474f-a103-23facb9b5c62) | 2026-10-08 | confirmed (tablet) |
| Foundayo | 2.5 mg | `#EBD79A` | `#F2E3B4` | same | 2026-10-08 | confirmed (tablet) |
| Foundayo | 5.5 mg | `#AFA6CF` | `#C2BADA` | same | 2026-10-08 | confirmed (tablet) |
| Foundayo | 9 mg | `#E08CA8` | `#EDA3BC` | same | 2026-10-08 | confirmed (tablet) |
| Foundayo | 14.5 mg | `#EBD79A` | `#F2E3B4` | same | 2026-10-08 | confirmed (tablet) |
| Foundayo | 17.2 mg | `#AFA6CF` | `#C2BADA` | same | 2026-10-08 | confirmed (tablet) |
| Mounjaro | 2.5 mg | `#75787B` | `#8A8D91` | [Lilly-supplied product photos](https://www.goodrx.com/mounjaro/appearance) | 2026-10-08 | confirmed (pen) |
| Mounjaro | 5 mg | `#592C7F` | `#7B4AA8` | same | 2026-10-08 | confirmed (pen) |
| Mounjaro | 7.5 mg | `#00857D` | `#159C93` | same | 2026-10-08 | confirmed (pen) |
| Mounjaro | 10 mg | `#D45780` | `#E27A9C` | same | 2026-10-08 | confirmed (pen) |
| Mounjaro | 12.5 mg | `#0069A0` | `#1E86BF` | same | 2026-10-08 | confirmed (pen) |
| Mounjaro | 15 mg | `#F58233` | `#FA9C5C` | same | 2026-10-08 | confirmed (pen) |

Mirrored manufacturer behaviour worth signing off deliberately:

- **Ozempic** colours by pen, not by dose: 0.25 mg and 0.5 mg come from the same
  red-label pen and therefore share one colour, as they do on the product.
- **Foundayo** colours by tablet: pink is used for 0.8 mg and 9 mg, light yellow
  for 2.5 mg and 14.5 mg, grayish purple for 5.5 mg and 17.2 mg. The tablets also
  differ in shape, and every chip prints the dose number, so nothing is told
  apart by colour alone.
- **Rybelsus** colours the carton, not the tablet (all tablets are white to light
  yellow), so the token follows the carton.
- **Mounjaro** is recorded from US pens and cartons. UK pens use a different set
  (yellow, maroon, green, teal, indigo, purple) — please confirm which market to
  follow before release.

## Awaiting a manufacturer source (standard scale, flagged for review)

| Medication | Why it is on the standard scale | Candidate colours recorded in the entry |
|---|---|---|
| Zepbound | No manufacturer-stated colour found. Lilly describes a colour-coded pen without naming the colours. | Dark grey, dark purple, dark teal, pink, blue, red (2.5 → 15 mg) from a third-party guide |
| Trulicity | No manufacturer-stated colour found; no longer offered as a new choice | none |
| Victoza | One pen delivers 0.6 / 1.2 / 1.8 mg, so all doses would share one colour; that colour could not be sourced | none |
| Saxenda | One pen delivers every strength from 0.6 to 3 mg; that colour could not be sourced | none |

Confirming any of these is a one-line change: add `color` tokens to the entry's
doses and set `colorScheme.status` to `"confirmed"` with the source and date.

## Standard scale and neutral

| Element | Light | Dark | Used by |
|---|---|---|---|
| Step 1 (lowest dose) | `#C7D2FE` | `#A5B4FC` | compounded products, peptides, Others |
| Step 2 | `#A5B4FC` | `#99A2FA` | same |
| Step 3 | `#8B95F8` | `#8B8FF8` | same |
| Step 4 | `#6E76F1` | `#7B7DF5` | same |
| Step 5 | `#5549E3` | `#6B64F0` | same |
| Step 6 | `#4436C9` | `#5C55E8` | same |
| Step 7 | `#372BA8` | `#4E47DC` | same |
| Step 8 (highest dose) | `#2B217F` | `#4139C9` | same |
| Typed dose / no scheme | outline `#CBD5E1`, text `#475569` | outline `rgba(255,255,255,0.30)`, text `#C7CBD8` | "+ Other" on a branded product, unknown medication |

- One indigo hue, stepping light to dark with the product's own dose size. Steps
  are fixed, so adding a higher strength never repaints the ones below it.
- Products with no labelled strengths (peptides, Others) take step 1 rather than
  implying a strength they do not have. If you would rather they ranked on the
  doses a person has actually logged, that is a small change to one function.
- A dose typed through "+ Other" on a branded product is a **neutral outline**,
  never a fill, so it cannot be mistaken for a labelled strength.

## What the checks confirm

`npm run check:colors` verifies, and currently passes:

| Rule | Result |
|---|---|
| Confirmed products carry a light and dark token per labelled strength, a source link and a verified date | pass |
| Every chip meets WCAG AA in light and dark mode | 48 chip calculations, minimum 4.5:1, 5 colours needed a lightness step with the hue kept |
| Standard scale ordered light → dark | pass |
| Standard scale / neutral never reuses a brand colour | minimum distance 44 (RGB) from any brand token; the neutral is a 0.16-saturation slate |
| Labelled dose filled, typed dose neutral | pass on all five branded products |
| Print swatch stays readable in greyscale | pale tint with near-black text, minimum 12.8:1 |
| Every review flag records why | pass |

## Visual QA before release (needs eyes, not a script)

- [ ] Add Shot Log: switch between Ozempic, Wegovy, Rybelsus, Foundayo, Mounjaro and a
      compounded product — chips change at once, no colour carries over.
- [ ] Selected chip: checkmark and ring visible with colour ignored.
- [ ] "+ Other" typed dose: outlined, not filled, in the picker, on the day card and in history.
- [ ] Repeat-dose confirmation shows the same colour as the picker chip.
- [ ] History dots, the exposure-chart markers and the dose legend agree with the picker.
- [ ] Light and dark mode both read cleanly; switch the theme with the sheet open.
- [ ] Largest system text size: chips, badges and legend labels do not clip.
- [ ] Colour-blind pass (protanopia, deuteranopia, tritanopia): adjacent doses stay
      identifiable from the printed dose number, which every chip, badge and legend row carries.
- [ ] Doctor report: doses print as text (no fill colour), so nothing there depends on
      colour; `getPrintDoseStyle()` is ready for any report surface that shows a swatch.