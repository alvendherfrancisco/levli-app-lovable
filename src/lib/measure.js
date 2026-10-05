// ─────────────────────────────────────────────────────────────────────────────
// Canonical measurements.
//
// Weight is stored in KILOGRAMS and height in CENTIMETRES in the data layer.
// The unit on the profile (kg/lb, cm/in) is a DISPLAY preference only — a
// display value is converted on the way in and on the way out, and never
// written to the database as if it were canonical.
//
// Plausibility limits are input guards, not medical guidance: they only catch
// values that cannot belong to a person (or that suggest the wrong unit).
// ─────────────────────────────────────────────────────────────────────────────

export const KG_PER_LB = 0.45359237;
export const LB_PER_KG = 1 / KG_PER_LB;
export const CM_PER_IN = 2.54;

export const WEIGHT_UNITS = ["kg", "lb"];
export const HEIGHT_UNITS = ["cm", "in"];

// Adult plausibility windows.
export const WEIGHT_KG_RANGE = { min: 20, max: 400 };
export const HEIGHT_CM_RANGE = { min: 100, max: 250 };
export const GOAL_KG_RANGE = { min: 30, max: 300 };
export const BMI_PLAUSIBLE = { min: 12, max: 70 };
// An adult BMI below this cannot be real — usually a mixed-up kg/lb entry.
const BMI_SUSPICIOUS_LOW = 15;

export const weightUnitLabel = (unit) => (unit === "kg" ? "kg" : "lb");
export const heightUnitLabel = (unit) => (unit === "cm" ? "cm" : "in");

export const roundKg = (kg) => (kg == null ? null : Math.round(kg * 100) / 100);

/** A value the user typed in `unit` → canonical kilograms. */
export function toKg(value, unit) {
  const n = typeof value === "number" ? value : parseFloat(value);
  if (!Number.isFinite(n)) return null;
  return roundKg(unit === "kg" ? n : n * KG_PER_LB);
}

/** Canonical kilograms → the value to show in `unit`, rounded for display. */
export function fromKg(kg, unit) {
  const n = typeof kg === "number" ? kg : parseFloat(kg);
  if (!Number.isFinite(n)) return null;
  const value = unit === "kg" ? n : n * LB_PER_KG;
  return Math.round(value * 10) / 10;
}

export function weightText(kg, unit) {
  const value = fromKg(kg, unit);
  return value == null ? null : `${value.toFixed(1)} ${weightUnitLabel(unit)}`;
}

/**
 * Canonical kilograms for a stored row, whether it holds a canonical value or
 * one logged before the kg migration.
 */
export function kgOfEntry(entry, fallbackUnit = "kg") {
  if (!entry || entry.weight == null) return null;
  const n = typeof entry.weight === "number" ? entry.weight : parseFloat(entry.weight);
  if (!Number.isFinite(n)) return null;
  const unit = entry.weight_unit || fallbackUnit;
  return unit === "kg" ? roundKg(n) : roundKg(n * KG_PER_LB);
}

// ── Height ──────────────────────────────────────────────────────────────────
export function heightCmFromParts(ft, inch) {
  const f = parseFloat(ft) || 0;
  const i = parseFloat(inch) || 0;
  const totalIn = f * 12 + i;
  return totalIn > 0 ? Math.round(totalIn * CM_PER_IN * 10) / 10 : null;
}

export function heightPartsFromCm(cm) {
  const totalIn = cm / CM_PER_IN;
  const ft = Math.floor(totalIn / 12);
  return { ft, inch: Math.round((totalIn - ft * 12) * 10) / 10 };
}

/** Canonical centimetres for a profile, falling back to any legacy ft/in pair. */
export function heightCmOf(profile = {}) {
  const cm = parseFloat(profile.height_cm);
  if (Number.isFinite(cm) && cm > 0) return cm;
  return heightCmFromParts(profile.height_ft, profile.height_in);
}

export function heightText(cm, unit) {
  if (!Number.isFinite(cm) || cm <= 0) return null;
  if (unit === "cm") return `${Math.round(cm)} cm`;
  const { ft, inch } = heightPartsFromCm(cm);
  return `${ft} ft ${inch} in (${Math.round(cm)} cm)`;
}

// ── Plausibility ────────────────────────────────────────────────────────────
function inRange(value, range) {
  return Number.isFinite(value) && value >= range.min && value <= range.max;
}

/** { ok, kg, message } — the message is neutral and asks the user to check. */
export function checkWeight(value, unit) {
  const kg = toKg(value, unit);
  if (kg == null) return { ok: false, kg: null, message: "Enter a weight to save." };
  if (!inRange(kg, WEIGHT_KG_RANGE)) {
    return {
      ok: false,
      kg,
      message: `That works out to ${Math.round(kg)} kg, which is outside the range this app expects for an adult (${WEIGHT_KG_RANGE.min}–${WEIGHT_KG_RANGE.max} kg). Please check the value and the unit.`,
    };
  }
  return { ok: true, kg, message: "" };
}

export function checkHeight(cm) {
  if (!Number.isFinite(cm) || cm <= 0) return { ok: false, cm: null, message: "Enter a height to save." };
  if (!inRange(cm, HEIGHT_CM_RANGE)) {
    return {
      ok: false,
      cm,
      message: `That works out to ${Math.round(cm)} cm, which is outside the range this app expects (${HEIGHT_CM_RANGE.min}–${HEIGHT_CM_RANGE.max} cm). Please check the value and the unit.`,
    };
  }
  return { ok: true, cm, message: "" };
}

export function checkGoal(value, unit) {
  const kg = toKg(value, unit);
  if (kg == null) return { ok: false, kg: null, message: "" };
  if (!inRange(kg, GOAL_KG_RANGE)) {
    return {
      ok: false,
      kg,
      message: `That goal works out to ${Math.round(kg)} kg, which is outside the range this app expects (${GOAL_KG_RANGE.min}–${GOAL_KG_RANGE.max} kg). Please check it against your Profile units.`,
    };
  }
  return { ok: true, kg, message: "" };
}

// ── BMI ─────────────────────────────────────────────────────────────────────
export function bmiFor(kg, cm) {
  if (!Number.isFinite(kg) || !Number.isFinite(cm) || cm <= 0) return null;
  const m = cm / 100;
  return Math.round((kg / (m * m)) * 10) / 10;
}

export function bmiPlausible(bmi) {
  return Number.isFinite(bmi) && bmi >= BMI_PLAUSIBLE.min && bmi <= BMI_PLAUSIBLE.max;
}

/**
 * The BMI to show, or null when the stored height and weight cannot produce a
 * believable value. A null means "do not display a number", never "0".
 */
export function shownBmi(kg, cm) {
  const bmi = bmiFor(kg, cm);
  return bmiPlausible(bmi) ? bmi : null;
}

/**
 * Entries that look like the wrong unit was used: read as logged they give an
 * impossible BMI, read as kilograms they give a believable one.
 * Returns { needsPrompt, count, total, values }.
 */
export function detectUnitMismatch(values, loggedUnit, heightCm) {
  const list = (values || []).map((v) => (typeof v === "number" ? v : parseFloat(v))).filter((v) => Number.isFinite(v));
  if (!list.length || !Number.isFinite(heightCm) || heightCm <= 0) {
    return { needsPrompt: false, count: 0, total: list.length, values: [] };
  }
  const suspicious = list.filter((value) => {
    const asLogged = bmiFor(toKg(value, loggedUnit), heightCm);
    const asKg = bmiFor(roundKg(value), heightCm);
    return asLogged != null && asLogged < BMI_SUSPICIOUS_LOW && bmiPlausible(asKg);
  });
  return {
    needsPrompt: suspicious.length > 0,
    count: suspicious.length,
    total: list.length,
    values: suspicious,
  };
}