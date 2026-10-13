import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";

// Returns the signed-in user's App Store entitlement, or null when no record exists.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const rows = await base44.asServiceRole.entities.UserSubscription.filter({ user_id: user.id }, "-expiration_date", 1);
    const row = rows[0];
    return Response.json({
      user_id: user.id,
      subscription: row ? { expiration_date: row.expiration_date, product_id: row.product_id ?? null } : null,
    });
  } catch (e) {
    console.error("get-subscription failed", e.message);
    return Response.json({ error: e.message }, { status: 500 });
  }
}