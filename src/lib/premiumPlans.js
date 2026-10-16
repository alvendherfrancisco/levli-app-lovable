/**
 * The Premium plans the paywall offers — the one place the screen's plan words
 * come from, and the one place its numbers are worked out.
 *
 * No price is written here. The amounts and the currency are read from the
 * product's own data when the screen opens (see base44/functions/get-premium-prices),
 * and everything on the card is derived from them: the per-month figure of the
 * yearly plan, what the yearly plan saves against twelve months, the button's
 * label and the terms line under it. Two lines on the screen therefore cannot
 * disagree, and a price change needs no release.
 *
 * Only what a price record cannot carry lives in this file: each plan's name, the
 * wording of its one muted line, and the length of the yearly plan's introductory
 * offer.
 */
const PLAN_META = {
  yearly: { name: "Yearly", button: "Start free trial", trialDays: 7, detail: (perMonth) => `${perMonth}/month` },
  monthly: { name: "Monthly", button: "Subscribe", detail: () => "Cancel anytime" },
  lifetime: { name: "Lifetime", button: "Buy lifetime", detail: () => "Pay once, keep forever" },
};

/** The four lines the checklist under the headline carries, in order. */
export const PREMIUM_BENEFITS = [
  "Unlimited shots and full history.",
  "Complete insights and injection site rotation.",
  "Share reports with your doctor.",
  "No ads or watermarks.",
];

/**
 * One amount, as the store quotes it: the currency and its own symbol, and the
 * customer's own number formatting. Amounts are in the currency's smallest unit,
 * so 50900 is ₱509.
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

/**
 * The store's prices as the screen shows them. Returns [] when nothing has been
 * read yet, and only the plans the store actually offers.
 */
export function buildPlans(store) {
  const prices = store?.plans;
  if (!prices) return [];
  const currency = store.currency;
  const yearly = prices.yearly;
  const monthly = prices.monthly;
  const lifetime = prices.lifetime;

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
    const perMonth = formatMoney(Math.floor(yearly.amount / 12), currency);
    plans.push({
      id: "yearly",
      name: PLAN_META.yearly.name,
      button: PLAN_META.yearly.button,
      badge: savingsPct ? `Best value · Save ${savingsPct}%` : "Best value",
      priceLine: `${year}/year`,
      detailLine: trialDays > 0
        ? `${PLAN_META.yearly.detail(perMonth)} · ${trialDays}-day free trial`
        : PLAN_META.yearly.detail(perMonth),
      terms: trialDays > 0
        ? `${trialDays} days free, then ${year}/year. Cancel anytime in your Apple ID settings.`
        : `${year}/year. Cancel anytime in your Apple ID settings.`,
    });
  }

  if (monthly) {
    const month = formatMoney(monthly.amount, currency);
    plans.push({
      id: "monthly",
      name: PLAN_META.monthly.name,
      button: PLAN_META.monthly.button,
      badge: null,
      priceLine: `${month}/month`,
      detailLine: PLAN_META.monthly.detail(),
      terms: `${month}/month. Cancel anytime in your Apple ID settings.`,
    });
  }

  if (lifetime) {
    const once = formatMoney(lifetime.amount, currency);
    plans.push({
      id: "lifetime",
      name: PLAN_META.lifetime.name,
      button: PLAN_META.lifetime.button,
      badge: null,
      priceLine: `${once} one time`,
      detailLine: PLAN_META.lifetime.detail(),
      terms: `One payment of ${once}. Yours for life, no renewal.`,
    });
  }

  return plans;
}