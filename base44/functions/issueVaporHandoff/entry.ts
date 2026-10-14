import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";
import { secrets } from "base44:runtime";

// Verifies the caller's Base44 session, then asks Wanilla (Vapor) for a
// one-time handoff code. The server key never leaves this function.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user?.id || !user?.email) {
      return Response.json({ error: true, errorCode: "unauthorized", reason: "Not signed in" }, { status: 401 });
    }

    const baseUrl = (secrets.get("VAPOR_BASE_URL") || "").replace(/\/+$/, "");
    const res = await fetch(`${baseUrl}/api/v1/auth/base44/handoff`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        wanillaAPIKey: secrets.get("APPLE_WEBHOOK_API_KEY") || "",
      },
      body: JSON.stringify({
        base44_user_id: user.id,
        email: user.email,
        full_name: user.full_name || "",
      }),
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.handoff_code) {
      console.error("Wanilla handoff failed:", res.status, data.errorCode || "", data.reason || "");
      return Response.json(
        { error: true, errorCode: data.errorCode || "internal_error", reason: data.reason || "Handoff failed" },
        { status: res.ok ? 502 : res.status },
      );
    }

    // A Base44 account created in the last 10 minutes counts as a registration.
    const createdAt = Date.parse(user.created_date || "");
    const is_registration = !Number.isNaN(createdAt) && Date.now() - createdAt < 10 * 60 * 1000;

    return Response.json({ handoff_code: data.handoff_code, expires_in: data.expires_in, base44_user_id: user.id, is_registration });
  } catch (error) {
    console.error("issueVaporHandoff failed:", error.message);
    return Response.json({ error: true, errorCode: "internal_error", reason: error.message }, { status: 500 });
  }
}