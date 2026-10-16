import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import {
  inviteExpiry, isEmail, isExpired, normalizeEmail, nowIso, ownerFirstName,
} from "../../shared/caregiverAccess.ts";

/**
 * Grants caregiver access to one email address.
 *
 * Nothing is sent from here — no email, no invitation provider. The invite is
 * saved as pending and the person who granted it shares the app link themselves
 * (see src/lib/caregiverShare.js for those words). Access is matched by address
 * alone: the row becomes active the first time that exact address signs in, which
 * the shared-records call does on its own. An invite that runs out its week is
 * never accepted.
 *
 * The invite row itself is written with the caller's own client, so it belongs to
 * the person granting access and only they can see, change or revoke it.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const me = await base44.auth.me();
    if (!me) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const email = normalizeEmail(body.email);
    if (!isEmail(email)) return Response.json({ error: "invalid_email", message: "Enter a valid email address." });
    if (email === normalizeEmail(me.email)) {
      return Response.json({ error: "self", message: "That is your own email address." });
    }

    const scope = body.scope === "read_write" ? "read_write" : "read";
    // Only this account's own invites are visible here, so the duplicate check
    // needs nothing more than the address.
    const existing = await base44.entities.ProxyAccess.filter({ grantee_email: email });
    const live = (Array.isArray(existing) ? existing : existing?.items || [])
      .find((row) => row.status === "active" || (row.status === "pending" && !isExpired(row)));
    if (live) {
      return Response.json({
        error: live.status === "active" ? "already_active" : "duplicate",
        accessId: live.id,
        message: live.status === "active"
          ? "This email already has access."
          : "This email already has an invite waiting.",
      });
    }

    const inviter = await ownerFirstName(base44.asServiceRole, me.id, me);
    const record = await base44.entities.ProxyAccess.create({
      grantee_email: email,
      scope,
      status: "pending",
      relationship: String(body.relationship || ""),
      owner_name: inviter,
      invited_date: nowIso(),
      expires_at: inviteExpiry(),
    });
    return Response.json({ ok: true, accessId: record.id, email: record.grantee_email });
  } catch (error) {
    console.error("inviteCaregiver failed", error);
    return Response.json({ error: "failed", message: "The invite could not be saved." }, { status: 500 });
  }
}