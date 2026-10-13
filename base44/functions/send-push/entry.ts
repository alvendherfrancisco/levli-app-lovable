import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";
import { secrets } from "base44:runtime";

const BATCH = 25;
const MAX_ATTEMPTS = 5;
const USER_NOT_FOUND_MAX_ATTEMPTS = 2;
const LADDER = [60, 300, 1800, 7200, 43200]; // 60s, 5m, 30m, 2h, 12h
const STALE_CLAIM_S = 600;

const now = () => Math.floor(Date.now() / 1000);

async function deliver(outbox, row, baseUrl, apiKey) {
  const attempts = row.attempts;
  const retry = (err) =>
    attempts >= MAX_ATTEMPTS
      ? outbox.update(row.id, { status: "dead", last_error: err })
      : outbox.update(row.id, { status: "pending", last_error: err, next_attempt_at: now() + LADDER[attempts - 1] });

  let res;
  try {
    res = await fetch(`${baseUrl}/api/v1/users/apns/external`, {
      method: "POST",
      headers: { "content-type": "application/json", "X-WLAPNS": apiKey },
      body: JSON.stringify({
        recipient_user_id: row.recipient_user_id,
        category: row.category,
        trigger_id: row.trigger_id,
        title: row.title,
        body: row.body,
        deep_link: row.deep_link || null,
        payload: row.payload || {},
        dedupe_key: row.dedupe_key || row.id,
      }),
      signal: AbortSignal.timeout(10000),
    });
  } catch (e) {
    return retry(`network: ${e.message}`);
  }

  const data = await res.json().catch(() => ({}));
  if (res.status === 200 && data.success) return outbox.update(row.id, { status: "sent", sent_at: now(), last_error: "" });

  const err = `${res.status}: ${data.reason || data.error || "unknown"}`;
  if (res.status === 404 && String(data.reason || "").startsWith("User not found")) {
    return attempts >= USER_NOT_FOUND_MAX_ATTEMPTS
      ? outbox.update(row.id, { status: "dead", last_error: err })
      : outbox.update(row.id, { status: "pending", last_error: err, next_attempt_at: now() + 60 });
  }
  if (res.status === 404) {
    console.error("send-push: 404 without 'User not found' — check VAPOR_PUSH_API_KEY", err);
    return retry(err);
  }
  if (res.status >= 400 && res.status < 500 && res.status !== 408 && res.status !== 429) {
    return outbox.update(row.id, { status: "dead", last_error: err });
  }
  return retry(err);
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const internal = req.headers.get("x-internal-key") === secrets.get("INTERNAL_FUNCTION_KEY");
    // The scheduled drain (Workflow) sends { trigger: "cron" }; anything else needs the internal key.
    if (!internal && body?.trigger !== "cron") return Response.json({ error: "Unauthorized" }, { status: 401 });

    const outbox = base44.asServiceRole.entities.PushOutbox;
    const t = now();

    // Reset rows a crashed drainer left claimed.
    const claimed = await outbox.filter({ status: "claimed" });
    await Promise.allSettled(
      claimed
        .filter((r) => t - Math.floor(new Date(r.updated_date).getTime() / 1000) > STALE_CLAIM_S)
        .map((r) => outbox.update(r.id, { status: "pending", claim_token: "" })),
    );

    const due = (await outbox.filter({ status: "pending", next_attempt_at: { $lte: t } }, "next_attempt_at", BATCH));

    // Claim without row locks: write a token, read back, keep only rows we won.
    const mine = [];
    await Promise.allSettled(
      due.map(async (r) => {
        const token = crypto.randomUUID();
        await outbox.update(r.id, { status: "claimed", claim_token: token, attempts: (r.attempts || 0) + 1 });
        const fresh = await outbox.get(r.id);
        if (fresh.claim_token === token) mine.push(fresh);
      }),
    );

    const baseUrl = (secrets.get("VAPOR_BASE_URL") || "").replace(/\/$/, "");
    const apiKey = secrets.get("VAPOR_PUSH_API_KEY");
    const results = await Promise.allSettled(mine.map((r) => deliver(outbox, r, baseUrl, apiKey)));

    return Response.json({ success: true, claimed: mine.length, failed: results.filter((r) => r.status === "rejected").length });
  } catch (error) {
    console.error("send-push error", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}