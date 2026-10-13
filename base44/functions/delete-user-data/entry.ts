import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";
import { secrets } from "base44:runtime";

// Server-to-server only: called by Vapor with x-api-key. Deletes every Levli
// record owned by (or pointing at) the user. Vapor deprovisions the app user.

const safeEqual = (a, b) => {
  const x = new TextEncoder().encode(a), y = new TextEncoder().encode(b);
  if (x.length !== y.length) return false;
  let d = 0;
  for (let i = 0; i < x.length; i++) d |= x[i] ^ y[i];
  return d === 0;
};

// Children before parents.
const OWNED = [
  ["PushOutbox", "recipient_user_id"],
  ["Shot", "created_by_id"], ["DayMetric", "created_by_id"], ["JournalEntry", "created_by_id"],
  ["AdverseEvent", "created_by_id"], ["StorageLog", "created_by_id"], ["Inventory", "created_by_id"],
  ["RepeatSchedule", "created_by_id"], ["ProgressPhoto", "created_by_id"], ["Medication", "created_by_id"],
  ["ProxyAccess", "created_by_id"], ["ProxyAccess", "grantee_user_id"],
  ["UserProfile", "created_by_id"],
];

export default async function (req) {
  const key = secrets.get("APPLE_WEBHOOK_API_KEY");
  const given = req.headers.get("x-api-key") || "";
  if (!key || !given || !safeEqual(given, key)) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const userId = body?.user_id;
  if (typeof userId !== "string" || !userId.trim()) return Response.json({ error: "user_id required" }, { status: 400 });

  const admin = createClientFromRequest(req).asServiceRole;
  let user;
  try {
    user = await admin.entities.User.get(userId);
  } catch (e) {
    console.error("delete-user-data lookup failed", e.message);
    return Response.json({ error: "User not found" }, { status: 404 });
  }
  if (!user) return Response.json({ error: "User not found" }, { status: 404 });

  const warnings = [];
  for (const [name, field] of OWNED) {
    try {
      await admin.entities[name].deleteMany({ [field]: userId });
    } catch (e) {
      warnings.push(`${name}.${field}: ${e.message}`);
      console.error(`delete-user-data: ${name}.${field}`, e.message);
    }
  }

  // Clear any custom data saved on the user record so a re-provisioned email starts clean.
  try {
    const { id, email, full_name, role, created_date, updated_date, created_by_id, ...custom } = user;
    const cleared = Object.fromEntries(Object.keys(custom).map((k) => [k, null]));
    if (Object.keys(cleared).length) await admin.entities.User.update(userId, cleared);
  } catch (e) {
    warnings.push(`User fields: ${e.message}`);
  }

  return Response.json({ success: true, message: "User data deleted", warnings });
}