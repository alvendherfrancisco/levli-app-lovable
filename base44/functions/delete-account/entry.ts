import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

/**
 * Deletes the caller's account and every record it owns, server-side.
 * Requires the caller to repeat their own email address, so the endpoint
 * cannot be triggered by an accidental tap.
 */
const OWNED_ENTITIES = [
  "Shot", "DayMetric", "JournalEntry", "AdverseEvent", "Medication",
  "Inventory", "StorageLog", "RepeatSchedule",
  "ProgressPhoto", "ProxyAccess", "UserProfile",
];

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    let body = {};
    try { body = await req.json(); } catch (e) { body = {}; }
    const typed = String(body.confirmEmail || "").trim().toLowerCase();
    if (!typed || typed !== String(user.email || "").trim().toLowerCase()) {
      return Response.json({ error: "The email you typed does not match your account." }, { status: 400 });
    }

    // Service role: an account deleting itself also has to remove the records
    // held for it and the user record, which a user-scoped token may not do.
    const deleted = {};
    await Promise.all(OWNED_ENTITIES.map(async (name) => {
      try {
        await base44.asServiceRole.entities[name].deleteMany({ created_by_id: user.id });
        deleted[name] = true;
      } catch (e) {
        // A missing or already-empty store must not stop the deletion.
        deleted[name] = false;
        console.error(`delete-account: could not purge ${name}:`, e.message);
      }
    }));

    await base44.asServiceRole.entities.User.delete(user.id);

    return Response.json({ ok: true, purged: deleted });
  } catch (error) {
    console.error("delete-account failed:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}