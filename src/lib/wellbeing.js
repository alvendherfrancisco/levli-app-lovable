// Wellbeing safeguards: a low BMI, a fast rate of loss, or a goal weight that
// would put BMI below 18.5 are all reasons to check in with a prescriber.
// Nothing here is a diagnosis, and none of it is presented as an achievement.

import { bmiFor, bmiPlausible } from "@/lib/measure";
import { calendarDaysBetween } from "@/lib/dateUtils";

export const LOW_BMI = 18.5;
/** Loss of more than this share of body weight in a week counts as fast. */
export const RAPID_LOSS_PCT = 2;
/** This many weeks in a row is what makes it a pattern. */
export const RAPID_LOSS_WEEKS = 3;

/** BMI from a weight and a canonical height, or null when either is unusable. */
export function bmiOf(kg, heightCm) {
  const value = bmiFor(kg, heightCm);
  if (value == null || !bmiPlausible(value)) return null;
  return value;
}

export function lowBmiSafeguard(kg, heightCm) {
  const bmi = bmiOf(kg, heightCm);
  return { flagged: bmi != null && bmi < LOW_BMI, bmi };
}

/** Consecutive weeks in which weight fell by more than RAPID_LOSS_PCT. */
export function rapidLossSafeguard(series = []) {
  const points = series
    .filter((p) => p && p.kg != null && p.date)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));
  if (points.length < RAPID_LOSS_WEEKS + 1) return { flagged: false, weeks: 0 };

  const weeklyPct = [];
  for (let i = 1; i < points.length; i++) {
    let base = null;
    for (let j = i - 1; j >= 0; j--) {
      const gap = calendarDaysBetween(points[j].date, points[i].date);
      if (gap >= 6 && gap <= 8) { base = points[j]; break; }
      if (gap > 8) break;
    }
    if (!base || !base.kg) { weeklyPct.push(0); continue; }
    weeklyPct.push(((base.kg - points[i].kg) / base.kg) * 100);
  }

  let run = 0;
  let best = 0;
  weeklyPct.forEach((pct) => {
    if (pct > RAPID_LOSS_PCT) { run += 1; best = Math.max(best, run); } else { run = 0; }
  });
  return { flagged: best >= RAPID_LOSS_WEEKS, weeks: best };
}

export function goalBmiSafeguard(goalKg, heightCm) {
  const bmi = bmiOf(goalKg, heightCm);
  return { flagged: bmi != null && bmi < LOW_BMI, bmi };
}

/**
 * @param {{ series?: Array, heightCm?: number, goalKg?: number }} args
 *        series — weight history, each entry { date, kg }
 */
export function wellbeingSafeguards({ series = [], heightCm = null, goalKg = null } = {}) {
  const latest = series.filter((p) => p && p.kg != null).slice(-1)[0] || null;
  const lowBmi = lowBmiSafeguard(latest?.kg, heightCm);
  const rapidLoss = rapidLossSafeguard(series);
  const goalBmi = goalBmiSafeguard(goalKg, heightCm);
  return {
    lowBmi,
    rapidLoss,
    goalBmi,
    latestKg: latest?.kg ?? null,
    flagged: lowBmi.flagged || rapidLoss.flagged || goalBmi.flagged,
  };
}

/** The gentle, non-judgemental line shown when a safeguard is active. */
export function wellbeingMessage(flags) {
  const reasons = [];
  if (flags?.lowBmi?.flagged) reasons.push(`your most recent BMI is ${flags.lowBmi.bmi.toFixed(1)}, below 18.5`);
  if (flags?.rapidLoss?.flagged) reasons.push(`your weight has fallen by more than ${RAPID_LOSS_PCT}% a week for ${flags.rapidLoss.weeks} weeks in a row`);
  if (flags?.goalBmi?.flagged) reasons.push(`your goal weight would put your BMI at ${flags.goalBmi.bmi.toFixed(1)}, below 18.5`);
  if (!reasons.length) return "";
  return `Worth talking to your prescriber: ${reasons.join(", and ")}. They may want to review your dose or your goal with you. This isn't a diagnosis.`;
}