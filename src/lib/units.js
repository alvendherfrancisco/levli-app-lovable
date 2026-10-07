// Weight unit conversions — keeps historical entries stable when the user toggles units.

export function weightToKg(value, unit) {
  if (value == null) return null;
  return unit === "kg" ? value : value * 0.453592;
}

export function kgToUnit(kg, unit) {
  if (kg == null) return null;
  return unit === "kg" ? kg : kg / 0.453592;
}

export function convertWeight(value, fromUnit, toUnit) {
  if (value == null) return null;
  if (fromUnit === toUnit) return value;
  return kgToUnit(weightToKg(value, fromUnit), toUnit);
}

// ── Dose unit conversions ──────────────────────────────────────────────────
// Supports mg, mcg, units, IU, mL. Conversions are only applied between
// mass units (mg ↔ mcg). units / IU / mL are not interconvertible and are
// returned as-is — the app stores the unit alongside the value so raw
// milligram values are never compared across unit types.

const MASS_TO_MCG = { mg: 1000, mcg: 1 };

/**
 * Convert a dose value between mass units (mg ↔ mcg).
 * For non-mass units (units, IU, mL) returns the value unchanged.
 */
export function convertDose(value, fromUnit, toUnit) {
  if (value == null) return null;
  if (fromUnit === toUnit) return value;
  // Only convert between mass units
  if (MASS_TO_MCG[fromUnit] && MASS_TO_MCG[toUnit]) {
    return (value * MASS_TO_MCG[fromUnit]) / MASS_TO_MCG[toUnit];
  }
  return value;
}

/**
 * Returns the appropriate numeric input step for a dose unit.
 */
export function doseStep(unit) {
  switch (unit) {
    case "mcg": return 1;     // whole micrograms
    case "mg": return 0.25;
    case "units": return 1;
    case "IU": return 1;
    case "mL": return 0.1;
    case "sprays": return 1;
    case "tablets": return 1;
    case "applications": return 1;
    default: return 0.25;
  }
}

/**
 * Display label for a dose unit.
 */
export function doseUnitLabel(unit) {
  switch (unit) {
    case "mg": return "mg";
    case "mcg": return "mcg";
    case "units": return "units";
    case "IU": return "IU";
    case "mL": return "mL";
    case "sprays": return "sprays";
    case "tablets": return "tablets";
    case "applications": return "applications";
    default: return unit || "mg";
  }
}