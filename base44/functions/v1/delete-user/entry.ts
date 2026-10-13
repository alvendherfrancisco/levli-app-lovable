import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";
import { isAuthorized } from "../../../shared/vaporAuth.ts";

// Server-to-server only: called by Vapor with x-api-key. Deletes every Levli
// record owned by (or pointing at) the user. Children before parents.
const OWNED = [
  ["PushOutbox", "recipient_user_id"],
  ["Shot", "created_by_id"], ["DayMetric", "created_by_id"], ["JournalEntry", "created_by_id"],
  ["AdverseEvent", "created_by_id"], ["StorageLog", "created_by_id"], ["Inventory", "created_by_id"],
  ["RepeatSchedule", "created_by_id"], ["ProgressPhoto", "created_by_id"], ["Medication", "created_by_id"],
  ["ProxyAccess", "created_by_id"], ["ProxyAccess", "grantee_user_id"],
  ["UserProfile", "created_by_id"], ["UserSubscription", "user_id"],
];

export default async function (req: Request): Promise<Response> {
  if (req.method !== "POST") return Response.json({ success: false, error: "Method not allowed" }, { status: 405 });
  if (!isAuthorized(req)) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const userId = body?.user_id;
  if (typeof userId !== "string" || !userId.trim()) {
    return Response.json({ success: false, error: "user_id required" }, { status: 400 });
  }

  const admin = createClientFromRequest(req).asServiceRole;
  const user = await admin.entities.User.get(userId).catch(() => null);
  if (!user) return Response.json({ success: false, error: "User not found" }, { status: 404 });

  const warnings: string[] = [];
  for (const [name, field] of OWNED) {
    try {
      await admin.entities[name].deleteMany({ [field]: userId });
    } catch (e) {
      warnings.push(`${name}.${field}: ${e.message}`);
      console.error(`delete-user: ${name}.${field}`, e.message);
    }
  }

  try {
    await admin.entities.User.delete(userId);
  } catch (e) {
    warnings.push(`User: ${e.message}`);
    console.error("delete-user: User", e.message);
  }

  return Response.json({ success: true, message: "User deleted", warnings });
}