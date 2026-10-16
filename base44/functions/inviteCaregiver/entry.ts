import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import {
  APP_URL, INVITE_DAYS, inviteExpiry, isEmail, isExpired, normalizeEmail, nowIso, ownerFirstName, scopeLabel,
} from "../../shared/caregiverAccess.ts";

/**
 * Grants caregiver access and emails the invitation.
 *
 * Two calls come here: a new invite (email + scope), and a resend for an entry
 * that is still pending or has run out its week (accessId). Either way the invite
 * is saved first and the email is sent after, so a send that fails leaves the
 * entry in place, waiting to be tried again — the screen offers Retry for exactly
 * that, and reports which addresses went out and which did not.
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
    const inviter = await ownerFirstName(base44.asServiceRole, me.id, me);

    // ── Resend: the same entry, a fresh week and a fresh email ───────────────
    const accessId = String(body.accessId || "");
    if (accessId) {
      const row = await base44.entities.ProxyAccess.get(accessId).catch(() => null);
      if (!row) return Response.json({ error: "not_found", message: "That invite is no longer there." });
      if (row.status === "revoked") {
        return Response.json({ error: "revoked", message: "Access was revoked. Grant it again to invite them back." });
      }
      if (row.status === "active") {
        return Response.json({ error: "already_active", message: `${row.grantee_email} already has access.` });
      }
      const refreshed = await base44.entities.ProxyAccess.update(row.id, {
        status: "pending", invited_date: nowIso(), expires_at: inviteExpiry(),
      });
      return await sendInvite(base44, refreshed, inviter);
    }

    // ── A new invite ────────────────────────────────────────────────────────
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
          ? `${email} already has access to your records.`
          : `An invite is already waiting for ${email}. You can resend it.`,
      });
    }

    const record = await base44.entities.ProxyAccess.create({
      grantee_email: email,
      scope,
      status: "pending",
      relationship: String(body.relationship || ""),
      owner_name: inviter,
      invited_date: nowIso(),
      expires_at: inviteExpiry(),
    });
    return await sendInvite(base44, record, inviter);
  } catch (error) {
    console.error("inviteCaregiver failed", error);
    return Response.json({ error: "failed", message: "The invite could not be saved." }, { status: 500 });
  }
}

/**
 * Sends the invitation email. The invite is already saved, so a refusal from the
 * mail service is reported rather than thrown: the screen keeps the entry, says
 * the email did not go out, and offers Retry.
 */
async function sendInvite(base44, record, inviter) {
  const variables = {
    inviter_name: inviter,
    access_level: scopeLabel(record.scope),
    invitee_email: record.grantee_email,
    expires_days: String(INVITE_DAYS),
    app_url: APP_URL,
  };
  try {
    await base44.integrations.Core.SendEmail({
      to: record.grantee_email,
      template_name: "CaregiverInvite",
      variables,
    });
    await base44.entities.ProxyAccess.update(record.id, { last_email_sent_at: nowIso(), email_error: "" });
    return Response.json({ ok: true, accessId: record.id, email: record.grantee_email, emailSent: true });
  } catch (error) {
    const message = error?.message || "The email could not be sent.";
    console.error("caregiver invite email failed", error);
    await base44.entities.ProxyAccess.update(record.id, { email_error: message }).catch(() => {});
    return Response.json({
      ok: true,
      accessId: record.id,
      email: record.grantee_email,
      emailSent: false,
      // The reason the mail service gave, word for word: it is the one thing that
      // says what to put right before trying again.
      emailError: message,
    });
  }
}