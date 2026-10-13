import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";
import { secrets } from "base44:runtime";
import { z } from "npm:zod@3.24.2";

// Server-to-server only: Vapor calls this on every StoreKit purchase, renewal,
// cancellation or refund. One UserSubscription per user; renewals overwrite.

const safeEqual = (a, b) => {
  const x = new TextEncoder().encode(a), y = new TextEncoder().encode(b);
  if (x.length !== y.length) return false;
  let d = 0;
  for (let i = 0; i < x.length; i++) d |= x[i] ^ y[i];
  return d === 0;
};

const Body = z.object({
  user_id: z.string().min(1).max(100),
  expiration_date: z.number().int().nonnegative(),
  product_id: z.string().max(200).nullish(),
  purchase_date: z.number().int().nonnegative().nullish(),
  original_transaction_id: z.string().max(200).nullish(),
  consumed_product_discount_id: z.string().max(200).nullish(),
});

export default async function (req) {
  try {
    const key = secrets.get("APPLE_WEBHOOK_API_KEY");
    const given = req.headers.get("x-api-key") || "";
    if (!key || !given || !safeEqual(given, key)) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return Response.json({ error: "Invalid body", issues: parsed.error.issues }, { status: 400 });
    const b = parsed.data;

    const admin = createClientFromRequest(req).asServiceRole;
    const user = await admin.entities.User.get(b.user_id).catch(() => null);
    if (!user) return Response.json({ error: "User not found" }, { status: 404 });

    const record = { user_id: b.user_id, expiration_date: b.expiration_date };
    for (const k of ["product_id", "purchase_date", "original_transaction_id", "consumed_product_discount_id"]) {
      if (b[k] != null) record[k] = b[k];
    }

    const existing = await admin.entities.UserSubscription.filter({ user_id: b.user_id }, "created_date");
    let subscription;
    if (existing.length) {
      subscription = await admin.entities.UserSubscription.update(existing[0].id, record);
    } else {
      subscription = await admin.entities.UserSubscription.create(record);
      // No unique index: if a concurrent call also created one, keep the oldest.
      const again = await admin.entities.UserSubscription.filter({ user_id: b.user_id }, "created_date");
      for (const extra of again.slice(1)) await admin.entities.UserSubscription.delete(extra.id);
      if (again.length > 1) subscription = await admin.entities.UserSubscription.update(again[0].id, record);
    }
    return Response.json({ success: true, subscription });
  } catch (e) {
    console.error("update-subscription failed", e.message);
    return Response.json({ error: e.message }, { status: 500 });
  }
}