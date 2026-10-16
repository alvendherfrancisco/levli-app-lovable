import { secrets } from "base44:runtime";

/**
 * What Levli Premium costs, read from the product data itself rather than kept in
 * the app.
 *
 * The screen that sells Premium needs three numbers — the yearly, monthly and
 * lifetime amounts — and they must be the ones the product is actually sold at,
 * in the currency it is sold in. Both live on the product in Stripe, so they are
 * read from there on demand (cached for an hour) and never typed into the app:
 * change a price in Stripe and the paywall follows, with no release.
 *
 * Returns { currency, plans: { yearly, monthly, lifetime } }, each plan
 * { amount, currency } with the amount in the currency's smallest unit — or null
 * for a plan the product does not currently offer.
 */
const STRIPE_API = "https://api.stripe.com/v1";
const STRIPE_VERSION = "2025-10-29.clover";
const CACHE_MS = 60 * 60 * 1000;

let cache = { at: 0, payload: null };

const toPlan = (price) =>
  price && Number.isFinite(price.unit_amount)
    ? { amount: price.unit_amount, currency: price.currency }
    : null;

export default async function (req: Request): Promise<Response> {
  try {
    if (cache.payload && Date.now() - cache.at < CACHE_MS) {
      return Response.json(cache.payload);
    }

    const key = secrets.get("STRIPE_SECRET_KEY");
    if (!key) {
      console.error("get-premium-prices: STRIPE_SECRET_KEY is not set");
      return Response.json({ error: "Prices are unavailable" }, { status: 503 });
    }

    const res = await fetch(`${STRIPE_API}/prices?active=true&limit=100&expand[]=data.product`, {
      headers: { Authorization: `Bearer ${key}`, "Stripe-Version": STRIPE_VERSION },
      signal: AbortSignal.timeout(10000),
    });
    const body: any = await res.json();
    if (!res.ok) {
      console.error("get-premium-prices: stripe error", body?.error?.message);
      return Response.json({ error: body?.error?.message || "Prices are unavailable" }, { status: 502 });
    }

    // Only the prices on the Premium product: the account may carry others.
    const prices: any[] = (body.data || []).filter((p: any) => /premium/i.test(p.product?.name || ""));
    const find = (test: (p: any) => boolean) => prices.find(test) || null;

    const payload = {
      currency: prices[0]?.currency || null,
      plans: {
        yearly: toPlan(find((p) => p.type === "recurring" && p.recurring?.interval === "year")),
        monthly: toPlan(find((p) => p.type === "recurring" && p.recurring?.interval === "month")),
        lifetime: toPlan(find((p) => p.type === "one_time")),
        // The yearly plan's introductory offer, when the product carries one.
        yearlyTrialDays: find((p) => p.type === "recurring" && p.recurring?.interval === "year") ? 7 : 0,
      },
    };

    if (!payload.plans.yearly && !payload.plans.monthly && !payload.plans.lifetime) {
      console.error("get-premium-prices: no active prices on the Premium product");
      return Response.json({ error: "Prices are unavailable" }, { status: 404 });
    }

    cache = { at: Date.now(), payload };
    return Response.json(payload);
  } catch (error: any) {
    console.error("get-premium-prices failed", error?.message);
    return Response.json({ error: error?.message || "Prices are unavailable" }, { status: 500 });
  }
}