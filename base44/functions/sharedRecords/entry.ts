import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import {
  activeSharesFor, claimPendingInvites, entityRows, newestProfileByOwner, personName,
} from "../../shared/caregiverAccess.ts";

/**
 * What a caregiver sees, and the only door to it.
 *
 * Called with no accessId it returns the people who have shared their records
 * with this account, and on the way it links any invite that was addressed to
 * their email — which is why an invited person needs no code: signing in with the
 * invited address is the whole of accepting.
 *
 * Called with an accessId it returns that person's records, and nothing else: the
 * share is looked up among THIS account's own active shares first, so an invite
 * that is pending, expired or revoked — or a share belonging to somebody else —
 * never reaches a record. Reads are read-only by design: the client that asks is
 * never given a way to write, and every write entity rule remains owner-scoped,
 * so a caregiver cannot change anything even by calling the API directly.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const me = await base44.auth.me();
    if (!me) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const admin = base44.asServiceRole;
    await claimPendingInvites(admin, me);

    const shares = await activeSharesFor(admin, me);
    const ownerIds = [...new Set(shares.map((share) => share.created_by_id))];
    const profiles = ownerIds.length
      ? newestProfileByOwner(await admin.entities.UserProfile.filter({ created_by_id: { $in: ownerIds } }))
      : new Map();
    // The account itself, for the people who never entered a first name: their
    // own name is still a better answer than no name at all.
    const ownerUsers = await Promise.all(ownerIds.map((id) => admin.entities.User.get(id).catch(() => null)));
    const users = new Map(ownerIds.map((id, index) => [id, ownerUsers[index]]));

    const described = shares.map((share) => {
      const profile = profiles.get(share.created_by_id);
      return {
        id: share.id,
        owner_id: share.created_by_id,
        owner_name: personName({ profile, user: users.get(share.created_by_id), fallback: share.owner_name }),
        scope: share.scope || "read",
        granted_date: share.granted_date || share.invited_date || "",
        weight_unit: profile?.weight_unit || "lb",
      };
    });

    const body = await req.json().catch(() => ({}));
    const accessId = String(body?.accessId || "");
    if (!accessId) return Response.json({ ok: true, shares: described });

    const share = described.find((row) => row.id === accessId);
    if (!share) {
      return Response.json(
        { error: "no_access", message: "This access is no longer available." },
        { status: 403 },
      );
    }

    // Only now, with the share checked above, are the records read — and they are
    // read for the owner of that share alone.
    const [shots, journal, metrics, events] = await Promise.all([
      admin.entities.Shot.filter({ created_by_id: share.owner_id }, { sort: "-date", limit: 300 }),
      admin.entities.JournalEntry.filter({ created_by_id: share.owner_id }, { sort: "-date", limit: 200 }),
      admin.entities.DayMetric.filter({ created_by_id: share.owner_id }, { sort: "-day_key", limit: 400 }),
      admin.entities.AdverseEvent.filter({ created_by_id: share.owner_id }, { sort: "-onset_date", limit: 200 }),
    ]);
    const profile = profiles.get(share.owner_id) || null;

    return Response.json({
      ok: true,
      person: {
        id: share.owner_id,
        name: share.owner_name,
        scope: share.scope,
        weight_unit: share.weight_unit,
        goal_weight_kg: profile?.goal_weight_kg ?? null,
        height_cm: profile?.height_cm ?? null,
        granted_date: share.granted_date,
      },
      shots: entityRows(shots),
      journal: entityRows(journal),
      weight: entityRows(metrics).filter((row) => row.weight != null),
      side_effects: entityRows(events),
    });
  } catch (error) {
    console.error("sharedRecords failed", error);
    return Response.json({ error: "failed", message: "The shared records could not be loaded." }, { status: 500 });
  }
}