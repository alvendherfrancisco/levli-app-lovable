import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";
import { secrets, waitUntil } from "base44:runtime";
import { z } from "npm:zod@3.24.2";
import { mayPushTo } from "../../shared/mayPushTo.ts";

const SERVER_ONLY = ["subscription.lapsed", "referral.successful"];

const Body = z.object({
  recipient_user_id: z.string().min(1),
  category: z.enum(["social", "monetisation", "retention"]),
  trigger_id: z.string().min(1).max(64),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(500),
  deep_link: z.string().max(500).optional(),
  payload: z.record(z.string().max(500)).optional(),
  dedupe_key: z.string().max(200).optional(),
  drain_now: z.boolean().optional(),
});

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) return Response.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
    const b = parsed.data;

    if (SERVER_ONLY.includes(b.trigger_id)) return Response.json({ error: "Server-only trigger" }, { status: 403 });
    if (b.recipient_user_id === user.id) return Response.json({ error: "Self-push not allowed" }, { status: 403 });
    if (!(await mayPushTo(base44, user, b.recipient_user_id))) return Response.json({ error: "Not allowed to push this user" }, { status: 403 });

    const outbox = base44.asServiceRole.entities.PushOutbox;
    if (b.dedupe_key) {
      const existing = await outbox.filter({ dedupe_key: b.dedupe_key });
      if (existing.length) return Response.json({ success: true, deduped: true });
    }

    const { drain_now, ...fields } = b;
    const record = await outbox.create({
      ...fields,
      enqueued_by: user.id,
      status: "pending",
      attempts: 0,
      next_attempt_at: Math.floor(Date.now() / 1000),
    });

    // Lose a create race on the same dedupe key: the oldest record wins.
    if (b.dedupe_key) {
      const dupes = await outbox.filter({ dedupe_key: b.dedupe_key }, "created_date");
      if (dupes.length > 1 && dupes[0].id !== record.id) {
        await outbox.delete(record.id);
        return Response.json({ success: true, deduped: true });
      }
    }

    if (drain_now !== false) {
      const appUrl = req.headers.get("x-base44-app-url") || "https://levli-app.base44.app";
      waitUntil(
        fetch(`${appUrl}/functions/send-push`, {
          method: "POST",
          headers: { "content-type": "application/json", "x-internal-key": secrets.get("INTERNAL_FUNCTION_KEY") },
          body: JSON.stringify({ trigger: "enqueue" }),
          signal: AbortSignal.timeout(30000),
        }).catch((e) => console.error("drain_now failed", e.message)),
      );
    }

    return Response.json({ success: true, id: record.id });
  } catch (error) {
    console.error("enqueue-push error", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}