// Phase 4C — client helper for the remote push pipeline. Payload values must be
// strings (Vapor rejects nested objects); enqueue-push enforces it too.
import { base44 } from "@/api/base44Client";

export async function sendRemotePush({ recipientUserId, triggerId, category, title, body, deepLink, payload, dedupeKey }) {
  const res = await base44.functions.invoke("enqueue-push", {
    recipient_user_id: recipientUserId,
    trigger_id: triggerId,
    category,
    title,
    body,
    ...(deepLink ? { deep_link: deepLink } : {}),
    ...(payload ? { payload: Object.fromEntries(Object.entries(payload).map(([k, v]) => [k, String(v)])) } : {}),
    ...(dedupeKey ? { dedupe_key: dedupeKey } : {}),
  });
  return res.data;
}