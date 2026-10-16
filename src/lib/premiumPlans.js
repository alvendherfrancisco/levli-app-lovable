/**
 * The Premium screen's words: its four slides, and the plans in front of them.
 *
 * The slides are the screen's own copy — one per benefit, each a short headline
 * and one line under it, in the onboarding's voice: short, warm, direct sentences
 * in sentence case, no jargon, never a line longer than six words. These four are
 * the benefits Premium is sold on, in one place, so every screen that lists them
 * lists the same ones.
 *
 * No price is written here. The amounts and the currency are read from the
 * product's own data when the screen opens (see
 * base44/functions/get-premium-prices), and everything a plan row and the bar
 * show is derived from it: the yearly plan's per-month figure, what it saves
 * against twelve months, the button's label and the line under it. Two lines on
 * the screen therefore cannot disagree, and a price change needs no release.
 *
 * Only what a price record cannot carry lives in this file: each plan's name, the
 * length of the yearly plan's introductory offer, and the slides' copy.
 */
const PLAN_META = {
  yearly: { name: "Yearly", period: "/ year", button: "Start free trial", trialDays: 7 },
  monthly: { name: "Monthly", period: "/ month", button: "Subscribe", trialDays: 0 },
  lifetime: { name: "Lifetime", period: "once", button: "Buy lifetime", trialDays: 0 },
};

/** One slide per benefit, in the order the screen shows them. */
export const PREMIUM_SLIDES = [
  { id: "shots", label: "Shot tracking", headline: "Track every shot", line: "No limits on your log" },
  { id: "insights", label: "Full insights", headline: "See your whole journey", line: "Track every trend and photo" },
  { id: "history", label: "Complete history", headline: "Your full history", line: "Every dose and entry, saved" },
  { id: "reports", label: "Reports", headline: "Reports for your doctor", line: "Share your progress in one tap" },
];

/**
 * One amount, as the store quotes it: the currency and its own symbol, and the
 * customer's own number formatting. Amounts arrive in the currency's smallest
 * unit, so 50900 is ₱509.
 */
export function formatMoney(amountMinor, currency) {
  const amount = Number(amountMinor) / 100;
  if (!Number.isFinite(amount)) return "";
  const whole = Number(amountMinor) % 100 === 0;
  const digits = whole ? 0 : 2;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: String(currency || "").toUpperCase(),
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(amount);
  } catch {
    return `${amount.toFixed(digits)} ${String(currency || "").toUpperCase()}`.trim();
  }
}

/** A monthly figure in whole currency: 50900 a year reads as ₱42 a month. */
function perMonth(amountMinor, currency) {
  const months = Math.round(Number(amountMinor) / 12 / 100) * 100;
  return formatMoney(months, currency);
}

/**
 * The store's prices as the screen shows them. Returns [] until they have been
 * read, and only the plans the store actually offers.
 */
export function buildPlans(store) {
  const prices = store?.plans;
  if (!prices) return [];
  const currency = store.currency;
  const { yearly, monthly, lifetime } = prices;

  // What the yearly plan saves over twelve months of the monthly one, worked out
  // from the store's own two amounts so the badge can never go stale.
  let savingsPct = null;
  if (yearly && monthly && monthly.amount > 0) {
    const twelveMonths = monthly.amount * 12;
    const pct = Math.round(((twelveMonths - yearly.amount) / twelveMonths) * 100);
    if (pct >= 1) savingsPct = pct;
  }

  const trialDays = Number(prices.yearlyTrialDays) || 0;
  const plans = [];

  if (yearly) {
    const year = formatMoney(yearly.amount, currency);
    plans.push({
      id: "yearly",
      name: PLAN_META.yearly.name,
      price: year,
      period: PLAN_META.yearly.period,
      detail: `${perMonth(yearly.amount, currency)}/month`,
      badge: savingsPct ? `Save ${savingsPct}%` : null,
      button: trialDays > 0 ? PLAN_META.yearly.button : PLAN_META.monthly.button,
      terms: trialDays > 0
        ? `${trialDays} days free, then ${year}/year. Cancel anytime.`
        : `${year}/year. Cancel anytime.`,
    });
  }

  if (monthly) {
    const month = formatMoney(monthly.amount, currency);
    plans.push({
      id: "monthly",
      name: PLAN_META.monthly.name,
      price: month,
      period: PLAN_META.monthly.period,
      detail: null,
      badge: null,
      button: PLAN_META.monthly.button,
      terms: `${month}/month. Cancel anytime.`,
    });
  }

  if (lifetime) {
    plans.push({
      id: "lifetime",
      name: PLAN_META.lifetime.name,
      price: formatMoney(lifetime.amount, currency),
      period: PLAN_META.lifetime.period,
      detail: null,
      badge: null,
      button: PLAN_META.lifetime.button,
      terms: "One-time payment. No subscription.",
    });
  }

  return plans;
}